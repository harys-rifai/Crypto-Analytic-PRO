import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Cryptocurrency, Watchlist, PriceAlert, PriceHistory, MutualFund, MutualFundHistory, FundWatchlist, CurrencyRate, Portfolio, Stock, StockHistory, StockWatchlist, Gold, GoldHistory, GoldWatchlist } from "@shared/schema";

export function useCryptoData(limit?: number) {
  return useQuery<Cryptocurrency[]>({
    queryKey: ['/api/cryptocurrencies', limit],
    queryFn: async () => {
      const url = limit
        ? `/api/cryptocurrencies?limit=${limit}`
        : '/api/cryptocurrencies';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch cryptocurrencies');
      return res.json();
    },
    staleTime: 30000, // Data is fresh for 30 seconds
  });
}

export function useCryptoSearch(query: string, enabled: boolean = true) {
  return useQuery<Cryptocurrency[]>({
    queryKey: ['/api/cryptocurrencies/search', query],
    queryFn: async () => {
      const res = await fetch(`/api/cryptocurrencies/search?q=${encodeURIComponent(query)}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Search failed: ${res.statusText}`);
      }
      return await res.json();
    },
    enabled: enabled && query.length > 2,
    staleTime: 30000,
  });
}

export function usePriceHistory(cryptoId: string, hours: number = 24) {
  return useQuery<PriceHistory[]>({
    queryKey: [`/api/cryptocurrencies/${cryptoId}/history?hours=${hours}`],
    staleTime: 0,
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
  });
}

export function useMarketSummary() {
  return useQuery({
    queryKey: ['/api/market/summary'],
    staleTime: 300000, // Market summary is fresh for 5 minutes
  });
}

export function useWatchlist() {
  return useQuery<(Watchlist & { crypto: Cryptocurrency })[]>({
    queryKey: ['/api/watchlist'],
    staleTime: 60000,
  });
}

export function useAddToWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { cryptoId: string }) => {
      const response = await apiRequest('POST', '/api/watchlist', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/watchlist'] });
    },
  });
}

export function useRemoveFromWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cryptoId: string) => {
      const response = await apiRequest('DELETE', `/api/watchlist/${cryptoId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/watchlist'] });
    },
  });
}

export function usePriceAlerts() {
  return useQuery<(PriceAlert & { crypto: Cryptocurrency })[]>({
    queryKey: ['/api/alerts'],
    staleTime: 60000,
  });
}

export function useCreatePriceAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { cryptoId: string; alertType: string; targetValue: string }) => {
      const response = await apiRequest('POST', '/api/alerts', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
    },
  });
}

export function useDeletePriceAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const response = await apiRequest('DELETE', `/api/alerts/${alertId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
    },
  });
}

// ========================================
// Reksa Dana (Mutual Fund) Hooks
// ========================================

export function useMutualFunds(limit?: number) {
  return useQuery<MutualFund[]>({
    queryKey: ['/api/funds', limit],
    queryFn: async () => {
      const url = limit
        ? `/api/funds?limit=${limit}`
        : '/api/funds';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch mutual funds');
      return res.json();
    },
    staleTime: 300000,
  });
}

export function useFundSearch(query: string, enabled: boolean = true) {
  return useQuery<MutualFund[]>({
    queryKey: ['/api/funds/search', query],
    queryFn: async () => {
      const res = await fetch(`/api/funds/search?q=${encodeURIComponent(query)}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Search failed: ${res.statusText}`);
      }
      return await res.json();
    },
    enabled: enabled && query.length > 2,
    staleTime: 60000,
  });
}

export function useMutualFund(id: string) {
  return useQuery<MutualFund>({
    queryKey: [`/api/funds/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/funds/${id}`);
      if (!res.ok) throw new Error('Failed to fetch mutual fund');
      return res.json();
    },
    staleTime: 300000,
  });
}

export function useFundHistory(fundId: string, days: number = 30) {
  return useQuery<MutualFundHistory[]>({
    queryKey: [`/api/funds/${fundId}/history?days=${days}`],
    queryFn: async () => {
      const res = await fetch(`/api/funds/${fundId}/history?days=${days}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error('Failed to fetch fund history');
      return res.json();
    },
    staleTime: 0,
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
  });
}

export function useFundWatchlist() {
  return useQuery<(FundWatchlist & { fund: MutualFund })[]>({
    queryKey: ['/api/funds/watchlist'],
    queryFn: async () => {
      const res = await fetch('/api/funds/watchlist', {
        credentials: "include",
      });
      if (!res.ok) throw new Error('Failed to fetch fund watchlist');
      return res.json();
    },
    staleTime: 60000,
  });
}

export function useAddToFundWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { fundId: string }) => {
      const response = await apiRequest('POST', '/api/funds/watchlist', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/funds/watchlist'] });
    },
  });
}

export function useRemoveFromFundWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fundId: string) => {
      const response = await apiRequest('DELETE', `/api/funds/watchlist/${fundId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/funds/watchlist'] });
    },
  });
}

// ========================================
// Currency Rate Hooks
// ========================================

export function useCurrencyRates() {
  return useQuery<CurrencyRate[]>({
    queryKey: ['/api/currency-rates'],
    queryFn: async () => {
      const res = await fetch('/api/currency-rates');
      if (!res.ok) throw new Error('Failed to fetch currency rates');
      return res.json();
    },
    staleTime: 3600000,
  });
}

// ========================================
// Portfolio Hooks
// ========================================

export function usePortfolios() {
  return useQuery<Portfolio[]>({
    queryKey: ['/api/portfolio'],
    queryFn: async () => {
      const res = await fetch('/api/portfolio', {
        credentials: "include",
      });
      if (!res.ok) throw new Error('Failed to fetch portfolio');
      return res.json();
    },
    staleTime: 60000,
  });
}

export function useAddToPortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      assetType: string;
      assetId: string;
      quantity: string;
      buyPrice?: string;
    }) => {
      const response = await apiRequest('POST', '/api/portfolio', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio'] });
    },
  });
}

