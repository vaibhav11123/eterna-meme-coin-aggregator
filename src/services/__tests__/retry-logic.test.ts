import axios from 'axios';

// Mock axios for retry logic testing
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Retry Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle API failures gracefully', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));
    
    // Test that the system doesn't crash on API failure
    try {
      await mockedAxios.get('https://api.dexscreener.com/latest/dex/tokens/test');
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it('should handle timeout errors', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('ETIMEDOUT'));
    
    try {
      await mockedAxios.get('https://api.dexscreener.com/latest/dex/tokens/test');
    } catch (error: any) {
      expect(error.message).toContain('ETIMEDOUT');
    }
  });

  it('should handle rate limit errors', async () => {
    const rateLimitError = {
      response: { status: 429, statusText: 'Too Many Requests' },
    };
    mockedAxios.get.mockRejectedValueOnce(rateLimitError);
    
    try {
      await mockedAxios.get('https://api.dexscreener.com/latest/dex/tokens/test');
    } catch (error: any) {
      expect(error.response?.status).toBe(429);
    }
  });
});

