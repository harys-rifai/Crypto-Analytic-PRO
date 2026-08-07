import { CurrencyCode } from "@/hooks/useCurrency";

export const IDR_COINS = new Set([
  "bank",
  "skyai",
  "ub",
  "hei",
  "hft",
]);

const CURRENCY_SYMBOLS: Record<string, string> = {
  IDR: "Rp",
  USD: "$",
  SGD: "S$",
};

export function getCurrencySymbol(cryptoId: string): string {
  return IDR_COINS.has(cryptoId) ? "Rp" : "$";
}

export function getSymbolForCurrency(currency: string): string {
  return CURRENCY_SYMBOLS[currency] || "$";
}

export function formatPrice(
  price: string | null | undefined,
  cryptoId?: string,
  currency?: CurrencyCode,
): string {
  if (!price) return `${currency ? CURRENCY_SYMBOLS[currency] || "$" : "$"}0.00`;
  const num = parseFloat(price);

  if (!currency) {
    currency = getCurrencyForAsset(cryptoId || "");
  }

  const symbol = CURRENCY_SYMBOLS[currency] || "$";

  if (currency === "IDR") {
    if (num >= 1000000) {
      return `Rp${(num / 1000000).toFixed(1)}Jt`;
    }
    if (num >= 1000) {
      return `Rp${num.toLocaleString("id-ID")}`;
    }
    return `Rp${num.toLocaleString("id-ID", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  if (num >= 1000) {
    return `$${(num / 1000).toFixed(2)}K`;
  }
  return `$${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  })}`;
}

export function formatLargeValue(
  value: number,
  cryptoId?: string,
  currency?: CurrencyCode,
): string {
  let symbol: string;
  if (currency) {
    symbol = CURRENCY_SYMBOLS[currency] || "$";
  } else {
    cryptoId = cryptoId || "";
    symbol = IDR_COINS.has(cryptoId) ? "Rp" : "$";
  }

  if (currency === "IDR" || (currency === undefined && IDR_COINS.has(cryptoId || ""))) {
    if (value >= 1e12) return `${"Rp"}${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `${"Rp"}${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${"Rp"}${(value / 1e6).toFixed(1)}Jt`;
    return `${"Rp"}${value.toLocaleString("id-ID")}`;
  }

  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  return `$${(value / 1e6).toFixed(1)}M`;
}

export function getCurrencyForAsset(cryptoId: string): CurrencyCode {
  return IDR_COINS.has(cryptoId) ? "IDR" : "USD";
}

export function convertPrice(
  price: string | number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: { fromCurrency: string; toCurrency: string; rate: string }[],
): number {
  if (from === to) return typeof price === "string" ? parseFloat(price) : price;

  const rate = rates.find((r) => r.fromCurrency === from && r.toCurrency === to);
  if (!rate) {
    const usdToFrom = rates.find((r) => r.fromCurrency === "USD" && r.toCurrency === from);
    const usdToTo = rates.find((r) => r.fromCurrency === "USD" && r.toCurrency === to);
    if (usdToFrom && usdToTo) {
      const num = typeof price === "string" ? parseFloat(price) : price;
      const usdAmount = num / parseFloat(usdToFrom.rate);
      return usdAmount * parseFloat(usdToTo.rate);
    }
    return typeof price === "string" ? parseFloat(price) : price;
  }

  const num = typeof price === "string" ? parseFloat(price) : price;
  return num * parseFloat(rate.rate);
}
