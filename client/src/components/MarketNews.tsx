import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface NewsItem {
  id: number;
  title: string;
  description: string;
  timestamp: Date;
}

// Pool of news templates to rotate through
const newsTemplates = [
  {
    title: "Bitcoin ETF Sees Record Inflows",
    description: "Institutional investors pour $2B into Bitcoin ETFs amid bullish sentiment..."
  },
  {
    title: "Ethereum 2.0 Staking Milestone",
    description: "ETH staking reaches new heights with over 25% of supply now staked..."
  },
  {
    title: "DeFi Protocol Launches",
    description: "New decentralized exchange promises zero slippage trades..."
  },
  {
    title: "Major Exchange Lists New Altcoin",
    description: "Leading cryptocurrency exchange adds support for emerging blockchain project..."
  },
  {
    title: "Regulatory Framework Proposed",
    description: "New guidelines aim to provide clarity for crypto businesses and investors..."
  },
  {
    title: "NFT Marketplace Hits New Record",
    description: "Digital collectibles platform processes $500M in monthly trading volume..."
  }
];

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  } else {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }
}

function generateNewsItems(): NewsItem[] {
  const now = new Date();
  const items: NewsItem[] = [];

  // Generate 3 news items with staggered timestamps
  for (let i = 0; i < 3; i++) {
    const hoursAgo = (i + 1) * 2; // 2, 4, 6 hours ago
    const timestamp = new Date(now.getTime() - (hoursAgo * 60 * 60 * 1000));
    const templateIndex = (Math.floor(now.getTime() / (1000 * 60 * 60)) + i) % newsTemplates.length;

    items.push({
      id: i + 1,
      ...newsTemplates[templateIndex],
      timestamp
    });
  }

  return items;
}

export default function MarketNews() {
  const [news, setNews] = useState<NewsItem[]>(generateNewsItems());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Refresh news every hour
    const interval = setInterval(() => {
      setIsRefreshing(true);
      setTimeout(() => {
        setNews(generateNewsItems());
        setIsRefreshing(false);
      }, 500);
    }, 3600000); // 1 hour in milliseconds

    // Also update relative timestamps every minute
    const timestampInterval = setInterval(() => {
      setNews(prevNews => [...prevNews]); // Trigger re-render
    }, 60000); // 1 minute

    return () => {
      clearInterval(interval);
      clearInterval(timestampInterval);
    };
  }, []);

  if (isRefreshing) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4" data-testid="text-news-title">Market News</h3>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4" data-testid="text-news-title">Market News</h3>
        <div className="space-y-4">
          {news.map((newsItem, index) => (
            <div
              key={newsItem.id}
              className={`${index < news.length - 1 ? 'border-b border-border pb-3' : ''}`}
              data-testid={`news-item-${newsItem.id}`}
            >
              <h4 className="font-medium text-sm mb-1" data-testid={`news-title-${newsItem.id}`}>
                {newsItem.title}
              </h4>
              <p className="text-xs text-muted-foreground mb-2" data-testid={`news-description-${newsItem.id}`}>
                {newsItem.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground" data-testid={`news-timestamp-${newsItem.id}`}>
                  {getRelativeTime(newsItem.timestamp)}
                </span>
                <Button
                  variant="link"
                  size="sm"
                  className="text-xs text-primary p-0 h-auto"
                  data-testid={`button-read-more-${newsItem.id}`}
                >
                  Read more
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="ghost"
          className="w-full mt-4 text-sm text-primary hover:bg-primary/5"
          data-testid="button-view-all-news"
        >
          View All News
        </Button>
      </CardContent>
    </Card>
  );
}
