import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, X, TrendingUp, TrendingDown } from "lucide-react";
import { usePriceAlerts, useDeletePriceAlert } from "@/hooks/useCryptoData";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import CreateAlertDialog from "./CreateAlertDialog";
import type { Cryptocurrency } from "@shared/schema";

export default function PriceAlerts() {
  const { data: alerts, isLoading } = usePriceAlerts();
  const deleteMutation = useDeletePriceAlert();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [dummyCrypto] = useState<Cryptocurrency>({
    id: "bitcoin",
    symbol: "btc",
    name: "Bitcoin",
    image: "",
    current_price: "0",
    market_cap: null,
    market_cap_rank: null,
    fully_diluted_valuation: null,
    total_volume: null,
    high_24h: null,
    low_24h: null,
    price_change_24h: null,
    price_change_percentage_24h: null,
    price_change_percentage_7d: null,
    market_cap_change_24h: null,
    market_cap_change_percentage_24h: null,
    circulating_supply: null,
    total_supply: null,
    max_supply: null,
    ath: null,
    ath_change_percentage: null,
    ath_date: null,
    atl: null,
    atl_change_percentage: null,
    atl_date: null,
    last_updated: null,
  });

  const handleDeleteAlert = (alertId: string) => {
    deleteMutation.mutate(alertId, {
      onSuccess: () => {
        toast({
          title: "Alert deleted",
          description: "Price alert has been removed successfully"
        });
      }
    });
  };

  const getAlertVariant = (isTriggered: boolean) => {
    if (isTriggered) return "destructive";
    return "secondary";
  };

  const getAlertStatus = (isTriggered: boolean) => {
    return isTriggered ? "Triggered" : "Active";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Price Alerts</h3>
            <Plus className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3 border rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="w-20 h-4 mb-1" />
                    <Skeleton className="w-24 h-3" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Skeleton className="w-16 h-5" />
                    <Skeleton className="w-4 h-4" />
                  </div>
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
          <h3 className="text-lg font-semibold" data-testid="text-alerts-title">Price Alerts</h3>
          <Button
            variant="ghost"
            size="icon"
            data-testid="button-add-alert"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4 text-primary" />
          </Button>
        </div>

        <div className="space-y-3">
          {(!alerts || alerts.length === 0) ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No price alerts set</p>
              <p className="text-sm">Create alerts to get notified of price changes</p>
            </div>
          ) : (
            alerts.map((alert) => {
              const alertType = alert.alertType;
              const targetValue = parseFloat(alert.targetValue);
              const crypto = alert.crypto;
              const currentPrice = parseFloat(crypto.current_price || "0");
              const change24h = parseFloat(crypto.price_change_percentage_24h || "0");
              const marketCap = crypto.market_cap ? parseFloat(crypto.market_cap) : 0;
              const volume = crypto.total_volume ? parseFloat(crypto.total_volume) : 0;

              let alertDescription = '';
              switch (alertType) {
                case 'price_above':
                  alertDescription = `Price above $${targetValue.toLocaleString()}`;
                  break;
                case 'price_below':
                  alertDescription = `Price below $${targetValue.toLocaleString()}`;
                  break;
                case 'percentage_change':
                  alertDescription = `24h change > ${targetValue}%`;
                  break;
                default:
                  alertDescription = `Alert at ${targetValue}`;
              }

              return (
                <div
                  key={alert.id}
                  className={`p-3 rounded border ${alert.isTriggered
                    ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                    : 'bg-secondary border-border'
                    }`}
                  data-testid={`alert-item-${alert.id}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {crypto.image && (
                          <img src={crypto.image} alt={crypto.name} className="w-6 h-6 rounded-full" />
                        )}
                        <div>
                          <div className="font-medium text-sm" data-testid={`alert-title-${alert.id}`}>
                            {crypto.symbol.toUpperCase()} Alert
                          </div>
                          <div className="text-xs text-muted-foreground" data-testid={`alert-description-${alert.id}`}>
                            {alertDescription}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={getAlertVariant(alert.isTriggered || false)}
                          data-testid={`alert-status-${alert.id}`}
                        >
                          {getAlertStatus(alert.isTriggered || false)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-4 h-4 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteAlert(alert.id)}
                          data-testid={`button-delete-alert-${alert.id}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Enhanced data display */}
                    <div className="grid grid-cols-2 gap-2 text-xs border-t pt-2">
                      <div>
                        <div className="text-muted-foreground">Current Price</div>
                        <div className="font-semibold">${currentPrice.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">24h Change</div>
                        <div className={`font-semibold flex items-center gap-1 ${change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {change24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {change24h.toFixed(2)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Market Cap</div>
                        <div className="font-semibold">${(marketCap / 1e9).toFixed(2)}B</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Volume</div>
                        <div className="font-semibold">${(volume / 1e6).toFixed(2)}M</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <Button
          variant="outline"
          className="w-full mt-4 border-dashed text-muted-foreground"
          data-testid="button-create-alert"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Alert
        </Button>

        <CreateAlertDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          crypto={dummyCrypto}
        />
      </CardContent>
    </Card>
  );
}
