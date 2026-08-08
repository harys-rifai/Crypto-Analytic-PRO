import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import { 
  type Cryptocurrency, type InsertCryptocurrency, type Watchlist, type InsertWatchlist, type PriceAlert, type InsertPriceAlert, type PriceHistory, type InsertPriceHistory, type User, type InsertUser, type MutualFund, type InsertMutualFund, type MutualFundHistory, type InsertMutualFundHistory, type FundWatchlist, type InsertFundWatchlist, type Stock, type InsertStock, type StockHistory, type InsertStockHistory, type StockWatchlist, type InsertStockWatchlist, type Gold, type InsertGold, type GoldHistory, type InsertGoldHistory, type GoldWatchlist, type InsertGoldWatchlist, type Portfolio, type InsertPortfolio, type CurrencyRate, type InsertCurrencyRate,
  users, cryptocurrencies, watchlists, priceAlerts, priceHistory, mutualFunds, mutualFundHistory, fundWatchlists, stocks, stockHistory, stockWatchlists, gold, goldHistory, goldWatchlists, portfolios, currencyRates
} from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { IStorage } from "./storage-base";

const MAX_NUMERIC_20_2 = 999999999999999999;
const MAX_NUMERIC_10_4 = 999999.9999;

function clamp(value: string | number | null | undefined, max: number): string | null {
  if (value === null || value === undefined) return null;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return null;
  if (num > max) return max.toString();
  return num.toString();
}

