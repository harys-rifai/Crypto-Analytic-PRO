import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";
import type { GoldWatchlist } from "@shared/schema";
import {
  useGoldWatchlist,
  useRemoveFromGoldWatchlist,
} from "@/hooks/useCryptoData";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/currencyFormat";

export default function GoldWatchlist() {
  const { data: watchlist, isLoading } = useGoldWatchlist();
  const removeFromWatchlist = useRemoveFromGoldWatchlist();
  const { toast } = useToast();

  const handleRemove = async (goldId: string, goldName: string) => {
    try {
      await removeFromWatchlist.mutateAsync(goldId);
      toast({
        title: "Removed from watchlist",
        description: `${goldName} has been removed from your watchlist`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove from watchlist",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!watchlist || watchlist.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground py-8">
            <Star className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p className="font-medium">Your gold watchlist is empty</p>
            <p className="text-sm mt-1">Add gold to track their prices</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Gold Watchlist</h3>
        <div className="space-y-3">
          {watchlist.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              data-testid={`gold-watchlist-item-${item.goldId}`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
                  {item.gold?.symbol || "?"}
                </div>
                <div>
                  <div className="font-medium text-sm">{item.gold?.name}</div>
                  <div className="text-xs text-muted-foreground">{item.gold?.symbol}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <div className="font-semibold text-sm">
                    {item.gold?.current_price ? formatPrice(item.gold.current_price, undefined, "IDR") : "-"}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(item.goldId, item.gold?.name || "Gold")}
                  data-testid={`button-remove-gold-watchlist-${item.goldId}`}
                  className="text-muted-foreground hover:text-red-500"
                >
                  <Star className="h-4 w-4 fill-current" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
