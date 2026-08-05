import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, X } from "lucide-react";
import { useWatchlist, useRemoveFromWatchlist } from "@/hooks/useCryptoData";
import { useToast } from "@/hooks/use-toast";

export default function Watchlist() {
  const { data: watchlist, isLoading } = useWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();
  const { toast } = useToast();

  const handleRemoveFromWatchlist = async (cryptoId: string, cryptoName: string) => {
    try {
      await removeFromWatchlist.mutateAsync(cryptoId);
      toast({
        title: "Removed from watchlist",
        description: `${cryptoName} has been removed from your watchlist`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove from watchlist. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">My Watchlist</h3>
            <Plus className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3">
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-6 h-6 rounded-full" />
                  <div>
                    <Skeleton className="w-12 h-4 mb-1" />
                    <Skeleton className="w-8 h-3" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="w-16 h-4 mb-1" />
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
          <h3 className="text-lg font-semibold" data-testid="text-watchlist-title">My Watchlist</h3>
          <Button variant="ghost" size="icon" data-testid="button-add-to-watchlist">
            <Plus className="h-4 w-4 text-primary" />
          </Button>
        </div>

        <div className="space-y-3">
          {(!watchlist || watchlist.length === 0) ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Your watchlist is empty</p>
              <p className="text-sm">Add cryptocurrencies to track their prices</p>
            </div>
          ) : (
            watchlist.map((item) => {
              const priceChange = parseFloat(item.crypto.price_change_percentage_24h || "0");
              const isPositive = priceChange >= 0;
              const price = parseFloat(item.crypto.current_price || "0");

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 hover:bg-muted/50 rounded transition-colors"
                  data-testid={`watchlist-item-${item.crypto.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full overflow-hidden">
                      {item.crypto.image ? (
                        <img src={item.crypto.image} alt={item.crypto.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {item.crypto.symbol.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm" data-testid={`watchlist-symbol-${item.crypto.id}`}>
                        {item.crypto.symbol.toUpperCase()}
                      </div>
                      <div className={`text-xs ${isPositive ? 'profit' : 'loss'}`} data-testid={`watchlist-change-${item.crypto.id}`}>
                        {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm" data-testid={`watchlist-price-${item.crypto.id}`}>
                      ${price > 1 ? price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : price.toFixed(6)}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-4 h-4 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveFromWatchlist(item.crypto.id, item.crypto.name)}
                      data-testid={`button-remove-watchlist-${item.crypto.id}`}
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
          data-testid="button-add-crypto-watchlist"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Cryptocurrency
        </Button>
      </CardContent>
    </Card>
  );
}
