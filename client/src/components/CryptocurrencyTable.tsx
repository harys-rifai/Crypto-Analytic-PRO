import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpDown, ArrowUp, ArrowDown, Filter, Download, Star, Bell } from "lucide-react";
import { AssetImage } from "@/components/ui/asset-image";
import type { Cryptocurrency } from "@shared/schema";
import { useWatchlist, useAddToWatchlist, useRemoveFromWatchlist } from "@/hooks/useCryptoData";
import { useCurrency } from "@/hooks/useCurrency";
import { useToast } from "@/hooks/use-toast";
import { IDR_COINS } from "@/lib/currencyFormat";

interface CryptocurrencyTableProps {
  cryptocurrencies: Cryptocurrency[];
  isLoading: boolean;
  searchFilter?: string | null;
}

export default function CryptocurrencyTable({ cryptocurrencies, isLoading, searchFilter }: CryptocurrencyTableProps) {
  const [sortBy, setSortBy] = useState<keyof Cryptocurrency>('market_cap_rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: watchlist } = useWatchlist();
  const { currency, convert, formatCurrency } = useCurrency();
  const addToWatchlist = useAddToWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();
  const { toast } = useToast();

  const handleSort = (field: keyof Cryptocurrency) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  // Filter data if search filter is applied
  const filteredData = searchFilter
    ? cryptocurrencies.filter(crypto => crypto.id === searchFilter)
    : cryptocurrencies;

  const sortedData = [...filteredData].sort((a, b) => {
    const aVal = a[sortBy] || '';
    const bVal = b[sortBy] || '';

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    const aNum = parseFloat(aVal as string) || 0;
    const bNum = parseFloat(bVal as string) || 0;

    return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
  });

  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleWatchlistToggle = async (cryptoId: string, cryptoName: string) => {
    const isWatched = watchlist?.some(item => item.cryptoId === cryptoId);

    try {
      if (isWatched) {
        await removeFromWatchlist.mutateAsync(cryptoId);
        toast({
          title: "Removed from watchlist",
          description: `${cryptoName} has been removed from your watchlist`
        });
      } else {
        await addToWatchlist.mutateAsync({ cryptoId });
        toast({
          title: "Added to watchlist",
          description: `${cryptoName} has been added to your watchlist`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update watchlist. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold" data-testid="text-crypto-table-title">Cryptocurrency Prices</h3>
          <div className="flex items-center space-x-2">
            <Button variant="secondary" size="sm" data-testid="button-filter">
              <Filter className="h-4 w-4 mr-1" />
              Filter
            </Button>
            <Button variant="secondary" size="sm" data-testid="button-export">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <Button variant="ghost" size="sm" onClick={() => handleSort('market_cap_rank')} data-testid="button-sort-rank">
                  #
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <Button variant="ghost" size="sm" onClick={() => handleSort('name')} data-testid="button-sort-name">
                  Name
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <Button variant="ghost" size="sm" onClick={() => handleSort('current_price')} data-testid="button-sort-price">
                  Price
                  {sortBy === 'current_price' && (
                    sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                  )}
                </Button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">24h</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">7d</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Market Cap</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Volume</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedData.map((crypto) => {
               const priceChange24h = parseFloat(crypto.price_change_percentage_24h || "0");
               const priceChange7d = parseFloat(crypto.price_change_percentage_7d || "0");
               const isPositive24h = priceChange24h >= 0;
               const isPositive7d = priceChange7d >= 0;
               const price = parseFloat(crypto.current_price || "0");
               const marketCap = parseFloat(crypto.market_cap || "0");
               const volume = parseFloat(crypto.total_volume || "0");
               const isWatched = watchlist?.some(item => item.cryptoId === crypto.id);

               const sourceCurrency = IDR_COINS.has(crypto.id) ? "IDR" : "USD" as any;
               const convertedPrice = convert(price, sourceCurrency, currency as any);
               const convertedMarketCap = convert(marketCap, sourceCurrency, currency as any);
               const convertedVolume = convert(volume, sourceCurrency, currency as any);

              return (
                <tr key={crypto.id} className="hover:bg-muted/50 transition-colors" data-testid={`row-crypto-${crypto.id}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground" data-testid={`text-rank-${crypto.id}`}>
                    {crypto.market_cap_rank}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden">
                        <AssetImage src={crypto.image} alt={crypto.name} symbol={crypto.symbol} type="crypto" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-medium" data-testid={`text-name-${crypto.id}`}>{crypto.name}</div>
                        <div className="text-sm text-muted-foreground" data-testid={`text-symbol-${crypto.id}`}>
                          {crypto.symbol.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold" data-testid={`text-price-${crypto.id}`}>
                      {formatCurrency(convertedPrice, currency as any)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center space-x-1 rounded px-2 py-1 ${isPositive24h ? 'pulse-green' : 'pulse-red'}`}>
                      {isPositive24h ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      <span className={`font-medium ${isPositive24h ? 'profit' : 'loss'}`} data-testid={`text-change-24h-${crypto.id}`}>
                        {isPositive24h ? '+' : ''}{priceChange24h.toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      {isPositive7d ? <ArrowUp className="h-3 w-3 text-green-600" /> : <ArrowDown className="h-3 w-3 text-red-600" />}
                      <span className={isPositive7d ? 'profit' : 'loss'} data-testid={`text-change-7d-${crypto.id}`}>
                        {isPositive7d ? '+' : ''}{priceChange7d.toFixed(2)}%
                      </span>
                    </div>
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm" data-testid={`text-market-cap-${crypto.id}`}>
                    {formatCurrency(convertedMarketCap, currency as any)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" data-testid={`text-volume-${crypto.id}`}>
                    {formatCurrency(convertedVolume, currency as any)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleWatchlistToggle(crypto.id, crypto.name)}
                        data-testid={`button-watchlist-${crypto.id}`}
                        className={isWatched ? "text-yellow-500 hover:text-yellow-600" : "text-muted-foreground hover:text-yellow-500"}
                      >
                        <Star className={`h-4 w-4 ${isWatched ? 'fill-current' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid={`button-alert-${crypto.id}`}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Bell className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} cryptocurrencies
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              data-testid="button-prev-page"
            >
              Previous
            </Button>
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "secondary"}
                  size="sm"
                  className="w-8 h-8"
                  onClick={() => setCurrentPage(page)}
                  data-testid={`button-page-${page}`}
                >
                  {page}
                </Button>
              ))}
              {totalPages > 5 && (
                <>
                  <span className="w-8 h-8 flex items-center justify-center text-sm">...</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-8 h-8"
                    onClick={() => setCurrentPage(totalPages)}
                    data-testid={`button-page-${totalPages}`}
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </div>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              data-testid="button-next-page"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
