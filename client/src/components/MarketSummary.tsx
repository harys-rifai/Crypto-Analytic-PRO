import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarketSummary } from "@/hooks/useCryptoData";

export default function MarketSummary() {
  const { data: marketData, isLoading } = useMarketSummary();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Market Summary</h3>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!marketData) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Market Summary</h3>
          <div className="text-center text-muted-foreground py-4">
            <p>Market data unavailable</p>
            <p className="text-sm">Unable to fetch global market statistics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    return `$${value.toLocaleString()}`;
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4" data-testid="text-market-summary-title">Market Summary</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Market Cap</span>
            <span className="font-semibold" data-testid="text-total-market-cap">
              {formatCurrency((marketData as any).total_market_cap?.usd || 0)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">24h Volume</span>
            <span className="font-semibold" data-testid="text-total-volume">
              {formatCurrency((marketData as any).total_volume?.usd || 0)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">BTC Dominance</span>
            <span className="font-semibold" data-testid="text-btc-dominance">
              {(marketData as any).market_cap_percentage?.btc?.toFixed(1) || '0'}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Active Cryptos</span>
            <span className="font-semibold" data-testid="text-active-cryptos">
              {(marketData as any).active_cryptocurrencies?.toLocaleString() || '0'}
            </span>
          </div>
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Fear & Greed Index</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold" data-testid="text-fear-greed-index">72</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800" data-testid="badge-fear-greed-status">
                  Greed
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
