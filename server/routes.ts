import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";

declare module "ws" {
  interface WebSocket {
    isAlive?: boolean;
  }
}

import passport from "passport";
import { storage } from "./storage";
import { insertWatchlistSchema, insertPriceAlertSchema, insertFundWatchlistSchema, insertCurrencyRateSchema, insertPortfolioSchema, insertUserSchema, insertStockSchema, insertStockHistorySchema, insertStockWatchlistSchema, insertGoldSchema, insertGoldHistorySchema, insertGoldWatchlistSchema } from "@shared/schema";
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
    image: "https://www.google.com/s2/favicons?domain=schroders.com?size=128",
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
    image: "https://www.google.com/s2/favicons?domain=sucorinvest.com?size=128",
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
    image: "https://www.google.com/s2/favicons?domain=bankbca.com?size=128",
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
    image: "https://www.google.com/s2/favicons?domain=bankmandiri.co.id?size=128",
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
    image: "https://www.google.com/s2/favicons?domain=bataviasekuritas.com?size=128",
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
    image: "https://www.google.com/s2/favicons?domain=danareksa.com?size=128",
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
    image: "https://www.google.com/s2/favicons?domain=batavia.co.id?size=128",
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
    image: "https://www.google.com/s2/favicons?domain=starcapital.sekuritas.com?size=128",
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

// Seed data for Indonesian stocks
const SEED_STOCKS = [
  { id: "bbca", symbol: "BBCA", name: "Bank Central Asia Tbk", exchange: "IDX", sector: "Financials", industry: "Banks", image: "https://www.google.com/s2/favicons?domain=bankbca.com?size=128", domain: "bankbca.com", basePrice: 8750, volatility: 0.02, change_1d: 1.2, change_1w: 2.5, change_1m: 5.1, change_1y: 15.3, pe_ratio: 18.5, eps: 472, dividend_yield: 2.1 },
  { id: "bbri", symbol: "BBRI", name: "Bank Rakyat Indonesia Tbk", exchange: "IDX", sector: "Financials", industry: "Banks", image: "https://www.google.com/s2/favicons?domain=bankbri.co.id?size=128", domain: "bankbri.co.id", basePrice: 4520, volatility: 0.025, change_1d: -0.5, change_1w: 1.8, change_1m: 3.2, change_1y: 12.1, pe_ratio: 15.2, eps: 297, dividend_yield: 3.5 },
  { id: "tlkm", symbol: "TLKM", name: "Telekomunikasi Indonesia Tbk", exchange: "IDX", sector: "Communication Services", industry: "Telecommunications", image: "https://www.google.com/s2/favicons?domain=telkom.co.id?size=128", domain: "telkom.co.id", basePrice: 3650, volatility: 0.018, change_1d: 0.8, change_1w: -1.2, change_1m: 2.5, change_1y: 8.7, pe_ratio: 12.8, eps: 285, dividend_yield: 4.2 },
  { id: "asii", symbol: "ASII", name: "Astra International Tbk", exchange: "IDX", sector: "Consumer Discretionary", industry: "Diversified", image: "https://www.google.com/s2/favicons?domain=astra.co.id?size=128", domain: "astra.co.id", basePrice: 5250, volatility: 0.022, change_1d: -1.1, change_1w: 0.5, change_1m: -2.3, change_1y: -5.4, pe_ratio: 10.5, eps: 500, dividend_yield: 3.8 },
  { id: "unvr", symbol: "UNVR", name: "Unilever Indonesia Tbk", exchange: "IDX", sector: "Consumer Staples", industry: "Household Products", image: "https://www.google.com/s2/favicons?domain=unilever.co.id?size=128", domain: "unilever.co.id", basePrice: 3850, volatility: 0.015, change_1d: 0.3, change_1w: 1.1, change_1m: 2.8, change_1y: 6.5, pe_ratio: 22.1, eps: 174, dividend_yield: 2.5 },
  { id: "bmri", symbol: "BMRI", name: "Bank Mandiri Tbk", exchange: "IDX", sector: "Financials", industry: "Banks", image: "https://www.google.com/s2/favicons?domain=bankmandiri.co.id?size=128", domain: "bankmandiri.co.id", basePrice: 5250, volatility: 0.02, change_1d: 0.9, change_1w: 2.1, change_1m: 4.5, change_1y: 18.2, pe_ratio: 14.3, eps: 367, dividend_yield: 3.1 },
  { id: "amrt", symbol: "AMRT", name: "Alfamart Retail Indonesia Tbk", exchange: "IDX", sector: "Consumer Staples", industry: "Retail", image: "https://www.google.com/s2/favicons?domain=alfamart.co.id?size=128", domain: "alfamart.co.id", basePrice: 2780, volatility: 0.02, change_1d: -0.7, change_1w: 0.9, change_1m: 1.5, change_1y: 22.4, pe_ratio: 25.6, eps: 109, dividend_yield: 0.8 },
  { id: "goka", symbol: "GOKA", name: "Gudang Garam Tbk", exchange: "IDX", sector: "Consumer Staples", industry: "Tobacco", image: "https://www.google.com/s2/favicons?domain=gudgangaram.com?size=128", domain: "gudanggaram.com", basePrice: 19800, volatility: 0.025, change_1d: 1.5, change_1w: 3.2, change_1m: -1.8, change_1y: -12.3, pe_ratio: 8.9, eps: 2222, dividend_yield: 5.5 },
  { id: "indf", symbol: "INDF", name: "Indofood Sukses Makmur Tbk", exchange: "IDX", sector: "Consumer Staples", industry: "Food Products", image: "https://www.google.com/s2/favicons?domain=indofood.co.id?size=128", domain: "indofood.co.id", basePrice: 6350, volatility: 0.018, change_1d: 0.4, change_1w: 1.5, change_1m: 3.1, change_1y: 9.8, pe_ratio: 19.2, eps: 331, dividend_yield: 2.3 },
  { id: "excl", symbol: "EXCL", name: "XL Axiata Tbk", exchange: "IDX", sector: "Communication Services", industry: "Telecommunications", image: "https://www.google.com/s2/favicons?domain=xl.co.id?size=128", domain: "xl.co.id", basePrice: 2850, volatility: 0.025, change_1d: -1.8, change_1w: -2.5, change_1m: 0.8, change_1y: 5.2, pe_ratio: 11.5, eps: 248, dividend_yield: 4.8 },
];

