const COINGECKO_API_BASE = "https://api.coingecko.com/api/v3";

export interface CoinGeckoMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  roi: any;
  last_updated: string;
}

export interface CoinGeckoGlobal {
  data: {
    active_cryptocurrencies: number;
    upcoming_icos: number;
    ongoing_icos: number;
    ended_icos: number;
    markets: number;
    total_market_cap: Record<string, number>;
    total_volume: Record<string, number>;
    market_cap_percentage: Record<string, number>;
    market_cap_change_percentage_24h_usd: number;
    updated_at: number;
  };
}

export async function fetchCryptocurrencies(
  vs_currency = 'usd',
  order = 'market_cap_desc',
  per_page = 100,
  page = 1,
  sparkline = false,
  price_change_percentage = '24h,7d'
): Promise<CoinGeckoMarket[]> {
  const url = new URL(`${COINGECKO_API_BASE}/coins/markets`);
  url.searchParams.append('vs_currency', vs_currency);
  url.searchParams.append('order', order);
  url.searchParams.append('per_page', per_page.toString());
  url.searchParams.append('page', page.toString());
  url.searchParams.append('sparkline', sparkline.toString());
  url.searchParams.append('price_change_percentage', price_change_percentage);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.statusText}`);
  }
  
  return response.json();
}

export async function fetchGlobalData(): Promise<CoinGeckoGlobal> {
  const response = await fetch(`${COINGECKO_API_BASE}/global`);
  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.statusText}`);
  }
  
  return response.json();
}

export async function searchCryptocurrencies(query: string): Promise<any[]> {
  const response = await fetch(`${COINGECKO_API_BASE}/search?query=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.coins || [];
}
