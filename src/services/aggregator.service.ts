import { MemeCoinData, AggregatedMemeCoin, PriceData } from '../types';
import { dexscreenerClient } from '../clients/dexscreener.client';
import { geckoterminalClient } from '../clients/geckoterminal.client';
import { jupiterClient } from '../clients/jupiter.client';
import { redisService } from './redis.service';
import { config } from '../config';
import { logger } from '../utils/logger';
import { metricsCollector } from '../utils/metrics';

export class AggregatorService {
  async aggregateTokenData(tokenAddresses: string[]): Promise<AggregatedMemeCoin[]> {
    const startTime = Date.now();
    const cacheKey = `${config.cache.keyPrefix}aggregated:${tokenAddresses.sort().join(',')}`;

    // Check cache (but don't fail if Redis is down)
    let cacheHit = false;
    try {
      const cached = await redisService.get<AggregatedMemeCoin[]>(cacheKey);
      if (cached && cached.length > 0) {
        cacheHit = true;
        const latency = Date.now() - startTime;
        logger.debug(`[cache] hit ${tokenAddresses.join(',')} (${latency}ms)`);
        metricsCollector.record({ timestamp: Date.now(), latency, cacheHit: true });
        return cached;
      }
      if (cached && cached.length === 0) {
        logger.warn('Cache contains empty array - clearing and fetching fresh data');
        await redisService.del(cacheKey);
      }
    } catch (error) {
      logger.warn('Cache check failed, proceeding with fresh fetch:', error);
    }

    logger.info(`Aggregating data for ${tokenAddresses.length} token(s): ${tokenAddresses.join(', ')}`);

    // Fetch from all sources in parallel with error handling
    const fetchStartTime = Date.now();
    
    // Get token symbols for Jupiter (we'll fetch prices for all tokens)
    // First, try to get symbols from a quick DexScreener call or use addresses
    const [dexscreenerData, geckoterminalData, jupiterPriceData] = await Promise.allSettled([
      dexscreenerClient.getTokenPairs(tokenAddresses),
      this.fetchGeckoTerminalData(tokenAddresses),
      jupiterClient.getPrices(tokenAddresses), // Get prices for all requested tokens
    ]);

    // Fetch latency tracked per source below
    const allData: MemeCoinData[] = [];

    if (dexscreenerData.status === 'fulfilled') {
      const dexscreenerLatency = Date.now() - fetchStartTime;
      logger.info(`[fetch] DexScreener: ${dexscreenerLatency}ms | ${dexscreenerData.value.length} results`);
      metricsCollector.record({ timestamp: Date.now(), latency: dexscreenerLatency, cacheHit: false, source: 'dexscreener' });
      allData.push(...dexscreenerData.value);
    } else {
      logger.error('DexScreener fetch failed:', dexscreenerData.reason);
    }

    if (geckoterminalData.status === 'fulfilled') {
      const geckoLatency = Date.now() - fetchStartTime;
      logger.info(`[fetch] GeckoTerminal: ${geckoLatency}ms | ${geckoterminalData.value.length} results`);
      metricsCollector.record({ timestamp: Date.now(), latency: geckoLatency, cacheHit: false, source: 'geckoterminal' });
      allData.push(...geckoterminalData.value);
    } else {
      logger.error('GeckoTerminal fetch failed:', geckoterminalData.reason);
    }

    // Extract Jupiter prices and map to token addresses
    const jupiterPrices: Record<string, number> = {};
    if (jupiterPriceData.status === 'fulfilled' && jupiterPriceData.value) {
      const jupiterData = jupiterPriceData.value;
      // Jupiter returns data keyed by token ID (symbol or address)
      // Map to addresses by matching symbols from our collected data
      for (const [tokenId, priceInfo] of Object.entries(jupiterData)) {
        if (priceInfo && typeof priceInfo === 'object' && 'price' in priceInfo) {
          const price = (priceInfo as any).price;
          if (price && price > 0) {
            // Find matching token by symbol or address
            const matchingToken = allData.find(
              item => item.token.symbol === tokenId || 
                      item.token.address.toLowerCase() === tokenId.toLowerCase() ||
                      tokenId.toLowerCase() === item.token.address.toLowerCase()
            );
            if (matchingToken) {
              jupiterPrices[matchingToken.token.address.toLowerCase()] = price;
            } else {
              // Try direct address match
              const directMatch = tokenAddresses.find(addr => 
                addr.toLowerCase() === tokenId.toLowerCase()
              );
              if (directMatch) {
                jupiterPrices[directMatch.toLowerCase()] = price;
              }
            }
          }
        }
      }
      if (Object.keys(jupiterPrices).length > 0) {
        logger.info(`[fetch] Jupiter: ${Object.keys(jupiterPrices).length} prices retrieved`);
      }
    } else {
      logger.debug('Jupiter fetch skipped or returned no data');
    }

    logger.info(`Total data collected: ${allData.length} items from all sources`);

    if (allData.length === 0) {
      logger.warn(`No data collected from any source for addresses: ${tokenAddresses.join(', ')}`);
      // Return empty array instead of caching empty results
      return [];
    }

    // Merge and aggregate data with Jupiter price enrichment
    const mergeStartTime = Date.now();
    const aggregated = this.mergeData(allData, jupiterPrices);
    const mergeLatency = Date.now() - mergeStartTime;

    logger.info(`[merge] ${aggregated.length} tokens | Latency: ${mergeLatency}ms`);

    // Cache aggregated result
    await redisService.set(cacheKey, aggregated, config.cache.ttlSeconds);

    // Record total latency
    const totalLatency = Date.now() - startTime;
    metricsCollector.record({ timestamp: Date.now(), latency: totalLatency, cacheHit: false });
    logger.info(`[METRIC] Total latency: ${totalLatency}ms | Cache hit: ${cacheHit ? 'yes' : 'no'}`);

    return aggregated;
  }