function safeNum(value: string | number | null | undefined, max: number): string | null {
  if (value === null || value === undefined) return null;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return null;
  if (num > max) return max.toString();
  if (num < -max) return (-max).toString();
  return num.toString();
}

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:Password09!@localhost:5008/cryptoanalyze";
const pool = new Pool({ connectionString });
export const db = drizzle(pool);

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const [user] = await db.insert(users).values({ ...insertUser, id }).returning();
    return user;
  }

  async getCryptocurrencies(limit = 100): Promise<Cryptocurrency[]> {
    const result = await db.select().from(cryptocurrencies).orderBy(desc(cryptocurrencies.market_cap_rank)).limit(limit);
    return result;
  }

  async getCryptocurrency(id: string): Promise<Cryptocurrency | undefined> {
    const result = await db.select().from(cryptocurrencies).where(eq(cryptocurrencies.id, id)).limit(1);
    return result[0];
  }

  async upsertCryptocurrency(crypto: InsertCryptocurrency): Promise<Cryptocurrency> {
    const values: any = {
      ...crypto,
      image: crypto.image || null,
      current_price: safeNum(crypto.current_price, MAX_NUMERIC_20_2),
      market_cap: safeNum(crypto.market_cap, MAX_NUMERIC_20_2),
      market_cap_rank: crypto.market_cap_rank || null,
      fully_diluted_valuation: safeNum(crypto.fully_diluted_valuation, MAX_NUMERIC_20_2),
      total_volume: safeNum(crypto.total_volume, MAX_NUMERIC_20_2),
      high_24h: safeNum(crypto.high_24h, MAX_NUMERIC_20_2),
      low_24h: safeNum(crypto.low_24h, MAX_NUMERIC_20_2),
      price_change_24h: safeNum(crypto.price_change_24h, MAX_NUMERIC_20_2),
      price_change_percentage_24h: safeNum(crypto.price_change_percentage_24h, MAX_NUMERIC_10_4),
      price_change_percentage_7d: safeNum(crypto.price_change_percentage_7d, MAX_NUMERIC_10_4),
      market_cap_change_24h: safeNum(crypto.market_cap_change_24h, MAX_NUMERIC_20_2),
      market_cap_change_percentage_24h: safeNum(crypto.market_cap_change_percentage_24h, MAX_NUMERIC_10_4),
      circulating_supply: safeNum(crypto.circulating_supply, MAX_NUMERIC_20_2),
      total_supply: safeNum(crypto.total_supply, MAX_NUMERIC_20_2),
      max_supply: safeNum(crypto.max_supply, MAX_NUMERIC_20_2),
      ath: safeNum(crypto.ath, MAX_NUMERIC_20_2),
      ath_change_percentage: safeNum(crypto.ath_change_percentage, MAX_NUMERIC_10_4),
      ath_date: crypto.ath_date || null,
      atl: safeNum(crypto.atl, MAX_NUMERIC_20_2),
      atl_change_percentage: safeNum(crypto.atl_change_percentage, MAX_NUMERIC_10_4),
      atl_date: crypto.atl_date || null,
      last_updated: new Date(),
    };

    try {
      const [updated] = await db.insert(cryptocurrencies)
        .values(values)
        .onConflictDoUpdate({
          target: cryptocurrencies.id,
          set: values,
        })
        .returning();
      return updated;
    } catch (error: any) {
      if (error?.code === '22003') {
        console.error(`Numeric overflow for crypto ${crypto.id}: ${error.message}`);
        return crypto as any;
      }
      throw error;
    }
  }

  async searchCryptocurrencies(query: string): Promise<Cryptocurrency[]> {
    const lowerQuery = query.toLowerCase();
    const result = await db.select().from(cryptocurrencies).where(sql`lower(${cryptocurrencies.name}) LIKE ${`%${lowerQuery}%`} OR lower(${cryptocurrencies.symbol}) LIKE ${`%${lowerQuery}%`}`);
    return result;
  }

  async getWatchlist(userId: string): Promise<(Watchlist & { crypto: Cryptocurrency })[]> {
    const items = await db.select().from(watchlists).where(eq(watchlists.userId, userId));
    const result: (Watchlist & { crypto: Cryptocurrency })[] = [];
    for (const item of items) {
      const crypto = await this.getCryptocurrency(item.cryptoId);
      if (crypto) {
        result.push({ ...item, crypto });
      }
    }
    return result;
  }

  async addToWatchlist(watchlistItem: InsertWatchlist): Promise<Watchlist> {
    const id = randomUUID();
    const [item] = await db.insert(watchlists).values({ ...watchlistItem, id, createdAt: new Date() }).returning();
    return item;
  }

  async removeFromWatchlist(userId: string, cryptoId: string): Promise<void> {
    await db.delete(watchlists).where(and(eq(watchlists.userId, userId), eq(watchlists.cryptoId, cryptoId)));
  }

  async getPriceAlerts(userId: string): Promise<(PriceAlert & { crypto: Cryptocurrency })[]> {
    const alerts = await db.select().from(priceAlerts).where(eq(priceAlerts.userId, userId));
    const result: (PriceAlert & { crypto: Cryptocurrency })[] = [];
    for (const alert of alerts) {
      const crypto = await this.getCryptocurrency(alert.cryptoId);
      if (crypto) {
        result.push({ ...alert, crypto });
      }
    }
    return result;
  }

  async createPriceAlert(alert: InsertPriceAlert): Promise<PriceAlert> {
    const id = randomUUID();
    const [newAlert] = await db.insert(priceAlerts).values({
      ...alert,
      id,
      isActive: true,
      isTriggered: false,
      triggeredAt: null,
      createdAt: new Date(),
    }).returning();
    return newAlert;
  }

  async updatePriceAlert(id: string, updates: Partial<PriceAlert>): Promise<PriceAlert | undefined> {
    const [updated] = await db.update(priceAlerts).set(updates).where(eq(priceAlerts.id, id)).returning();
    return updated;
  }

  async deletePriceAlert(id: string): Promise<void> {
    await db.delete(priceAlerts).where(eq(priceAlerts.id, id));
  }

  async getActivePriceAlerts(): Promise<(PriceAlert & { crypto: Cryptocurrency })[]> {
    const alerts = await db.select().from(priceAlerts).where(and(eq(priceAlerts.isActive, true), eq(priceAlerts.isTriggered, false)));
    const result: (PriceAlert & { crypto: Cryptocurrency })[] = [];
    for (const alert of alerts) {
      const crypto = await this.getCryptocurrency(alert.cryptoId);
      if (crypto) {
        result.push({ ...alert, crypto });
      }
    }
    return result;
  }

  async addPriceHistory(priceData: InsertPriceHistory): Promise<PriceHistory> {
    const id = randomUUID();
    try {
      const [history] = await db.insert(priceHistory).values({ ...priceData, id, timestamp: priceData.timestamp || new Date() }).returning();
      return history;
    } catch (error: any) {
      if (error?.code === '23503') {
        return priceData as any;
      }
      throw error;
    }
  }

  async getPriceHistory(cryptoId: string, hours: number): Promise<PriceHistory[]> {
    const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
    const result = await db.select().from(priceHistory).where(and(eq(priceHistory.cryptoId, cryptoId), sql`${priceHistory.timestamp} >= ${cutoffTime}`)).orderBy(priceHistory.timestamp);
    return result;
  }

  async getMutualFunds(limit = 100): Promise<MutualFund[]> {
    const result = await db.select().from(mutualFunds).orderBy(desc(mutualFunds.aum)).limit(limit);
    return result;
  }

  async getMutualFund(id: string): Promise<MutualFund | undefined> {
    const result = await db.select().from(mutualFunds).where(eq(mutualFunds.id, id)).limit(1);
    return result[0];
  }

  async upsertMutualFund(fund: InsertMutualFund): Promise<MutualFund> {
    const values: any = {
      ...fund,
      nav: fund.nav || null,
      change_1d: fund.change_1d || null,
      change_1w: fund.change_1w || null,
      change_1m: fund.change_1m || null,
      change_1y: fund.change_1y || null,
      aum: fund.aum || null,
      manager: fund.manager || null,
      risk_level: fund.risk_level || null,
      last_updated: new Date(),
    };

    const [updated] = await db.insert(mutualFunds)
      .values(values)
      .onConflictDoUpdate({
        target: mutualFunds.id,
        set: values,
      })
      .returning();
    return updated;
  }

  async searchMutualFunds(query: string): Promise<MutualFund[]> {
    const lowerQuery = query.toLowerCase();
    const result = await db.select().from(mutualFunds).where(sql`lower(${mutualFunds.name}) LIKE ${`%${lowerQuery}%`} OR lower(${mutualFunds.symbol}) LIKE ${`%${lowerQuery}%`}`);
    return result;
  }

  async addFundHistory(historyData: InsertMutualFundHistory): Promise<MutualFundHistory> {
    const id = randomUUID();
    const [history] = await db.insert(mutualFundHistory).values({ ...historyData, id, date: historyData.date || new Date() }).returning();
    return history;
  }

  async addFundHistoryBatch(historyData: InsertMutualFundHistory[]): Promise<MutualFundHistory[]> {
    const values = historyData.map(data => ({ ...data, id: randomUUID(), date: data.date || new Date() }));
    try {
      return await db.insert(mutualFundHistory).values(values).returning();
    } catch (error: any) {
      if (error?.code === '23503') {
        return values as any[];
      }
      throw error;
    }
  }

  async getFundHistory(fundId: string, days: number): Promise<MutualFundHistory[]> {
    const cutoffTime = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
    const result = await db.select().from(mutualFundHistory).where(and(eq(mutualFundHistory.fundId, fundId), sql`${mutualFundHistory.date} >= ${cutoffTime}`)).orderBy(mutualFundHistory.date);
    return result;
  }

  async getFundWatchlist(userId: string): Promise<(FundWatchlist & { fund: MutualFund })[]> {
    const items = await db.select().from(fundWatchlists).where(eq(fundWatchlists.userId, userId));
    const result: (FundWatchlist & { fund: MutualFund })[] = [];
    for (const item of items) {
      const fund = await this.getMutualFund(item.fundId);
      if (fund) {
        result.push({ ...item, fund });
      }
    }
    return result;
  }

  async addToFundWatchlist(watchlistItem: InsertFundWatchlist): Promise<FundWatchlist> {
    const id = randomUUID();
    const [item] = await db.insert(fundWatchlists).values({ ...watchlistItem, id, createdAt: new Date() }).returning();
    return item;
  }

  async removeFromFundWatchlist(userId: string, fundId: string): Promise<void> {
    await db.delete(fundWatchlists).where(and(eq(fundWatchlists.userId, userId), eq(fundWatchlists.fundId, fundId)));
  }

  async getStocks(limit = 100): Promise<Stock[]> {
    const result = await db.select().from(stocks).orderBy(desc(stocks.market_cap)).limit(limit);
    return result;
  }

  async getStock(id: string): Promise<Stock | undefined> {
    const result = await db.select().from(stocks).where(eq(stocks.id, id)).limit(1);
    return result[0];
  }

  async upsertStock(stock: InsertStock): Promise<Stock> {
    const values: any = {
      ...stock,
      current_price: safeNum(stock.current_price, MAX_NUMERIC_20_2),
      change_1d: safeNum(stock.change_1d, MAX_NUMERIC_10_4),
      change_1w: safeNum(stock.change_1w, MAX_NUMERIC_10_4),
      change_1m: safeNum(stock.change_1m, MAX_NUMERIC_10_4),
      change_1y: safeNum(stock.change_1y, MAX_NUMERIC_10_4),
      market_cap: safeNum(stock.market_cap, MAX_NUMERIC_20_2),
      volume: safeNum(stock.volume, MAX_NUMERIC_20_2),
      high_24h: safeNum(stock.high_24h, MAX_NUMERIC_20_2),
      low_24h: safeNum(stock.low_24h, MAX_NUMERIC_20_2),
      pe_ratio: safeNum(stock.pe_ratio, MAX_NUMERIC_10_4),
      eps: safeNum(stock.eps, MAX_NUMERIC_10_4),
      dividend_yield: safeNum(stock.dividend_yield, MAX_NUMERIC_10_4),
      last_updated: new Date(),
    };

    const [updated] = await db.insert(stocks)
      .values(values)
      .onConflictDoUpdate({
        target: stocks.id,
        set: values,
      })
      .returning();
    return updated;
  }

  async searchStocks(query: string): Promise<Stock[]> {
    const lowerQuery = query.toLowerCase();
    const result = await db.select().from(stocks).where(sql`lower(${stocks.name}) LIKE ${`%${lowerQuery}%`} OR lower(${stocks.symbol}) LIKE ${`%${lowerQuery}%`}`);
    return result;
  }

  async addStockHistory(historyData: InsertStockHistory): Promise<StockHistory> {
    const id = randomUUID();
    try {
      const [history] = await db.insert(stockHistory).values({ ...historyData, id, timestamp: historyData.timestamp || new Date() }).returning();
      return history;
    } catch (error: any) {
      if (error?.code === '23503') {
        return historyData as any;
      }
      throw error;
    }
  }

  async addStockHistoryBatch(historyData: InsertStockHistory[]): Promise<StockHistory[]> {
    const id = randomUUID();
    const values = historyData.map(data => ({ ...data, id, timestamp: data.timestamp || new Date() }));
    try {
      return await db.insert(stockHistory).values(values).returning();
    } catch (error: any) {
      if (error?.code === '23503') {
        return values as any[];
      }
      throw error;
    }
  }

  async getStockHistory(stockId: string, hours: number): Promise<StockHistory[]> {
    const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
    const result = await db.select().from(stockHistory).where(and(eq(stockHistory.stockId, stockId), sql`${stockHistory.timestamp} >= ${cutoffTime}`)).orderBy(stockHistory.timestamp);
    return result;
  }

  async getStockWatchlist(userId: string): Promise<(StockWatchlist & { stock: Stock })[]> {
    const items = await db.select().from(stockWatchlists).where(eq(stockWatchlists.userId, userId));
    const result: (StockWatchlist & { stock: Stock })[] = [];
    for (const item of items) {
      const stock = await this.getStock(item.stockId);
      if (stock) {
        result.push({ ...item, stock });
      }
    }
    return result;
  }

  async addToStockWatchlist(watchlistItem: InsertStockWatchlist): Promise<StockWatchlist> {
    const id = randomUUID();
    const [item] = await db.insert(stockWatchlists).values({ ...watchlistItem, id, createdAt: new Date() }).returning();
    return item;
  }

  async removeFromStockWatchlist(userId: string, stockId: string): Promise<void> {
    await db.delete(stockWatchlists).where(and(eq(stockWatchlists.userId, userId), eq(stockWatchlists.stockId, stockId)));
  }

  async getGold(id: string): Promise<Gold | undefined> {
    const result = await db.select().from(gold).where(eq(gold.id, id)).limit(1);
    return result[0];
  }

  async upsertGold(goldItem: InsertGold): Promise<Gold> {
    const values: any = {
      ...goldItem,
      current_price: safeNum(goldItem.current_price, MAX_NUMERIC_20_2),
      change_1d: safeNum(goldItem.change_1d, MAX_NUMERIC_10_4),
      change_1w: safeNum(goldItem.change_1w, MAX_NUMERIC_10_4),
      change_1m: safeNum(goldItem.change_1m, MAX_NUMERIC_10_4),
      change_1y: safeNum(goldItem.change_1y, MAX_NUMERIC_10_4),
      last_updated: new Date(),
    };

    const [updated] = await db.insert(gold)
      .values(values)
      .onConflictDoUpdate({
        target: gold.id,
        set: values,
      })
      .returning();
    return updated;
  }

  async searchGold(query: string): Promise<Gold[]> {
    const lowerQuery = query.toLowerCase();
    const result = await db.select().from(gold).where(sql`lower(${gold.name}) LIKE ${`%${lowerQuery}%`} OR lower(${gold.symbol}) LIKE ${`%${lowerQuery}%`}`);
    return result;
  }

  async getAllGold(limit = 100): Promise<Gold[]> {
    const result = await db.select().from(gold).orderBy(gold.symbol).limit(limit);
    return result;
  }

  async addGoldHistory(historyData: InsertGoldHistory): Promise<GoldHistory> {
    const id = randomUUID();
    try {
      const [history] = await db.insert(goldHistory).values({ ...historyData, id, timestamp: historyData.timestamp || new Date() }).returning();
      return history;
    } catch (error: any) {
      if (error?.code === '23503') {
        return historyData as any;
      }
      throw error;
    }
  }

  async addGoldHistoryBatch(historyData: InsertGoldHistory[]): Promise<GoldHistory[]> {
    const values = historyData.map(data => ({ ...data, id: randomUUID(), timestamp: data.timestamp || new Date() }));
    try {
      return await db.insert(goldHistory).values(values).returning();
    } catch (error: any) {
      if (error?.code === '23503') {
        return values as any[];
      }
      throw error;
    }
  }

  async getGoldHistory(goldId: string, hours: number): Promise<GoldHistory[]> {
    const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
    const result = await db.select().from(goldHistory).where(and(eq(goldHistory.goldId, goldId), sql`${goldHistory.timestamp} >= ${cutoffTime}`)).orderBy(goldHistory.timestamp);
    return result;
  }

  async getGoldWatchlist(userId: string): Promise<(GoldWatchlist & { gold: Gold })[]> {
    const items = await db.select().from(goldWatchlists).where(eq(goldWatchlists.userId, userId));
    const result: (GoldWatchlist & { gold: Gold })[] = [];
    for (const item of items) {
      const goldItem = await this.getGold(item.goldId);
      if (goldItem) {
        result.push({ ...item, gold: goldItem });
      }
    }
    return result;
  }

  async addToGoldWatchlist(watchlistItem: InsertGoldWatchlist): Promise<GoldWatchlist> {
    const id = randomUUID();
    const [item] = await db.insert(goldWatchlists).values({ ...watchlistItem, id, createdAt: new Date() }).returning();
    return item;
  }

  async removeFromGoldWatchlist(userId: string, goldId: string): Promise<void> {
    await db.delete(goldWatchlists).where(and(eq(goldWatchlists.userId, userId), eq(goldWatchlists.goldId, goldId)));
  }

  async getPortfolios(userId: string): Promise<Portfolio[]> {
    const result = await db.select().from(portfolios).where(eq(portfolios.userId, userId)).orderBy(desc(portfolios.createdAt));
    return result;
  }

  async addPortfolioItem(item: InsertPortfolio): Promise<Portfolio> {
    const id = randomUUID();
    const [portfolioItem] = await db.insert(portfolios).values({ ...item, id, buyPrice: item.buyPrice || null, createdAt: new Date() }).returning();
    return portfolioItem;
  }

  async getCurrencyRate(from: string, to: string): Promise<CurrencyRate | undefined> {
    const result = await db.select().from(currencyRates).where(and(eq(currencyRates.fromCurrency, from), eq(currencyRates.toCurrency, to))).limit(1);
    return result[0];
  }

  async getAllCurrencyRates(): Promise<CurrencyRate[]> {
    const result = await db.select().from(currencyRates).orderBy(currencyRates.fromCurrency);
    return result;
  }

  async upsertCurrencyRate(rate: InsertCurrencyRate): Promise<CurrencyRate> {
    const id = `${rate.fromCurrency}_${rate.toCurrency}`;
    const [updated] = await db.insert(currencyRates).values({ ...rate, id, lastUpdated: new Date() }).onConflictDoUpdate({
      target: currencyRates.id,
      set: { ...rate, lastUpdated: new Date() },
    }).returning();
    return updated;
  }

  async clearHistory(): Promise<void> {
    await db.delete(priceHistory).execute();
    await db.delete(mutualFundHistory).execute();
    await db.delete(stockHistory).execute();
    await db.delete(goldHistory).execute();
  }
}