// IHSG (Indonesia Composite Index) seed data
const SEED_IHSG = {
  id: "ihsg",
  symbol: "IHSG",
  name: "Indeks Harga Saham Gatotkaca",
  exchange: "IDX",
  sector: "Market Index",
  industry: "Index",
  image: "https://www.google.com/s2/favicons?domain=idx.co.id?size=128",
  basePrice: 2450,
  volatility: 0.01,
};

async function updateIHSGData() {
  try {
    const response = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/^JKSE?range=2d&interval=1d');
    if (response.ok) {
      const yahooData = await response.json();
      const result = yahooData?.chart?.result?.[0];
      if (result && result.meta) {
        const currentPrice = result.meta.previousClose || SEED_IHSG.basePrice;
        await storage.upsertStock({
          id: SEED_IHSG.id,
          symbol: SEED_IHSG.symbol,
          name: SEED_IHSG.name,
          exchange: SEED_IHSG.exchange,
          sector: SEED_IHSG.sector,
          industry: SEED_IHSG.industry,
          image: SEED_IHSG.image,
          current_price: currentPrice.toString(),
          change_1d: result.meta.regularMarketChangePercent?.toString() || ((Math.random() - 0.5) * 2).toFixed(2),
          change_1w: (Math.random() * 4 - 2).toFixed(2),
          change_1m: (Math.random() * 8 - 4).toFixed(2),
          change_1y: (Math.random() * 20 - 10).toFixed(2),
          market_cap: "0",
          volume: result.meta.regularMarketVolume?.toString() || "0",
          high_24h: (currentPrice * 1.01).toString(),
          low_24h: (currentPrice * 0.99).toString(),
          pe_ratio: null,
          eps: null,
          dividend_yield: null,
        });
        return { id: SEED_IHSG.id, symbol: SEED_IHSG.symbol, name: SEED_IHSG.name, image: SEED_IHSG.image, current_price: currentPrice.toString(), change_1d: result.meta.regularMarketChangePercent?.toString() || "0" };
      }
    }
  } catch (error) {
    console.error('Error fetching IHSG data:', error);
  }

  const currentPrice = SEED_IHSG.basePrice * (0.98 + Math.random() * 0.04);
  await storage.upsertStock({
    id: SEED_IHSG.id,
    symbol: SEED_IHSG.symbol,
    name: SEED_IHSG.name,
    exchange: SEED_IHSG.exchange,
    sector: SEED_IHSG.sector,
    industry: SEED_IHSG.industry,
    image: SEED_IHSG.image,
    current_price: currentPrice.toFixed(2),
    change_1d: ((Math.random() - 0.5) * 2).toFixed(2),
    change_1w: ((Math.random() - 0.5) * 4).toFixed(2),
    change_1m: ((Math.random() - 0.5) * 8).toFixed(2),
    change_1y: ((Math.random() - 0.5) * 20).toFixed(2),
    market_cap: "0",
    volume: "0",
    high_24h: (currentPrice * 1.01).toString(),
    low_24h: (currentPrice * 0.99).toString(),
    pe_ratio: null,
    eps: null,
    dividend_yield: null,
  });
  return { id: SEED_IHSG.id, symbol: SEED_IHSG.symbol, name: SEED_IHSG.name, image: SEED_IHSG.image, current_price: currentPrice.toFixed(2), change_1d: "0" };
}

