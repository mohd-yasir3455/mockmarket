require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// 1. FIX: Create the Yahoo Finance Instance properly
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance(); 

const User = require('./models/User');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

// --- SMART PRICE FETCHER ---
// We add a 'strict' flag. 
// If strict = true (Top Stocks), we use the symbol EXACTLY as provided.
// If strict = false (Search Bar), we add .NS if it looks like an Indian stock.
const getStockPrice = async (symbol, strict = false) => {
  try {
    let searchSymbol = symbol;

    // Only auto-append .NS if NOT in strict mode
    if (!strict && !symbol.includes('.') && !symbol.includes(':') && !symbol.includes('-')) {
       searchSymbol = symbol + '.NS'; 
    }
    
    const quote = await yahooFinance.quote(searchSymbol);
    return quote.regularMarketPrice;

  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error.message);
    return null;
  }
};

// Route: User Login/Create
app.get('/api/user/:username', async (req, res) => {
  let user = await User.findOne({ username: req.params.username });
  if (!user) {
    user = new User({ username: req.params.username });
    await user.save();
  }
  res.json(user);
});

// Route: Get Top Popular Stocks (CORRECTED SYMBOLS)
app.get('/api/top-stocks', async (req, res) => {
  const topSymbols = [
    { symbol: 'AAPL', name: 'Apple Inc' },      // US Stock
    { symbol: 'MSFT', name: 'Microsoft' },      // US Stock
    { symbol: 'TSLA', name: 'Tesla Inc' },      // US Stock
    { symbol: 'AMZN', name: 'Amazon' },         // US Stock
    { symbol: 'BTC-USD', name: 'Bitcoin' },     // Crypto (Yahoo Format)
    { symbol: 'ETH-USD', name: 'Ethereum' },    // Crypto (Yahoo Format)
    { symbol: 'RELIANCE.NS', name: 'Reliance' } // India (Explicit)
  ];

  const results = [];
  for (const stock of topSymbols) {
    // Pass 'true' for strict mode so it doesn't add .NS to Apple/Bitcoin
    const price = await getStockPrice(stock.symbol, true);
    results.push({
      symbol: stock.symbol.replace('.NS', ''), // Clean name for UI
      name: stock.name,
      price: price || 0
    });
  }
  res.json(results);
});

// Route: Buy Stock (Search Bar - Auto detects .NS)
app.post('/api/buy', async (req, res) => {
  const { username, symbol, quantity } = req.body;
  
  // Pass 'false' so if user types "TATASTEEL", it becomes "TATASTEEL.NS"
  const price = await getStockPrice(symbol, false);
  
  if (!price) return res.status(400).json({ msg: 'Market Unavailable' });

  const cost = price * quantity;
  const user = await User.findOne({ username });

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
});

// Route: Sell Stock
app.post('/api/sell', async (req, res) => {
  const { username, symbol, quantity } = req.body;
  const price = await getStockPrice(symbol, false); // Use search mode

  if (!price) return res.status(400).json({ msg: 'Market Unavailable' });

  const user = await User.findOne({ username });
  if (!user) return res.status(404).json({ msg: 'User not found' });

  const stockIndex = user.portfolio.findIndex(s => s.symbol === symbol);
  if (stockIndex === -1) return res.status(400).json({ msg: 'Not owned' });

  const existingStock = user.portfolio[stockIndex];
  if (existingStock.quantity < quantity) return res.status(400).json({ msg: 'Not enough shares' });

  user.balance += (price * quantity);
  existingStock.quantity -= parseInt(quantity);

  if (existingStock.quantity <= 0) user.portfolio.splice(stockIndex, 1);

  await user.save();
  res.json({ msg: 'Sold', user });
});

// Route: Dashboard (Auto-Create + Value)
app.get('/api/dashboard/:username', async (req, res) => {
  try {
    let user = await User.findOne({ username: req.params.username });
    if (!user) {
      user = new User({ username: req.params.username });
      await user.save();
    }

    let portfolioValue = 0;
    const enrichedPortfolio = [];

    for (let stock of user.portfolio) {
      // Use search mode (false) to respect how they bought it
      let currentPrice = await getStockPrice(stock.symbol, false);
      
      const currentValue = (currentPrice || stock.avgPrice) * stock.quantity;
      const investedValue = stock.avgPrice * stock.quantity;
      
      portfolioValue += currentValue;
      enrichedPortfolio.push({
        ...stock.toObject(),
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
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

app.listen(process.env.PORT || 5000, () => console.log(`Server running`));