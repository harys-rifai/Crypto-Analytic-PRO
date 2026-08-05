import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertWatchlistSchema, insertPriceAlertSchema } from "@shared/schema";
import { z } from "zod";

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

        // Add to price history
        await storage.addPriceHistory({
          cryptoId: coin.id,
          price: coin.current_price?.toString()
        });
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

  // Set up periodic updates every 5 minutes to avoid rate limits
  setInterval(initializeAndUpdate, 300000);

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

  // Watchlist routes (using user ID from headers)
  const getUserId = (req: any) => {
    return req.headers['x-user-id'] || 'anonymous';
  };

  app.get("/api/watchlist", async (req, res) => {
    try {
      const userId = getUserId(req);
      const watchlist = await storage.getWatchlist(userId);
      res.json(watchlist);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch watchlist" });
    }
  });

  app.post("/api/watchlist", async (req, res) => {
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

  app.delete("/api/watchlist/:cryptoId", async (req, res) => {
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
  app.get("/api/alerts", async (req, res) => {
    try {
      const userId = getUserId(req);
      const alerts = await storage.getPriceAlerts(userId);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch price alerts" });
    }
  });

  app.post("/api/alerts", async (req, res) => {
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

  app.delete("/api/alerts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePriceAlert(id);
      res.json({ message: "Price alert deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete price alert" });
    }
  });

  return httpServer;
}
