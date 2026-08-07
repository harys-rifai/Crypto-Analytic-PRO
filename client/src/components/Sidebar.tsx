import MarketSummary from "./MarketSummary";
import Watchlist from "./Watchlist";
import PriceAlerts from "./PriceAlerts";
import MarketNews from "./MarketNews";
import FundWatchlist from "./FundWatchlist";

export default function Sidebar() {
  return (
    <div className="space-y-6">
      <MarketSummary />
      <Watchlist />
      <FundWatchlist />
      <PriceAlerts />
      <MarketNews />
    </div>
  );
}
