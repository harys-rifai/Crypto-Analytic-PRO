import { useState, useMemo } from "react";
import { Search, Moon, Sun, Bell, TrendingUp, Star, User, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTheme } from "@/hooks/useTheme";
import { useCryptoSearch, useCryptoData, useAddToWatchlist, useFundSearch, useAddToFundWatchlist } from "@/hooks/useCryptoData";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/hooks/useAuth";
import CreateAlertDialog from "./CreateAlertDialog";
import CreateFundAlertDialog from "./CreateFundAlertDialog";
import type { Cryptocurrency, MutualFund } from "@shared/schema";

interface HeaderProps {
  onSearchSelect?: (cryptoId: string) => void;
  activeTab?: "crypto" | "reksadana";
}

export default function Header({ onSearchSelect, activeTab = "crypto" }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [fundAlertDialogOpen, setFundAlertDialogOpen] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState<Cryptocurrency | null>(null);
  const [selectedFund, setSelectedFund] = useState<MutualFund | null>(null);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { data: cryptoResults } = useCryptoSearch(debouncedSearch, debouncedSearch.length > 2 && activeTab === "crypto");
  const { data: fundResults } = useFundSearch(debouncedSearch, debouncedSearch.length > 2 && activeTab === "reksadana");
  const { data: allCryptos } = useCryptoData(100);
  const addToWatchlist = useAddToWatchlist();
  const addToFundWatchlist = useAddToFundWatchlist();

  const topGainers = useMemo(() => {
    if (!allCryptos) return [];
    return [...allCryptos]
      .sort((a, b) => {
        const aChange = parseFloat(a.price_change_percentage_24h || "0");
        const bChange = parseFloat(b.price_change_percentage_24h || "0");
        return bChange - aChange;
      })
      .slice(0, 3);
  }, [allCryptos]);

  const hasSearchResults =
    (activeTab === "crypto" && cryptoResults && cryptoResults.length > 0) ||
    (activeTab === "reksadana" && fundResults && fundResults.length > 0);

  return (
    <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="text-2xl drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]">📈</div>
              <h1 className="text-2xl font-bold text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]" data-testid="text-app-title">InvestAnalytic</h1>
              <Badge variant="default" className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.3)]">PRO</Badge>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Input
                type="text"
                placeholder={activeTab === "crypto" ? "Search cryptocurrencies..." : "Search reksa dana..."}
                className="w-64 pl-10"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                data-testid="input-search-crypto"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />

              {showSearchResults && hasSearchResults && (
                <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-lg shadow-lg mt-1 z-50 max-h-60 overflow-y-auto">
                  {activeTab === "crypto" && cryptoResults &&
                    cryptoResults.slice(0, 5).map((crypto) => (
                      <div
                        key={crypto.id}
                        className="flex items-center space-x-3 p-3 hover:bg-muted"
                        data-testid={`result-crypto-${crypto.id}`}
                      >
                        <img src={crypto.image || ""} alt={crypto.name} className="w-6 h-6 rounded-full" />
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => {
                            if (onSearchSelect) {
                              onSearchSelect(crypto.id);
                            }
                            setSearchQuery("");
                            setShowSearchResults(false);
                          }}
                        >
                          <div className="font-medium">{crypto.name}</div>
                          <div className="text-sm text-muted-foreground">{crypto.symbol.toUpperCase()}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">${parseFloat(crypto.current_price || "0").toLocaleString()}</div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              addToWatchlist.mutate({ cryptoId: crypto.id });
                            }}
                          >
                            <Star className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              setSelectedCrypto(crypto);
                              setAlertDialogOpen(true);
                              setShowSearchResults(false);
                            }}
                          >
                            <Bell className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  {activeTab === "reksadana" && fundResults &&
                    fundResults.slice(0, 5).map((fund) => (
                      <div
                        key={fund.id}
                        className="flex items-center space-x-3 p-3 hover:bg-muted"
                        data-testid={`result-fund-${fund.id}`}
                      >
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
                          {fund.symbol || "?"}
                        </div>
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => {
                            if (onSearchSelect) {
                              onSearchSelect(fund.id);
                            }
                            setSearchQuery("");
                            setShowSearchResults(false);
                          }}
                        >
                          <div className="font-medium">{fund.name}</div>
                          <div className="text-sm text-muted-foreground">{fund.symbol}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">Rp{fund.nav}</div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              addToFundWatchlist.mutate({ fundId: fund.id });
                            }}
                          >
                            <Star className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              setSelectedFund(fund);
                              setFundAlertDialogOpen(true);
                              setShowSearchResults(false);
                            }}
                          >
                            <Bell className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              data-testid="button-toggle-theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {user && (
              <Popover open={showUserMenu} onOpenChange={setShowUserMenu}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2 px-2"
                    data-testid="button-user-menu"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium hidden sm:inline">{user.username}</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56" align="end">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3 p-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{user.username}</p>
                        <p className="text-xs text-muted-foreground">Administrator</p>
                      </div>
                    </div>
                    <div className="border-t border-border pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        data-testid="button-logout"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            <Popover open={showNotifications} onOpenChange={setShowNotifications}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  data-testid="button-show-alerts"
                >
                  <Bell className="h-4 w-4" />
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                    data-testid="badge-alert-count"
                  >
                    {topGainers.length}
                  </Badge>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Top Gainers (24H)
                  </h3>
                  <div className="space-y-2">
                    {topGainers.map((crypto) => {
                      const change = parseFloat(crypto.price_change_percentage_24h || "0");
                      return (
                        <div
                          key={crypto.id}
                          className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer"
                          onClick={() => {
                            if (onSearchSelect) {
                              onSearchSelect(crypto.id);
                            }
                            setShowNotifications(false);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <img src={crypto.image || ""} alt={crypto.name} className="w-6 h-6 rounded-full" />
                            <div>
                              <div className="font-medium text-sm">{crypto.symbol.toUpperCase()}</div>
                              <div className="text-xs text-muted-foreground">{crypto.name}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-sm">${parseFloat(crypto.current_price || "0").toLocaleString()}</div>
                            <div className={`text-xs ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
      {selectedCrypto && (
        <CreateAlertDialog
          open={alertDialogOpen}
          onOpenChange={setAlertDialogOpen}
          crypto={selectedCrypto}
        />
      )}
      {selectedFund && (
        <CreateFundAlertDialog
          open={fundAlertDialogOpen}
          onOpenChange={setFundAlertDialogOpen}
          fund={selectedFund}
        />
      )}
    </header>
  );
}
