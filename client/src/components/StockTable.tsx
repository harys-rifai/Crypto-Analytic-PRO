import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpDown, ArrowUp, ArrowDown, Filter, Download, Star, Bell } from "lucide-react";
import { AssetImage } from "@/components/ui/asset-image";
import type { Stock } from "@shared/schema";
import {
  useStockWatchlist,
  useAddToStockWatchlist,
  useRemoveFromStockWatchlist,
} from "@/hooks/useCryptoData";
import { useCurrency } from "@/hooks/useCurrency";
import { useToast } from "@/hooks/use-toast";
import { formatLargeValue } from "@/lib/currencyFormat";

interface StockTableProps {
  stocks: Stock[];
  isLoading: boolean;
  searchFilter?: string | null;
}

type SortField = keyof Stock;

export default function StockTable({ stocks, isLoading, searchFilter }: StockTableProps) {
  const [sortBy, setSortBy] = useState<SortField>("market_cap");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: watchlist } = useStockWatchlist();
  const { currency, convert, formatCurrency } = useCurrency();
  const addToWatchlist = useAddToStockWatchlist();
  const removeFromWatchlist = useRemoveFromStockWatchlist();
  const { toast } = useToast();

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("desc");
    }
  };

  const filteredData = searchFilter
    ? stocks.filter((stock) => stock.id === searchFilter)
    : stocks;

  const sortedData = [...filteredData].sort((a, b) => {
    const aVal = a[sortBy] || "";
    const bVal = b[sortBy] || "";

    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortDirection === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    const aNum = parseFloat(aVal as string) || 0;
    const bNum = parseFloat(bVal as string) || 0;

    return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
  });

  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleWatchlistToggle = async (stockId: string, stockName: string) => {
    const isWatched = watchlist?.some((item) => item.stockId === stockId);

    try {
      if (isWatched) {
        await removeFromWatchlist.mutateAsync(stockId);
        toast({
          title: "Removed from watchlist",
          description: `${stockName} has been removed from your watchlist`,
        });
      } else {
        await addToWatchlist.mutateAsync({ stockId });
        toast({
          title: "Added to watchlist",
          description: `${stockName} has been added to your watchlist`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update watchlist. Please try again.",
        variant: "destructive",
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
          <h3 className="text-xl font-semibold" data-testid="text-stock-table-title">
            Stocks
          </h3>
          <div className="flex items-center space-x-2">
            <Button variant="secondary" size="sm" data-testid="button-filter-stocks">
              <Filter className="h-4 w-4 mr-1" />
              Filter
            </Button>
            <Button variant="secondary" size="sm" data-testid="button-export-stocks">
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("name")}
                  data-testid="button-sort-name-stocks"
                >
                  Name
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Symbol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("current_price")}
                  data-testid="button-sort-price-stocks"
                >
                  Price
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">1D</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">1W</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">1M</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">1Y</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("market_cap")}
                  data-testid="button-sort-marketcap-stocks"
                >
                  Market Cap
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Volume</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">P/E</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Div Yield</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedData.map((stock) => {
              const price = parseFloat(stock.current_price || "0");
              const change1d = parseFloat(stock.change_1d || "0");
              const change1w = parseFloat(stock.change_1w || "0");
              const change1m = parseFloat(stock.change_1m || "0");
              const change1y = parseFloat(stock.change_1y || "0");
              const marketCap = parseFloat(stock.market_cap || "0");
              const volume = parseFloat(stock.volume || "0");
              const pe = parseFloat(stock.pe_ratio || "0");
              const divYield = parseFloat(stock.dividend_yield || "0");
              const isPositive1d = change1d >= 0;
              const isWatched = watchlist?.some((item) => item.stockId === stock.id);

              const convertedPrice = convert(price, "IDR", currency as any);

              return (
                <tr
                  key={stock.id}
                  className="hover:bg-muted/50 transition-colors"
                  data-testid={`row-stock-${stock.id}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <AssetImage src={stock.image} alt={stock.name} symbol={stock.symbol} type="stock" className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <div className="font-medium" data-testid={`text-stock-name-${stock.id}`}>
                          {stock.name}
                        </div>
                        <div className="text-sm text-muted-foreground" data-testid={`text-stock-sector-${stock.id}`}>
                          {stock.sector}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground" data-testid={`text-stock-symbol-${stock.id}`}>
                    {stock.symbol}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold" data-testid={`text-stock-price-${stock.id}`}>
                      {formatCurrency(convertedPrice, currency as any)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center space-x-1 rounded px-2 py-1 ${isPositive1d ? "pulse-green" : "pulse-red"}`}>
                      {isPositive1d ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      <span className={`font-medium ${isPositive1d ? "profit" : "loss"}`} data-testid={`text-stock-change-1d-${stock.id}`}>
                        {isPositive1d ? "+" : ""}{change1d.toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center space-x-1 ${change1w >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {change1w >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      <span data-testid={`text-stock-change-1w-${stock.id}`}>{change1w.toFixed(2)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center space-x-1 ${change1m >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {change1m >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      <span data-testid={`text-stock-change-1m-${stock.id}`}>{change1m.toFixed(2)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center space-x-1 ${change1y >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {change1y >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      <span data-testid={`text-stock-change-1y-${stock.id}`}>{change1y.toFixed(2)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" data-testid={`text-stock-marketcap-${stock.id}`}>
                    {formatLargeValue(marketCap, undefined, currency as any)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" data-testid={`text-stock-volume-${stock.id}`}>
                    {formatLargeValue(volume)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" data-testid={`text-stock-pe-${stock.id}`}>
                    {pe.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" data-testid={`text-stock-divyield-${stock.id}`}>
                    {divYield.toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleWatchlistToggle(stock.id, stock.name)}
                        data-testid={`button-stock-watchlist-table-${stock.id}`}
                        className={isWatched ? "text-yellow-500 hover:text-yellow-600" : "text-muted-foreground hover:text-yellow-500"}
                      >
                        <Star className={`h-4 w-4 ${isWatched ? "fill-current" : ""}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid={`button-stock-alert-table-${stock.id}`}
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
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} stocks
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              data-testid="button-prev-page-stocks"
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
                  data-testid={`button-page-stocks-${page}`}
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
                    data-testid={`button-page-stocks-${totalPages}`}
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
              data-testid="button-next-page-stocks"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
