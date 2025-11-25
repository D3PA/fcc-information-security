'use strict';
const fetch = require('node-fetch');

// in memory storage 
let stocks = [];

// helper function to anonymize IP
const anonymizeIP = (ip) => {
  if (!ip) return '0.0.0.0';
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.0.0`;
  }
  return ip;
};

// helper function to get stock price
const getStockPrice = async (symbol) => {
  try {
    const response = await fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`);
    if (!response.ok) {
      throw new Error('Stock not found');
    }
    const data = await response.json();
    return data.latestPrice;
  } catch (error) {
    throw new Error('Stock not found');
  }
};

// helper function to get or create stock
const getStockData = (symbol, ip, like) => {
  const symbolUpper = symbol.toUpperCase();
  let stock = stocks.find(s => s.symbol === symbolUpper);
  
  if (!stock) {
    stock = { symbol: symbolUpper, likes: 0, ips: [] };
    stocks.push(stock);
  }
  
  if (like === 'true' && !stock.ips.includes(ip)) {
    stock.likes += 1;
    stock.ips.push(ip);
  }
  
  return stock;
};

module.exports = function (app) {
  app.route('/api/stock-prices')
    .get(async function (req, res) {
      try {
        const { stock, like } = req.query;
        
        if (!stock) {
          return res.status(400).json({ error: 'Stock symbol is required' });
        }
        
        const ip = anonymizeIP(req.ip || req.connection.remoteAddress || '127.0.0.1');
        
        // single stock
        if (!Array.isArray(stock)) {
          const price = await getStockPrice(stock);
          const stockData = getStockData(stock, ip, like);
          
          return res.json({
            stockData: {
              stock: stockData.symbol,
              price: price,
              likes: stockData.likes
            }
          });
        }
        
        // two stocks
        if (Array.isArray(stock) && stock.length === 2) {
          const [price1, price2] = await Promise.all([
            getStockPrice(stock[0]),
            getStockPrice(stock[1])
          ]);
          
          const stockData1 = getStockData(stock[0], ip, like);
          const stockData2 = getStockData(stock[1], ip, like);
          
          const rel_likes = stockData1.likes - stockData2.likes;
          
          return res.json({
            stockData: [
              {
                stock: stockData1.symbol,
                price: price1,
                rel_likes: rel_likes
              },
              {
                stock: stockData2.symbol,
                price: price2,
                rel_likes: -rel_likes
              }
            ]
          });
        }
        
        res.status(400).json({ error: 'Invalid stock parameter' });
        
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
};