  async searchTokens(query: string): Promise<AggregatedMemeCoin[]> {
    const cacheKey = `${config.cache.keyPrefix}search:${query}`;

    const cached = await redisService.get<AggregatedMemeCoin[]>(cacheKey);
    if (cached) {
      logger.debug('Search cache hit');
      return cached;
    }

    const [dexscreenerResults, geckoterminalResults] = await Promise.allSettled([
      dexscreenerClient.searchTokens(query),
      geckoterminalClient.searchTokens(query),
    ]);

    const allData: MemeCoinData[] = [];

    if (dexscreenerResults.status === 'fulfilled') {
      allData.push(...dexscreenerResults.value);
    }

    if (geckoterminalResults.status === 'fulfilled') {
      allData.push(...geckoterminalResults.value);
    }

    const aggregated = this.mergeData(allData);

    await redisService.set(cacheKey, aggregated, config.cache.ttlSeconds);

    return aggregated;
  }

  private async fetchGeckoTerminalData(tokenAddresses: string[]): Promise<MemeCoinData[]> {
    const results: MemeCoinData[] = [];

    // Fetch each address (GeckoTerminal is configured for Solana)
    for (const address of tokenAddresses) {
      try {
        const data = await geckoterminalClient.getTokenData(address);
        if (data) {
          results.push(data);
        }
      } catch (error) {
        // Continue to next address
        continue;
      }
    }

    return results;
  }

