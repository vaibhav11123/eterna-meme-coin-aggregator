import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { logger } from '../utils/logger';
import { config } from '../config';
import { redisService } from './redis.service';
import { aggregatorService } from './aggregator.service';

interface ClientSubscription {
  ws: WebSocket;
  tokenAddresses: Set<string>;
  lastHeartbeat: number;
}

export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ClientSubscription> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private leaderboardInterval: NodeJS.Timeout | null = null;
  constructor(server: any) {
    this.wss = new WebSocketServer({ 
      server,
      perMessageDeflate: false,
      path: '/ws',
    });

    this.setupWebSocket();
    this.startHeartbeat();
    this.startUpdateLoop();
    this.startLeaderboardUpdates();
  }

  handleUpgrade(request: IncomingMessage, socket: any, head: Buffer): void {
    if (this.wss) {
      this.wss.handleUpgrade(request, socket, head, (ws) => {
        this.wss!.emit('connection', ws, request);
      });
    }
  }

  private setupWebSocket(): void {
    if (!this.wss) return;
    
    this.wss.on('connection', (ws: WebSocket, _req: IncomingMessage) => {
      const clientId = this.generateClientId();
      logger.info(`WebSocket client connected: ${clientId}`);

      const subscription: ClientSubscription = {
        ws,
        tokenAddresses: new Set(),
        lastHeartbeat: Date.now(),
      };

      this.clients.set(clientId, subscription);

      ws.on('message', async (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          await this.handleMessage(clientId, data);
        } catch (error: unknown) {
          logger.error('WebSocket message error:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        logger.info(`WebSocket client disconnected: ${clientId}`);
        this.clients.delete(clientId);
      });

      ws.on('error', (error: Error) => {
        logger.error(`WebSocket error for client ${clientId}:`, error);
        this.clients.delete(clientId);
      });

      // Send welcome message
      this.send(ws, {
        type: 'connected',
        clientId,
        timestamp: Date.now(),
      });
    });
  }

  private async handleMessage(clientId: string, data: any): Promise<void> {
    const subscription = this.clients.get(clientId);
    if (!subscription) return;

    switch (data.type) {
      case 'subscribe':
        if (Array.isArray(data.tokenAddresses)) {
          data.tokenAddresses.forEach((addr: string) => {
            subscription.tokenAddresses.add(addr.toLowerCase());
          });
          logger.info(`[WS] Client ${clientId} subscribed to ${subscription.tokenAddresses.size} tokens: ${Array.from(subscription.tokenAddresses).join(', ')}`);
          
          // Send subscription confirmation
          this.send(subscription.ws, {
            type: 'subscribed',
            tokenAddresses: Array.from(subscription.tokenAddresses),
          });
          
          // ✅ FIX: Send initial cached data immediately (no waiting for next update loop)
          this.sendInitialSnapshot(subscription);
        }
        break;

      case 'unsubscribe':
        if (Array.isArray(data.tokenAddresses)) {
          data.tokenAddresses.forEach((addr: string) => {
            subscription.tokenAddresses.delete(addr.toLowerCase());
          });
          logger.info(`Client ${clientId} unsubscribed from tokens`);
          this.send(subscription.ws, {
            type: 'unsubscribed',
            tokenAddresses: Array.from(subscription.tokenAddresses),
          });
        }
        break;

      case 'ping':
        subscription.lastHeartbeat = Date.now();
        this.send(subscription.ws, { type: 'pong', timestamp: Date.now() });
        break;

      default:
        this.sendError(subscription.ws, `Unknown message type: ${data.type}`);
    }
  }

  private async startUpdateLoop(): Promise<void> {
    if (!this.wss) return;
    
    this.updateInterval = setInterval(async () => {
      const allTokenAddresses = new Set<string>();
      
      // Collect all subscribed token addresses
      for (const subscription of this.clients.values()) {
        subscription.tokenAddresses.forEach((addr) => allTokenAddresses.add(addr));
      }

      if (allTokenAddresses.size === 0) return;

      try {
        const addresses = Array.from(allTokenAddresses);
        logger.debug(`[WS] Update loop: fetching ${addresses.length} token(s): ${addresses.join(', ')}`);
        
        const aggregated = await aggregatorService.aggregateTokenData(addresses);
        
        logger.info(`[WS] Broadcasting token updates... count=${aggregated.length}, symbols=${aggregated.map(t => t.token.symbol).join(', ')}`);

        // Broadcast to all subscribed clients
        for (const [_clientId, subscription] of this.clients.entries()) {
          if (subscription.tokenAddresses.size === 0) continue;

          const relevantData = aggregated.filter((item) =>
            subscription.tokenAddresses.has(item.token.address.toLowerCase())
          );

          if (relevantData.length > 0) {
            logger.debug(`[WS] Sending ${relevantData.length} token(s) to client ${_clientId}: ${relevantData.map(t => t.token.symbol).join(', ')}`);
            this.send(subscription.ws, {
              type: 'update',
              data: relevantData,
              timestamp: Date.now(),
            });
          } else {
            logger.warn(`[WS] No relevant data for client ${_clientId} subscribed to: ${Array.from(subscription.tokenAddresses).join(', ')}`);
          }
        }

        // Publish to Redis for other instances
        await redisService.publish('meme_coin:updates', {
          tokenAddresses: addresses,
          data: aggregated,
          timestamp: Date.now(),
        });
      } catch (error) {
        logger.error('Update loop error:', error);
      }
    }, config.cache.ttlSeconds * 1000);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeout = config.websocket.heartbeatIntervalMs * 2;

      for (const [clientId, subscription] of this.clients.entries()) {
        if (now - subscription.lastHeartbeat > timeout) {
          logger.info(`Client ${clientId} timed out, closing connection`);
          subscription.ws.terminate();
          this.clients.delete(clientId);
        }
      }
    }, config.websocket.heartbeatIntervalMs);
  }

  private async startLeaderboardUpdates(): Promise<void> {
    // Send leaderboard updates every 60 seconds
    this.leaderboardInterval = setInterval(async () => {
      if (this.clients.size === 0) return;

      try {
        const client = redisService.getClient();
        if (!client) return;

        // Get top 10 by volume
        const keys = await client.keys(`${config.cache.keyPrefix}aggregated:*`);
        if (keys.length === 0) return;

        const rawTokens: any[][] = [];
        for (const key of keys) {
          const cached = await redisService.get<any[]>(key);
          if (cached && Array.isArray(cached)) {
            rawTokens.push(cached);
          }
        }

        // Flatten and deduplicate
        const tokenMap = new Map<string, any>();
        for (const tokenArray of rawTokens) {
          for (const token of tokenArray) {
            const address = token.token.address.toLowerCase();
            if (!tokenMap.has(address) || token.lastUpdated > (tokenMap.get(address)?.lastUpdated || 0)) {
              tokenMap.set(address, token);
            }
          }
        }

        const allTokens = Array.from(tokenMap.values());
        const topByVolume = allTokens
          .sort((a, b) => (b.totalVolume24h || b.priceData?.volume24h || 0) - (a.totalVolume24h || a.priceData?.volume24h || 0))
          .slice(0, 10)
          .map((token, index) => ({
            rank: index + 1,
            symbol: token.token.symbol,
            name: token.token.name,
            volume24h: token.totalVolume24h || token.priceData?.volume24h || 0,
            price: token.priceData?.price || token.averagePrice || 0,
            priceChange24h: token.priceData?.priceChange24h || 0,
          }));

        const topByChange = allTokens
          .sort((a, b) => (b.priceData?.priceChange24h || 0) - (a.priceData?.priceChange24h || 0))
          .slice(0, 10)
          .map((token, index) => ({
            rank: index + 1,
            symbol: token.token.symbol,
            name: token.token.name,
            priceChange24h: token.priceData?.priceChange24h || 0,
            price: token.priceData?.price || token.averagePrice || 0,
          }));

        // Broadcast to all connected clients
        for (const subscription of this.clients.values()) {
          this.send(subscription.ws, {
            type: 'leaderboard_update',
            data: {
              topByVolume,
              topByChange,
            },
            timestamp: Date.now(),
          });
        }

        logger.debug(`[WS] Broadcasted leaderboard update to ${this.clients.size} client(s)`);
      } catch (error) {
        logger.error('[WS] Leaderboard update error:', error);
      }
    }, 60000); // Every 60 seconds
  }

  private send(ws: WebSocket, data: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(data));
      } catch (error) {
        logger.error('WebSocket send error:', error);
      }
    }
  }

  private async sendInitialSnapshot(subscription: ClientSubscription): Promise<void> {
    if (subscription.tokenAddresses.size === 0) return;
    
    try {
      const addresses = Array.from(subscription.tokenAddresses);
      logger.info(`[WS] Sending initial snapshot for ${addresses.length} token(s) to client`);
      
      // Fetch cached/current data immediately
      const aggregated = await aggregatorService.aggregateTokenData(addresses);
      
      if (aggregated.length > 0) {
        logger.info(`[WS] Initial snapshot: ${aggregated.length} token(s) - ${aggregated.map(t => t.token.symbol).join(', ')}`);
        this.send(subscription.ws, {
          type: 'update', // Use same type as regular updates for consistency
          data: aggregated,
          timestamp: Date.now(),
        });
      } else {
        logger.warn(`[WS] Initial snapshot: No data found for tokens: ${addresses.join(', ')}`);
      }
    } catch (error) {
      logger.error('[WS] Error sending initial snapshot:', error);
    }
  }

  private sendError(ws: WebSocket, message: string): void {
    this.send(ws, {
      type: 'error',
      message,
      timestamp: Date.now(),
    });
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  broadcast(data: any): void {
    for (const subscription of this.clients.values()) {
      this.send(subscription.ws, data);
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }

  shutdown(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.leaderboardInterval) {
      clearInterval(this.leaderboardInterval);
    }
    if (this.wss) {
      this.wss.close();
    }
  }
}

