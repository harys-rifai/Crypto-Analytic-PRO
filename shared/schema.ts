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

// Schemas
export const insertCryptocurrencySchema = createInsertSchema(cryptocurrencies);
export const insertWatchlistSchema = createInsertSchema(watchlists).omit({ id: true, createdAt: true });
export const insertPriceAlertSchema = createInsertSchema(priceAlerts).omit({ id: true, createdAt: true, triggeredAt: true });
export const insertPriceHistorySchema = createInsertSchema(priceHistory).omit({ id: true, timestamp: true });
export const insertUserSchema = createInsertSchema(users).pick({ username: true, password: true });
export const insertMutualFundSchema = createInsertSchema(mutualFunds);
export const insertMutualFundHistorySchema = createInsertSchema(mutualFundHistory).omit({ id: true });
export const insertFundWatchlistSchema = createInsertSchema(fundWatchlists).omit({ id: true, createdAt: true });
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
export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;
export type CurrencyRate = typeof currencyRates.$inferSelect;
export type InsertCurrencyRate = z.infer<typeof insertCurrencyRateSchema>;
