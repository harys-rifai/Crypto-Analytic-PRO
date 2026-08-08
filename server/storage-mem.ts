import type { IStorage } from "./storage-base";
import { 
  type Cryptocurrency, type InsertCryptocurrency, type Watchlist, type InsertWatchlist, type PriceAlert, type InsertPriceAlert, type PriceHistory, type InsertPriceHistory, type User, type InsertUser, type MutualFund, type InsertMutualFund, type MutualFundHistory, type InsertMutualFundHistory, type FundWatchlist, type InsertFundWatchlist, type Stock, type InsertStock, type StockHistory, type InsertStockHistory, type StockWatchlist, type InsertStockWatchlist, type Gold, type InsertGold, type GoldHistory, type InsertGoldHistory, type GoldWatchlist, type InsertGoldWatchlist, type Portfolio, type InsertPortfolio, type CurrencyRate, type InsertCurrencyRate, type UserSession, type InsertUserSession
} from "@shared/schema";
import { randomUUID } from "crypto";

export class MemStorage implements IStorage {
  private users = new Map<string, User>();
  private userSessions = new Map<string, UserSession>();
  private cryptocurrencies = new Map<string, Cryptocurrency>();
  private watchlists = new Map<string, Watchlist>();
  private priceAlerts = new Map<string, PriceAlert>();
  private priceHistory = new Map<string, PriceHistory>();
  private mutualFunds = new Map<string, MutualFund>();
  private fundHistory = new Map<string, MutualFundHistory>();
  private fundWatchlists = new Map<string, FundWatchlist>();
  private stocks = new Map<string, Stock>();
  private stockHistory = new Map<string, StockHistory>();
  private stockWatchlists = new Map<string, StockWatchlist>();
  private gold = new Map<string, Gold>();
  private goldHistory = new Map<string, GoldHistory>();
  private goldWatchlists = new Map<string, GoldWatchlist>();
  private portfolios = new Map<string, Portfolio>();
  private currencyRates = new Map<string, CurrencyRate>();

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getCryptocurrencies(limit = 100): Promise<Cryptocurrency[]> {
    return Array.from(this.cryptocurrencies.values())
      .sort((a, b) => {
        const rankA = parseInt(a.market_cap_rank || '0');
        const rankB = parseInt(b.market_cap_rank || '0');
        return rankA - rankB;
      })
      .slice(0, limit);
  }

  async getCryptocurrency(id: string): Promise<Cryptocurrency | undefined> {
    return this.cryptocurrencies.get(id);
  }

  async upsertCryptocurrency(crypto: InsertCryptocurrency): Promise<Cryptocurrency> {
    const existing = this.cryptocurrencies.get(crypto.id);
    const updated: Cryptocurrency = {
      ...existing,
      ...crypto,
      image: crypto.image || null,
      current_price: crypto.current_price || null,
      market_cap: crypto.market_cap || null,
      market_cap_rank: crypto.market_cap_rank || null,
      fully_diluted_valuation: crypto.fully_diluted_valuation || null,
      total_volume: crypto.total_volume || null,
      high_24h: crypto.high_24h || null,
      low_24h: crypto.low_24h || null,
      price_change_24h: crypto.price_change_24h || null,
      price_change_percentage_24h: crypto.price_change_percentage_24h || null,
      price_change_percentage_7d: crypto.price_change_percentage_7d || null,
      market_cap_change_24h: crypto.market_cap_change_24h || null,
      market_cap_change_percentage_24h: crypto.market_cap_change_percentage_24h || null,
      circulating_supply: crypto.circulating_supply || null,
      total_supply: crypto.total_supply || null,
      max_supply: crypto.max_supply || null,
      ath: crypto.ath || null,
      ath_change_percentage: crypto.ath_change_percentage || null,
      ath_date: crypto.ath_date || null,
      atl: crypto.atl || null,
      atl_change_percentage: crypto.atl_change_percentage || null,
      atl_date: crypto.atl_date || null,
      last_updated: new Date()
    };
    this.cryptocurrencies.set(crypto.id, updated);
    return updated;
  }

