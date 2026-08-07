import { useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
import { CandlestickController, CandlestickElement } from "chartjs-chart-financial";
import { usePriceHistory } from "@/hooks/useCryptoData";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import "chartjs-adapter-date-fns";

Chart.register(...registerables, CandlestickController, CandlestickElement);

type TimeFilter = '1h' | '3h' | '6h' | '24h' | '3d' | '7d' | '1m' | '3m' | '1y' | 'all';

const TIME_FILTER_HOURS: Record<TimeFilter, number> = {
  '1h': 1,
  '3h': 3,
  '6h': 6,
  '24h': 24,
  '3d': 72,
  '7d': 168,
  '1m': 720,
  '3m': 2160,
  '1y': 8760,
  'all': 43800, // 5 years approx, effectively "max" for most coins
};

interface PriceChartProps {
  cryptoId: string;
}

// Helper function to format time labels based on time range
function formatTimeLabel(date: Date, timeFilter: TimeFilter): string {
  switch (timeFilter) {
    case '1h':
    case '3h':
    case '6h':
      // For short periods, show time only (e.g., "02:30:00") to distinguish points
      // Using H:M:S if needed or H:M for 1h to avoid duplicate labels
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    case '24h':
      // For 24h, show time (e.g., "2:30 PM")
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    case '3d':
    case '7d':
      // For days, show month/day (e.g., "Dec 20")
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });

    case '1m':
    case '3m':
      // For months, show month/day (e.g., "Dec 20")
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });

    case '1y':
    case 'all':
      // For year/all, show month/year (e.g., "Dec 2024")
      return date.toLocaleDateString([], { month: 'short', year: 'numeric' });

    default:
      return date.toLocaleDateString();
  }
}

