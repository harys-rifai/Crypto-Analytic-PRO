import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, boolean, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const AssetType = z.enum(["crypto", "reksadana", "stock", "gold"]);
export type AssetType = z.infer<typeof AssetType>;

export interface Asset {
  id: string;
  name: string;
  symbol: string;
  type: AssetType;
  price: number;
  currency: string;
  change24h: number;
  updatedAt: Date;
}

export const cryptocurrencies = pgTable("cryptocurrencies", {
  id: varchar("id").primaryKey(),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  image: text("image"),
  current_price: decimal("current_price", { precision: 20, scale: 8 }),
  market_cap: decimal("market_cap", { precision: 20, scale: 2 }),
  market_cap_rank: text("market_cap_rank"),
  fully_diluted_valuation: decimal("fully_diluted_valuation", { precision: 20, scale: 2 }),
  total_volume: decimal("total_volume", { precision: 20, scale: 2 }),
  high_24h: decimal("high_24h", { precision: 20, scale: 8 }),
  low_24h: decimal("low_24h", { precision: 20, scale: 8 }),
  price_change_24h: decimal("price_change_24h", { precision: 20, scale: 8 }),
  price_change_percentage_24h: decimal("price_change_percentage_24h", { precision: 10, scale: 4 }),
  price_change_percentage_7d: decimal("price_change_percentage_7d", { precision: 10, scale: 4 }),
  market_cap_change_24h: decimal("market_cap_change_24h", { precision: 20, scale: 2 }),
  market_cap_change_percentage_24h: decimal("market_cap_change_percentage_24h", { precision: 10, scale: 4 }),
  circulating_supply: decimal("circulating_supply", { precision: 20, scale: 2 }),
  total_supply: decimal("total_supply", { precision: 20, scale: 2 }),
  max_supply: decimal("max_supply", { precision: 20, scale: 2 }),
  ath: decimal("ath", { precision: 20, scale: 8 }),
  ath_change_percentage: decimal("ath_change_percentage", { precision: 10, scale: 4 }),
  ath_date: timestamp("ath_date"),
  atl: decimal("atl", { precision: 20, scale: 8 }),
  atl_change_percentage: decimal("atl_change_percentage", { precision: 10, scale: 4 }),
  atl_date: timestamp("atl_date"),
  last_updated: timestamp("last_updated").defaultNow(),
});

