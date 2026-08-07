import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Star, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Stock } from "@shared/schema";
import {
  useStockWatchlist,
  useAddToStockWatchlist,
  useRemoveFromStockWatchlist,
} from "@/hooks/useCryptoData";
import { useCurrency } from "@/hooks/useCurrency";
import CreateStockAlertDialog from "./CreateStockAlertDialog";

interface StockOverviewProps {
  stocks: Stock[];
}

export default function StockOverview({ stocks: initialStocks }: StockOverviewProps) {
  const [displayedStocks, setDisplayedStocks] = useState<Stock[]>(
    initialStocks.slice(0, 4),
  );
  const [startIndex, setStartIndex] = useState(0);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const { data: watchlist } = useStockWatchlist();
  const { currency, convert, formatCurrency } = useCurrency();
  const addToWatchlist = useAddToStockWatchlist();
  const removeFromWatchlist = useRemoveFromStockWatchlist();

  const toggleWatchlist = (e: React.MouseEvent, stockId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const isInWatchlist = watchlist?.some((item) => item.stockId === stockId);
    if (isInWatchlist) {
      removeFromWatchlist.mutate(stockId);
    } else {
      addToWatchlist.mutate({ stockId });
    }
  };

  useEffect(() => {
    setDisplayedStocks(initialStocks.slice(startIndex, startIndex + 4));

    if (initialStocks.length <= 4) {
      return;
    }

    const interval = setInterval(() => {
      setStartIndex((prevIndex) => {
        const nextIndex = (prevIndex + 4) % initialStocks.length;
        const nextStocks = [];
        for (let i = 0; i < 4; i++) {
          nextStocks.push(
            initialStocks[(nextIndex + i) % initialStocks.length],
          );
        }
        setDisplayedStocks(nextStocks);
        return nextIndex;
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [initialStocks, startIndex]);

  const formatPercentage = (percentage: string | null) => {
    if (!percentage) return "0.00%";
    return `${parseFloat(percentage).toFixed(2)}%`;
  };

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      data-testid="stock-overview"
    >
      {displayedStocks.map((stock) => {
        const price = parseFloat(stock.current_price || "0");
        const change1d = parseFloat(stock.change_1d || "0");
        const isPositive = change1d >= 0;
        const convertedPrice = convert(price, "IDR", currency as any);

        return (
          <Card
            key={stock.id}
            className="ripple-effect"
            data-testid={`stock-card-${stock.id}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                    {stock.symbol || "?"}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{stock.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {stock.symbol}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-yellow-500"
                    onClick={(e) => toggleWatchlist(e, stock.id)}
                    data-testid={`button-stock-watchlist-${stock.id}`}
                  >
                    <Star
                      className={`h-4 w-4 ${watchlist?.some((item) => item.stockId === stock.id) ? "fill-yellow-500 text-yellow-500" : ""}`}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-blue-500"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedStock(stock);
                      setAlertDialogOpen(true);
                    }}
                    data-testid={`button-stock-alert-${stock.id}`}
                  >
                    <Bell className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold" data-testid={`stock-price-${stock.id}`}>
                  {formatCurrency(convertedPrice, currency as any)}
                </p>
                <div
                  className={`flex items-center space-x-1 text-sm ${isPositive ? "text-green-500" : "text-red-500"}`}
                >
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span data-testid={`stock-change-${stock.id}`}>
                    {formatPercentage(stock.change_1d)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      {selectedStock && (
        <CreateStockAlertDialog
          open={alertDialogOpen}
          onOpenChange={setAlertDialogOpen}
          stock={selectedStock}
        />
      )}
    </div>
  );
}
