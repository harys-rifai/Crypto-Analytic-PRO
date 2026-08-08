import { useEffect, useRef, useState } from "react";
import { Chart } from "@/lib/chartSetup";
import { useGoldHistory } from "@/hooks/useCryptoData";
import { useWebSocketContext } from "@/hooks/useWebSocket";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

type TimeFilter = "1M" | "3M" | "6M" | "1Y" | "3Y" | "all";

const TIME_FILTER_HOURS: Record<TimeFilter, number> = {
  "1M": 720,
  "3M": 2160,
  "6M": 4320,
  "1Y": 8760,
  "3Y": 26280,
  all: 43800,
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

interface GoldChartProps {
  goldId: string;
}

export default function GoldChart({ goldId }: GoldChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("1Y");
  const { lastTick } = useWebSocketContext();
  const {
    data: goldHistory,
    isLoading,
    refetch,
  } = useGoldHistory(goldId, TIME_FILTER_HOURS[timeFilter]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (!canvasRef.current || !goldHistory || goldHistory.length === 0)
      return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const labels = goldHistory.map((point) => {
      const date = new Date(point.timestamp!);
      return formatDateLabel(date, timeFilter);
    });

    const prices = goldHistory.map((point) => parseFloat(point.price));

    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const isPriceUp = lastPrice >= firstPrice;

    const lineColor = isPriceUp
      ? "rgb(34, 197, 94)"
      : "rgb(239, 68, 68)";
    const fillColor = isPriceUp
      ? "rgba(34, 197, 94, 0.1)"
      : "rgba(239, 68, 68, 0.1)";

    chartRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Price",
            data: prices,
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
                const timestamp = goldHistory[index].timestamp;
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
                return `Price: $${price.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`;
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
                if (num >= 1000) {
                  return '$' + (num / 1000).toFixed(2) + 'K';
                }
                return '$' + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [goldHistory, timeFilter, goldId]);

  useEffect(() => {
    if (!chartRef.current || !lastTick) return;
    const tick = lastTick[goldId];
    if (!tick) return;
    const chart = chartRef.current;
    const newData = chart.data.datasets[0].data as number[];
    if (newData.length > 0) {
      newData[newData.length - 1] = parseFloat(tick.current_price);
      chart.update();
    }
  }, [lastTick, goldId]);

  if (isLoading) {
    return (
      <div className="chart-container" style={{ height: "400px" }}>
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (!goldHistory || goldHistory.length === 0) {
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
    <div className="chart-container" data-testid="chart-gold-price-history">
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
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-xs"
          data-testid="button-refresh-gold-chart"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          <span className="ml-1">Refresh</span>
        </Button>
      </div>
      <div style={{ height: "400px", position: 'relative' }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
