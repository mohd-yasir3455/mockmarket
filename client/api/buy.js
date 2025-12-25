import { connectToDatabase } from './db.js';
import User from '../models/User.js';
import yahooFinance from 'yahoo-finance2';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ msg: 'Method not allowed' });

  try {
    const { username, symbol, quantity } = req.body;
    if (!username || !symbol || !quantity) return res.status(400).json({ msg: 'Missing fields' });

    await connectToDatabase();

    // auto-append .NS unless contains . or : or -
    let searchSymbol = symbol;
    if (!symbol.includes('.') && !symbol.includes(':') && !symbol.includes('-')) {
      searchSymbol = symbol + '.NS';
    }

    const quote = await yahooFinance.quote(searchSymbol);
    const price = quote?.regularMarketPrice;
    if (!price) return res.status(400).json({ msg: 'Market Unavailable' });

    const cost = price * quantity;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (user.balance < cost) return res.status(400).json({ msg: 'Insufficient Funds' });

    user.balance -= cost;

    const existingStock = user.portfolio.find(s => s.symbol === symbol);
    if (existingStock) {
      const totalCost = (existingStock.quantity * existingStock.avgPrice) + cost;
      existingStock.quantity += parseInt(quantity);
      existingStock.avgPrice = totalCost / existingStock.quantity;
    } else {
      user.portfolio.push({ symbol, quantity, avgPrice: price });
    }

    await user.save();
    res.json(user);
  } catch (err) {
    console.error('buy error', err);
    res.status(500).json({ msg: 'Server Error' });
  }
}
