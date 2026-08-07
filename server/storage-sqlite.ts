import Database from "better-sqlite3";
import { randomUUID } from "crypto";
import { 
  type User, type InsertUser, type Cryptocurrency, type InsertCryptocurrency, type Watchlist, type InsertWatchlist, type PriceAlert, type InsertPriceAlert, type PriceHistory, type InsertPriceHistory, type MutualFund, type InsertMutualFund, type MutualFundHistory, type InsertMutualFundHistory, type FundWatchlist, type InsertFundWatchlist, type Portfolio, type InsertPortfolio, type CurrencyRate, type InsertCurrencyRate
} from "@shared/schema";

const db = new Database("localdb.sqlite");

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS cryptocurrencies (
    id TEXT PRIMARY KEY,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    image TEXT,
    current_price TEXT,
    market_cap TEXT,
    market_cap_rank TEXT,
    fully_diluted_valuation TEXT,
    total_volume TEXT,
    high_24h TEXT,
    low_24h TEXT,
    price_change_24h TEXT,
    price_change_percentage_24h TEXT,
    price_change_percentage_7d TEXT,
    market_cap_change_24h TEXT,
    market_cap_change_percentage_24h TEXT,
    circulating_supply TEXT,
    total_supply TEXT,
    max_supply TEXT,
    ath TEXT,
    ath_change_percentage TEXT,
    ath_date TEXT,
    atl TEXT,
    atl_change_percentage TEXT,
    atl_date TEXT,
    last_updated TEXT DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS watchlists (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    crypto_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS price_alerts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    crypto_id TEXT NOT NULL,
    alert_type TEXT NOT NULL,
    target_value TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    is_triggered INTEGER DEFAULT 0,
    triggered_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS price_history (
    id TEXT PRIMARY KEY,
    crypto_id TEXT NOT NULL,
    price TEXT NOT NULL,
    timestamp TEXT DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS mutual_funds (
    id TEXT PRIMARY KEY,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    manager TEXT,
    nav TEXT,
    change_1d TEXT,
    change_1w TEXT,
    change_1m TEXT,
    change_1y TEXT,
    aum TEXT,
    risk_level TEXT,
    last_updated TEXT DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS mutual_fund_history (
    id TEXT PRIMARY KEY,
    fund_id TEXT NOT NULL,
    date TEXT NOT NULL,
    nav TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS fund_watchlists (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    fund_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS portfolios (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    asset_type TEXT NOT NULL,
    asset_id TEXT NOT NULL,
    quantity TEXT NOT NULL,
    buy_price TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS currency_rates (
    id TEXT PRIMARY KEY,
    from_currency TEXT NOT NULL,
    to_currency TEXT NOT NULL,
    rate TEXT NOT NULL,
    last_updated TEXT DEFAULT (datetime('now'))
  )
`);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getCryptocurrencies(limit?: number): Promise<Cryptocurrency[]>;
  getCryptocurrency(id: string): Promise<Cryptocurrency | undefined>;
  upsertCryptocurrency(crypto: InsertCryptocurrency): Promise<Cryptocurrency>;
  searchCryptocurrencies(query: string): Promise<Cryptocurrency[]>;

  getWatchlist(userId: string): Promise<(Watchlist & { crypto: Cryptocurrency })[]>;
  addToWatchlist(watchlistItem: InsertWatchlist): Promise<Watchlist>;
  removeFromWatchlist(userId: string, cryptoId: string): Promise<void>;

  getPriceAlerts(userId: string): Promise<(PriceAlert & { crypto: Cryptocurrency })[]>;
  createPriceAlert(alert: InsertPriceAlert): Promise<PriceAlert>;
  updatePriceAlert(id: string, updates: Partial<PriceAlert>): Promise<PriceAlert | undefined>;
  deletePriceAlert(id: string): Promise<void>;
  getActivePriceAlerts(): Promise<(PriceAlert & { crypto: Cryptocurrency })[]>;

  addPriceHistory(priceData: InsertPriceHistory): Promise<PriceHistory>;
  getPriceHistory(cryptoId: string, hours: number): Promise<PriceHistory[]>;

  getMutualFunds(limit?: number): Promise<MutualFund[]>;
  getMutualFund(id: string): Promise<MutualFund | undefined>;
  upsertMutualFund(fund: InsertMutualFund): Promise<MutualFund>;
  searchMutualFunds(query: string): Promise<MutualFund[]>;

  addFundHistory(historyData: InsertMutualFundHistory): Promise<MutualFundHistory>;
  getFundHistory(fundId: string, days: number): Promise<MutualFundHistory[]>;

  getFundWatchlist(userId: string): Promise<(FundWatchlist & { fund: MutualFund })[]>;
  addToFundWatchlist(watchlistItem: InsertFundWatchlist): Promise<FundWatchlist>;
  removeFromFundWatchlist(userId: string, fundId: string): Promise<void>;

  getPortfolios(userId: string): Promise<Portfolio[]>;
  addPortfolioItem(item: InsertPortfolio): Promise<Portfolio>;

  getCurrencyRate(from: string, to: string): Promise<CurrencyRate | undefined>;
  getAllCurrencyRates(): Promise<CurrencyRate[]>;
  upsertCurrencyRate(rate: InsertCurrencyRate): Promise<CurrencyRate>;
}

export class SqliteStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined;
    return row;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const row = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as User | undefined;
    return row;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    db.prepare("INSERT INTO users (id, username, password) VALUES (?, ?, ?)").run(id, insertUser.username, insertUser.password);
    const user = await this.getUser(id);
    return user!;
  }

  async getCryptocurrencies(limit = 100): Promise<Cryptocurrency[]> {
    const rows = db.prepare("SELECT * FROM cryptocurrencies ORDER BY CAST(market_cap_rank AS INTEGER) ASC LIMIT ?").all(limit) as Cryptocurrency[];
    return rows;
  }

  async getCryptocurrency(id: string): Promise<Cryptocurrency | undefined> {
    const row = db.prepare("SELECT * FROM cryptocurrencies WHERE id = ?").get(id) as Cryptocurrency | undefined;
    return row;
  }

  async upsertCryptocurrency(crypto: InsertCryptocurrency): Promise<Cryptocurrency> {
    const values: any = {
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
      last_updated: new Date().toISOString(),
    };

    db.prepare(`
      INSERT INTO cryptocurrencies (id, symbol, name, image, current_price, market_cap, market_cap_rank, fully_diluted_valuation, total_volume, high_24h, low_24h, price_change_24h, price_change_percentage_24h, price_change_percentage_7d, market_cap_change_24h, market_cap_change_percentage_24h, circulating_supply, total_supply, max_supply, ath, ath_change_percentage, ath_date, atl, atl_change_percentage, atl_date, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        symbol = excluded.symbol,
        name = excluded.name,
        image = excluded.image,
        current_price = excluded.current_price,
        market_cap = excluded.market_cap,
        market_cap_rank = excluded.market_cap_rank,
        fully_diluted_valuation = excluded.fully_diluted_valuation,
        total_volume = excluded.total_volume,
        high_24h = excluded.high_24h,
        low_24h = excluded.low_24h,
        price_change_24h = excluded.price_change_24h,
        price_change_percentage_24h = excluded.price_change_percentage_24h,
        price_change_percentage_7d = excluded.price_change_percentage_7d,
        market_cap_change_24h = excluded.market_cap_change_24h,
        market_cap_change_percentage_24h = excluded.market_cap_change_percentage_24h,
        circulating_supply = excluded.circulating_supply,
        total_supply = excluded.total_supply,
        max_supply = excluded.max_supply,
        ath = excluded.ath,
        ath_change_percentage = excluded.ath_change_percentage,
        ath_date = excluded.ath_date,
        atl = excluded.atl,
        atl_change_percentage = excluded.atl_change_percentage,
        atl_date = excluded.atl_date,
        last_updated = excluded.last_updated
    `).run(
      values.id, values.symbol, values.name, values.image, values.current_price, values.market_cap, values.market_cap_rank,
      values.fully_diluted_valuation, values.total_volume, values.high_24h, values.low_24h, values.price_change_24h,
      values.price_change_percentage_24h, values.price_change_percentage_7d, values.market_cap_change_24h,
      values.market_cap_change_percentage_24h, values.circulating_supply, values.total_supply, values.max_supply,
      values.ath, values.ath_change_percentage, values.ath_date, values.atl, values.atl_change_percentage, values.atl_date,
      values.last_updated
    );

    const cryptoData = await this.getCryptocurrency(crypto.id);
    return cryptoData as Cryptocurrency;
  }

  async searchCryptocurrencies(query: string): Promise<Cryptocurrency[]> {
    const lowerQuery = query.toLowerCase();
    const rows = db.prepare("SELECT * FROM cryptocurrencies WHERE lower(name) LIKE ? OR lower(symbol) LIKE ?").all(`%${lowerQuery}%`, `%${lowerQuery}%`) as Cryptocurrency[];
    return rows;
  }

  async getWatchlist(userId: string): Promise<(Watchlist & { crypto: Cryptocurrency })[]> {
    const items = db.prepare("SELECT * FROM watchlists WHERE user_id = ?").all(userId) as Watchlist[];
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
    db.prepare("INSERT INTO watchlists (id, user_id, crypto_id) VALUES (?, ?, ?)").run(id, watchlistItem.userId, watchlistItem.cryptoId);
    const row = db.prepare("SELECT * FROM watchlists WHERE id = ?").get(id) as Watchlist;
    return row;
  }

  async removeFromWatchlist(userId: string, cryptoId: string): Promise<void> {
    db.prepare("DELETE FROM watchlists WHERE user_id = ? AND crypto_id = ?").run(userId, cryptoId);
  }

  async getPriceAlerts(userId: string): Promise<(PriceAlert & { crypto: Cryptocurrency })[]> {
    const alerts = db.prepare("SELECT * FROM price_alerts WHERE user_id = ?").all(userId) as PriceAlert[];
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
    db.prepare("INSERT INTO price_alerts (id, user_id, crypto_id, alert_type, target_value, is_active, is_triggered) VALUES (?, ?, ?, ?, ?, ?, ?)").run(id, alert.userId, alert.cryptoId, alert.alertType, alert.targetValue, 1, 0);
    const row = db.prepare("SELECT * FROM price_alerts WHERE id = ?").get(id) as PriceAlert;
    return row;
  }

  async updatePriceAlert(id: string, updates: Partial<PriceAlert>): Promise<PriceAlert | undefined> {
    const sets: string[] = [];
    const values: any[] = [];
    for (const [key, value] of Object.entries(updates)) {
      if (key === "id") continue;
      const dbKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      sets.push(`${dbKey} = ?`);
      values.push(value);
    }
    if (sets.length === 0) return undefined;
    values.push(id);
    db.prepare(`UPDATE price_alerts SET ${sets.join(", ")} WHERE id = ?`).run(...values);
    return this.getPriceAlerts("").then(alerts => alerts.find(a => a.id === id));
  }

  async deletePriceAlert(id: string): Promise<void> {
    db.prepare("DELETE FROM price_alerts WHERE id = ?").run(id);
  }

  async getActivePriceAlerts(): Promise<(PriceAlert & { crypto: Cryptocurrency })[]> {
    const alerts = db.prepare("SELECT * FROM price_alerts WHERE is_active = 1 AND is_triggered = 0").all() as PriceAlert[];
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
    db.prepare("INSERT INTO price_history (id, crypto_id, price) VALUES (?, ?, ?)").run(id, priceData.cryptoId, priceData.price);
    const row = db.prepare("SELECT * FROM price_history WHERE id = ?").get(id) as PriceHistory;
    return row;
  }

  async getPriceHistory(cryptoId: string, hours: number): Promise<PriceHistory[]> {
    const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000)).toISOString();
    const rows = db.prepare("SELECT * FROM price_history WHERE crypto_id = ? AND timestamp >= ? ORDER BY timestamp ASC").all(cryptoId, cutoffTime) as PriceHistory[];
    return rows;
  }

  async getMutualFunds(limit = 100): Promise<MutualFund[]> {
    const rows = db.prepare("SELECT * FROM mutual_funds ORDER BY CAST(COALESCE(aum, '0') AS REAL) DESC LIMIT ?").all(limit) as MutualFund[];
    return rows;
  }

  async getMutualFund(id: string): Promise<MutualFund | undefined> {
    const row = db.prepare("SELECT * FROM mutual_funds WHERE id = ?").get(id) as MutualFund | undefined;
    return row;
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
      last_updated: new Date().toISOString(),
    };

    db.prepare(`
      INSERT INTO mutual_funds (id, symbol, name, category, manager, nav, change_1d, change_1w, change_1m, change_1y, aum, risk_level, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        symbol = excluded.symbol,
        name = excluded.name,
        category = excluded.category,
        manager = excluded.manager,
        nav = excluded.nav,
        change_1d = excluded.change_1d,
        change_1w = excluded.change_1w,
        change_1m = excluded.change_1m,
        change_1y = excluded.change_1y,
        aum = excluded.aum,
        risk_level = excluded.risk_level,
        last_updated = excluded.last_updated
    `).run(
      values.id, values.symbol, values.name, values.category, values.manager, values.nav, values.change_1d,
      values.change_1w, values.change_1m, values.change_1y, values.aum, values.risk_level, values.last_updated
    );

    const fundData = await this.getMutualFund(fund.id);
    return fundData as MutualFund;
  }

  async searchMutualFunds(query: string): Promise<MutualFund[]> {
    const lowerQuery = query.toLowerCase();
    const rows = db.prepare("SELECT * FROM mutual_funds WHERE lower(name) LIKE ? OR lower(symbol) LIKE ?").all(`%${lowerQuery}%`, `%${lowerQuery}%`) as MutualFund[];
    return rows;
  }

  async addFundHistory(historyData: InsertMutualFundHistory): Promise<MutualFundHistory> {
    const id = randomUUID();
    db.prepare("INSERT INTO mutual_fund_history (id, fund_id, date, nav) VALUES (?, ?, ?, ?)").run(id, historyData.fundId, historyData.date, historyData.nav);
    const row = db.prepare("SELECT * FROM mutual_fund_history WHERE id = ?").get(id) as MutualFundHistory;
    return row;
  }

  async getFundHistory(fundId: string, days: number): Promise<MutualFundHistory[]> {
    const cutoffTime = new Date(Date.now() - (days * 24 * 60 * 60 * 1000)).toISOString();
    const rows = db.prepare("SELECT * FROM mutual_fund_history WHERE fund_id = ? AND date >= ? ORDER BY date ASC").all(fundId, cutoffTime) as MutualFundHistory[];
    return rows;
  }

  async getFundWatchlist(userId: string): Promise<(FundWatchlist & { fund: MutualFund })[]> {
    const items = db.prepare("SELECT * FROM fund_watchlists WHERE user_id = ?").all(userId) as FundWatchlist[];
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
    db.prepare("INSERT INTO fund_watchlists (id, user_id, fund_id) VALUES (?, ?, ?)").run(id, watchlistItem.userId, watchlistItem.fundId);
    const row = db.prepare("SELECT * FROM fund_watchlists WHERE id = ?").get(id) as FundWatchlist;
    return row;
  }

  async removeFromFundWatchlist(userId: string, fundId: string): Promise<void> {
    db.prepare("DELETE FROM fund_watchlists WHERE user_id = ? AND fund_id = ?").run(userId, fundId);
  }

  async getPortfolios(userId: string): Promise<Portfolio[]> {
    const rows = db.prepare("SELECT * FROM portfolios WHERE user_id = ? ORDER BY datetime(created_at) DESC").all(userId) as Portfolio[];
    return rows;
  }

  async addPortfolioItem(item: InsertPortfolio): Promise<Portfolio> {
    const id = randomUUID();
    db.prepare("INSERT INTO portfolios (id, user_id, asset_type, asset_id, quantity, buy_price) VALUES (?, ?, ?, ?, ?, ?)").run(id, item.userId, item.assetType, item.assetId, item.quantity, item.buyPrice || null);
    const row = db.prepare("SELECT * FROM portfolios WHERE id = ?").get(id) as Portfolio;
    return row;
  }

  async getCurrencyRate(from: string, to: string): Promise<CurrencyRate | undefined> {
    const row = db.prepare("SELECT * FROM currency_rates WHERE from_currency = ? AND to_currency = ?").get(from, to) as CurrencyRate | undefined;
    return row;
  }

  async getAllCurrencyRates(): Promise<CurrencyRate[]> {
    const rows = db.prepare("SELECT * FROM currency_rates ORDER BY from_currency ASC").all() as CurrencyRate[];
    return rows;
  }

  async upsertCurrencyRate(rate: InsertCurrencyRate): Promise<CurrencyRate> {
    db.prepare(`
      INSERT INTO currency_rates (id, from_currency, to_currency, rate)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        from_currency = excluded.from_currency,
        to_currency = excluded.to_currency,
        rate = excluded.rate,
        last_updated = datetime('now')
    `).run(rate.id || `${rate.fromCurrency}_${rate.toCurrency}`, rate.fromCurrency, rate.toCurrency, rate.rate);
    const row = db.prepare("SELECT * FROM currency_rates WHERE id = ?").get(rate.id || `${rate.fromCurrency}_${rate.toCurrency}`) as CurrencyRate;
    return row;
  }
}

export const sqliteStorage = new SqliteStorage();