export const watchlists = pgTable("watchlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  cryptoId: text("crypto_id").notNull().references(() => cryptocurrencies.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const priceAlerts = pgTable("price_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  cryptoId: text("crypto_id").notNull().references(() => cryptocurrencies.id),
  alertType: text("alert_type").notNull(), // 'price_above', 'price_below', 'percentage_change'
  targetValue: decimal("target_value", { precision: 20, scale: 8 }).notNull(),
  isActive: boolean("is_active").default(true),
  isTriggered: boolean("is_triggered").default(false),
  triggeredAt: timestamp("triggered_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const priceHistory = pgTable("price_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cryptoId: text("crypto_id").notNull().references(() => cryptocurrencies.id),
  price: decimal("price", { precision: 20, scale: 8 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const mutualFunds = pgTable("mutual_funds", {
  id: varchar("id").primaryKey(),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  manager: text("manager"),
  nav: decimal("nav", { precision: 20, scale: 4 }),
  change_1d: decimal("change_1d", { precision: 10, scale: 4 }),
  change_1w: decimal("change_1w", { precision: 10, scale: 4 }),
  change_1m: decimal("change_1m", { precision: 10, scale: 4 }),
  change_1y: decimal("change_1y", { precision: 10, scale: 4 }),
  aum: decimal("aum", { precision: 20, scale: 2 }),
  risk_level: text("risk_level"),
  last_updated: timestamp("last_updated").defaultNow(),
});

export const mutualFundHistory = pgTable("mutual_fund_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fundId: text("fund_id").notNull().references(() => mutualFunds.id),
  date: timestamp("date").notNull(),
  nav: decimal("nav", { precision: 20, scale: 4 }).notNull(),
});

export const fundWatchlists = pgTable("fund_watchlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  fundId: text("fund_id").notNull().references(() => mutualFunds.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const stocks = pgTable("stocks", {
  id: varchar("id").primaryKey(),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  exchange: text("exchange").notNull(),
  sector: text("sector").notNull(),
  industry: text("industry"),
  current_price: decimal("current_price", { precision: 20, scale: 2 }),
  change_1d: decimal("change_1d", { precision: 10, scale: 4 }),
  change_1w: decimal("change_1w", { precision: 10, scale: 4 }),
  change_1m: decimal("change_1m", { precision: 10, scale: 4 }),
  change_1y: decimal("change_1y", { precision: 10, scale: 4 }),
  market_cap: decimal("market_cap", { precision: 20, scale: 2 }),
  volume: decimal("volume", { precision: 20, scale: 2 }),
  high_24h: decimal("high_24h", { precision: 20, scale: 2 }),
  low_24h: decimal("low_24h", { precision: 20, scale: 2 }),
  pe_ratio: decimal("pe_ratio", { precision: 10, scale: 2 }),
  eps: decimal("eps", { precision: 10, scale: 2 }),
  dividend_yield: decimal("dividend_yield", { precision: 10, scale: 4 }),
  last_updated: timestamp("last_updated").defaultNow(),
});

export const stockHistory = pgTable("stock_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stockId: text("stock_id").notNull().references(() => stocks.id),
  price: decimal("price", { precision: 20, scale: 2 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  volume: decimal("volume", { precision: 20, scale: 2 }),
});

export const stockWatchlists = pgTable("stock_watchlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  stockId: text("stock_id").notNull().references(() => stocks.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gold = pgTable("gold", {
  id: varchar("id").primaryKey(),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  current_price: decimal("current_price", { precision: 20, scale: 2 }),
  change_1d: decimal("change_1d", { precision: 10, scale: 4 }),
  change_1w: decimal("change_1w", { precision: 10, scale: 4 }),
  change_1m: decimal("change_1m", { precision: 10, scale: 4 }),
  change_1y: decimal("change_1y", { precision: 10, scale: 4 }),
  unit: text("unit").notNull(),
  last_updated: timestamp("last_updated").defaultNow(),
});

export const goldHistory = pgTable("gold_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  goldId: text("gold_id").notNull().references(() => gold.id),
  price: decimal("price", { precision: 20, scale: 2 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const goldWatchlists = pgTable("gold_watchlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  goldId: text("gold_id").notNull().references(() => gold.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const portfolios = pgTable("portfolios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  assetType: text("asset_type").notNull(),
  assetId: text("asset_id").notNull(),
  quantity: decimal("quantity").notNull(),
  buyPrice: decimal("buy_price"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const currencyRates = pgTable("currency_rates", {
  id: text("id").primaryKey(),
  fromCurrency: text("from_currency").notNull(),
  toCurrency: text("to_currency").notNull(),
  rate: decimal("rate", { precision: 20, scale: 6 }).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Seed data
export const SEED_STOCKS = [
  {
    id: "bbca",
    symbol: "BBCA",
    name: "Bank Central Asia Tbk",
    exchange: "IDX",
    sector: "Financials",
    industry: "Banks",
    basePrice: 8750,
    volatility: 0.02,
  },
  {
    id: "bbri",
    symbol: "BBRI",
    name: "Bank Rakyat Indonesia Tbk",
    exchange: "IDX",
    sector: "Financials",
    industry: "Banks",
    basePrice: 4520,
    volatility: 0.025,
  },
  {
    id: "tlkm",
    symbol: "TLKM",
    name: "Telekomunikasi Indonesia Tbk",
    exchange: "IDX",
    sector: "Communication Services",
    industry: "Telecommunications",
    basePrice: 3650,
    volatility: 0.018,
  },
  {
    id: "asii",
    symbol: "ASII",
    name: "Astra International Tbk",
    exchange: "IDX",
    sector: "Consumer Discretionary",
    industry: "Diversified",
    basePrice: 5250,
    volatility: 0.022,
  },
  {
    id: "unvr",
    symbol: "UNVR",
    name: "Unilever Indonesia Tbk",
    exchange: "IDX",
    sector: "Consumer Staples",
    industry: "Household Products",
    basePrice: 3850,
    volatility: 0.015,
  },
  {
    id: "bmri",
    symbol: "BMRI",
    name: "Bank Mandiri Tbk",
    exchange: "IDX",
    sector: "Financials",
    industry: "Banks",
    basePrice: 5250,
    volatility: 0.02,
  },
  {
    id: "amrt",
    symbol: "AMRT",
    name: "Alfamart Retail Indonesia Tbk",
    exchange: "IDX",
    sector: "Consumer Staples",
    industry: "Retail",
    basePrice: 2780,
    volatility: 0.02,
  },
  {
    id: "goka",
    symbol: "GOKA",
    name: "Gudang Garam Tbk",
    exchange: "IDX",
    sector: "Consumer Staples",
    industry: "Tobacco",
    basePrice: 19800,
    volatility: 0.025,
  },
  {
    id: "indf",
    symbol: "INDF",
    name: "Indofood Sukses Makmur Tbk",
    exchange: "IDX",
    sector: "Consumer Staples",
    industry: "Food Products",
    basePrice: 6350,
    volatility: 0.018,
  },
  {
    id: "excl",
    symbol: "EXCL",
    name: "XL Axiata Tbk",
    exchange: "IDX",
    sector: "Communication Services",
    industry: "Telecommunications",
    basePrice: 2850,
    volatility: 0.025,
  },
];

export const SEED_GOLD = [
  {
    id: "xau-idr",
    symbol: "XAU/IDR",
    name: "Gold Spot (IDR)",
    type: "gold_spot",
    unit: "gram",
    basePrice: 1150000,
    volatility: 0.008,
  },
  {
    id: "xau-usd",
    symbol: "XAU/USD",
    name: "Gold Spot (USD)",
    type: "gold_spot",
    unit: "troy_ounce",
    basePrice: 2350,
    volatility: 0.008,
  },
  {
    id: "gold-mini",
    symbol: "GCM",
    name: "Gold Mini Futures",
    type: "gold_futures",
    unit: "troy_ounce",
    basePrice: 2380,
    volatility: 0.012,
  },
  {
    id: "gold-1g",
    symbol: "AU1G",
    name: "Gold 1 Gram (IDR)",
    type: "gold_spot",
    unit: "gram",
    basePrice: 1160000,
    volatility: 0.008,
  },
  {
    id: "gold-5g",
    symbol: "AU5G",
    name: "Gold 5 Gram (IDR)",
    type: "gold_spot",
    unit: "gram",
    basePrice: 5750000,
    volatility: 0.008,
  },
  {
    id: "gold-10g",
    symbol: "AU10G",
    name: "Gold 10 Gram (IDR)",
    type: "gold_spot",
    unit: "gram",
    basePrice: 11450000,
    volatility: 0.008,
  },
  {
    id: "gold-25g",
    symbol: "AU25G",
    name: "Gold 25 Gram (IDR)",
    type: "gold_spot",
    unit: "gram",
    basePrice: 28600000,
    volatility: 0.008,
  },
  {
    id: "gold-50g",
    symbol: "AU50G",
    name: "Gold 50 Gram (IDR)",
    type: "gold_spot",
    unit: "gram",
    basePrice: 57000000,
    volatility: 0.008,
  },
];

// Schemas
export const insertCryptocurrencySchema = createInsertSchema(cryptocurrencies);
export const insertWatchlistSchema = createInsertSchema(watchlists).omit({ id: true, createdAt: true });
export const insertPriceAlertSchema = createInsertSchema(priceAlerts).omit({ id: true, createdAt: true, triggeredAt: true });
export const insertPriceHistorySchema = createInsertSchema(priceHistory).omit({ id: true });
export const insertUserSchema = createInsertSchema(users).pick({ username: true, password: true });
export const insertMutualFundSchema = createInsertSchema(mutualFunds);
export const insertMutualFundHistorySchema = createInsertSchema(mutualFundHistory).omit({ id: true });
export const insertFundWatchlistSchema = createInsertSchema(fundWatchlists).omit({ id: true, createdAt: true });
export const insertStockSchema = createInsertSchema(stocks);
export const insertStockHistorySchema = createInsertSchema(stockHistory).omit({ id: true });
export const insertStockWatchlistSchema = createInsertSchema(stockWatchlists).omit({ id: true, createdAt: true });
export const insertGoldSchema = createInsertSchema(gold);
export const insertGoldHistorySchema = createInsertSchema(goldHistory).omit({ id: true });
export const insertGoldWatchlistSchema = createInsertSchema(goldWatchlists).omit({ id: true, createdAt: true });
export const insertPortfolioSchema = createInsertSchema(portfolios).omit({ id: true, createdAt: true });
export const insertCurrencyRateSchema = createInsertSchema(currencyRates).omit({ lastUpdated: true });

export type Cryptocurrency = typeof cryptocurrencies.$inferSelect;
export type InsertCryptocurrency = z.infer<typeof insertCryptocurrencySchema>;
export type Watchlist = typeof watchlists.$inferSelect;
export type InsertWatchlist = z.infer<typeof insertWatchlistSchema>;
export type PriceAlert = typeof priceAlerts.$inferSelect;
export type InsertPriceAlert = z.infer<typeof insertPriceAlertSchema>;
export type PriceHistory = typeof priceHistory.$inferSelect;
export type InsertPriceHistory = z.infer<typeof insertPriceHistorySchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type MutualFund = typeof mutualFunds.$inferSelect;
export type InsertMutualFund = z.infer<typeof insertMutualFundSchema>;
export type MutualFundHistory = typeof mutualFundHistory.$inferSelect;
export type InsertMutualFundHistory = z.infer<typeof insertMutualFundHistorySchema>;
export type FundWatchlist = typeof fundWatchlists.$inferSelect;
export type InsertFundWatchlist = z.infer<typeof insertFundWatchlistSchema>;
export type Stock = typeof stocks.$inferSelect;
export type InsertStock = z.infer<typeof insertStockSchema>;
export type StockHistory = typeof stockHistory.$inferSelect;
export type InsertStockHistory = z.infer<typeof insertStockHistorySchema>;
export type StockWatchlist = typeof stockWatchlists.$inferSelect;
export type InsertStockWatchlist = z.infer<typeof insertStockWatchlistSchema>;
export type Gold = typeof gold.$inferSelect;
export type InsertGold = z.infer<typeof insertGoldSchema>;
export type GoldHistory = typeof goldHistory.$inferSelect;
export type InsertGoldHistory = z.infer<typeof insertGoldHistorySchema>;
export type GoldWatchlist = typeof goldWatchlists.$inferSelect;
export type InsertGoldWatchlist = z.infer<typeof insertGoldWatchlistSchema>;
export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;
export type CurrencyRate = typeof currencyRates.$inferSelect;
export type InsertCurrencyRate = z.infer<typeof insertCurrencyRateSchema>;
