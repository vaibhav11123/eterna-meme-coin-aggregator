import { WebSocketService } from '../websocket.service';
import { createServer } from 'http';

describe('WebSocket Service', () => {
  let server: any;
  let wsService: WebSocketService;

  beforeAll(() => {
    server = createServer();
    wsService = new WebSocketService(server);
  });

  afterAll(() => {
    wsService.shutdown();
    server.close();
  });

  it('should initialize WebSocket server', () => {
    expect(wsService).toBeDefined();
  });

  it('should track client connections', () => {
    const count = wsService.getClientCount();
    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it('should handle shutdown gracefully', () => {
    expect(() => wsService.shutdown()).not.toThrow();
  });
});

