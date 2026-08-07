export interface IStorage {
  getUser(id: string): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;

  getCryptocurrencies(limit?: number): Promise<any[]>;
  getCryptocurrency(id: string): Promise<any | undefined>;
  upsertCryptocurrency(crypto: any): Promise<any>;
  searchCryptocurrencies(query: string): Promise<any[]>;

  getWatchlist(userId: string): Promise<any[]>;
  addToWatchlist(watchlistItem: any): Promise<any>;
  removeFromWatchlist(userId: string, cryptoId: string): Promise<void>;

  getPriceAlerts(userId: string): Promise<any[]>;
  createPriceAlert(alert: any): Promise<any>;
  updatePriceAlert(id: string, updates: any): Promise<any | undefined>;
  deletePriceAlert(id: string): Promise<void>;
  getActivePriceAlerts(): Promise<any[]>;

  addPriceHistory(priceData: any): Promise<any>;
  getPriceHistory(cryptoId: string, hours: number): Promise<any[]>;

  getMutualFunds(limit?: number): Promise<any[]>;
  getMutualFund(id: string): Promise<any | undefined>;
  upsertMutualFund(fund: any): Promise<any>;
  searchMutualFunds(query: string): Promise<any[]>;

  addFundHistory(historyData: any): Promise<any>;
  getFundHistory(fundId: string, days: number): Promise<any[]>;

  getFundWatchlist(userId: string): Promise<any[]>;
  addToFundWatchlist(watchlistItem: any): Promise<any>;
  removeFromFundWatchlist(userId: string, fundId: string): Promise<void>;

  getPortfolios(userId: string): Promise<any[]>;
  addPortfolioItem(item: any): Promise<any>;

  getCurrencyRate(from: string, to: string): Promise<any | undefined>;
  getAllCurrencyRates(): Promise<any[]>;
  upsertCurrencyRate(rate: any): Promise<any>;
}
