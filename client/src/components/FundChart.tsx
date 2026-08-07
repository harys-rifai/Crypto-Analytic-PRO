import { useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
import { CandlestickController, CandlestickElement } from "chartjs-chart-financial";
import { useFundHistory } from "@/hooks/useCryptoData";
import { useWebSocketContext } from "@/hooks/useWebSocket";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { convertPrice } from "@/lib/currencyFormat";
import type { CurrencyRate } from "@shared/schema";
import "chartjs-adapter-date-fns";

Chart.register(...registerables, CandlestickController, CandlestickElement);

type TimeFilter = "1M" | "3M" | "6M" | "1Y" | "3Y" | "all";

const TIME_FILTER_DAYS: Record<TimeFilter, number> = {
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "1Y": 365,
  "3Y": 1095,
  all: 1825,
};

function formatDateLabel(date: Date, timeFilter: TimeFilter): string {
  switch (timeFilter) {
    case "1M":
    case "3M":
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    case "6M":
    case "1Y":
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    case "3Y":
      return date.toLocaleDateString([], { month: "short", year: "numeric" });
    case "all":
      return date.toLocaleDateString([], { month: "short", year: "numeric" });
    default:
      return date.toLocaleDateString();
  }
}

interface FundChartProps {
  fundId: string;
  rates: CurrencyRate[];
}

export default function FundChart({ fundId, rates }: FundChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("1Y");
  const [chartType, setChartType] = useState<'line' | 'candlestick'>('line');
  const { currency } = useCurrency();
  const { lastTick } = useWebSocketContext();
  const {
    data: fundHistory,
    isLoading,
    refetch,
  } = useFundHistory(fundId, TIME_FILTER_DAYS[timeFilter]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const uniqueCanvasId = `fund-chart-${fundId}-${timeFilter}`;

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
    if (!canvasRef.current || !fundHistory || fundHistory.length === 0)
      return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const labels = fundHistory.map((point) => {
      const date = new Date(point.date!);
      return formatDateLabel(date, timeFilter);
    });

    const navs = fundHistory.map((point) => {
      const nav = parseFloat(point.nav);
      const converted =
        currency !== "IDR" && rates
          ? convertPrice(nav, "IDR", currency as any, rates)
          : nav;
      return converted;
    });

    const firstNav = navs[0];
    const lastNav = navs[navs.length - 1];
    const isNavUp = lastNav >= firstNav;

    const lineColor = isNavUp
      ? "rgb(34, 197, 94)"
      : "rgb(239, 68, 68)";
    const fillColor = isNavUp
      ? "rgba(34, 197, 94, 0.1)"
      : "rgba(239, 68, 68, 0.1)";

    const currencySymbols: Record<string, string> = {
      IDR: "Rp",
      USD: "$",
      SGD: "S$",
    };
    const symbol = currencySymbols[currency] || "Rp";

    if (chartType === 'candlestick' && fundHistory.length > 0) {
      const candleData = fundHistory.map((point, index) => {
        const nav = parseFloat(point.nav);
        const prevNav = index > 0 ? parseFloat(fundHistory[index - 1].nav) : nav;
        const open = prevNav;
        const close = nav;
        const priceHash = Math.abs(nav * 1000 + index * 37) % 1000;
        const offset = (priceHash / 1000) * 0.005;
        const high = Math.max(open, close) * (1 + offset);
        const low = Math.min(open, close) * (1 - offset);
        return {
          x: new Date(point.date!).getTime(),
          o: open,
          h: high,
          l: low,
          c: close,
        };
      });

      chartRef.current = new Chart(ctx, {
        type: "candlestick",
        data: {
          datasets: [{
            label: "NAV",
            data: candleData,
            borderColor: {
              up: "rgb(34, 197, 94)",
              down: "rgb(239, 68, 68)",
              unchanged: "rgb(161, 161, 170)",
            } as any,
            backgroundColor: {
              up: "rgba(34, 197, 94, 0.8)",
              down: "rgba(239, 68, 68, 0.8)",
              unchanged: "rgba(161, 161, 170, 0.8)",
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
              backgroundColor: "rgba(24, 24, 27, 0.95)",
              titleColor: "#ffffff",
              bodyColor: "#ffffff",
              borderColor: "rgba(63, 63, 70, 0.8)",
              borderWidth: 1,
              padding: 12,
              callbacks: {
                title: (context) => {
                  const index = context[0].dataIndex;
                  const timestamp = fundHistory[index].date;
                  if (timestamp) {
                    const date = new Date(timestamp);
                    return date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
                  }
                  return "";
                },
                label: (context) => {
                  const point = context.raw as any;
                  return `NAV: ${symbol}${point.c.toLocaleString(currency === "IDR" ? "id-ID" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                },
              },
            },
          },
          scales: {
            x: {
              type: "time",
              time: { unit: timeFilter === "1M" || timeFilter === "3M" ? "day" : "month" },
              grid: { color: "rgba(63, 63, 70, 0.3)" },
              ticks: { color: "rgba(161, 161, 170, 1)", maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
              border: { color: "rgba(63, 63, 70, 0.5)" },
            },
            y: {
              position: "right",
              beginAtZero: false,
              grid: { color: "rgba(63, 63, 70, 0.3)" },
              ticks: {
                color: "rgba(161, 161, 170, 1)",
                callback: (value) => {
                  const num = Number(value);
                  if (currency === "IDR") {
                    if (num >= 1000000) return `${symbol}${(num / 1000000).toFixed(1)}Jt`;
                    return `${symbol}${num.toLocaleString("id-ID")}`;
                  }
                  return `${symbol}${num.toLocaleString("en-US")}`;
                },
              },
              border: { color: "rgba(63, 63, 70, 0.5)" },
            },
          },
        },
      });
    } else {
      chartRef.current = new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "NAV",
              data: navs,
              borderColor: lineColor,
              backgroundColor: fillColor,
              tension: 0.4,
              fill: true,
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 6,
              pointHoverBackgroundColor: lineColor,
              pointHoverBorderColor: "#ffffff",
              pointHoverBorderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              enabled: true,
              mode: "index",
              intersect: false,
              backgroundColor: "rgba(24, 24, 27, 0.95)",
              titleColor: "#ffffff",
              bodyColor: "#ffffff",
              borderColor: "rgba(63, 63, 70, 0.8)",
              borderWidth: 1,
              padding: 12,
              displayColors: true,
              callbacks: {
                title: (context) => {
                  const index = context[0].dataIndex;
                  const timestamp = fundHistory[index].date;
                  if (timestamp) {
                    const date = new Date(timestamp);
                    return (
                      date.toLocaleDateString("en-US", {
                        month: "2-digit",
                        day: "2-digit",
                        year: "numeric",
                      }) +
                      " " +
                      date.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })
                    );
                  }
                  return "";
                },
                label: (context) => {
                  const price = context.parsed.y;
                  return `NAV: ${symbol}${price.toLocaleString(currency === "IDR" ? "id-ID" : "en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`;
                },
                labelColor: () => {
                  return {
                    borderColor: lineColor,
                    backgroundColor: lineColor,
                    borderWidth: 2,
                    borderRadius: 2,
                  };
                },
              },
            },
          },
          scales: {
            x: {
              grid: {
                display: true,
                color: "rgba(63, 63, 70, 0.3)",
                drawOnChartArea: true,
              },
              ticks: {
                color: "rgba(161, 161, 170, 1)",
                font: { size: 11 },
                maxRotation: 0,
                autoSkip: true,
                maxTicksLimit: 8,
              },
              border: { color: "rgba(63, 63, 70, 0.5)" },
            },
            y: {
              position: "right",
              beginAtZero: false,
              grid: {
                display: true,
                color: "rgba(63, 63, 70, 0.3)",
                drawOnChartArea: true,
              },
              ticks: {
                color: "rgba(161, 161, 170, 1)",
                font: { size: 11 },
                callback: (value) => {
                  const num = Number(value);
                  if (currency === "IDR") {
                    if (num >= 1000000) {
                      return `${symbol}${(num / 1000000).toFixed(1)}Jt`;
                    }
                    return `${symbol}${num.toLocaleString("id-ID")}`;
                  }
                  return `${symbol}${num.toLocaleString("en-US")}`;
                },
              },
              border: { color: "rgba(63, 63, 70, 0.5)" },
            },
          },
          interaction: {
            mode: "index",
            intersect: false,
          },
        },
      });
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [fundHistory, timeFilter, currency, rates, chartType, fundId]);

  if (isLoading) {
    return (
      <div className="chart-container" style={{ height: "400px" }}>
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (!fundHistory || fundHistory.length === 0) {
    return (
      <div
        className="chart-container flex items-center justify-center border rounded-lg bg-card/50"
        style={{ height: "400px" }}
      >
        <div className="text-center text-muted-foreground p-6">
          <p className="text-lg font-semibold mb-2">No data available for this timeframe</p>
          <p className="text-sm">Try selecting a different time range or wait for new data.</p>
        </div>
      </div>
    );
  }

  const timeFilters: TimeFilter[] = ["1M", "3M", "6M", "1Y", "3Y", "all"];

  return (
    <div className="chart-container" data-testid="chart-fund-nav-history">
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
              {filter}
            </Button>
          ))}
          <Button
            variant={chartType === 'candlestick' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType(chartType === 'candlestick' ? 'line' : 'candlestick')}
            className="text-xs"
            data-testid="button-toggle-fund-candlestick"
          >
            {chartType === 'candlestick' ? 'LINE' : 'CANDLE'}
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-xs"
          data-testid="button-refresh-fund-chart"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          <span className="ml-1">Refresh</span>
        </Button>
      </div>
      <div style={{ height: "400px", position: 'relative' }}>
        <canvas id={uniqueCanvasId} ref={canvasRef} />
      </div>
    </div>
  );
}
