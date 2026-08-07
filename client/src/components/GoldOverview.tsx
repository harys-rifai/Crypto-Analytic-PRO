import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Star, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Gold } from "@shared/schema";
import {
  useGoldWatchlist,
  useAddToGoldWatchlist,
  useRemoveFromGoldWatchlist,
} from "@/hooks/useCryptoData";
import { useCurrency } from "@/hooks/useCurrency";
import CreateGoldAlertDialog from "./CreateGoldAlertDialog";

interface GoldOverviewProps {
  gold: Gold[];
}

export default function GoldOverview({ gold: initialGold }: GoldOverviewProps) {
  const [displayedGold, setDisplayedGold] = useState<Gold[]>(
    initialGold.slice(0, 4),
  );
  const [startIndex, setStartIndex] = useState(0);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [selectedGold, setSelectedGold] = useState<Gold | null>(null);
  const { data: watchlist } = useGoldWatchlist();
  const { currency, convert, formatCurrency } = useCurrency();
  const addToWatchlist = useAddToGoldWatchlist();
  const removeFromWatchlist = useRemoveFromGoldWatchlist();

  const toggleWatchlist = (e: React.MouseEvent, goldId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const isInWatchlist = watchlist?.some((item) => item.goldId === goldId);
    if (isInWatchlist) {
      removeFromWatchlist.mutate(goldId);
    } else {
      addToWatchlist.mutate({ goldId });
    }
  };

  useEffect(() => {
    setDisplayedGold(initialGold.slice(startIndex, startIndex + 4));

    if (initialGold.length <= 4) {
      return;
    }

    const interval = setInterval(() => {
      setStartIndex((prevIndex) => {
        const nextIndex = (prevIndex + 4) % initialGold.length;
        const nextGold = [];
        for (let i = 0; i < 4; i++) {
          nextGold.push(
            initialGold[(nextIndex + i) % initialGold.length],
          );
        }
        setDisplayedGold(nextGold);
        return nextIndex;
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [initialGold, startIndex]);

  const formatPercentage = (percentage: string | null) => {
    if (!percentage) return "0.00%";
    return `${parseFloat(percentage).toFixed(2)}%`;
  };

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      data-testid="gold-overview"
    >
      {displayedGold.map((goldItem) => {
        const price = parseFloat(goldItem.current_price || "0");
        const change1d = parseFloat(goldItem.change_1d || "0");
        const isPositive = change1d >= 0;
        const convertedPrice = convert(price, "IDR", currency as any);

        return (
          <Card
            key={goldItem.id}
            className="ripple-effect"
            data-testid={`gold-card-${goldItem.id}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {goldItem.image ? (
                    <img src={goldItem.image} alt={goldItem.name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
                      {goldItem.symbol || "?"}
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-sm">{goldItem.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {goldItem.symbol}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-yellow-500"
                    onClick={(e) => toggleWatchlist(e, goldItem.id)}
                    data-testid={`button-gold-watchlist-${goldItem.id}`}
                  >
                    <Star
                      className={`h-4 w-4 ${watchlist?.some((item) => item.goldId === goldItem.id) ? "fill-yellow-500 text-yellow-500" : ""}`}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-blue-500"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedGold(goldItem);
                      setAlertDialogOpen(true);
                    }}
                    data-testid={`button-gold-alert-${goldItem.id}`}
                  >
                    <Bell className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold" data-testid={`gold-price-${goldItem.id}`}>
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
                  <span data-testid={`gold-change-${goldItem.id}`}>
                    {formatPercentage(goldItem.change_1d)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      {selectedGold && (
        <CreateGoldAlertDialog
          open={alertDialogOpen}
          onOpenChange={setAlertDialogOpen}
          gold={selectedGold}
        />
      )}
    </div>
  );
}
