import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import passport from "passport";
import { storage } from "./storage";
import { insertWatchlistSchema, insertPriceAlertSchema, insertFundWatchlistSchema, insertCurrencyRateSchema, insertPortfolioSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { requireAuth, hashPassword } from "./auth";

// CoinGecko API integration
const COINGECKO_API_BASE = "https://api.coingecko.com/api/v3";

// Seed data for when CoinGecko is unavailable
const SEED_CRYPTOS = [
  { id: "bitcoin", symbol: "btc", name: "Bitcoin", rank: 1 },
  { id: "ethereum", symbol: "eth", name: "Ethereum", rank: 2 },
  { id: "tether", symbol: "usdt", name: "Tether", rank: 3 },
  { id: "binancecoin", symbol: "bnb", name: "BNB", rank: 4 },
  { id: "solana", symbol: "sol", name: "Solana", rank: 5 },
  { id: "usd-coin", symbol: "usdc", name: "USDC", rank: 6 },
  { id: "xrp", symbol: "xrp", name: "XRP", rank: 7 },
  { id: "cardano", symbol: "ada", name: "Cardano", rank: 8 },
  { id: "dogecoin", symbol: "doge", name: "Dogecoin", rank: 9 },
  { id: "tron", symbol: "trx", name: "TRON", rank: 10 },
  { id: "bank", symbol: "bank", name: "BANK", rank: 11, currency: "idr" },
  { id: "skyai", symbol: "skyai", name: "SKYAI", rank: 12, currency: "idr" },
  { id: "ub", symbol: "ub", name: "UB", rank: 13, currency: "idr" },
  { id: "hei", symbol: "hei", name: "HEI", rank: 14, currency: "idr" },
  { id: "hft", symbol: "hft", name: "HFT", rank: 15, currency: "idr" },
];

// Seed data for Indonesian mutual funds (reksa dana)
const SEED_FUNDS = [
  {
    id: "schroder-dana-prestasi-plus",
    symbol: "SDPP",
    name: "Schroder Dana Prestasi Plus",
    category: "Pendapatan Tetap",
    manager: "Schroder Investment Management",
    nav: 104.12,
    change_1d: 0.12,
    change_1w: 0.38,
    change_1m: 1.18,
    change_1y: 8.5,
    aum: 5800000000000,
    risk_level: "3",
    baseNav: 104.12,
    navVolatility: 0.015,
  },
  {
    id: "sucorinvest-money-market",
    symbol: "SISMM",
    name: "Sucorinvest Money Market Fund",
    category: "Pasar Uang",
    manager: "Sucorinvest",
    nav: 110.75,
    change_1d: 0.05,
    change_1w: 0.27,
    change_1m: 0.92,
    change_1y: 4.8,
    aum: 1200000000000,
    risk_level: "1",
    baseNav: 110.75,
    navVolatility: 0.003,
  },
  {
    id: "bca-dana-kas",
    symbol: "BCDK",
    name: "BCA Dana Kas",
    category: "Pasar Uang",
    manager: "PT Bank Central Asia",
    nav: 514.33,
    change_1d: 0.03,
    change_1w: 0.15,
    change_1m: 0.42,
    change_1y: 4.2,
    aum: 8900000000000,
    risk_level: "1",
    baseNav: 514.33,
    navVolatility: 0.002,
  },
  {
    id: "mandiri-investa-pasar-uang",
    symbol: "MIPO",
    name: "Mandiri Investa Pasar Uang",
    category: "Pasar Uang",
    manager: "Mandiri Investment Management",
    nav: 498.76,
    change_1d: 0.04,
    change_1w: 0.18,
    change_1m: 0.51,
    change_1y: 4.5,
    aum: 6500000000000,
    risk_level: "1",
    baseNav: 498.76,
    navVolatility: 0.0025,
  },
  {
    id: "batava-dana-kas-maxima",
    symbol: "BDKM",
    name: "Batavia Dana Kas Maxima",
    category: "Pasar Uang",
    manager: "Batavia Asset Management",
    nav: 312.45,
    change_1d: 0.06,
    change_1w: 0.25,
    change_1m: 0.78,
    change_1y: 4.9,
    aum: 3200000000000,
    risk_level: "1",
    baseNav: 312.45,
    navVolatility: 0.0035,
  },
  {
    id: "danareksa-saham-samsung",
    symbol: "DSS",
    name: "Danareksa Saham Samsung",
    category: "Saham",
    manager: "PT Danareksa Investama",
    nav: 235.68,
    change_1d: -0.85,
    change_1w: -2.14,
    change_1m: 3.22,
    change_1y: 12.4,
    aum: 1800000000000,
    risk_level: "5",
    baseNav: 235.68,
    navVolatility: 0.025,
  },
  {
    id: "bibi-saham-unilever",
    symbol: "BSU",
    name: "BIBI Saham Unilever Indonesia",
    category: "Saham",
    manager: "PT Batavia Investmentindo",
    nav: 156.30,
    change_1d: 0.42,
    change_1w: 1.23,
    change_1m: 4.67,
    change_1y: 28.5,
    aum: 750000000000,
    risk_level: "4",
    baseNav: 156.30,
    navVolatility: 0.02,
  },
  {
    id: "star-capital-emas",
    symbol: "SCE",
    name: "Star Capital Dana Emas",
    category: "Logam Mulia",
    manager: "Star Capital Sekuritas",
    nav: 89.15,
    change_1d: -0.12,
    change_1w: 0.85,
    change_1m: 2.18,
    change_1y: 15.3,
    aum: 350000000000,
    risk_level: "3",
    baseNav: 89.15,
    navVolatility: 0.012,
  },
];

// Seed currency rates (USD base)
const SEED_CURRENCY_RATES = [
  { id: "USD_IDR", from: "USD", to: "IDR", rate: 16500 },
  { id: "USD_SGD", from: "USD", to: "SGD", rate: 1.33 },
  { id: "USD_USD", from: "USD", to: "USD", rate: 1 },
  { id: "IDR_USD", from: "IDR", to: "USD", rate: 0.0000606 },
  { id: "IDR_SGD", from: "IDR", to: "SGD", rate: 0.0000806 },
  { id: "SGD_USD", from: "SGD", to: "USD", rate: 0.7519 },
  { id: "SGD_IDR", from: "SGD", to: "IDR",  rate: 12391 },
];

async function fetchFromCoinGecko(endpoint: string) {
  try {
    const response = await fetch(`${COINGECKO_API_BASE}${endpoint}`);
    if (!response.ok) {
      // Just throw, catch block will handle
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('CoinGecko API error:', error);
    throw error;
  }
}

async function updateCryptocurrencyData() {
  try {
    const data = await fetchFromCoinGecko("/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h,7d");

    // Only update storage if we successfully fetched data
    if (data && data.length > 0) {
      for (const coin of data) {
        try {
          await storage.upsertCryptocurrency({
            id: coin.id,
            symbol: coin.symbol,
            name: coin.name,
            image: coin.image,
            current_price: coin.current_price?.toString(),
            market_cap: coin.market_cap?.toString(),
            market_cap_rank: coin.market_cap_rank?.toString(),
            fully_diluted_valuation: coin.fully_diluted_valuation?.toString(),
            total_volume: coin.total_volume?.toString(),
            high_24h: coin.high_24h?.toString(),
            low_24h: coin.low_24h?.toString(),
            price_change_24h: coin.price_change_24h?.toString(),
            price_change_percentage_24h: coin.price_change_percentage_24h?.toString(),
            price_change_percentage_7d: coin.price_change_percentage_7d_in_currency?.toString(),
            market_cap_change_24h: coin.market_cap_change_24h?.toString(),
            market_cap_change_percentage_24h: coin.market_cap_change_percentage_24h?.toString(),
            circulating_supply: coin.circulating_supply?.toString(),
            total_supply: coin.total_supply?.toString(),
            max_supply: coin.max_supply?.toString(),
            ath: coin.ath?.toString(),
            ath_change_percentage: coin.ath_change_percentage?.toString(),
            ath_date: coin.ath_date ? new Date(coin.ath_date) : null,
            atl: coin.atl?.toString(),
            atl_change_percentage: coin.atl_change_percentage?.toString(),
            atl_date: coin.atl_date ? new Date(coin.atl_date) : null,
          });

          await storage.addPriceHistory({
            cryptoId: coin.id,
            price: coin.current_price?.toString()
          });
        } catch (error: any) {
          console.error(`Failed to update ${coin.id}: ${error?.message || error}`);
        }
      }
      console.log(`Successfully updated ${data.length} cryptocurrencies`);
    }

    return data;
  } catch (error) {
    console.error('Error updating cryptocurrency data (will retry later):', error);

    // If storage is empty (first boot), seed with basic data
    const existingData = await storage.getCryptocurrencies(10);
    if (!existingData || existingData.length === 0) {
      console.log('Storage empty - seeding with fallback data');
      await seedFallbackData();
    }

    // Return null to signal failure without clearing existing data
    return null;
  }
}

async function seedFallbackData() {
  for (const seed of SEED_CRYPTOS) {
    const isIDR = seed.currency === 'idr';
    const basePrice = isIDR
      ? (seed.rank === 11 ? 1500 : seed.rank === 12 ? 800 : seed.rank === 13 ? 500 : seed.rank === 14 ? 300 : 200)
      : (seed.rank === 1 ? 50000 : seed.rank === 2 ? 3000 : 500 / seed.rank);
    const currentPrice = basePrice * (0.95 + Math.random() * 0.1);
    const change24h = -5 + Math.random() * 10;

    await storage.upsertCryptocurrency({
      id: seed.id,
      symbol: seed.symbol,
      name: seed.name,
      image: `https://assets.coingecko.com/coins/images/1/${seed.id}.png`,
      current_price: currentPrice.toFixed(2),
      market_cap: (currentPrice * 1000000000).toFixed(0),
      market_cap_rank: seed.rank.toString(),
      fully_diluted_valuation: null,
      total_volume: (currentPrice * 50000000).toFixed(0),
      high_24h: (currentPrice * 1.05).toFixed(2),
      low_24h: (currentPrice * 0.95).toFixed(2),
      price_change_24h: ((currentPrice * change24h) / 100).toFixed(2),
      price_change_percentage_24h: change24h.toFixed(2),
      price_change_percentage_7d: (change24h * 1.5).toFixed(2),
      market_cap_change_24h: null,
      market_cap_change_percentage_24h: null,
      circulating_supply: null,
      total_supply: null,
      max_supply: null,
      ath: (currentPrice * 2).toFixed(2),
      ath_change_percentage: "-50",
      ath_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      atl: (currentPrice * 0.1).toFixed(2),
      atl_change_percentage: "900",
      atl_date: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000),
    });

    await storage.addPriceHistory({
      cryptoId: seed.id,
      price: currentPrice.toFixed(2)
    });
  }
  console.log(`Seeded ${SEED_CRYPTOS.length} fallback cryptocurrencies`);
}

async function seedFundData() {
  for (const seed of SEED_FUNDS) {
    await storage.upsertMutualFund({
      id: seed.id,
      symbol: seed.symbol,
      name: seed.name,
      category: seed.category,
      manager: seed.manager,
      nav: seed.nav.toString(),
      change_1d: seed.change_1d.toString(),
      change_1w: seed.change_1w.toString(),
      change_1m: seed.change_1m.toString(),
      change_1y: seed.change_1y.toString(),
      aum: seed.aum.toString(),
      risk_level: seed.risk_level,
    });
  }
  console.log(`Seeded ${SEED_FUNDS.length} mutual funds`);
}

async function seedFundHistory() {
  for (const seed of SEED_FUNDS) {
    const now = Date.now();
    const baseNav = seed.baseNav;

    for (let i = 365; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const dayFactor = i / 365;
      const trend = seed.change_1y / 100;
      const cumulative = trend * dayFactor;

      const noise = (Math.random() - 0.5) * 2 * seed.navVolatility;
      const seasonal = Math.sin(i / 30) * (seed.navVolatility * 0.5);
      const nav = baseNav * (1 + cumulative + noise + seasonal);

      await storage.addFundHistory({
        fundId: seed.id,
        date,
        nav: Math.max(0.0001, nav).toString(),
      });
    }
  }
  console.log('Seeded mutual fund history (365 days)');
}

async function seedCurrencyRates() {
  for (const rate of SEED_CURRENCY_RATES) {
    await storage.upsertCurrencyRate({
      id: rate.id,
      fromCurrency: rate.from,
      toCurrency: rate.to,
      rate: rate.rate.toString(),
    });
  }
  console.log(`Seeded ${SEED_CURRENCY_RATES.length} currency rates`);
}

async function updateMutualFundData() {
  try {
    const existingFunds = await storage.getMutualFunds(1);
    if (existingFunds.length === 0) {
      console.log('Storage empty - seeding mutual fund data');
      await seedFundData();
      await seedFundHistory();
    }

    // Attempt to update from Yahoo Finance API
    for (const seed of SEED_FUNDS) {
      try {
        const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${seed.symbol}.JK?range=1d&interval=1d`);
        if (response.ok) {
          const yahooData = await response.json();
          const result = yahooData?.chart?.result?.[0];
          if (result && result.meta) {
            const currentNav = result.meta.previousClose || seed.nav;
            await storage.upsertMutualFund({
              id: seed.id,
              symbol: seed.symbol,
              name: seed.name,
              category: seed.category,
              manager: seed.manager,
              nav: currentNav.toString(),
              change_1d: seed.change_1d.toString(),
              change_1w: seed.change_1w.toString(),
              change_1m: seed.change_1m.toString(),
              change_1y: seed.change_1y.toString(),
              aum: seed.aum.toString(),
              risk_level: seed.risk_level,
            });
          }
        }
      } catch (error) {
        console.error(`Yahoo Finance fetch failed for ${seed.symbol}, using seed:`, error);
      }
    }

    console.log(`Updated ${SEED_FUNDS.length} mutual funds`);
  } catch (error) {
    console.error('Error updating mutual fund data:', error);
  }
}

async function updateCurrencyRates() {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (response.ok) {
      const data = await response.json();
      const rates: { from: string; to: string; rate: number }[] = [
        { from: 'USD', to: 'IDR', rate: data.rates?.IDR || 16500 },
        { from: 'USD', to: 'SGD', rate: data.rates?.SGD || 1.33 },
      ];

      for (const r of rates) {
        const inverseRate = r.to === 'USD' ? 1 : 1 / r.rate;
        await storage.upsertCurrencyRate({
          id: `${r.from}_${r.to}`,
          fromCurrency: r.from,
          toCurrency: r.to,
          rate: r.rate.toString(),
        });
        if (r.to !== 'USD') {
          await storage.upsertCurrencyRate({
            id: `${r.to}_${r.from}`,
            fromCurrency: r.to,
            toCurrency: r.from,
            rate: inverseRate.toString(),
          });
        }
      }
      console.log('Updated currency rates from API');
    }
  } catch (error) {
    console.error('Failed to fetch currency rates, using seed data:', error);
    await seedCurrencyRates();
  }
}

async function checkPriceAlerts(cryptoData: any[]) {
  const activeAlerts = await storage.getActivePriceAlerts();

  for (const alert of activeAlerts) {
    const cryptoPrice = cryptoData.find(c => c.id === alert.cryptoId);
    if (!cryptoPrice) continue;

    let shouldTrigger = false;
    const currentPrice = parseFloat(cryptoPrice.current_price);
    const targetValue = parseFloat(alert.targetValue);
    const priceChange24h = parseFloat(cryptoPrice.price_change_percentage_24h);

    switch (alert.alertType) {
      case 'price_above':
        shouldTrigger = currentPrice >= targetValue;
        break;
      case 'price_below':
        shouldTrigger = currentPrice <= targetValue;
        break;
      case 'percentage_change':
        shouldTrigger = Math.abs(priceChange24h) >= targetValue;
        break;
    }

    if (shouldTrigger) {
      await storage.updatePriceAlert(alert.id, {
        isTriggered: true,
        triggeredAt: new Date()
      });
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store connected clients
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws: WebSocket) => {
    clients.add(ws);
    console.log('Client connected to WebSocket');

    ws.on('close', () => {
      clients.delete(ws);
      console.log('Client disconnected from WebSocket');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  // Broadcast data to all connected clients
  function broadcast(data: any) {
    const message = JSON.stringify(data);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Initialize data and set up periodic updates
  let isInitialized = false;

  async function initializeAndUpdate() {
    try {
      console.log('Fetching cryptocurrency data...');
      const data = await updateCryptocurrencyData();

      // Only process if we got valid data
      if (data && data.length > 0) {
        await checkPriceAlerts(data);

        // Broadcast updated data to connected clients
        broadcast({
          type: 'price_update',
          data: data.slice(0, 20) // Send top 20 coins
        });

        if (!isInitialized) {
          console.log('Cryptocurrency data initialized');
          isInitialized = true;
        }
      } else if (data === null) {
        console.log('API rate limited or failed - keeping existing data');
      }
    } catch (error) {
      console.error('Error in periodic update:', error);
    }
  }

  // Initial data fetch
  initializeAndUpdate().catch(err => console.error("Initial fetch failed:", err));

  // Seed and update mutual fund data on startup
  seedCurrencyRates().catch(err => console.error("Currency rate seed failed:", err));
  updateMutualFundData().catch(err => console.error("Mutual fund update failed:", err));

  // Set up periodic updates every 5 minutes to avoid rate limits
  setInterval(initializeAndUpdate, 300000);
  setInterval(updateMutualFundData, 3600000); // Update funds every hour

  // API Routes
  app.get("/api/cryptocurrencies", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const cryptocurrencies = await storage.getCryptocurrencies(limit);
      res.json(cryptocurrencies);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cryptocurrencies" });
    }
  });

  app.get("/api/cryptocurrencies/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const results = await storage.searchCryptocurrencies(query);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Search failed" });
    }
  });

  app.get("/api/cryptocurrencies/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const cryptocurrency = await storage.getCryptocurrency(id);
      if (!cryptocurrency) {
        return res.status(404).json({ message: "Cryptocurrency not found" });
      }
      res.json(cryptocurrency);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cryptocurrency" });
    }
  });

  app.get("/api/cryptocurrencies/:id/history", async (req, res) => {
    try {
      const { id } = req.params;
      const hours = req.query.hours ? parseInt(req.query.hours as string) : 24;

      // Try to get from local storage first
      let history = await storage.getPriceHistory(id, hours);

      // Check if we have enough historical data coverage
      const oldestPoint = history[0];
      const newestPoint = history[history.length - 1];
      const timeSpanHours = oldestPoint && newestPoint
        ? (newestPoint.timestamp!.getTime() - oldestPoint.timestamp!.getTime()) / (1000 * 60 * 60)
        : 0;

      // If coverage is less than 90% of requested time, fetch from CoinGecko
      if (timeSpanHours < hours * 0.9) {
        try {
          let days: string | number = 1;
          if (hours <= 24) days = 1;
          else if (hours <= 168) days = Math.ceil(hours / 24);
          else if (hours <= 720) days = 30;
          else if (hours <= 2160) days = 90;
          else if (hours <= 8760) days = 365;
          else days = 'max' as any;

          let endpoint = `/coins/${id}/market_chart?vs_currency=usd&days=${days}`;
          if (days === 365 || days === 'max') {
            endpoint += '&interval=daily';
          }

          const coinGeckoData = await fetchFromCoinGecko(endpoint);

          if (coinGeckoData && coinGeckoData.prices) {
            history = coinGeckoData.prices.map((pricePoint: [number, number]) => ({
              id: `${id}-${pricePoint[0]}`,
              cryptoId: id,
              price: pricePoint[1].toString(),
              timestamp: new Date(pricePoint[0])
            }));

            // Filter if we asked for a specific range but API returned more
            if (hours !== 43800) {
              const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
              history = history.filter(h => h.timestamp! >= cutoffTime);
            }
          }
        } catch (fetchError) {
          console.error(`Fetch failed for ${id} history (${hours}h), using mock fallback:`, fetchError);

          // Fallback: Generate mock data with linear interpolation + noise
          const now = Date.now();
          const numPoints = hours <= 24 ? 48 : (hours <= 168 ? 168 : 365);
          const start = now - (hours * 60 * 60 * 1000);
          const step = (now - start) / numPoints;

          const basePrice = 50000;

          history = Array.from({ length: numPoints }, (_, i) => {
            const time = start + (i * step);
            // Add some sine wave + random noise for realistic look
            const change = Math.sin(i / 10) * (basePrice * 0.05) + (Math.random() - 0.5) * (basePrice * 0.02);
            return {
              id: `mock-${id}-${time}`,
              cryptoId: id,
              price: (basePrice + change).toString(),
              timestamp: new Date(time)
            };
          });
        }
      }

      // Downsampling for large datasets (max 2000 points)
      if (history.length > 2000) {
        const step = Math.ceil(history.length / 2000);
        history = history.filter((_, index) => index % step === 0);
      }

      res.json(history);
    } catch (error) {
      console.error('Error fetching price history:', error);
      res.status(500).json({ message: "Failed to fetch price history" });
    }
  });

  // Market summary endpoint
  app.get("/api/market/summary", async (req, res) => {
    try {
      const globalData = await fetchFromCoinGecko("/global");
      res.json(globalData.data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch market summary" });
    }
  });

  // Auth routes
  app.post("/api/register", async (req, res) => {
    try {
      const { username, password } = insertUserSchema.parse(req.body);
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const user = await storage.createUser({
        username,
        password: hashPassword(password),
      });
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed after registration" });
        }
        return res.json({ id: user.id, username: user.username });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: err.message || "Login failed" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid username or password" });
      }
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        return res.json({ id: user.id, username: user.username });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/me", (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      const user = req.user as any;
      res.json({ id: user.id, username: user.username });
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  // Watchlist routes (using user ID from headers or session)
  const getUserId = (req: any) => {
    return req.user?.id || req.headers['x-user-id'] || 'anonymous';
  };

  app.get("/api/watchlist", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const watchlist = await storage.getWatchlist(userId);
      res.json(watchlist);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch watchlist" });
    }
  });

  app.post("/api/watchlist", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertWatchlistSchema.parse({
        ...req.body,
        userId: userId
      });
      const watchlistItem = await storage.addToWatchlist(data);
      res.json(watchlistItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add to watchlist" });
    }
  });

  app.delete("/api/watchlist/:cryptoId", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { cryptoId } = req.params;
      await storage.removeFromWatchlist(userId, cryptoId);
      res.json({ message: "Removed from watchlist" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove from watchlist" });
    }
  });

  // Price alerts routes
  app.get("/api/alerts", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const alerts = await storage.getPriceAlerts(userId);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch price alerts" });
    }
  });

  app.post("/api/alerts", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertPriceAlertSchema.parse({
        ...req.body,
        userId: userId
      });
      const alert = await storage.createPriceAlert(data);
      res.json(alert);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create price alert" });
    }
  });

  app.delete("/api/alerts/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePriceAlert(id);
      res.json({ message: "Price alert deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete price alert" });
    }
  });

  // Currency Rate routes
  app.get("/api/currency-rates", async (req, res) => {
    try {
      const rates = await storage.getAllCurrencyRates();
      res.json(rates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch currency rates" });
    }
  });

  app.get("/api/currency-rates/:from/:to", async (req, res) => {
    try {
      const { from, to } = req.params;
      const rate = await storage.getCurrencyRate(from.toUpperCase(), to.toUpperCase());
      if (!rate) {
        return res.status(404).json({ message: "Currency rate not found" });
      }
      res.json(rate);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch currency rate" });
    }
  });

  // Mutual Fund routes
  app.get("/api/funds", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const funds = await storage.getMutualFunds(limit);
      res.json(funds);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch mutual funds" });
    }
  });

  app.get("/api/funds/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const results = await storage.searchMutualFunds(query);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Fund Watchlist routes (must come before /:id)
  app.get("/api/funds/watchlist", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const watchlist = await storage.getFundWatchlist(userId);
      res.json(watchlist);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch fund watchlist" });
    }
  });

  app.post("/api/funds/watchlist", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertFundWatchlistSchema.parse({
        ...req.body,
        userId: userId
      });
      const watchlistItem = await storage.addToFundWatchlist(data);
      res.json(watchlistItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add to fund watchlist" });
    }
  });

  app.delete("/api/funds/watchlist/:fundId", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { fundId } = req.params;
      await storage.removeFromFundWatchlist(userId, fundId);
      res.json({ message: "Removed from fund watchlist" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove from fund watchlist" });
    }
  });

  // Fund History route (must come before /:id)
  app.get("/api/funds/:id/history", async (req, res) => {
    try {
      const { id } = req.params;
      const days = req.query.days ? parseInt(req.query.days as string) : 30;

      let history = await storage.getFundHistory(id, days);

      if (history.length === 0) {
        const fund = await storage.getMutualFund(id);
        if (!fund) {
          return res.status(404).json({ message: "Fund not found" });
        }

        const baseNav = parseFloat(fund.nav || '100');
        const now = Date.now();
        const numPoints = days <= 30 ? days : (days <= 90 ? Math.ceil(days / 2) : Math.ceil(days / 5));

        history = Array.from({ length: Math.min(numPoints, 365) }, (_, i) => {
          const date = new Date(now - ((numPoints - 1 - i) * (days * 24 * 60 * 60 * 1000) / numPoints));
          const trend = i / numPoints;
          const noise = (Math.random() - 0.5) * 2 * 0.005;
          const seasonal = Math.sin(i / 10) * 0.002;
          const nav = baseNav * (1 + trend * 0.02 + noise + seasonal);

          return {
            id: `mock-${id}-${date.getTime()}`,
            fundId: id,
            date,
            nav: Math.max(0.0001, nav).toString(),
          };
        });
      }

      res.json(history);
    } catch (error) {
      console.error('Error fetching fund history:', error);
      res.status(500).json({ message: "Failed to fetch fund history" });
    }
  });

  // Single Fund route (must come last after specific routes)
  app.get("/api/funds/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const fund = await storage.getMutualFund(id);
      if (!fund) {
        return res.status(404).json({ message: "Mutual fund not found" });
      }
      res.json(fund);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch mutual fund" });
    }
  });

  app.delete("/api/funds/watchlist/:fundId", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { fundId } = req.params;
      await storage.removeFromFundWatchlist(userId, fundId);
      res.json({ message: "Removed from fund watchlist" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove from fund watchlist" });
    }
  });

  // Portfolio routes
  app.get("/api/portfolio", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const portfolios = await storage.getPortfolios(userId);
      res.json(portfolios);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch portfolio" });
    }
  });

  app.post("/api/portfolio", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertPortfolioSchema.parse({
        ...req.body,
        userId: userId
      });
      const portfolioItem = await storage.addPortfolioItem(data);
      res.json(portfolioItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add to portfolio" });
    }
  });

  return httpServer;
}
