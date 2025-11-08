// Quick test script to verify API endpoints work
const axios = require('axios');

async function testDexScreener() {
  try {
    console.log('Testing DexScreener API...');
    const address = 'So11111111111111111111111111111111111111112';
    const url = `https://api.dexscreener.com/latest/dex/tokens/${address}`;
    console.log(`URL: ${url}`);
    
    const response = await axios.get(url, { timeout: 10000 });
    console.log('Status:', response.status);
    console.log('Has pairs?', !!response.data?.pairs);
    console.log('Pairs count:', response.data?.pairs?.length || 0);
    
    if (response.data?.pairs && response.data.pairs.length > 0) {
      const firstPair = response.data.pairs[0];
      console.log('First pair:', {
        symbol: firstPair.baseToken?.symbol,
        priceUsd: firstPair.priceUsd,
        volume: firstPair.volume?.h24
      });
    }
  } catch (error) {
    console.error('DexScreener error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

async function testGeckoTerminal() {
  try {
    console.log('\nTesting GeckoTerminal API...');
    const address = 'So11111111111111111111111111111111111111112';
    const url = `https://api.geckoterminal.com/api/v2/networks/solana/tokens/${address}`;
    console.log(`URL: ${url}`);
    
    const response = await axios.get(url, { timeout: 10000 });
    console.log('Status:', response.status);
    console.log('Has data?', !!response.data?.data);
    
    if (response.data?.data) {
      const data = Array.isArray(response.data.data) ? response.data.data[0] : response.data.data;
      if (data?.attributes) {
        console.log('Token data:', {
          symbol: data.attributes.symbol,
          priceUsd: data.attributes.price_usd,
          volume: data.attributes.volume_usd
        });
      }
    }
  } catch (error) {
    console.error('GeckoTerminal error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data).substring(0, 200));
    }
  }
}

(async () => {
  await testDexScreener();
  await testGeckoTerminal();
})();

