import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, X } from "lucide-react";
import { useFundWatchlist, useRemoveFromFundWatchlist } from "@/hooks/useCryptoData";
import { useCurrency } from "@/hooks/useCurrency";
import { useToast } from "@/hooks/use-toast";

export default function FundWatchlist() {
  const { data: watchlist, isLoading } = useFundWatchlist();
  const removeFromWatchlist = useRemoveFromFundWatchlist();
  const { toast } = useToast();
  const { currency, convert, formatCurrency } = useCurrency();

  const handleRemoveFromWatchlist = async (fundId: string, fundName: string) => {
    try {
      await removeFromWatchlist.mutateAsync(fundId);
      toast({
        title: "Removed from watchlist",
        description: `${fundName} has been removed from your watchlist`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove from watchlist. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Fund Watchlist</h3>
            <Plus className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3">
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-6 h-6 rounded-full" />
                  <div>
                    <Skeleton className="w-16 h-4 mb-1" />
                    <Skeleton className="w-10 h-3" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="w-20 h-4 mb-1" />
                  <Skeleton className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" data-testid="text-fund-watchlist-title">
            Fund Watchlist
          </h3>
          <Button variant="ghost" size="icon" data-testid="button-add-fund-watchlist">
            <Plus className="h-4 w-4 text-primary" />
          </Button>
        </div>

        <div className="space-y-3">
          {!watchlist || watchlist.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Your fund watchlist is empty</p>
              <p className="text-sm">Add mutual funds to track their performance</p>
            </div>
          ) : (
            watchlist.map((item) => {
              const nav = parseFloat(item.fund.nav || "0");
              const change1d = parseFloat(item.fund.change_1d || "0");
              const isPositive = change1d >= 0;
              const convertedNav = convert(nav, "IDR", currency as any);

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 hover:bg-muted/50 rounded transition-colors"
                  data-testid={`fund-watchlist-item-${item.fund.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
                      {item.fund.symbol || "?"}
                    </div>
                    <div>
                      <div className="font-medium text-sm" data-testid={`fund-watchlist-symbol-${item.fund.id}`}>
                        {item.fund.symbol}
                      </div>
                      <div
                        className={`text-xs ${isPositive ? "profit" : "loss"}`}
                        data-testid={`fund-watchlist-change-${item.fund.id}`}
                      >
                        {isPositive ? "+" : ""}{change1d.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm" data-testid={`fund-watchlist-nav-${item.fund.id}`}>
                      {formatCurrency(convertedNav, currency as any)}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-4 h-4 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveFromWatchlist(item.fund.id, item.fund.name)}
                      data-testid={`button-remove-fund-watchlist-${item.fund.id}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <Button
          variant="outline"
          className="w-full mt-4 border-dashed text-muted-foreground"
          data-testid="button-add-fund-watchlist-bottom"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Reksa Dana
        </Button>
      </CardContent>
    </Card>
  );
}
