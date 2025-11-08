export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals?: number;
}

export interface PriceData {
  price: number;
  priceChange24h?: number;
  priceChangePercent24h?: number;
  volume24h?: number;
  liquidity?: number;
  marketCap?: number;
  timestamp: number;
}

export interface MemeCoinData {
  token: Token;
  priceData: PriceData;
  source: 'dexscreener' | 'geckoterminal' | 'merged';
  chain?: string;
  pairAddress?: string;
  fdv?: number;
  pairCreatedAt?: number;
}

export interface AggregatedMemeCoin {
  token: Token;
  priceData: PriceData;
  sources: string[];
  chains: string[];
  pairAddresses: string[];
  bestPrice: number;
  averagePrice: number;
  totalVolume24h: number;
  totalLiquidity: number;
  lastUpdated: number;
  confidenceScore?: number; // Price agreement confidence (0-100)
}

export interface DexScreenerResponse {
  pairs: Array<{
    chainId: string;
    dexId: string;
    url: string;
    pairAddress: string;
    baseToken: {
      address: string;
      name: string;
      symbol: string;
    };
    quoteToken: {
      address: string;
      name: string;
      symbol: string;
    };
    priceNative: string;
    priceUsd: string;
    txns: {
      m5: { buys: number; sells: number };
      h1: { buys: number; sells: number };
      h6: { buys: number; sells: number };
      h24: { buys: number; sells: number };
    };
    volume: {
      h24: number;
      h6: number;
      h1: number;
      m5: number;
    };
    priceChange: {
      m5: number;
      h1: number;
      h6: number;
      h24: number;
    };
    liquidity?: {
      usd?: number;
      base?: number;
      quote?: number;
    };
    fdv?: number;
    pairCreatedAt?: number;
  }>;
}

export interface GeckoTerminalResponse {
  data: {
    id: string;
    type: string;
    attributes: {
      address: string;
      name: string;
      symbol: string;
      decimals: number;
      total_supply: string;
      price_usd: string;
      price_native_currency: string;
      volume_usd: string;
      reserve_in_usd: string;
      fdv_usd: string;
      price_change_percentage: {
        m5: number;
        m15: number;
        m30: number;
        h1: number;
        h24: number;
      };
      transactions: {
        m5: { buys: number; sells: number };
        m15: { buys: number; sells: number };
        m30: { buys: number; sells: number };
        h1: { buys: number; sells: number };
        h24: { buys: number; sells: number };
      };
      token_price_usd: string;
      token_price_native_currency: string;
    };
    relationships: {
      base_token: {
        data: {
          id: string;
          type: string;
        };
      };
      quote_token: {
        data: {
          id: string;
          type: string;
        };
      };
      dex: {
        data: {
          id: string;
          type: string;
        };
      };
      network: {
        data: {
          id: string;
          type: string;
        };
      };
    };
  }[];
}

