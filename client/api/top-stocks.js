import yahooFinance from 'yahoo-finance2';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ msg: 'Method not allowed' });

  const topSymbols = [
    { symbol: 'AAPL', name: 'Apple Inc' },
    { symbol: 'MSFT', name: 'Microsoft' },
    { symbol: 'TSLA', name: 'Tesla Inc' },
    { symbol: 'AMZN', name: 'Amazon' },
    { symbol: 'BTC-USD', name: 'Bitcoin' },
    { symbol: 'ETH-USD', name: 'Ethereum' },
    { symbol: 'RELIANCE.NS', name: 'Reliance' }
  ];

  try {
    const results = [];
    for (const stock of topSymbols) {
      const quote = await yahooFinance.quote(stock.symbol);
      const price = quote?.regularMarketPrice ?? 0;
      results.push({
        symbol: stock.symbol.replace('.NS', ''),
        name: stock.name,
        price
      });
    }
    res.status(200).json(results);
  } catch (err) {
    console.error('top-stocks error', err);
    res.status(500).json({ msg: 'Error fetching stocks' });
  }
}
