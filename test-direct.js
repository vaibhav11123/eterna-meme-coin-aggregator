// Direct test without Redis or caching
const axios = require('axios');
const https = require('https');

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function test() {
  const address = 'So11111111111111111111111111111111111111112';
  
  console.log('Testing DexScreener...');
  try {
    const response = await axios.get(
      `https://api.dexscreener.com/latest/dex/tokens/${address}`,
      { 
        timeout: 10000,
        httpsAgent 
      }
    );
    console.log('✅ DexScreener Success!');
    console.log('Status:', response.status);
    console.log('Has pairs:', !!response.data?.pairs);
    console.log('Pairs count:', response.data?.pairs?.length || 0);
    
    if (response.data?.pairs && response.data.pairs.length > 0) {
      const pair = response.data.pairs[0];
      console.log('\nFirst pair sample:');
      console.log('  Symbol:', pair.baseToken?.symbol);
      console.log('  Price USD:', pair.priceUsd);
      console.log('  Volume 24h:', pair.volume?.h24);
      console.log('  Chain:', pair.chainId);
    } else {
      console.log('⚠️  Response structure:', Object.keys(response.data || {}));
      console.log('Full response (first 500 chars):', JSON.stringify(response.data).substring(0, 500));
    }
  } catch (error) {
    console.error('❌ DexScreener Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Headers:', error.response.headers);
    }
  }

  console.log('\n\nTesting GeckoTerminal...');
  try {
    const response = await axios.get(
      `https://api.geckoterminal.com/api/v2/networks/solana/tokens/${address}`,
      { 
        timeout: 10000,
        httpsAgent 
      }
    );
    console.log('✅ GeckoTerminal Success!');
    console.log('Status:', response.status);
    console.log('Has data:', !!response.data?.data);
    
    if (response.data?.data) {
      const data = Array.isArray(response.data.data) ? response.data.data[0] : response.data.data;
      if (data?.attributes) {
        console.log('\nToken data sample:');
        console.log('  Symbol:', data.attributes.symbol);
        console.log('  Price USD:', data.attributes.price_usd);
        console.log('  Volume USD:', data.attributes.volume_usd);
      }
    } else {
      console.log('⚠️  Response structure:', Object.keys(response.data || {}));
    }
  } catch (error) {
    console.error('❌ GeckoTerminal Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
    }
  }
}

test();

