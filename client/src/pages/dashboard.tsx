import { useState, useEffect } from "react";
import Header from "@/components/Header";
import MarketOverview from "@/components/MarketOverview";
import FundOverview from "@/components/FundOverview";
import StockOverview from "@/components/StockOverview";
import GoldOverview from "@/components/GoldOverview";
import PriceChart from "@/components/PriceChart";
import FundChart from "@/components/FundChart";
import StockChart from "@/components/StockChart";
import GoldChart from "@/components/GoldChart";
import CryptocurrencyTable from "@/components/CryptocurrencyTable";
import FundTable from "@/components/FundTable";
import StockTable from "@/components/StockTable";
import GoldTable from "@/components/GoldTable";
import Sidebar from "@/components/Sidebar";
import FABMenu from "@/components/FABMenu";
import CurrencySwitcher from "@/components/CurrencySwitcher";
import { useCryptoData, useMutualFunds, useStocks, useGold } from "@/hooks/useCryptoData";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrency } from "@/hooks/useCurrency";

export default function Dashboard() {
  const [selectedCrypto, setSelectedCrypto] = useState("bitcoin");
  const [selectedFund, setSelectedFund] = useState("schroder-dana-prestasi-plus");
  const [selectedStock, setSelectedStock] = useState("bbca");
  const [selectedGold, setSelectedGold] = useState("xau-idr");
  const [searchFilter, setSearchFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"crypto" | "reksadana" | "stock" | "gold">("crypto");

  useEffect(() => {
    setSearchFilter(null);
  }, [activeTab]);
  const { data: cryptocurrencies, isLoading } = useCryptoData(100);
  const { data: mutualFunds, isLoading: fundsLoading } = useMutualFunds(100);
  const { data: stocks, isLoading: stocksLoading } = useStocks(100);
  const { data: gold, isLoading: goldLoading } = useGold(100);
  useWebSocket();
  const { currency, rates } = useCurrency();

  const selectedCryptoObj =
    cryptocurrencies?.find((c) => c.id === selectedCrypto) ||
    cryptocurrencies?.[0];

  const selectedFundObj = mutualFunds?.find((f) => f.id === selectedFund) || mutualFunds?.[0];
  const selectedStockObj = stocks?.find((s) => s.id === selectedStock) || stocks?.[0];
  const selectedGoldObj = gold?.find((g) => g.id === selectedGold) || gold?.[0];

  useEffect(() => {
    if (mutualFunds && mutualFunds.length > 0) {
      const exists = mutualFunds.some((f) => f.id === selectedFund);
      if (!exists) {
        setSelectedFund(mutualFunds[0].id);
      }
    }
  }, [mutualFunds, selectedFund]);

  useEffect(() => {
    if (cryptocurrencies && cryptocurrencies.length > 0) {
      const exists = cryptocurrencies.some((c) => c.id === selectedCrypto);
      if (!exists) {
        setSelectedCrypto(cryptocurrencies[0].id);
      }
    }
  }, [cryptocurrencies, selectedCrypto]);

  useEffect(() => {
    if (stocks && stocks.length > 0) {
      const exists = stocks.some((s) => s.id === selectedStock);
      if (!exists) {
        setSelectedStock(stocks[0].id);
      }
    }
  }, [stocks, selectedStock]);

  useEffect(() => {
    if (gold && gold.length > 0) {
      const exists = gold.some((g) => g.id === selectedGold);
      if (!exists) {
        setSelectedGold(gold[0].id);
      }
    }
  }, [gold, selectedGold]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header onSearchSelect={setSearchFilter} activeTab={activeTab} />

      <main className="container mx-auto px-4 py-6">
        {/* Tab Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as "crypto" | "reksadana" | "stock" | "gold")}
            className="w-full max-w-md"
            data-testid="tabs-market"
          >
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="crypto" data-testid="tab-crypto">
                Cryptocurrency
              </TabsTrigger>
              <TabsTrigger value="reksadana" data-testid="tab-reksadana">
                Reksa Dana
              </TabsTrigger>
              <TabsTrigger value="stock" data-testid="tab-stock">
                Stocks
              </TabsTrigger>
              <TabsTrigger value="gold" data-testid="tab-gold">
                Gold
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <CurrencySwitcher />
        </div>

        {activeTab === "crypto" ? (
          <>
            {/* Crypto Market Overview */}
            <MarketOverview cryptocurrencies={cryptocurrencies || []} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Dashboard */}
              <div className="lg:col-span-2 space-y-6">
                {/* Interactive Price Chart */}
                <div className="bg-card p-6 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Price Chart</h3>
                    <select
                      className="px-3 py-1 bg-secondary border border-border rounded text-sm"
                      onChange={(e) => setSelectedCrypto(e.target.value)}
                      value={selectedCrypto}
                      data-testid="select-crypto-chart"
                    >
                      {cryptocurrencies?.slice(0, 10).map((crypto) => (
                        <option key={crypto.id} value={crypto.id}>
                          {crypto.symbol.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <PriceChart cryptoId={selectedCrypto} />
                </div>

                {/* Detailed Price Table */}
                <CryptocurrencyTable
                  cryptocurrencies={cryptocurrencies || []}
                  isLoading={isLoading}
                  searchFilter={searchFilter}
                />
              </div>

              {/* Sidebar */}
              <Sidebar />
            </div>
          </>
        ) : activeTab === "stock" ? (
          <>
            {/* Stock Market Overview */}
            <StockOverview stocks={stocks || []} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Dashboard */}
              <div className="lg:col-span-2 space-y-6">
                {/* Interactive Stock Chart */}
                <div className="bg-card p-6 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Price Chart</h3>
                    <select
                      className="px-3 py-1 bg-secondary border border-border rounded text-sm"
                      onChange={(e) => setSelectedStock(e.target.value)}
                      value={selectedStock}
                      data-testid="select-stock-chart"
                    >
                      {stocks?.map((stock) => (
                        <option key={stock.id} value={stock.id}>
                          {stock.symbol} - {stock.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <StockChart stockId={selectedStock} rates={rates} />
                </div>

                {/* Detailed Stock Table */}
                <StockTable
                  stocks={stocks || []}
                  isLoading={stocksLoading}
                  searchFilter={searchFilter}
                />
              </div>

              {/* Sidebar */}
              <Sidebar />
            </div>
          </>
        ) : activeTab === "gold" ? (
          <>
            {/* Gold Market Overview */}
            <GoldOverview gold={gold || []} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Dashboard */}
              <div className="lg:col-span-2 space-y-6">
                {/* Interactive Gold Chart */}
                <div className="bg-card p-6 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Price Chart</h3>
                    <select
                      className="px-3 py-1 bg-secondary border border-border rounded text-sm"
                      onChange={(e) => setSelectedGold(e.target.value)}
                      value={selectedGold}
                      data-testid="select-gold-chart"
                    >
                      {gold?.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.symbol} - {g.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <GoldChart goldId={selectedGold} rates={rates} />
                </div>

                {/* Detailed Gold Table */}
                <GoldTable
                  gold={gold || []}
                  isLoading={goldLoading}
                  searchFilter={searchFilter}
                />
              </div>

              {/* Sidebar */}
              <Sidebar />
            </div>
          </>
        ) : (
          <>
            {/* Reksa Dana Market Overview */}
            <FundOverview funds={mutualFunds || []} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Dashboard */}
              <div className="lg:col-span-2 space-y-6">
                {/* Interactive Fund NAV Chart */}
                <div className="bg-card p-6 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">NAV Chart</h3>
                    <select
                      className="px-3 py-1 bg-secondary border border-border rounded text-sm"
                      onChange={(e) => setSelectedFund(e.target.value)}
                      value={selectedFund}
                      data-testid="select-fund-chart"
                    >
                      {mutualFunds?.map((fund) => (
                        <option key={fund.id} value={fund.id}>
                          {fund.symbol} - {fund.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <FundChart fundId={selectedFund} rates={rates} />
                </div>

                {/* Detailed Fund Table */}
                <FundTable
                  funds={mutualFunds || []}
                  isLoading={fundsLoading}
                  searchFilter={searchFilter}
                />
              </div>

              {/* Sidebar */}
              <Sidebar />
            </div>
          </>
        )}
      </main>

      {/* Floating Action Button Menu */}
      {selectedCryptoObj && activeTab === "crypto" && (
        <FABMenu selectedCrypto={selectedCryptoObj} />
      )}
    </div>
  );
}
