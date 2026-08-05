const IDR_COINS = new Set([
  'bank',
  'skyai',
  'ub',
  'hei',
  'hft',
]);

export function getCurrencySymbol(cryptoId: string): string {
  return IDR_COINS.has(cryptoId) ? 'Rp' : '$';
}

export function formatPrice(price: string | null | undefined, cryptoId: string): string {
  if (!price) return `${getCurrencySymbol(cryptoId)}0.00`;
  const num = parseFloat(price);
  const symbol = getCurrencySymbol(cryptoId);
  
  if (cryptoId && IDR_COINS.has(cryptoId)) {
    if (num >= 1000) {
      return `Rp${num.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `Rp${num.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  
  if (num >= 1000) {
    return `$${(num / 1000).toFixed(2)}K`;
  }
  return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}`;
}

export function formatLargeValue(value: number, cryptoId: string): string {
  const symbol = getCurrencySymbol(cryptoId);
  if (cryptoId && IDR_COINS.has(cryptoId)) {
    if (value >= 1e12) return `${symbol}${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `${symbol}${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${symbol}${(value / 1e6).toFixed(1)}M`;
    return `${symbol}${value.toLocaleString('id-ID')}`;
  }
  if (value >= 1e12) return `${symbol}${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `${symbol}${(value / 1e9).toFixed(1)}B`;
  return `${symbol}${(value / 1e6).toFixed(1)}M`;
}
