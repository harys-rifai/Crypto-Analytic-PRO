import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Star, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MutualFund } from "@shared/schema";
import {
  useFundWatchlist,
  useAddToFundWatchlist,
  useRemoveFromFundWatchlist,
} from "@/hooks/useCryptoData";
import { useCurrency } from "@/hooks/useCurrency";
import CreateFundAlertDialog from "./CreateFundAlertDialog";

interface FundOverviewProps {
  funds: MutualFund[];
}

export default function FundOverview({ funds: initialFunds }: FundOverviewProps) {
  const [displayedFunds, setDisplayedFunds] = useState<MutualFund[]>(
    initialFunds.slice(0, 4),
  );
  const [startIndex, setStartIndex] = useState(0);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [selectedFund, setSelectedFund] = useState<MutualFund | null>(null);
  const { data: watchlist } = useFundWatchlist();
  const { currency, convert, formatCurrency } = useCurrency();
  const addToWatchlist = useAddToFundWatchlist();
  const removeFromWatchlist = useRemoveFromFundWatchlist();

  const toggleWatchlist = (e: React.MouseEvent, fundId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const isInWatchlist = watchlist?.some((item) => item.fundId === fundId);
    if (isInWatchlist) {
      removeFromWatchlist.mutate(fundId);
    } else {
      addToWatchlist.mutate({ fundId });
    }
  };

  useEffect(() => {
    setDisplayedFunds(initialFunds.slice(startIndex, startIndex + 4));

    if (initialFunds.length <= 4) {
      return;
    }

    const interval = setInterval(() => {
      setStartIndex((prevIndex) => {
        const nextIndex = (prevIndex + 4) % initialFunds.length;
        const nextFunds = [];
        for (let i = 0; i < 4; i++) {
          nextFunds.push(
            initialFunds[(nextIndex + i) % initialFunds.length],
          );
        }
        setDisplayedFunds(nextFunds);
        return nextIndex;
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [initialFunds, startIndex]);

  const formatPercentage = (percentage: string | null) => {
    if (!percentage) return "0.00%";
    return `${parseFloat(percentage).toFixed(2)}%`;
  };

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      data-testid="fund-overview"
    >
      {displayedFunds.map((fund) => {
        const nav = parseFloat(fund.nav || "0");
        const change1d = parseFloat(fund.change_1d || "0");
        const isPositive = change1d >= 0;
        const convertedNav = convert(nav, "IDR", currency as any);

        return (
          <Card
            key={fund.id}
            className="ripple-effect"
            data-testid={`fund-card-${fund.id}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
                    {fund.symbol || "?"}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{fund.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {fund.symbol}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-yellow-500"
                    onClick={(e) => toggleWatchlist(e, fund.id)}
                    data-testid={`button-fund-watchlist-${fund.id}`}
                  >
                    <Star
                      className={`h-4 w-4 ${watchlist?.some((item) => item.fundId === fund.id) ? "fill-yellow-500 text-yellow-500" : ""}`}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-blue-500"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedFund(fund);
                      setAlertDialogOpen(true);
                    }}
                    data-testid={`button-fund-alert-${fund.id}`}
                  >
                    <Bell className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold" data-testid={`fund-nav-${fund.id}`}>
                  {formatCurrency(convertedNav, currency as any)}
                </p>
                <div
                  className={`flex items-center space-x-1 text-sm ${isPositive ? "text-green-500" : "text-red-500"}`}
                >
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span data-testid={`fund-change-${fund.id}`}>
                    {formatPercentage(fund.change_1d)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      {selectedFund && (
        <CreateFundAlertDialog
          open={alertDialogOpen}
          onOpenChange={setAlertDialogOpen}
          fund={selectedFund}
        />
      )}
    </div>
  );
}
