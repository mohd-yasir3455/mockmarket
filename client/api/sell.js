import { connectToDatabase } from './db.js';
import User from '../models/User.js';
import yahooFinance from 'yahoo-finance2';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ msg: 'Method not allowed' });

  try {
    const { username, symbol, quantity } = req.body;
    if (!username || !symbol || !quantity) return res.status(400).json({ msg: 'Missing fields' });

    await connectToDatabase();
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const quote = await yahooFinance.quote(symbol.includes('.')||symbol.includes(':')?symbol:symbol + '.NS');
    const price = quote?.regularMarketPrice;
    if (!price) return res.status(400).json({ msg: 'Market Unavailable' });

    const stockIndex = user.portfolio.findIndex(s => s.symbol === symbol);
    if (stockIndex === -1) return res.status(400).json({ msg: 'Not owned' });

    const existingStock = user.portfolio[stockIndex];
    if (existingStock.quantity < quantity) return res.status(400).json({ msg: 'Not enough shares' });

    user.balance += (price * quantity);
    existingStock.quantity -= parseInt(quantity);

    if (existingStock.quantity <= 0) user.portfolio.splice(stockIndex, 1);

    await user.save();
    res.json({ msg: 'Sold', user });
  } catch (err) {
    console.error('sell error', err);
    res.status(500).json({ msg: 'Server Error' });
  }
}
