// MarketOverview component for displaying crypto trends
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Star, Bell } from "lucide-react";
import { AssetImage } from "@/components/ui/asset-image";
import { Button } from "@/components/ui/button";
import type { Cryptocurrency } from "@shared/schema";
import { useWatchlist, useAddToWatchlist, useRemoveFromWatchlist } from "@/hooks/useCryptoData";
import { useCurrency } from "@/hooks/useCurrency";
import { IDR_COINS } from "@/lib/currencyFormat";
import CreateAlertDialog from "./CreateAlertDialog";

interface MarketOverviewProps {
    cryptocurrencies: Cryptocurrency[];
}

export default function MarketOverview({ cryptocurrencies: initialCryptos }: MarketOverviewProps) {
    const [displayedCoins, setDisplayedCoins] = useState<Cryptocurrency[]>(initialCryptos.slice(0, 4));
    const [startIndex, setStartIndex] = useState(0);
    const [alertDialogOpen, setAlertDialogOpen] = useState(false);
    const [selectedCrypto, setSelectedCrypto] = useState<Cryptocurrency | null>(null);
    const { data: watchlist } = useWatchlist();
    const addToWatchlist = useAddToWatchlist();
    const removeFromWatchlist = useRemoveFromWatchlist();
    const { currency, convert, formatCurrency } = useCurrency();

    const toggleWatchlist = (e: React.MouseEvent, cryptoId: string) => {
        e.preventDefault();
        e.stopPropagation();

        const isInWatchlist = watchlist?.some(item => item.cryptoId === cryptoId);
        if (isInWatchlist) {
            removeFromWatchlist.mutate(cryptoId);
        } else {
            addToWatchlist.mutate({ cryptoId });
        }
    };

    // Rotate through different coins every 30 seconds
    useEffect(() => {
        // Immediate update when data arrives or changes
        setDisplayedCoins(initialCryptos.slice(startIndex, startIndex + 4));

        if (initialCryptos.length <= 4) {
            return;
        }

        const interval = setInterval(() => {
            setStartIndex((prevIndex) => {
                const nextIndex = (prevIndex + 4) % initialCryptos.length;
                const nextCoins = [];
                for (let i = 0; i < 4; i++) {
                    nextCoins.push(initialCryptos[(nextIndex + i) % initialCryptos.length]);
                }
                setDisplayedCoins(nextCoins);
                return nextIndex;
            });
        }, 30000); // Change every 30 seconds

        return () => clearInterval(interval);
    }, [initialCryptos]);

    const formatPercentage = (percentage: string | null) => {
        if (!percentage) return "0.00%";
        return `${parseFloat(percentage).toFixed(2)}%`;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" data-testid="market-overview">
            {displayedCoins.map((crypto) => {
                const priceChange = parseFloat(crypto.price_change_percentage_24h || "0");
                const isPositive = priceChange >= 0;

                return (
                    <Card key={crypto.id} className="ripple-effect" data-testid={`market-card-${crypto.id}`}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <AssetImage src={crypto.image} alt={crypto.name} symbol={crypto.symbol} type="crypto" className="w-8 h-8 rounded-full" />
                                    <div>
                                        <h4 className="font-semibold text-sm">{crypto.name}</h4>
                                        <p className="text-xs text-muted-foreground">{crypto.symbol.toUpperCase()}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-yellow-500"
                                        onClick={(e) => toggleWatchlist(e, crypto.id)}
                                    >
                                        <Star
                                            className={`h-4 w-4 ${watchlist?.some(item => item.cryptoId === crypto.id) ? "fill-yellow-500 text-yellow-500" : ""}`}
                                        />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-blue-500"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setSelectedCrypto(crypto);
                                            setAlertDialogOpen(true);
                                        }}
                                    >
                                        <Bell className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                             <div className="space-y-1">
                                <p className="text-2xl font-bold">{formatCurrency(convert(parseFloat(crypto.current_price || "0"), IDR_COINS.has(crypto.id) ? "IDR" : "USD", currency as any), currency as any)}</p>
                                <div className={`flex items-center space-x-1 text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                    {isPositive ? (
                                        <TrendingUp className="h-4 w-4" />
                                    ) : (
                                        <TrendingDown className="h-4 w-4" />
                                    )}
                                    <span>{formatPercentage(crypto.price_change_percentage_24h)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
            {selectedCrypto && (
                <CreateAlertDialog
                    open={alertDialogOpen}
                    onOpenChange={setAlertDialogOpen}
                    crypto={selectedCrypto}
                />
            )}
        </div>
    );
}
