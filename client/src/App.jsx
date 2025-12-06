import { useState, useEffect } from 'react';
import axios from 'axios';

// Icons
const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);
function App() {
  const [orderType, setOrderType] = useState('BUY'); // 'BUY' or 'SELL'
  const [data, setData] = useState(null);
  const [marketTrends, setMarketTrends] = useState([]); // State for right column
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const USERNAME = 'demo_user'; 

  // 1. Fetch Dashboard Data (Auto-refresh every 5s)
  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 5000);
    return () => clearInterval(interval);
  }, []);

  // 2. Fetch Market Trends (Once on load)
  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/top-stocks');
        setMarketTrends(res.data);
      } catch (err) { console.error(err); }
    };
    fetchTrends();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/dashboard/${USERNAME}`);
      setData(res.data);
    } catch (err) { console.error(err); }
  };
const handleTrade = async (e) => {
    e.preventDefault();
    if(!symbol || !quantity) return;
    setLoading(true);
    
    // DECIDE: Buy or Sell URL?
    const endpoint = orderType === 'BUY' ? '/api/buy' : '/api/sell';

    try {
      await axios.post(`http://localhost:5000${endpoint}`, {
        username: USERNAME,
        symbol: symbol.toUpperCase(),
        quantity: parseInt(quantity)
      });
      
      const action = orderType === 'BUY' ? 'Bought' : 'Sold';
      setMsg({ text: `${action} ${quantity} ${symbol}`, type: 'success' });
      
      // Clear form and refresh data
      setSymbol(''); 
      setQuantity('');
      fetchDashboard();
    } catch (err) {
      setMsg({ text: err.response?.data?.msg || 'Transaction Failed', type: 'error' });
    }
    setLoading(false);
  };

  const getColor = (val) => val >= 0 ? 'text-green-400' : 'text-red-400';

  if (!data) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading Terminal...</div>;

  return (
    // Changed max-w-6xl to max-w-[1800px] to use the full screen width
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-gray-800 p-4 rounded-xl border border-gray-700">
          <div className="flex items-center gap-3">
             <div className="bg-blue-600 p-2 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
             </div>
             <h1 className="text-2xl font-bold tracking-tight">MockMarket <span className="text-gray-500 text-sm font-normal ml-2">v1.0</span></h1>
          </div>
          <button onClick={fetchDashboard} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition">
             <RefreshIcon /> Refresh
          </button>
        </div>

        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Cash Balance" value={`₹${data.balance.toFixed(2)}`} />
          <StatCard title="Portfolio Value" value={`₹${data.portfolioValue.toFixed(2)}`} />
          <StatCard title="Net Worth" value={`₹${data.netWorth.toFixed(2)}`} highlight />
        </div>

        {/* MAIN GRID: 3 COLUMNS NOW */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* COLUMN 1: Holdings (Takes 50% width - 2 cols) */}
          <div className="xl:col-span-2 bg-gray-800 rounded-xl shadow-xl border border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700 bg-gray-750">
              <h2 className="font-semibold">Your Holdings</h2>
            </div>
            <div className="overflow-auto flex-grow">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-900 text-gray-400">
                  <tr>
                    <th className="p-3">Symbol</th>
                    <th className="p-3">Qty</th>
                    <th className="p-3">Current</th>
                    <th className="p-3 text-right">P/L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {data.portfolio.map((stock, idx) => (
                    <tr key={idx} className="hover:bg-gray-700/50">
                      <td className="p-3 font-bold">{stock.symbol}</td>
                      <td className="p-3 text-gray-400">{stock.quantity}</td>
                      <td className="p-3">₹{stock.currentPrice?.toFixed(2)}</td>
                      <td className={`p-3 text-right font-mono ${getColor(stock.pl)}`}>
{stock.pl >= 0 ? '+' : ''}₹{(stock.pl || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {data.portfolio.length === 0 && <tr><td colSpan="4" className="p-4 text-center text-gray-500">Empty Portfolio</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* COLUMN 2: Place Order (Takes 25% width - 1 col) */}
 {/* COLUMN 2: Place Order (With Buy/Sell Toggle) */}
<div className="xl:col-span-1 bg-gray-800 rounded-xl shadow-xl border border-gray-700 h-fit">
  
  {/* Header with Toggle Switch */}
  <div className="p-1 border-b border-gray-700 bg-gray-750 flex">
    <button 
      onClick={() => setOrderType('BUY')}
      className={`flex-1 py-3 text-sm font-bold transition-colors ${orderType === 'BUY' ? 'bg-gray-800 text-green-400 border-b-2 border-green-500' : 'text-gray-500 hover:text-gray-300'}`}
    >
      BUY
    </button>
    <button 
      onClick={() => setOrderType('SELL')}
      className={`flex-1 py-3 text-sm font-bold transition-colors ${orderType === 'SELL' ? 'bg-gray-800 text-red-400 border-b-2 border-red-500' : 'text-gray-500 hover:text-gray-300'}`}
    >
      SELL
    </button>
  </div>

  <form onSubmit={handleTrade} className="p-4 space-y-4">
    <div>
      <label className="text-xs text-gray-400 uppercase">Symbol</label>
      <input 
        type="text" 
        className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-blue-500 outline-none uppercase"
        placeholder={orderType === 'BUY' ? "e.g. AAPL" : "Stock to sell..."}
        value={symbol}
        onChange={e => setSymbol(e.target.value)}
      />
    </div>
    <div>
      <label className="text-xs text-gray-400 uppercase">Qty</label>
      <input 
        type="number" 
        min="1"
        className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-blue-500 outline-none"
        value={quantity}
        onChange={e => setQuantity(e.target.value)}
      />
    </div>

    {/* Dynamic Button Color */}
    <button 
      disabled={loading} 
      className={`w-full py-2 rounded font-bold transition ${orderType === 'BUY' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
    >
      {loading ? 'Processing...' : `${orderType} NOW`}
    </button>

    {msg && (
      <div className={`text-xs p-2 rounded text-center ${msg.type === 'error' ? 'text-red-300 bg-red-900/30' : 'text-green-300 bg-green-900/30'}`}>
        {msg.text}
      </div>
    )}
  </form>
</div>
          {/* COLUMN 3: Market Trends (Takes 25% width - 1 col) - FILLS THE BLANK SPACE */}
          <div className="xl:col-span-1 bg-gray-800 rounded-xl shadow-xl border border-gray-700 h-fit">
            <div className="p-4 border-b border-gray-700 bg-gray-750 flex justify-between items-center">
              <h2 className="font-semibold">Market Trends</h2>
              <span className="text-[10px] bg-green-900 text-green-300 px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
            </div>
            <div className="p-0">
               <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-gray-700">
                  {marketTrends.length === 0 ? (
                    <tr><td className="p-4 text-center text-gray-500 italic">Loading trends...</td></tr>
                  ) : (
                    marketTrends.map((stock, idx) => (
                      <tr key={idx} className="hover:bg-gray-700/50 group cursor-pointer" onClick={() => setSymbol(stock.symbol)}>
                        <td className="p-3">
                          <div className="font-bold text-gray-200 group-hover:text-blue-400 transition">{stock.symbol}</div>
                          <div className="text-[10px] text-gray-500 uppercase">{stock.name}</div>
                        </td>
                        <td className="p-3 text-right font-mono text-gray-300">
                          ₹{stock.price.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
               </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, highlight }) {
  return (
    <div className={`p-5 rounded-xl border ${highlight ? 'bg-blue-900/20 border-blue-500/50' : 'bg-gray-800 border-gray-700'}`}>
      <h3 className="text-xs font-medium text-gray-400 uppercase">{title}</h3>
      <div className="mt-1 text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

export default App;