// ========================================
// Stock Hooks
// ========================================

export function useStocks(limit?: number) {
  return useQuery<Stock[]>({
    queryKey: ['/api/stocks', limit],
    queryFn: async () => {
      const url = limit ? `/api/stocks?limit=${limit}` : '/api/stocks';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch stocks');
      return res.json();
    },
    staleTime: 30000,
  });
}

export function useStockSearch(query: string, enabled: boolean = true) {
  return useQuery<Stock[]>({
    queryKey: ['/api/stocks/search', query],
    queryFn: async () => {
      const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Stock search failed: ${res.statusText}`);
      return res.json();
    },
    enabled: enabled && query.length > 2,
    staleTime: 30000,
  });
}

export function useStockHistory(stockId: string, hours: number = 24) {
  return useQuery<StockHistory[]>({
    queryKey: [`/api/stocks/${stockId}/history?hours=${hours}`],
    queryFn: async () => {
      const res = await fetch(`/api/stocks/${stockId}/history?hours=${hours}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error('Failed to fetch stock history');
      return res.json();
    },
    staleTime: 0,
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
  });
}

export function useStockWatchlist() {
  return useQuery<(StockWatchlist & { stock: Stock })[]>({
    queryKey: ['/api/stocks/watchlist'],
    queryFn: async () => {
      const res = await fetch('/api/stocks/watchlist', {
        credentials: "include",
      });
      if (!res.ok) throw new Error('Failed to fetch stock watchlist');
      return res.json();
    },
    staleTime: 60000,
  });
}

export function useAddToStockWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { stockId: string }) => {
      const response = await apiRequest('POST', '/api/stocks/watchlist', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stocks/watchlist'] });
    },
  });
}

export function useRemoveFromStockWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stockId: string) => {
      const response = await apiRequest('DELETE', `/api/stocks/watchlist/${stockId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stocks/watchlist'] });
    },
  });
}

// ========================================
// Gold Hooks
// ========================================

export function useGold(limit?: number) {
  return useQuery<Gold[]>({
    queryKey: ['/api/gold', limit],
    queryFn: async () => {
      const url = limit ? `/api/gold?limit=${limit}` : '/api/gold';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch gold');
      return res.json();
    },
    staleTime: 30000,
  });
}

export function useGoldSearch(query: string, enabled: boolean = true) {
  return useQuery<Gold[]>({
    queryKey: ['/api/gold/search', query],
    queryFn: async () => {
      const res = await fetch(`/api/gold/search?q=${encodeURIComponent(query)}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Gold search failed: ${res.statusText}`);
      return res.json();
    },
    enabled: enabled && query.length > 2,
    staleTime: 30000,
  });
}

export function useGoldHistory(goldId: string, hours: number = 24) {
  return useQuery<GoldHistory[]>({
    queryKey: [`/api/gold/${goldId}/history?hours=${hours}`],
    queryFn: async () => {
      const res = await fetch(`/api/gold/${goldId}/history?hours=${hours}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error('Failed to fetch gold history');
      return res.json();
    },
    staleTime: 0,
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
  });
}

export function useGoldWatchlist() {
  return useQuery<(GoldWatchlist & { gold: Gold })[]>({
    queryKey: ['/api/gold/watchlist'],
    queryFn: async () => {
      const res = await fetch('/api/gold/watchlist', {
        credentials: "include",
      });
      if (!res.ok) throw new Error('Failed to fetch gold watchlist');
      return res.json();
    },
    staleTime: 60000,
  });
}

export function useAddToGoldWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { goldId: string }) => {
      const response = await apiRequest('POST', '/api/gold/watchlist', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gold/watchlist'] });
    },
  });
}

export function useRemoveFromGoldWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goldId: string) => {
      const response = await apiRequest('DELETE', `/api/gold/watchlist/${goldId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gold/watchlist'] });
    },
  });
}
