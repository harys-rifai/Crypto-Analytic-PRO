import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Cryptocurrency, Watchlist, PriceAlert, PriceHistory } from "@shared/schema";

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
    staleTime: 60000, // Price history is fresh for 1 minute
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
