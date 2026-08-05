import { type Cryptocurrency, type InsertCryptocurrency, type Watchlist, type InsertWatchlist, type PriceAlert, type InsertPriceAlert, type PriceHistory, type InsertPriceHistory, type User, type InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Cryptocurrency methods
  getCryptocurrencies(limit?: number): Promise<Cryptocurrency[]>;
  getCryptocurrency(id: string): Promise<Cryptocurrency | undefined>;
  upsertCryptocurrency(crypto: InsertCryptocurrency): Promise<Cryptocurrency>;
  searchCryptocurrencies(query: string): Promise<Cryptocurrency[]>;

  // Watchlist methods
  getWatchlist(userId: string): Promise<(Watchlist & { crypto: Cryptocurrency })[]>;
  addToWatchlist(watchlistItem: InsertWatchlist): Promise<Watchlist>;
  removeFromWatchlist(userId: string, cryptoId: string): Promise<void>;

  // Price alert methods
  getPriceAlerts(userId: string): Promise<(PriceAlert & { crypto: Cryptocurrency })[]>;
  createPriceAlert(alert: InsertPriceAlert): Promise<PriceAlert>;
  updatePriceAlert(id: string, updates: Partial<PriceAlert>): Promise<PriceAlert | undefined>;
  deletePriceAlert(id: string): Promise<void>;
  getActivePriceAlerts(): Promise<(PriceAlert & { crypto: Cryptocurrency })[]>;

  // Price history methods
  addPriceHistory(priceData: InsertPriceHistory): Promise<PriceHistory>;
  getPriceHistory(cryptoId: string, hours: number): Promise<PriceHistory[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private cryptocurrencies: Map<string, Cryptocurrency>;
  private watchlists: Map<string, Watchlist>;
  private priceAlerts: Map<string, PriceAlert>;
  private priceHistory: Map<string, PriceHistory>;

  constructor() {
    this.users = new Map();
    this.cryptocurrencies = new Map();
    this.watchlists = new Map();
    this.priceAlerts = new Map();
    this.priceHistory = new Map();
  }

  // User methods
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

  // Cryptocurrency methods
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

  // Watchlist methods
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

  // Price alert methods
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

  // Price history methods
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
}

export const storage = new MemStorage();
