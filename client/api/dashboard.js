import { connectToDatabase } from './db.js';
import User from '../models/User.js';
import yahooFinance from 'yahoo-finance2';

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const parts = url.pathname.split('/').filter(Boolean); // ['api','dashboard','username']
    const username = url.searchParams.get('username') || parts[2];
    if (!username) return res.status(400).json({ msg: 'username required' });

    await connectToDatabase();
    let user = await User.findOne({ username });
    if (!user) {
      user = new User({ username });
      await user.save();
    }

    let portfolioValue = 0;
    const enrichedPortfolio = [];

    for (let stock of user.portfolio) {
      let currentPrice = null;
      try {
        currentPrice = (await yahooFinance.quote(stock.symbol.includes('.')||stock.symbol.includes(':')?stock.symbol:stock.symbol + '.NS'))?.regularMarketPrice;
      } catch (err) {
        currentPrice = null;
      }

      const currentValue = (currentPrice || stock.avgPrice) * stock.quantity;
      const investedValue = stock.avgPrice * stock.quantity;

      portfolioValue += currentValue;
      enrichedPortfolio.push({
        ...stock.toObject?.() || stock,
        currentPrice: currentPrice || stock.avgPrice,
        pl: currentValue - investedValue,
        plPercent: investedValue === 0 ? 0 : (((currentValue - investedValue) / investedValue) * 100).toFixed(2)
      });
    }

    res.json({
      balance: user.balance,
      netWorth: user.balance + portfolioValue,
      portfolioValue,
      portfolio: enrichedPortfolio
    });
  } catch (err) {
    console.error('dashboard error', err);
    res.status(500).json({ msg: 'Server Error' });
  }
}
