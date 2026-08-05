import MarketSummary from "./MarketSummary";
import Watchlist from "./Watchlist";
import PriceAlerts from "./PriceAlerts";
import MarketNews from "./MarketNews";

export default function Sidebar() {
  return (
    <div className="space-y-6">
      <MarketSummary />
      <Watchlist />
      <PriceAlerts />
      <MarketNews />
    </div>
  );
}
