import { useState, useMemo } from "react";
import { Search, Moon, Sun, Bell, TrendingUp, Star, User, LogOut, ChevronDown, Menu, X, BarChart3, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/hooks/useTheme";
import { useCryptoSearch, useCryptoData, useAddToWatchlist, useFundSearch, useAddToFundWatchlist, useStockSearch, useAddToStockWatchlist, useGoldSearch, useAddToGoldWatchlist } from "@/hooks/useCryptoData";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/hooks/useAuthContext";
import CreateAlertDialog from "./CreateAlertDialog";
import CreateFundAlertDialog from "./CreateFundAlertDialog";
import CreateStockAlertDialog from "./CreateStockAlertDialog";
import CreateGoldAlertDialog from "./CreateGoldAlertDialog";
import type { Cryptocurrency, MutualFund, Stock, Gold } from "@shared/schema";

interface HeaderProps {
  onSearchSelect?: (id: string) => void;
  activeTab?: "crypto" | "reksadana" | "stock" | "gold";
  onTabChange?: (tab: "crypto" | "reksadana" | "stock" | "gold") => void;
}

export default function Header({ onSearchSelect, activeTab = "crypto", onTabChange }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [fundAlertDialogOpen, setFundAlertDialogOpen] = useState(false);
  const [stockAlertDialogOpen, setStockAlertDialogOpen] = useState(false);
  const [goldAlertDialogOpen, setGoldAlertDialogOpen] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState<Cryptocurrency | null>(null);
  const [selectedFund, setSelectedFund] = useState<MutualFund | null>(null);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [selectedGold, setSelectedGold] = useState<Gold | null>(null);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { data: cryptoResults } = useCryptoSearch(debouncedSearch, debouncedSearch.length > 2 && activeTab === "crypto");
  const { data: fundResults } = useFundSearch(debouncedSearch, debouncedSearch.length > 2 && activeTab === "reksadana");
  const { data: stockResults } = useStockSearch(debouncedSearch, debouncedSearch.length > 2 && activeTab === "stock");
  const { data: goldResults } = useGoldSearch(debouncedSearch, debouncedSearch.length > 2 && activeTab === "gold");
  const { data: allCryptos } = useCryptoData(100);
  const addToWatchlist = useAddToWatchlist();
  const addToFundWatchlist = useAddToFundWatchlist();
  const addToStockWatchlist = useAddToStockWatchlist();
  const addToGoldWatchlist = useAddToGoldWatchlist();

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
    (activeTab === "reksadana" && fundResults && fundResults.length > 0) ||
    (activeTab === "stock" && stockResults && stockResults.length > 0) ||
    (activeTab === "gold" && goldResults && goldResults.length > 0);

  const tabs = [
    { key: "crypto", label: "Cryptocurrency", icon: BarChart3 },
    { key: "reksadana", label: "Reksa Dana", icon: PieChart },
    { key: "stock", label: "Stocks", icon: BarChart3 },
    { key: "gold", label: "Gold", icon: Star },
  ] as const;

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <BarChart3 className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight" data-testid="text-app-title">
                  InvestAnalytic
                </h1>
              </div>
              <Badge className="hidden sm:inline-flex bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-medium px-2 py-0.5 rounded-full">
                PRO
              </Badge>
            </div>

            <nav className="hidden lg:flex items-center gap-0.5">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <Button
                    key={tab.key}
                    variant="ghost"
                    size="sm"
                    onClick={() => onTabChange?.(tab.key)}
                    className={`relative px-3 py-2 text-sm font-medium transition-all duration-200 rounded-lg ${
                      isActive
                        ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                    data-testid={`tab-${tab.key}`}
                  >
                    <Icon className="h-4 w-4 mr-1.5" />
                    {tab.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-5 bg-emerald-600 dark:bg-emerald-400 rounded-full" />
                    )}
                  </Button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:block relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                type="text"
                placeholder={
                  activeTab === "crypto" ? "Search cryptocurrencies..." :
                  activeTab === "reksadana" ? "Search reksa dana..." :
                  activeTab === "stock" ? "Search stocks..." :
                  "Search gold..."
                }
                className="w-64 pl-9 h-9 text-sm bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                data-testid="input-search-crypto"
              />
              {showSearchResults && hasSearchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
                  <div className="p-2">
                    {activeTab === "crypto" && cryptoResults &&
                      cryptoResults.slice(0, 5).map((crypto) => (
                        <div
                          key={crypto.id}
                          className="flex items-center gap-3 p-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors"
                          data-testid={`result-crypto-${crypto.id}`}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          <img src={crypto.image || ""} alt={crypto.name} className="w-8 h-8 rounded-full" />
                          <div className="flex-1 min-w-0" onClick={() => {
                            if (onSearchSelect) onSearchSelect(crypto.id);
                            setSearchQuery("");
                            setShowSearchResults(false);
                          }}>
                            <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{crypto.name}</div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">{crypto.symbol.toUpperCase()}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">${parseFloat(crypto.current_price || "0").toLocaleString()}</div>
                          </div>
                          <div className="flex gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => addToWatchlist.mutate({ cryptoId: crypto.id })}
                            >
                              <Star className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onMouseDown={(e) => e.preventDefault()}
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
                    {activeTab === "reksa dana" && fundResults &&
                      fundResults.slice(0, 5).map((fund) => (
                        <div
                          key={fund.id}
                          className="flex items-center gap-3 p-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors"
                          data-testid={`result-fund-${fund.id}`}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
                            {fund.symbol || "?"}
                          </div>
                          <div className="flex-1 min-w-0" onClick={() => {
                            if (onSearchSelect) onSearchSelect(fund.id);
                            setSearchQuery("");
                            setShowSearchResults(false);
                          }}>
                            <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{fund.name}</div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">{fund.symbol}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Rp{fund.nav}</div>
                          </div>
                          <div className="flex gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => addToFundWatchlist.mutate({ fundId: fund.id })}
                            >
                              <Star className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onMouseDown={(e) => e.preventDefault()}
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
                    {activeTab === "stock" && stockResults &&
                      stockResults.slice(0, 5).map((stock) => (
                        <div
                          key={stock.id}
                          className="flex items-center gap-3 p-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors"
                          data-testid={`result-stock-${stock.id}`}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                            {stock.symbol || "?"}
                          </div>
                          <div className="flex-1 min-w-0" onClick={() => {
                            if (onSearchSelect) onSearchSelect(stock.id);
                            setSearchQuery("");
                            setShowSearchResults(false);
                          }}>
                            <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{stock.name}</div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">{stock.symbol}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{parseFloat(stock.current_price || "0").toLocaleString()}</div>
                          </div>
                          <div className="flex gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => addToStockWatchlist.mutate({ stockId: stock.id })}
                            >
                              <Star className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setSelectedStock(stock);
                                setStockAlertDialogOpen(true);
                                setShowSearchResults(false);
                              }}
                            >
                              <Bell className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    {activeTab === "gold" && goldResults &&
                      goldResults.slice(0, 5).map((goldItem) => (
                        <div
                          key={goldItem.id}
                          className="flex items-center gap-3 p-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors"
                          data-testid={`result-gold-${goldItem.id}`}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
                            {goldItem.symbol || "?"}
                          </div>
                          <div className="flex-1 min-w-0" onClick={() => {
                            if (onSearchSelect) onSearchSelect(goldItem.id);
                            setSearchQuery("");
                            setShowSearchResults(false);
                          }}>
                            <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{goldItem.name}</div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">{goldItem.symbol}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{parseFloat(goldItem.current_price || "0").toLocaleString()}</div>
                          </div>
                          <div className="flex gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => addToGoldWatchlist.mutate({ goldId: goldItem.id })}
                            >
                              <Star className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setSelectedGold(goldItem);
                                setGoldAlertDialogOpen(true);
                                setShowSearchResults(false);
                              }}
                            >
                              <Bell className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
                data-testid="button-toggle-theme"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              <Popover open={showNotifications} onOpenChange={setShowNotifications}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
                    data-testid="button-show-alerts"
                  >
                    <Bell className="h-4 w-4" />
                    {topGainers.length > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-medium px-1.5">
                        {topGainers.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      Top Gainers (24H)
                    </h3>
                  </div>
                  <div className="p-2">
                    {topGainers.map((crypto) => {
                      const change = parseFloat(crypto.price_change_percentage_24h || "0");
                      return (
                        <div
                          key={crypto.id}
                          className="flex items-center justify-between p-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors"
                          onClick={() => {
                            if (onSearchSelect) onSearchSelect(crypto.id);
                            setShowNotifications(false);
                          }}
                        >
                          <div className="flex items-center gap-2.5">
                            <img src={crypto.image || ""} alt={crypto.name} className="w-8 h-8 rounded-full" />
                            <div>
                              <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{crypto.symbol.toUpperCase()}</div>
                              <div className="text-xs text-zinc-500 dark:text-zinc-400">{crypto.name}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">${parseFloat(crypto.current_price || "0").toLocaleString()}</div>
                            <div className={`text-xs font-medium ${change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                              {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>

              {user && (
                <Popover open={showUserMenu} onOpenChange={setShowUserMenu}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 px-2 h-9 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
                      data-testid="button-user-menu"
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hidden sm:inline">{user.username}</span>
                      <ChevronDown className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0" align="end">
                    <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-sm">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{user.username}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">Administrator</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg"
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
                  </PopoverContent>
                </Popover>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-9 w-9 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-zinc-200 dark:border-zinc-800">
            <nav className="flex flex-col gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <Button
                    key={tab.key}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onTabChange?.(tab.key);
                      setMobileMenuOpen(false);
                    }}
                    className={`justify-start px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                      isActive
                        ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </Button>
                );
              })}
            </nav>
          </div>
        )}
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
      {selectedStock && (
        <CreateStockAlertDialog
          open={stockAlertDialogOpen}
          onOpenChange={setStockAlertDialogOpen}
          stock={selectedStock}
        />
      )}
      {selectedGold && (
        <CreateGoldAlertDialog
          open={goldAlertDialogOpen}
          onOpenChange={setGoldAlertDialogOpen}
          gold={selectedGold}
        />
      )}
    </header>
  );
}