  private mergeData(data: MemeCoinData[], jupiterPrices: Record<string, number> = {}): AggregatedMemeCoin[] {
    if (data.length === 0) {
      logger.warn('mergeData called with empty data array');
      return [];
    }

    // Group by token address
    const tokenMap = new Map<string, MemeCoinData[]>();

    for (const item of data) {
      const key = item.token.address.toLowerCase();
      if (!tokenMap.has(key)) {
        tokenMap.set(key, []);
      }
      tokenMap.get(key)!.push(item);
    }

    logger.debug(`Grouped ${data.length} items into ${tokenMap.size} unique tokens`);

    const aggregated: AggregatedMemeCoin[] = [];

    for (const [address, items] of tokenMap.entries()) {
      if (items.length === 0) continue;

      // Separate data by source for enrichment
      const dexData = items.find(item => item.source === 'dexscreener');
      const geckoData = items.find(item => item.source === 'geckoterminal');
      const jupiterPrice = jupiterPrices[address];

      // Collect all prices (including Jupiter if available)
      const allPrices: number[] = items.map((item) => item.priceData.price).filter((p) => p > 0);
      if (jupiterPrice && jupiterPrice > 0) {
        allPrices.push(jupiterPrice);
      }

      if (allPrices.length === 0) {
        logger.warn(`No valid prices found for token ${address}, skipping`);
        continue;
      }

      // Calculate price statistics
      const bestPrice = Math.max(...allPrices);
      const minPrice = Math.min(...allPrices);
      const averagePrice = allPrices.reduce((sum, p) => sum + p, 0) / allPrices.length;

      // Calculate confidence score based on price agreement
      let confidenceScore = 100;
      if (allPrices.length > 1) {
        const priceSpread = (bestPrice - minPrice) / averagePrice;
        // Confidence decreases as price spread increases
        // 1% spread = 99% confidence, 5% spread = 95% confidence, etc.
        confidenceScore = Math.max(0, Math.min(100, 100 - (priceSpread * 100 * 10)));
        confidenceScore = Math.round(confidenceScore * 10) / 10; // Round to 1 decimal
      }

      // Aggregate volumes and liquidities
      const volumes = items.map((item) => item.priceData.volume24h || 0);
      const liquidities = items.map((item) => item.priceData.liquidity || 0);
      const totalVolume24h = volumes.reduce((sum, v) => sum + v, 0);
      const totalLiquidity = liquidities.reduce((sum, l) => sum + l, 0);

      // Use the most recent price data as base, then enrich with missing fields
      const latestPriceData = items.reduce((latest, current) =>
        current.priceData.timestamp > latest.priceData.timestamp ? current : latest
      ).priceData;

      // Build enriched price data - merge from all sources
      const enrichedPriceData: PriceData = {
        price: averagePrice,
        volume24h: dexData?.priceData.volume24h ?? geckoData?.priceData.volume24h ?? latestPriceData.volume24h ?? totalVolume24h,
        liquidity: dexData?.priceData.liquidity ?? geckoData?.priceData.liquidity ?? latestPriceData.liquidity ?? totalLiquidity,
        marketCap: dexData?.priceData.marketCap ?? geckoData?.priceData.marketCap ?? latestPriceData.marketCap,
        priceChange24h: dexData?.priceData.priceChange24h ?? geckoData?.priceData.priceChange24h ?? latestPriceData.priceChange24h,
        priceChangePercent24h: dexData?.priceData.priceChangePercent24h ?? geckoData?.priceData.priceChangePercent24h ?? latestPriceData.priceChangePercent24h,
        timestamp: Math.max(...items.map(item => item.priceData.timestamp)),
      };

      // Collect all sources (including Jupiter if we have price data)
      const sources = new Set<string>();
      items.forEach(item => sources.add(item.source));
      if (jupiterPrice && jupiterPrice > 0) {
        sources.add('jupiter');
      }

      // Use best token metadata (prefer DexScreener, fallback to GeckoTerminal)
      const bestToken = dexData?.token || geckoData?.token || items[0].token;

      aggregated.push({
        token: bestToken,
        priceData: enrichedPriceData,
        sources: Array.from(sources),
        chains: [...new Set(items.map((item) => item.chain).filter((c): c is string => Boolean(c)))],
        pairAddresses: [...new Set(items.map((item) => item.pairAddress).filter((p): p is string => Boolean(p)))],
        bestPrice,
        averagePrice,
        totalVolume24h,
        totalLiquidity,
        confidenceScore,
        lastUpdated: Date.now(),
      });

      logger.debug(`Merged token ${bestToken.symbol}: ${sources.size} sources, confidence: ${confidenceScore}%`);
    }

    return aggregated;
  }
}

export const aggregatorService = new AggregatorService();

