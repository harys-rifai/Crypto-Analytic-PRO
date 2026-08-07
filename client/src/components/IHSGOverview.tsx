import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { Stock } from "@shared/schema";
import { useCurrency } from "@/hooks/useCurrency";
import { useWebSocketContext } from "@/hooks/useWebSocket";

interface IHSGOverviewProps {
  ihsg: Stock | undefined;
}

export default function IHSGOverview({ ihsg }: IHSGOverviewProps) {
  const { currency, convert, formatCurrency } = useCurrency();
  const { lastTick } = useWebSocketContext();

  const tick = lastTick?.["ihsg"];
  const displayData = tick || ihsg;

  if (!displayData) {
    return null;
  }

  const price = parseFloat(displayData.current_price || "0");
  const change1d = parseFloat(displayData.change_1d || "0");
  const isPositive = change1d >= 0;
  const convertedPrice = convert(price, "IDR", currency as any);
  const formattedPrice =
    currency === "IDR"
      ? `Rp${convertedPrice.toLocaleString("id-ID")}`
      : `${currency}${convertedPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Card className="mb-6 bg-gradient-to-br from-blue-950/20 via-indigo-950/20 to-purple-950/20 border border-blue-500/30">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img
              src={displayData.image || ""}
              alt={displayData.name}
              className="w-12 h-12 rounded-lg object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {displayData.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {displayData.symbol} • {displayData.exchange}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p
              className="text-3xl font-bold"
              data-testid="ihsg-price"
            >
              {formattedPrice}
            </p>
            <div
              className={`flex items-center justify-end space-x-1 text-sm ${
                isPositive ? "text-green-500" : "text-red-500"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span data-testid="ihsg-change">
                {change1d >= 0 ? "+" : ""}
                {change1d.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