  async searchCryptocurrencies(query: string): Promise<Cryptocurrency[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.cryptocurrencies.values()).filter(crypto =>
      crypto.name.toLowerCase().includes(lowerQuery) ||
      crypto.symbol.toLowerCase().includes(lowerQuery)
    );
  }

  async getWatchlist(userId: string): Promise<(Watchlist & { crypto: Cryptocurrency })[]> {
    const watchlistItems = Array.from(this.watchlists.values()).filter(item => item.userId === userId);
    return watchlistItems.map(item => {
      const crypto = this.cryptocurrencies.get(item.cryptoId);
      return { ...item, crypto: crypto! };
    }).filter(item => item.crypto);
  }

  async addToWatchlist(watchlistItem: InsertWatchlist): Promise<Watchlist> {
    const id = randomUUID();
    const item: Watchlist = {
      ...watchlistItem,
      id,
      createdAt: new Date()
    };
    this.watchlists.set(id, item);
    return item;
  }

  async removeFromWatchlist(userId: string, cryptoId: string): Promise<void> {
    const item = Array.from(this.watchlists.entries()).find(([_, watchlist]) =>
      watchlist.userId === userId && watchlist.cryptoId === cryptoId
    );
    if (item) {
      this.watchlists.delete(item[0]);
    }
  }

  async getPriceAlerts(userId: string): Promise<(PriceAlert & { crypto: Cryptocurrency })[]> {
    const alerts = Array.from(this.priceAlerts.values()).filter(alert => alert.userId === userId);
    return alerts.map(alert => {
      const crypto = this.cryptocurrencies.get(alert.cryptoId);
      return { ...alert, crypto: crypto! };
    }).filter(alert => alert.crypto);
  }

  async createPriceAlert(alert: InsertPriceAlert): Promise<PriceAlert> {
    const id = randomUUID();
    const newAlert: PriceAlert = {
      ...alert,
      id,
      isActive: true,
      isTriggered: false,
      triggeredAt: null,
      createdAt: new Date()
    };
    this.priceAlerts.set(id, newAlert);
    return newAlert;
  }

  async updatePriceAlert(id: string, updates: Partial<PriceAlert>): Promise<PriceAlert | undefined> {
    const existing = this.priceAlerts.get(id);
    if (!existing) return undefined;
    const updated: PriceAlert = { ...existing, ...updates };
    this.priceAlerts.set(id, updated);
    return updated;
  }

  async deletePriceAlert(id: string): Promise<void> {
    this.priceAlerts.delete(id);
  }

  async getActivePriceAlerts(): Promise<(PriceAlert & { crypto: Cryptocurrency })[]> {
    const alerts = Array.from(this.priceAlerts.values()).filter(alert => alert.isActive && !alert.isTriggered);
    return alerts.map(alert => {
      const crypto = this.cryptocurrencies.get(alert.cryptoId);
      return { ...alert, crypto: crypto! };
    }).filter(alert => alert.crypto);
  }

  async addPriceHistory(priceData: InsertPriceHistory): Promise<PriceHistory> {
    const id = randomUUID();
    const history: PriceHistory = {
      ...priceData,
      id,
      timestamp: new Date()
    };
    this.priceHistory.set(id, history);
    return history;
  }

  async getPriceHistory(cryptoId: string, hours: number): Promise<PriceHistory[]> {
    const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
    return Array.from(this.priceHistory.values())
      .filter(history => history.cryptoId === cryptoId && history.timestamp! >= cutoffTime)
      .sort((a, b) => (a.timestamp!.getTime() - b.timestamp!.getTime()));
  }

  async getMutualFunds(limit = 100): Promise<MutualFund[]> {
    return Array.from(this.mutualFunds.values())
      .sort((a, b) => {
        const aumA = parseFloat(a.aum || '0');
        const aumB = parseFloat(b.aum || '0');
        return aumB - aumA;
      })
      .slice(0, limit);
  }

  async getMutualFund(id: string): Promise<MutualFund | undefined> {
    return this.mutualFunds.get(id);
  }

  async upsertMutualFund(fund: InsertMutualFund): Promise<MutualFund> {
    const existing = this.mutualFunds.get(fund.id);
    const updated: MutualFund = {
      ...existing,
      ...fund,
      nav: fund.nav || null,
      change_1d: fund.change_1d || null,
      change_1w: fund.change_1w || null,
      change_1m: fund.change_1m || null,
      change_1y: fund.change_1y || null,
      aum: fund.aum || null,
      manager: fund.manager || null,
      risk_level: fund.risk_level || null,
      image: fund.image || null,
      last_updated: new Date()
    };
    this.mutualFunds.set(fund.id, updated);
    return updated;
  }

  async searchMutualFunds(query: string): Promise<MutualFund[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.mutualFunds.values()).filter(fund =>
      fund.name.toLowerCase().includes(lowerQuery) ||
      fund.symbol.toLowerCase().includes(lowerQuery)
    );
  }

  async addFundHistory(historyData: InsertMutualFundHistory): Promise<MutualFundHistory> {
    const id = randomUUID();
    const history: MutualFundHistory = {
      ...historyData,
      id,
    };
    this.fundHistory.set(id, history);
    return history;
  }

  async addFundHistoryBatch(historyData: InsertMutualFundHistory[]): Promise<MutualFundHistory[]> {
    const results: MutualFundHistory[] = [];
    for (const data of historyData) {
      const id = randomUUID();
      const history: MutualFundHistory = {
        ...data,
        id,
      };
      this.fundHistory.set(id, history);
      results.push(history);
    }
    return results;
  }

  async getFundHistory(fundId: string, days: number): Promise<MutualFundHistory[]> {
    const cutoffTime = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
    return Array.from(this.fundHistory.values())
      .filter(history => history.fundId === fundId && history.date! >= cutoffTime)
      .sort((a, b) => (a.date!.getTime() - b.date!.getTime()));
  }

  async getFundWatchlist(userId: string): Promise<(FundWatchlist & { fund: MutualFund })[]> {
    const items = Array.from(this.fundWatchlists.values()).filter(item => item.userId === userId);
    return items.map(item => {
      const fund = this.mutualFunds.get(item.fundId);
      return { ...item, fund: fund! };
    }).filter(item => item.fund);
  }

  async addToFundWatchlist(watchlistItem: InsertFundWatchlist): Promise<FundWatchlist> {
    const id = randomUUID();
    const item: FundWatchlist = {
      ...watchlistItem,
      id,
      createdAt: new Date()
    };
    this.fundWatchlists.set(id, item);
    return item;
  }

  async removeFromFundWatchlist(userId: string, fundId: string): Promise<void> {
    const item = Array.from(this.fundWatchlists.entries()).find(([_, watchlist]) =>
      watchlist.userId === userId && watchlist.fundId === fundId
    );
    if (item) {
      this.fundWatchlists.delete(item[0]);
    }
  }

  async getStocks(limit = 100): Promise<Stock[]> {
    return Array.from(this.stocks.values())
      .sort((a, b) => {
        const aumA = parseFloat(a.market_cap || '0');
        const aumB = parseFloat(b.market_cap || '0');
        return aumB - aumA;
      })
      .slice(0, limit);
  }

  async getStock(id: string): Promise<Stock | undefined> {
    return this.stocks.get(id);
  }

  async upsertStock(stock: InsertStock): Promise<Stock> {
    const existing = this.stocks.get(stock.id);
    const updated: Stock = {
      ...existing,
      ...stock,
      id: stock.id,
      symbol: stock.symbol,
      name: stock.name,
      exchange: stock.exchange,
      sector: stock.sector,
      industry: stock.industry || null,
      image: stock.image || null,
      current_price: stock.current_price || null,
      change_1d: stock.change_1d || null,
      change_1w: stock.change_1w || null,
      change_1m: stock.change_1m || null,
      change_1y: stock.change_1y || null,
      market_cap: stock.market_cap || null,
      volume: stock.volume || null,
      high_24h: stock.high_24h || null,
      low_24h: stock.low_24h || null,
      pe_ratio: stock.pe_ratio || null,
      eps: stock.eps || null,
      dividend_yield: stock.dividend_yield || null,
      last_updated: new Date()
    };
    this.stocks.set(stock.id, updated);
    return updated;
  }

  async searchStocks(query: string): Promise<Stock[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.stocks.values()).filter(stock =>
      stock.name.toLowerCase().includes(lowerQuery) ||
      stock.symbol.toLowerCase().includes(lowerQuery)
    );
  }

  async addStockHistory(historyData: InsertStockHistory): Promise<StockHistory> {
    const id = randomUUID();
    const history: StockHistory = {
      id,
      stockId: historyData.stockId,
      price: historyData.price,
      timestamp: new Date(),
      volume: historyData.volume || null,
    };
    this.stockHistory.set(id, history);
    return history;
  }

  async addStockHistoryBatch(historyData: InsertStockHistory[]): Promise<StockHistory[]> {
    const results: StockHistory[] = [];
    for (const data of historyData) {
      const id = randomUUID();
      const history: StockHistory = {
        id,
        stockId: data.stockId,
        price: data.price,
        timestamp: new Date(),
        volume: data.volume || null,
      };
      this.stockHistory.set(id, history);
      results.push(history);
    }
    return results;
  }

  async getStockHistory(stockId: string, hours: number): Promise<StockHistory[]> {
    const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
    return Array.from(this.stockHistory.values())
      .filter(history => history.stockId === stockId && history.timestamp! >= cutoffTime)
      .sort((a, b) => (a.timestamp!.getTime() - b.timestamp!.getTime()));
  }

  async getStockWatchlist(userId: string): Promise<(StockWatchlist & { stock: Stock })[]> {
    const items = Array.from(this.stockWatchlists.values()).filter(item => item.userId === userId);
    return items.map(item => {
      const stock = this.stocks.get(item.stockId);
      return { ...item, stock: stock! };
    }).filter(item => item.stock);
  }

  async addToStockWatchlist(watchlistItem: InsertStockWatchlist): Promise<StockWatchlist> {
    const id = randomUUID();
    const item: StockWatchlist = {
      ...watchlistItem,
      id,
      createdAt: new Date()
    };
    this.stockWatchlists.set(id, item);
    return item;
  }

  async removeFromStockWatchlist(userId: string, stockId: string): Promise<void> {
    const item = Array.from(this.stockWatchlists.entries()).find(([_, watchlist]) =>
      watchlist.userId === userId && watchlist.stockId === stockId
    );
    if (item) {
      this.stockWatchlists.delete(item[0]);
    }
  }

  async getGold(id: string): Promise<Gold | undefined> {
    return this.gold.get(id);
  }

  async upsertGold(goldItem: InsertGold): Promise<Gold> {
    const existing = this.gold.get(goldItem.id);
    const updated: Gold = {
      ...existing,
      ...goldItem,
      current_price: goldItem.current_price || null,
      change_1d: goldItem.change_1d || null,
      change_1w: goldItem.change_1w || null,
      change_1m: goldItem.change_1m || null,
      change_1y: goldItem.change_1y || null,
      image: goldItem.image || null,
      last_updated: new Date()
    };
    this.gold.set(goldItem.id, updated);
    return updated;
  }

  async searchGold(query: string): Promise<Gold[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.gold.values()).filter(goldItem =>
      goldItem.name.toLowerCase().includes(lowerQuery) ||
      goldItem.symbol.toLowerCase().includes(lowerQuery)
    );
  }

  async getAllGold(limit = 100): Promise<Gold[]> {
    return Array.from(this.gold.values())
      .sort((a, b) => a.symbol.localeCompare(b.symbol))
      .slice(0, limit);
  }

  async addGoldHistory(historyData: InsertGoldHistory): Promise<GoldHistory> {
    const id = randomUUID();
    const history: GoldHistory = {
      ...historyData,
      id,
      timestamp: new Date()
    };
    this.goldHistory.set(id, history);
    return history;
  }

  async addGoldHistoryBatch(historyData: InsertGoldHistory[]): Promise<GoldHistory[]> {
    const results: GoldHistory[] = [];
    for (const data of historyData) {
      const id = randomUUID();
      const history: GoldHistory = {
        ...data,
        id,
        timestamp: new Date()
      };
      this.goldHistory.set(id, history);
      results.push(history);
    }
    return results;
  }

  async getGoldHistory(goldId: string, hours: number): Promise<GoldHistory[]> {
    const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
    return Array.from(this.goldHistory.values())
      .filter(history => history.goldId === goldId && history.timestamp! >= cutoffTime)
      .sort((a, b) => (a.timestamp!.getTime() - b.timestamp!.getTime()));
  }

  async getGoldWatchlist(userId: string): Promise<(GoldWatchlist & { gold: Gold })[]> {
    const items = Array.from(this.goldWatchlists.values()).filter(item => item.userId === userId);
    return items.map(item => {
      const goldItem = this.gold.get(item.goldId);
      return { ...item, gold: goldItem! };
    }).filter(item => item.gold);
  }

  async addToGoldWatchlist(watchlistItem: InsertGoldWatchlist): Promise<GoldWatchlist> {
    const id = randomUUID();
    const item: GoldWatchlist = {
      ...watchlistItem,
      id,
      createdAt: new Date()
    };
    this.goldWatchlists.set(id, item);
    return item;
  }

  async removeFromGoldWatchlist(userId: string, goldId: string): Promise<void> {
    const item = Array.from(this.goldWatchlists.entries()).find(([_, watchlist]) =>
      watchlist.userId === userId && watchlist.goldId === goldId
    );
    if (item) {
      this.goldWatchlists.delete(item[0]);
    }
  }

  async getPortfolios(userId: string): Promise<Portfolio[]> {
    return Array.from(this.portfolios.values())
      .filter(item => item.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async addPortfolioItem(item: InsertPortfolio): Promise<Portfolio> {
    const id = randomUUID();
    const portfolioItem: Portfolio = {
      ...item,
      id,
      buyPrice: item.buyPrice || null,
      createdAt: new Date()
    };
    this.portfolios.set(id, portfolioItem);
    return portfolioItem;
  }

  async getCurrencyRate(from: string, to: string): Promise<CurrencyRate | undefined> {
    const key = `${from}_${to}`;
    return this.currencyRates.get(key);
  }

  async getAllCurrencyRates(): Promise<CurrencyRate[]> {
    return Array.from(this.currencyRates.values())
      .sort((a, b) => a.fromCurrency.localeCompare(b.fromCurrency));
  }

  async upsertCurrencyRate(rate: InsertCurrencyRate): Promise<CurrencyRate> {
    const id = `${rate.fromCurrency}_${rate.toCurrency}`;
    const updated: CurrencyRate = {
      ...rate,
      id,
      lastUpdated: new Date()
    };
    this.currencyRates.set(id, updated);
    return updated;
  }

  async clearHistory(): Promise<void> {
    this.priceHistory.clear();
    this.fundHistory.clear();
    this.stockHistory.clear();
    this.goldHistory.clear();
  }
}
