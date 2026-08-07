import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Cryptocurrency, Stock, MutualFund, Gold } from "@shared/schema";

interface WebSocketData {
  type: string;
  data: any;
}

interface WebSocketContextType {
  isConnected: boolean;
  lastUpdate: string | null;
  lastTick: Record<string, any> | null;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  lastUpdate: null,
  lastTick: null,
});

export function useWebSocketContext() {
  return useContext(WebSocketContext);
}

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [lastTick, setLastTick] = useState<Record<string, any> | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempt = useRef(0);
  const queryClient = useQueryClient();

  const updateAllMatchingQueries = (
    prefix: string,
    updater: (old: any) => any
  ) => {
    const queries = queryClient.getQueryCache().findAll({
      predicate: (query) =>
        Array.isArray(query.queryKey) &&
        typeof query.queryKey[0] === "string" &&
        query.queryKey[0] === prefix,
    });
    queries.forEach((query) => {
      queryClient.setQueryData(query.queryKey, updater);
    });
  };

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const connectWebSocket = () => {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        reconnectAttempt.current = 0;
      };

      ws.current.onmessage = (event) => {
        try {
          const msg: WebSocketData = JSON.parse(event.data);

          switch (msg.type) {
            case "price_update":
              updateAllMatchingQueries("/api/cryptocurrencies", (old) => {
                if (!Array.isArray(old)) return old;
                return old.map((c: any) => msg.data.find((d: any) => d.id === c.id) || c);
              });
              setLastUpdate(new Date().toLocaleString());
              break;

            case "stock_update":
              updateAllMatchingQueries("/api/stocks", (old) => {
                if (!Array.isArray(old)) return old;
                return old.map((s: any) => msg.data.find((d: any) => d.id === s.id) || s);
              });
              break;

            case "fund_update":
              updateAllMatchingQueries("/api/funds", (old) => {
                if (!Array.isArray(old)) return old;
                return old.map((f: any) => msg.data.find((d: any) => d.id === f.id) || f);
              });
              break;

            case "gold_update":
              updateAllMatchingQueries("/api/gold", (old) => {
                if (!Array.isArray(old)) return old;
                return old.map((g: any) => msg.data.find((d: any) => d.id === g.id) || g);
              });
              break;

            case "currency_update":
              updateAllMatchingQueries("/api/currency-rates", () => msg.data);
              break;

            case "price_tick":
              setLastTick(msg.data);
              setLastUpdate(new Date().toLocaleString());

              updateAllMatchingQueries("/api/cryptocurrencies", (old) => {
                if (!Array.isArray(old)) return old;
                return old.map((c: any) => msg.data[c.id] || c);
              });

              updateAllMatchingQueries("/api/stocks", (old) => {
                if (!Array.isArray(old)) return old;
                return old.map((s: any) => msg.data[s.id] || s);
              });

              updateAllMatchingQueries("/api/funds", (old) => {
                if (!Array.isArray(old)) return old;
                return old.map((f: any) => msg.data[f.id] || f);
              });

              updateAllMatchingQueries("/api/gold", (old) => {
                if (!Array.isArray(old)) return old;
                return old.map((g: any) => msg.data[g.id] || g);
              });
              break;
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      const scheduleReconnect = (delay: number) => {
        reconnectTimeout.current = setTimeout(() => {
          if (ws.current?.readyState === WebSocket.CLOSED) {
            reconnectAttempt.current += 1;
            connectWebSocket();
          }
        }, delay);
      };

      ws.current.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
        scheduleReconnect(5000);
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
        ws.current?.close();
      };
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [queryClient]);

  return (
    <WebSocketContext.Provider value={{ isConnected, lastUpdate, lastTick }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  return useContext(WebSocketContext);
}