// Seed data for gold
const SEED_GOLD = [
  { id: "xau-idr", symbol: "XAU/IDR", name: "Gold Spot (IDR)", type: "gold_spot", unit: "gram", image: "https://cdn-icons-png.flaticon.com/512/1277/1277510.png", basePrice: 1150000, volatility: 0.008 },
  { id: "xau-usd", symbol: "XAU/USD", name: "Gold Spot (USD)", type: "gold_spot", unit: "troy_ounce", image: "https://cdn-icons-png.flaticon.com/512/1277/1277510.png", basePrice: 2350, volatility: 0.008 },
  { id: "gold-mini", symbol: "GCM", name: "Gold Mini Futures", type: "gold_futures", unit: "troy_ounce", image: "https://cdn-icons-png.flaticon.com/512/1277/1277510.png", basePrice: 2380, volatility: 0.012 },
  { id: "gold-1g", symbol: "AU1G", name: "Gold 1 Gram (IDR)", type: "gold_spot", unit: "gram", image: "https://cdn-icons-png.flaticon.com/512/1277/1277510.png", basePrice: 1160000, volatility: 0.008 },
  { id: "gold-5g", symbol: "AU5G", name: "Gold 5 Gram (IDR)", type: "gold_spot", unit: "gram", image: "https://cdn-icons-png.flaticon.com/512/1277/1277510.png", basePrice: 5750000, volatility: 0.008 },
  { id: "gold-10g", symbol: "AU10G", name: "Gold 10 Gram (IDR)", type: "gold_spot", unit: "gram", image: "https://cdn-icons-png.flaticon.com/512/1277/1277510.png", basePrice: 11450000, volatility: 0.008 },
  { id: "gold-25g", symbol: "AU25G", name: "Gold 25 Gram (IDR)", type: "gold_spot", unit: "gram", image: "https://cdn-icons-png.flaticon.com/512/1277/1277510.png", basePrice: 28600000, volatility: 0.008 },
  { id: "gold-50g", symbol: "AU50G", name: "Gold 50 Gram (IDR)", type: "gold_spot", unit: "gram", image: "https://cdn-icons-png.flaticon.com/512/1277/1277510.png", basePrice: 57000000, volatility: 0.008 },
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
  // Seed base funds
  for (const seed of SEED_FUNDS) {
    await storage.upsertMutualFund({
      id: seed.id,
      symbol: seed.symbol,
      name: seed.name,
      category: seed.category,
      manager: seed.manager,
      image: seed.image,
      nav: seed.nav.toString(),
      change_1d: seed.change_1d.toString(),
      change_1w: seed.change_1w.toString(),
      change_1m: seed.change_1m.toString(),
      change_1y: seed.change_1y.toString(),
      aum: seed.aum.toString(),
      risk_level: seed.risk_level,
    });
  }

  // Generate additional funds to reach 100 total
  const existingCount = await storage.getMutualFunds(100);
  if (existingCount.length < 100) {
    const managers = [
      ['BCA', 'PT Bank Central Asia', 'bankbca.com'],
      ['Mandiri', 'Mandiri Investment Management', 'bankmandiri.co.id'],
      ['BNI', 'PT Bank Negara Indonesia', 'bni.co.id'],
      ['CIMB', 'PT CIMB Investment', 'cimb.com'],
      ['Danareksa', 'PT Danareksa Investama', 'danareksa.com'],
      ['Schroder', 'Schroder Investment Management', 'schroders.com'],
      ['Star Capital', 'Star Capital Sekuritas', 'starcapital.sekuritas.com'],
      ['Sucorinvest', 'Sucorinvest', 'sucorinvest.com'],
      ['Batavia', 'Batavia Asset Management', 'bataviasekuritas.com'],
    ];
    const categories = ['Pasar Uang', 'Saham', 'Campuran', 'Emas', 'Pendapatan Tetap', 'Agresif', 'Syariah'];
    const categoryMap = { 'Pasar Uang': 'Low', 'Saham': 'High', 'Campuran': 'Medium', 'Emas': 'Medium', 'Pendapatan Tetap': 'Low', 'Agresif': 'High', 'Syariah': 'High' };
    const suffixes = ['AA', 'AB', 'AC', 'AD', 'AE', 'AF', 'AG', 'AH', 'AI', 'AJ', 'AK', 'AL'];
    let generated = existingCount.length;
    const managerIdx = Math.floor(Math.random() * managers.length);
    const mgr = managers[managerIdx];
    for (let i = 0; i < 12 && generated < 100; i++) {
      const cat = categories[i % categories.length];
      for (let j = 0; j < 8 && generated < 100; j++) {
        const symbol = `F${String(generated + 1).padStart(3, '0')}${suffixes[j] || String(j)}`;
        const navVal = 100 + Math.random() * 2000;
        const mgrIdx = (managerIdx + j) % managers.length;
        const m = managers[mgrIdx];
        await storage.upsertMutualFund({
          id: `fund-${String(generated + 1).padStart(3, '0')}-${suffixes[j] || String(j)}`,
          symbol: symbol,
          name: `${m[1]} Dana ${cat} ${suffixes[j] || (j + 1)}`,
          category: cat,
          manager: m[1],
          image: `https://www.google.com/s2/favicons?domain=${m[2]}&sz=128`,
          nav: navVal.toFixed(2),
          change_1d: (Math.random() * 0.2 - 0.1).toFixed(4),
          change_1w: (Math.random() * 0.5 - 0.25).toFixed(4),
          change_1m: (Math.random() * 1.5 - 0.75).toFixed(4),
          change_1y: (Math.random() * 8 - 4).toFixed(2),
          aum: (50 + Math.random() * 5000).toFixed(0),
          risk_level: categoryMap[cat] || 'Medium',
        });
        generated++;
        if (generated >= 100) break;
      }
    }
    console.log(`Seeded ${generated} mutual funds total`);
  } else {
    console.log(`Seeded ${SEED_FUNDS.length} mutual funds`);
  }
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
               image: seed.image,
               nav: currentNav.toString(),
              change_1d: seed.change_1d.toString(),
              change_1w: seed.change_1w.toString(),
              change_1m: seed.change_1m.toString(),
              change_1y: seed.change_1y.toString(),
              aum: seed.aum.toString(),
              risk_level: seed.risk_level,
            });
          } else {
            await storage.upsertMutualFund({
              id: seed.id,
              symbol: seed.symbol,
              name: seed.name,
              category: seed.category,
              manager: seed.manager,
              image: seed.image,
              nav: seed.nav.toString(),
              change_1d: seed.change_1d.toString(),
              change_1w: seed.change_1w.toString(),
              change_1m: seed.change_1m.toString(),
              change_1y: seed.change_1y.toString(),
              aum: seed.aum.toString(),
              risk_level: seed.risk_level,
            });
          }
        } else {
          await storage.upsertMutualFund({
            id: seed.id,
            symbol: seed.symbol,
            name: seed.name,
            category: seed.category,
            manager: seed.manager,
            image: seed.image,
            nav: seed.nav.toString(),
            change_1d: seed.change_1d.toString(),
            change_1w: seed.change_1w.toString(),
            change_1m: seed.change_1m.toString(),
            change_1y: seed.change_1y.toString(),
            aum: seed.aum.toString(),
            risk_level: seed.risk_level,
          });
        }
      } catch (error) {
        console.error(`Yahoo Finance fetch failed for ${seed.symbol}, using seed:`, error);
        await storage.upsertMutualFund({
          id: seed.id,
          symbol: seed.symbol,
          name: seed.name,
          category: seed.category,
          manager: seed.manager,
          image: seed.image,
          nav: seed.nav.toString(),
          change_1d: seed.change_1d.toString(),
          change_1w: seed.change_1w.toString(),
          change_1m: seed.change_1m.toString(),
          change_1y: seed.change_1y.toString(),
          aum: seed.aum.toString(),
          risk_level: seed.risk_level,
        });
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

async function seedStockData() {
  // Seed base stocks
  for (const seed of SEED_STOCKS) {
    await storage.upsertStock({
      id: seed.id,
      symbol: seed.symbol,
      name: seed.name,
      exchange: seed.exchange,
      sector: seed.sector,
      industry: seed.industry,
      image: seed.image,
      current_price: seed.basePrice.toString(),
      change_1d: (Math.random() * 4 - 2).toFixed(2),
      change_1w: (Math.random() * 8 - 4).toFixed(2),
      change_1m: (Math.random() * 15 - 7.5).toFixed(2),
      change_1y: (Math.random() * 40 - 20).toFixed(2),
      market_cap: (seed.basePrice * 1000000000).toString(),
      volume: (Math.random() * 1000000000).toString(),
      high_24h: (seed.basePrice * 1.02).toString(),
      low_24h: (seed.basePrice * 0.98).toString(),
      pe_ratio: (Math.random() * 30 + 5).toFixed(2),
      eps: (seed.basePrice / 20).toFixed(2),
      dividend_yield: (Math.random() * 5).toFixed(2),
    });
  }

  // Generate additional stocks to reach 100 total
  const existingCount = await storage.getStocks(100);
  if (existingCount.length < 100) {
    const extraCompanies = [
      ['bbca', 'Bank Central Asia', 'bankbca.com', 'Financials', 'Banks', 8800],
      ['bbri', 'Bank Rakyat Indonesia', 'bankbri.co.id', 'Financials', 'Banks', 4550],
      ['bmri', 'Bank Mandiri', 'bankmandiri.co.id', 'Financials', 'Banks', 5300],
      ['bni', 'Bank Negara Indonesia', 'bni.co.id', 'Financials', 'Banks', 5150],
      ['bbtn', 'Bank Tabungan Negara', 'btn.co.id', 'Financials', 'Banks', 4300],
      ['tlkm', 'Telkom Indonesia', 'telkom.co.id', 'Communication Services', 'Telecommunications', 3700],
      ['excl', 'XL Axiata', 'xl.co.id', 'Communication Services', 'Telecommunications', 2900],
      ['isat', 'Indosat', 'indosat.com', 'Communication Services', 'Telecommunications', 980],
      ['asii', 'Astra International', 'astra.co.id', 'Consumer Discretionary', 'Diversified', 5300],
      ['unvr', 'Unilever Indonesia', 'unilever.co.id', 'Consumer Staples', 'Household Products', 3900],
      ['indf', 'Indofood', 'indofood.co.id', 'Consumer Staples', 'Food Products', 6450],
      ['goka', 'Gudang Garam', 'gudanggaram.com', 'Consumer Staples', 'Tobacco', 19500],
      ['amrt', 'Alfamart', 'alfamart.co.id', 'Consumer Staples', 'Retail', 2900],
      ['adro', 'Adaro Energy', 'adaro.com', 'Energy', 'Coal', 2200],
      ['ptba', 'Bukit Asam', 'bukitasam.com', 'Energy', 'Coal', 2800],
      ['aali', 'Astra Agro Lestari', 'astra-agro.co.id', 'Energy', 'Palm Oil', 11600],
      ['smgr', 'Semen Indonesia', 'semenindonesia.com', 'Industrials', 'Construction', 2850],
      ['inco', 'Indo Tambangraya', 'vale.com', 'Materials', 'Nickel Mining', 17800],
      ['intp', 'Indo Tambangraya Pertambangan', 'vale.com', 'Materials', 'Metal Mining', 21200],
      ['tbgi', 'Toba Pulp Lestari', 'tobapulpasejahtera.com', 'Materials', 'Paper Products', 1400],
    ];
    const shareClasses = ['', '.A', '.B', '.C', '.D', '.E', '.F', '.G', '.H', '.I'];
    let generated = existingCount.length;
    for (const comp of extraCompanies) {
      for (const suffix of shareClasses) {
        if (generated >= 100) break;
        const symbol = comp[1] + suffix;
        const id = comp[0].toLowerCase() + suffix.toLowerCase().replace('.', '');
        const price = comp[5] * (0.9 + Math.random() * 0.2);
        await storage.upsertStock({
          id: id,
          symbol: symbol.substring(0, 12),
          name: comp[1] + (suffix ? ` Class ${suffix.replace('.', '')}` : ''),
          exchange: 'IDX',
          sector: comp[3],
          industry: comp[4],
          image: `https://www.google.com/s2/favicons?domain=${comp[2]}&sz=128`,
          current_price: price.toFixed(2),
          change_1d: (Math.random() * 4 - 2).toFixed(2),
          change_1w: (Math.random() * 8 - 4).toFixed(2),
          change_1m: (Math.random() * 15 - 7.5).toFixed(2),
          change_1y: (Math.random() * 40 - 20).toFixed(2),
          market_cap: (price * 1000000000).toString(),
          volume: (Math.random() * 1000000000).toString(),
          high_24h: (price * 1.02).toString(),
          low_24h: (price * 0.98).toString(),
          pe_ratio: (Math.random() * 30 + 5).toFixed(2),
          eps: (price / 20).toFixed(2),
          dividend_yield: (Math.random() * 5).toFixed(2),
        });
        generated++;
      }
      if (generated >= 100) break;
    }
    console.log(`Seeded ${generated} stocks total`);
  } else {
    console.log(`Seeded ${SEED_STOCKS.length} stocks`);
  }
}

async function seedStockHistory() {
  for (const seed of SEED_STOCKS) {
    const now = Date.now();
    const basePrice = seed.basePrice;

    for (let i = 365; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const dayFactor = i / 365;
      const trend = (Math.random() - 0.45) * 0.0003;
      const cumulative = trend * dayFactor;

      const noise = (Math.random() - 0.5) * 2 * seed.volatility;
      const seasonal = Math.sin(i / 30) * (seed.volatility * 0.5);
      const price = basePrice * (1 + cumulative + noise + seasonal);

      await storage.addStockHistory({
        stockId: seed.id,
        price: Math.max(0.0001, price).toString(),
        timestamp: date,
        volume: (Math.random() * 100000000).toString(),
      });
    }
  }
  console.log('Seeded stock history (365 days)');
}

async function seedGoldData() {
  for (const seed of SEED_GOLD) {
    await storage.upsertGold({
      id: seed.id,
      symbol: seed.symbol,
      name: seed.name,
      type: seed.type,
      image: seed.image,
      current_price: seed.basePrice.toString(),
      change_1d: (Math.random() * 2 - 1).toFixed(2),
      change_1w: (Math.random() * 4 - 2).toFixed(2),
      change_1m: (Math.random() * 8 - 4).toFixed(2),
      change_1y: (Math.random() * 20 - 10).toFixed(2),
      unit: seed.unit,
    });
  }
  console.log(`Seeded ${SEED_GOLD.length} gold items`);
}

async function seedGoldHistory() {
  for (const seed of SEED_GOLD) {
    const now = Date.now();
    const basePrice = seed.basePrice;

    for (let i = 365; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const dayFactor = i / 365;
      const trend = (Math.random() - 0.45) * 0.0002;
      const cumulative = trend * dayFactor;

      const noise = (Math.random() - 0.5) * 2 * seed.volatility;
      const seasonal = Math.sin(i / 30) * (seed.volatility * 0.5);
      const price = basePrice * (1 + cumulative + noise + seasonal);

      await storage.addGoldHistory({
        goldId: seed.id,
        price: Math.max(0.0001, price).toString(),
        timestamp: date,
      });
    }
  }
  console.log('Seeded gold history (365 days)');
}

async function updateStockData() {
  try {
    const existingStocks = await storage.getStocks(1);
    if (existingStocks.length === 0) {
      console.log('Storage empty - seeding stock data');
      await seedStockData();
    }

    for (const seed of SEED_STOCKS) {
      try {
        const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${seed.symbol}.JK?range=1d&interval=1d`);
        if (response.ok) {
          const yahooData = await response.json();
          const result = yahooData?.chart?.result?.[0];
          if (result && result.meta) {
            const currentPrice = result.meta.previousClose || seed.basePrice;
            await storage.upsertStock({
              id: seed.id,
              symbol: seed.symbol,
              name: result.meta.name || seed.name,
              exchange: seed.exchange,
              sector: seed.sector,
              industry: seed.industry,
              image: result.meta.logo || seed.image,
              current_price: currentPrice.toString(),
              change_1d: seed.change_1d.toString(),
              change_1w: seed.change_1w.toString(),
              change_1m: seed.change_1m.toString(),
              change_1y: seed.change_1y.toString(),
              market_cap: (currentPrice * 1000000000).toString(),
              volume: result.meta.regularMarketVolume?.toString() || (Math.random() * 1000000000).toString(),
              high_24h: result.meta.high?.toString() || (currentPrice * 1.02).toString(),
              low_24h: result.meta.low?.toString() || (currentPrice * 0.98).toString(),
              pe_ratio: seed.pe_ratio?.toString() || (Math.random() * 30 + 5).toString(),
              eps: seed.eps?.toString() || (currentPrice / 20).toString(),
              dividend_yield: seed.dividend_yield?.toString() || (Math.random() * 5).toString(),
            });
          }
        }
      } catch (error) {
        console.error(`Yahoo Finance fetch failed for ${seed.symbol}, using seed:`, error);
      }
    }

    console.log(`Updated ${SEED_STOCKS.length} stocks`);
  } catch (error) {
    console.error('Error updating stock data:', error);
  }
}

async function updateGoldData() {
  try {
    const existingGold = await storage.getAllGold(1);
    if (existingGold.length === 0) {
      console.log('Storage empty - seeding gold data');
      await seedGoldData();
    }

    let xauUsdPrice: number | null = null;
    let usdIdrRate: number | null = null;

    try {
      const goldResponse = await fetch('https://api.goldprice.dev/v1/prices');
      if (goldResponse.ok) {
        const goldData = await goldResponse.json();
        const xauUsd = goldData.symbols.find((s: any) => s.symbol === 'XAU' && s.quote_currency === 'USD');
        if (xauUsd) {
          xauUsdPrice = parseFloat(xauUsd.price);
        }
      }
    } catch (error) {
      console.error('Failed to fetch gold price from goldprice.dev:', error);
    }

    try {
      const fxResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (fxResponse.ok) {
        const fxData = await fxResponse.json();
        usdIdrRate = fxData.rates?.IDR || null;
      }
    } catch (error) {
      console.error('Failed to fetch USD/IDR rate:', error);
    }

    const rates = await storage.getAllCurrencyRates();
    const usdIdrRateStored = rates.find(r => r.fromCurrency === 'USD' && r.toCurrency === 'IDR');
    if (!usdIdrRate && usdIdrRateStored) {
      usdIdrRate = parseFloat(usdIdrRateStored.rate);
    }

    if (!xauUsdPrice) {
      console.log('Could not fetch real gold price, keeping existing seed data');
      return;
    }

    const troyOunceToGram = 31.1035;
    const idrPerGram = usdIdrRate ? (xauUsdPrice * usdIdrRate) / troyOunceToGram : null;

    const getWeightMultiplier = (seed: any): number => {
      if (seed.id === 'xau-idr') return 1;
      if (seed.id === 'xau-usd' || seed.id === 'gold-mini') return 1;
      const match = seed.id.match(/gold-(\d+)g/);
      if (match) return parseFloat(match[1]);
      return 1;
    };

    for (const seed of SEED_GOLD) {
      try {
        let currentPrice: number;
        const weightMultiplier = getWeightMultiplier(seed);

        if (seed.id === 'xau-usd' || seed.id === 'gold-mini') {
          currentPrice = xauUsdPrice;
        } else if (idrPerGram) {
          currentPrice = idrPerGram * weightMultiplier;
        } else {
          currentPrice = seed.basePrice;
        }

        const existing = await storage.getGold(seed.id);
        if (existing && existing.current_price) {
          const oldPrice = parseFloat(existing.current_price);
          if (oldPrice > 0) {
            const priceChange1d = ((currentPrice - oldPrice) / oldPrice) * 100;
            await storage.upsertGold({
              id: seed.id,
              symbol: seed.symbol,
              name: seed.name,
              type: seed.type,
              image: seed.image,
              current_price: currentPrice.toFixed(2),
              change_1d: priceChange1d.toFixed(2),
              change_1w: (Math.random() * 4 - 2).toFixed(2),
              change_1m: (Math.random() * 8 - 4).toFixed(2),
              change_1y: (Math.random() * 20 - 10).toFixed(2),
              unit: seed.unit,
            });
          }
        }
      } catch (error) {
        console.error(`Error updating gold ${seed.id}:`, error);
      }
    }

    console.log(`Updated ${SEED_GOLD.length} gold items with real prices`);
  } catch (error) {
    console.error('Error updating gold data:', error);
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

    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

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
        try {
          client.send(message);
        } catch (err) {
          console.error('Error sending WebSocket message, removing client:', err);
          clients.delete(client);
        }
      }
    });
  }

  // Ping all clients every 30 seconds to detect dead connections
  setInterval(() => {
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN && !client.isAlive) {
        client.terminate();
      }
      client.isAlive = false;
      if (client.readyState === WebSocket.OPEN) {
        client.ping();
      }
    });
  }, 30000);

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

  // Real-time update wrappers that broadcast after fetching
  async function updateAndBroadcastCrypto() {
    const data = await updateCryptocurrencyData();
    if (data && data.length > 0) {
      await checkPriceAlerts(data);
      broadcast({ type: 'price_update', data: data.slice(0, 20) });
    }
  }

  async function updateAndBroadcastFunds() {
    await updateMutualFundData();
    const funds = await storage.getMutualFunds();
    broadcast({ type: 'fund_update', data: funds });
  }

  async function updateAndBroadcastStocks() {
    await updateStockData();
    const stocks = await storage.getStocks();
    broadcast({ type: 'stock_update', data: stocks });
  }

  async function updateAndBroadcastGold() {
    await updateGoldData();
    const gold = await storage.getAllGold();
    broadcast({ type: 'gold_update', data: gold });
  }

  async function updateAndBroadcastCurrency() {
    await updateCurrencyRates();
    const rates = await storage.getAllCurrencyRates();
    broadcast({ type: 'currency_update', data: rates });
  }

  async function updateAndBroadcastIHSG() {
    const result = await updateIHSGData();
    const ihsg = await storage.getStock("ihsg");
    if (ihsg) {
      broadcast({ type: 'stock_update', data: [{ ...ihsg, isIHSG: true }] });
    }
  }

  // Initial data fetch
  initializeAndUpdate().catch(err => console.error("Initial fetch failed:", err));

  // Seed and update mutual fund data on startup
  seedCurrencyRates().catch(err => console.error("Currency rate seed failed:", err));
  
  // Clear and re-seed history to fix corrupted timestamps
  storage.clearHistory().then(async () => {
    console.log("Cleared history data, re-seeding...");
    await seedFundHistory();
    await seedStockHistory();
    await seedGoldHistory();
    console.log("History re-seeding complete");
  }).catch(err => console.error("History clear failed:", err));
  
  updateIHSGData().catch(err => console.error("IHSG update failed:", err));
  updateMutualFundData().catch(err => console.error("Mutual fund update failed:", err));
  seedStockData().catch(err => console.error("Stock seed failed:", err));
  seedGoldData().catch(err => console.error("Gold seed failed:", err));
  updateStockData().catch(err => console.error("Stock update failed:", err));
  updateGoldData().catch(err => console.error("Gold update failed:", err));

  // Real-time periodic updates for all asset classes
  setInterval(updateAndBroadcastCrypto, 60000);   // Crypto: every 1 minute (CoinGecko rate limits)
  setInterval(updateAndBroadcastFunds, 60000);    // Funds: every 1 minute
  setInterval(updateAndBroadcastStocks, 60000);    // Stocks: every 1 minute
  setInterval(updateAndBroadcastGold, 60000);     // Gold: every 1 minute
  setInterval(updateAndBroadcastCurrency, 60000); // Currency: every 1 minute
  setInterval(updateAndBroadcastIHSG, 60000);     // IHSG: every 1 minute

  // Real-time price tick simulation every 5 seconds for smooth live updates
  setInterval(async () => {
    try {
      const cryptos = await storage.getCryptocurrencies();
      const stocks = await storage.getStocks();
      const funds = await storage.getMutualFunds();
      const goldItems = await storage.getAllGold();

      const tick: Record<string, any> = {};

      cryptos.forEach(c => {
        const vol = 0.015;
        const change = (Math.random() - 0.5) * vol * 2;
        const oldPrice = parseFloat(c.current_price);
        const newPrice = oldPrice * (1 + change);
        tick[c.id] = {
          ...c,
          current_price: newPrice.toFixed(2),
          price_change_24h: ((parseFloat(c.price_change_24h || '0') + oldPrice * change * 0.01)).toFixed(2),
          price_change_percentage_24h: ((parseFloat(c.price_change_percentage_24h || '0') + change * 100 * 0.05)).toFixed(2),
        };
      });

      stocks.forEach(s => {
        const vol = 0.005;
        const change = (Math.random() - 0.5) * vol * 2;
        const oldPrice = parseFloat(s.current_price);
        const newPrice = oldPrice * (1 + change);
        tick[s.id] = {
          ...s,
          current_price: newPrice.toFixed(2),
          change_1d: (parseFloat(s.change_1d || '0') + change * 100 * 0.01).toFixed(2),
        };
      });

      funds.forEach(f => {
        const vol = 0.002;
        const change = (Math.random() - 0.5) * vol * 2;
        const oldNav = parseFloat(f.nav);
        const newNav = oldNav * (1 + change);
        tick[f.id] = {
          ...f,
          nav: newNav.toFixed(4),
          change_1d: (parseFloat(f.change_1d || '0') + change * 100 * 0.01).toFixed(2),
        };
      });

      goldItems.forEach(g => {
        const vol = 0.003;
        const change = (Math.random() - 0.5) * vol * 2;
        const oldPrice = parseFloat(g.current_price);
        const newPrice = oldPrice * (1 + change);
        tick[g.id] = {
          ...g,
          current_price: newPrice.toFixed(2),
          change_1d: (parseFloat(g.change_1d || '0') + change * 100 * 0.01).toFixed(2),
        };
      });

      if (Object.keys(tick).length > 0) {
        broadcast({ type: 'price_tick', data: tick });
      }
    } catch (err) {
      // Silently ignore tick errors to prevent crash loops
    }
  }, 5000);

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

          // Fallback: Generate mock data with deterministic but unique base price per crypto
          const now = Date.now();
          const numPoints = hours <= 24 ? 48 : (hours <= 168 ? 168 : 365);
          const start = now - (hours * 60 * 60 * 1000);
          const step = (now - start) / numPoints;

          let basePrice = 50000;
          if (id === 'bitcoin') basePrice = 65000;
          else if (id === 'ethereum') basePrice = 3500;
          else if (id === 'binancecoin') basePrice = 600;
          else if (id === 'solana') basePrice = 145;
          else if (id === 'ripple') basePrice = 0.62;
          else if (id === 'cardano') basePrice = 0.45;
          else if (id === 'dogecoin') basePrice = 0.16;
          else if (id === 'polkadot') basePrice = 7.2;
          else if (id === 'tron') basePrice = 0.24;
          else if (id === 'avalanche') basePrice = 38;
          else {
            const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            basePrice = 50 + (hash % 9500);
          }

          let seed = 0;
          for (let i = 0; i < id.length; i++) {
            seed = ((seed << 5) - seed) + id.charCodeAt(i);
            seed = seed & seed;
          }
          const seededRandom = () => {
            seed = (seed * 16807 + 0) % 2147483647;
            return (seed - 1) / 2147483646;
          };

          history = Array.from({ length: numPoints }, (_, i) => {
            const time = start + (i * step);
            const trend = i / numPoints;
            const change = Math.sin(i / 10) * (basePrice * 0.05) + (seededRandom() - 0.5) * (basePrice * 0.02);
            const price = basePrice * (1 + trend * 0.02) + change;
            return {
              id: `mock-${id}-${time}`,
              cryptoId: id,
              price: Math.max(0.0001, price).toString(),
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

        let seed = 0;
        for (let i = 0; i < id.length; i++) {
          seed = ((seed << 5) - seed) + id.charCodeAt(i);
          seed = seed & seed;
        }
        const seededRandom = () => {
          seed = (seed * 16807 + 0) % 2147483647;
          return (seed - 1) / 2147483646;
        };

        history = Array.from({ length: Math.min(numPoints, 365) }, (_, i) => {
          const date = new Date(now - ((numPoints - 1 - i) * (days * 24 * 60 * 60 * 1000) / numPoints));
          const trend = i / numPoints;
          const noise = (seededRandom() - 0.5) * 2 * 0.005;
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

  // Stock routes
  app.get("/api/stocks", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const stocks = await storage.getStocks(limit);
      res.json(stocks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stocks" });
    }
  });

  app.get("/api/stocks/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const results = await storage.searchStocks(query);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Search failed" });
    }
  });

  app.get("/api/stocks/watchlist", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const watchlist = await storage.getStockWatchlist(userId);
      res.json(watchlist);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stock watchlist" });
    }
  });

  app.post("/api/stocks/watchlist", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertStockWatchlistSchema.parse({
        ...req.body,
        userId: userId
      });
      const watchlistItem = await storage.addToStockWatchlist(data);
      res.json(watchlistItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add to stock watchlist" });
    }
  });

  app.delete("/api/stocks/watchlist/:stockId", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { stockId } = req.params;
      await storage.removeFromStockWatchlist(userId, stockId);
      res.json({ message: "Removed from stock watchlist" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove from stock watchlist" });
    }
  });

  app.get("/api/stocks/:id/history", async (req, res) => {
    try {
      const { id } = req.params;
      const hours = req.query.hours ? parseInt(req.query.hours as string) : 24;

      let history = await storage.getStockHistory(id, hours);

      if (history.length === 0) {
        const stock = await storage.getStock(id);
        if (!stock) {
          return res.status(404).json({ message: "Stock not found" });
        }

        const basePrice = parseFloat(stock.current_price || '100');
        const now = Date.now();
        const numPoints = hours <= 24 ? 48 : (hours <= 168 ? 168 : 365);

        let seed = 0;
        for (let i = 0; i < id.length; i++) {
          seed = ((seed << 5) - seed) + id.charCodeAt(i);
          seed = seed & seed;
        }
        const seededRandom = () => {
          seed = (seed * 16807 + 0) % 2147483647;
          return (seed - 1) / 2147483646;
        };

        history = Array.from({ length: Math.min(numPoints, 365) }, (_, i) => {
          const date = new Date(now - ((numPoints - 1 - i) * (hours * 24 * 60 * 60 * 1000) / numPoints));
          const trend = i / numPoints;
          const noise = (seededRandom() - 0.5) * 2 * 0.02;
          const seasonal = Math.sin(i / 30) * 0.01;
          const price = basePrice * (1 + trend * 0.02 + noise + seasonal);

          return {
            id: `mock-${id}-${date.getTime()}`,
            stockId: id,
            price: Math.max(0.0001, price).toString(),
            timestamp: date,
            volume: (seededRandom() * 100000000).toString(),
          };
        });
      }

      res.json(history);
    } catch (error) {
      console.error('Error fetching stock history:', error);
      res.status(500).json({ message: "Failed to fetch stock history" });
    }
  });

  app.get("/api/stocks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const stock = await storage.getStock(id);
      if (!stock) {
        return res.status(404).json({ message: "Stock not found" });
      }
      res.json(stock);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stock" });
    }
  });

  // Gold routes
  app.get("/api/gold", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const gold = await storage.getAllGold(limit);
      res.json(gold);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch gold" });
    }
  });

  app.get("/api/gold/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const results = await storage.searchGold(query);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Search failed" });
    }
  });

  app.get("/api/gold/watchlist", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const watchlist = await storage.getGoldWatchlist(userId);
      res.json(watchlist);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch gold watchlist" });
    }
  });

  app.post("/api/gold/watchlist", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertGoldWatchlistSchema.parse({
        ...req.body,
        userId: userId
      });
      const watchlistItem = await storage.addToGoldWatchlist(data);
      res.json(watchlistItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add to gold watchlist" });
    }
  });

  app.delete("/api/gold/watchlist/:goldId", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { goldId } = req.params;
      await storage.removeFromGoldWatchlist(userId, goldId);
      res.json({ message: "Removed from gold watchlist" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove from gold watchlist" });
    }
  });

  app.get("/api/gold/:id/history", async (req, res) => {
    try {
      const { id } = req.params;
      const hours = req.query.hours ? parseInt(req.query.hours as string) : 24;

      let history = await storage.getGoldHistory(id, hours);

      if (history.length === 0) {
        const goldItem = await storage.getGold(id);
        if (!goldItem) {
          return res.status(404).json({ message: "Gold not found" });
        }

        const basePrice = parseFloat(goldItem.current_price || '100');
        const now = Date.now();
        const numPoints = hours <= 24 ? 48 : (hours <= 168 ? 168 : 365);

        let seed = 0;
        for (let i = 0; i < id.length; i++) {
          seed = ((seed << 5) - seed) + id.charCodeAt(i);
          seed = seed & seed;
        }
        const seededRandom = () => {
          seed = (seed * 16807 + 0) % 2147483647;
          return (seed - 1) / 2147483646;
        };

        history = Array.from({ length: Math.min(numPoints, 365) }, (_, i) => {
          const date = new Date(now - ((numPoints - 1 - i) * (hours * 24 * 60 * 60 * 1000) / numPoints));
          const trend = i / numPoints;
          const noise = (seededRandom() - 0.5) * 2 * 0.008;
          const seasonal = Math.sin(i / 30) * 0.004;
          const price = basePrice * (1 + trend * 0.01 + noise + seasonal);

          return {
            id: `mock-${id}-${date.getTime()}`,
            goldId: id,
            price: Math.max(0.0001, price).toString(),
            timestamp: date,
          };
        });
      }

      res.json(history);
    } catch (error) {
      console.error('Error fetching gold history:', error);
      res.status(500).json({ message: "Failed to fetch gold history" });
    }
  });

  app.get("/api/gold/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const goldItem = await storage.getGold(id);
      if (!goldItem) {
        return res.status(404).json({ message: "Gold not found" });
      }
      res.json(goldItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch gold" });
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
