import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { CurrencyRate } from "@shared/schema";

export type CurrencyCode = "IDR" | "USD" | "SGD";

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  rates: CurrencyRate[];
  isLoading: boolean;
  convert: (amount: number, from: CurrencyCode, to: CurrencyCode) => number;
  formatCurrency: (amount: number, currency?: CurrencyCode) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CURRENCY_STORAGE_KEY = "investanalytic-currency";

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyCode>("IDR");

  const { data: rates, isLoading } = useQuery<CurrencyRate[]>({
    queryKey: ["/api/currency-rates"],
    queryFn: async () => {
      const res = await fetch("/api/currency-rates");
      if (!res.ok) throw new Error("Failed to fetch currency rates");
      return res.json();
    },
    staleTime: 3600000,
  });

  useEffect(() => {
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (stored === "IDR" || stored === "USD" || stored === "SGD") {
      setCurrency(stored as CurrencyCode);
    }
    if (stored) {
      setCurrency(stored as CurrencyCode);
    }
  }, []);

  const handleSetCurrency = (newCurrency: CurrencyCode) => {
    setCurrency(newCurrency);
    localStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency);
  };

  const convert = (amount: number, from: CurrencyCode, to: CurrencyCode): number => {
    if (from === to) return amount;
    if (!rates) return amount;

    const rate = rates.find(
      (r) => r.fromCurrency === from && r.toCurrency === to,
    );
    if (rate) {
      return amount * parseFloat(rate.rate);
    }

    const usdToFrom = rates.find(
      (r) => r.fromCurrency === "USD" && r.toCurrency === from,
    );
    const usdToTo = rates.find(
      (r) => r.fromCurrency === "USD" && r.toCurrency === to,
    );

    if (usdToFrom && usdToTo) {
      const usdAmount = amount / parseFloat(usdToFrom.rate);
      return usdAmount * parseFloat(usdToTo.rate);
    }

    return amount;
  };

  const formatCurrency = (amount: number, targetCurrency?: CurrencyCode): string => {
    const cur = targetCurrency || currency;
    const symbols: Record<CurrencyCode, string> = {
      IDR: "Rp",
      USD: "$",
      SGD: "S$",
    };

    const symbol = symbols[cur];

    if (cur === "IDR") {
      return `${symbol}${amount.toLocaleString("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })}`;
    }

    return `${symbol}${amount.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency: handleSetCurrency,
        rates: rates || [],
        isLoading,
        convert,
        formatCurrency,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