export default function PriceChart({ cryptoId }: PriceChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('24h');
  const [chartType, setChartType] = useState<'line' | 'candlestick'>('line');
  const { data: priceHistory, isLoading, refetch } = usePriceHistory(cryptoId, TIME_FILTER_HOURS[timeFilter]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const uniqueCanvasId = `price-chart-${cryptoId}-${timeFilter}`;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 60000);

    return () => clearInterval(interval);
  }, [refetch]);

  useEffect(() => {
    if (!canvasRef.current || !priceHistory || priceHistory.length === 0) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    if (chartType === 'candlestick' && priceHistory.length > 0) {
      const candleData = priceHistory.map((point, index) => {
        const price = parseFloat(point.price);
        const prevPrice = index > 0 ? parseFloat(priceHistory[index - 1].price) : price;
        const open = prevPrice;
        const close = price;
        const priceHash = Math.abs(price * 1000 + index * 37) % 1000;
        const offset = (priceHash / 1000) * 0.01;
        const high = Math.max(open, close) * (1 + offset);
        const low = Math.min(open, close) * (1 - offset);
        return {
          x: new Date(point.timestamp!).getTime(),
          o: open,
          h: high,
          l: low,
          c: close,
        };
      });

      chartRef.current = new Chart(ctx, {
        type: 'candlestick',
        data: {
          datasets: [{
            label: 'Price',
            data: candleData,
            borderColor: {
              up: 'rgb(34, 197, 94)',
              down: 'rgb(239, 68, 68)',
              unchanged: 'rgb(161, 161, 170)',
            } as any,
            backgroundColor: {
              up: 'rgba(34, 197, 94, 0.8)',
              down: 'rgba(239, 68, 68, 0.8)',
              unchanged: 'rgba(161, 161, 170, 0.8)',
            } as any,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              enabled: true,
              backgroundColor: 'rgba(24, 24, 27, 0.95)',
              titleColor: '#ffffff',
              bodyColor: '#ffffff',
              borderColor: 'rgba(63, 63, 70, 0.8)',
              borderWidth: 1,
              padding: 12,
              callbacks: {
                label: (context) => {
                  const point = context.raw as any;
                  return `O: $${point.o.toFixed(2)} H: $${point.h.toFixed(2)} L: $${point.l.toFixed(2)} C: $${point.c.toFixed(2)}`;
                },
              },
            },
          },
          scales: {
            x: {
              type: 'time',
              time: {
                unit: timeFilter === '1h' || timeFilter === '3h' ? 'hour' : 'day',
              },
              grid: { color: 'rgba(63, 63, 70, 0.3)' },
              ticks: { color: 'rgba(161, 161, 170, 1)', maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
              border: { color: 'rgba(63, 63, 70, 0.5)' },
            },
            y: {
              position: 'right',
              beginAtZero: false,
              grid: { color: 'rgba(63, 63, 70, 0.3)' },
              ticks: {
                color: 'rgba(161, 161, 170, 1)',
                callback: (value) => '$' + Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              },
              border: { color: 'rgba(63, 63, 70, 0.5)' },
            },
          },
        },
      });
    } else {
      const labels = priceHistory.map((point) => {
        const date = new Date(point.timestamp!);
        return formatTimeLabel(date, timeFilter);
      });

      const prices = priceHistory.map((point) => parseFloat(point.price));

      const firstPrice = prices[0];
      const lastPrice = prices[prices.length - 1];
      const isPriceUp = lastPrice >= firstPrice;

      const lineColor = isPriceUp ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';
      const fillColor = isPriceUp ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';

      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Price',
            data: prices,
            borderColor: lineColor,
            backgroundColor: fillColor,
            tension: 0.4,
            fill: true,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: lineColor,
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 2,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              enabled: true,
              mode: 'index',
              intersect: false,
              backgroundColor: 'rgba(24, 24, 27, 0.95)',
              titleColor: '#ffffff',
              bodyColor: '#ffffff',
              borderColor: 'rgba(63, 63, 70, 0.8)',
              borderWidth: 1,
              padding: 12,
              displayColors: true,
              callbacks: {
                title: (context) => {
                  const index = context[0].dataIndex;
                  const timestamp = priceHistory[index].timestamp;
                  if (timestamp) {
                    const date = new Date(timestamp);
                    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) + ' ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                  }
                  return '';
                },
                label: (context) => {
                  const price = context.parsed.y;
                  return `Price: $${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                },
                labelColor: () => ({ borderColor: lineColor, backgroundColor: lineColor, borderWidth: 2, borderRadius: 2 }),
              },
            },
          },
          scales: {
            x: {
              grid: { color: 'rgba(63, 63, 70, 0.3)', drawOnChartArea: true },
              ticks: { color: 'rgba(161, 161, 170, 1)', font: { size: 11 }, maxRotation: 0, autoSkip: true, maxTicksLimit: timeFilter === '1h' || timeFilter === '3h' ? 10 : 8 },
              border: { color: 'rgba(63, 63, 70, 0.5)' },
            },
            y: {
              position: 'right',
              beginAtZero: false,
              grid: { color: 'rgba(63, 63, 70, 0.3)', drawOnChartArea: true },
              ticks: {
                color: 'rgba(161, 161, 170, 1)',
                font: { size: 11 },
                callback: (value) => {
                  const num = Number(value);
                  if (num >= 1000) return '$' + (num / 1000).toFixed(2) + 'K';
                  return '$' + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                },
              },
              border: { color: 'rgba(63, 63, 70, 0.5)' },
            },
          },
          interaction: { mode: 'index', intersect: false },
        },
      });
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [priceHistory, timeFilter, chartType, cryptoId]);

  if (isLoading) {
    return (
      <div className="chart-container" style={{ height: '400px' }}>
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (!priceHistory || priceHistory.length === 0) {
    return (
      <div className="chart-container flex items-center justify-center border rounded-lg bg-card/50" style={{ height: '400px' }}>
        <div className="text-center text-muted-foreground p-6">
          <p className="text-lg font-semibold mb-2">No data available for this timeframe</p>
          <p className="text-sm">Try selecting a different time range or wait for new data.</p>
        </div>
      </div>
    );
  }

  const timeFilters: TimeFilter[] = ['1h', '3h', '6h', '24h', '3d', '7d', '1m', '3m', '1y', 'all'];

  return (
    <div className="chart-container" data-testid="chart-price-history">
      <div className="flex flex-wrap gap-2 mb-4 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {timeFilters.map((filter) => (
            <Button
              key={filter}
              variant={timeFilter === filter ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeFilter(filter)}
              className="text-xs"
              data-testid={`button-time-filter-${filter}`}
            >
              {filter.toUpperCase()}
            </Button>
          ))}
          <Button
            variant={chartType === 'candlestick' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType(chartType === 'candlestick' ? 'line' : 'candlestick')}
            className="text-xs"
            data-testid="button-toggle-candlestick"
          >
            {chartType === 'candlestick' ? 'LINE' : 'CANDLE'}
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          {priceHistory && priceHistory.length > 0 && (
            <span className="text-xs text-muted-foreground" data-testid="text-chart-last-update">
              Last updated: {new Date(priceHistory[priceHistory.length - 1].timestamp!).toLocaleString()}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xs text-muted-foreground hover:text-foreground"
            data-testid="button-refresh-chart"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>
      <div style={{ height: '400px', position: 'relative' }}>
        <canvas id={uniqueCanvasId} ref={canvasRef} />
      </div>
    </div>
  );
}
