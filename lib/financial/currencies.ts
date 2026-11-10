export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  minorUnits: number;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  INR: {
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
    locale: "en-IN",
    minorUnits: 2,
  },
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    locale: "en-US",
    minorUnits: 2,
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    locale: "de-DE",
    minorUnits: 2,
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    locale: "en-GB",
    minorUnits: 2,
  },
  AED: {
    code: "AED",
    symbol: "AED",
    name: "UAE Dirham",
    locale: "en-AE",
    minorUnits: 2,
  },
  CAD: {
    code: "CAD",
    symbol: "CA$",
    name: "Canadian Dollar",
    locale: "en-CA",
    minorUnits: 2,
  },
  AUD: {
    code: "AUD",
    symbol: "AU$",
    name: "Australian Dollar",
    locale: "en-AU",
    minorUnits: 2,
  },
  SGD: {
    code: "SGD",
    symbol: "SG$",
    name: "Singapore Dollar",
    locale: "en-SG",
    minorUnits: 2,
  },
};

/**
 * Formats integer minor units into a localized currency string.
 * e.g. 15000000 minor units of INR -> "₹1,50,000.00" (Lakh grouping)
 */
export function formatCurrency(
  minorUnits: number = 0,
  currencyCode: string = "INR",
  options?: { showSymbol?: boolean; hideZeroDecimals?: boolean }
): string {
  const currency = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.INR;
  const decimalValue = (minorUnits || 0) / Math.pow(10, currency.minorUnits);

  try {
    const formatter = new Intl.NumberFormat(currency.locale, {
      style: options?.showSymbol !== false ? "currency" : "decimal",
      currency: currency.code,
      minimumFractionDigits: options?.hideZeroDecimals && decimalValue % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    });
    return formatter.format(decimalValue);
  } catch {
    // Fallback formatting if Intl lacks locale support
    const symbol = options?.showSymbol !== false ? `${currency.symbol} ` : "";
    return `${symbol}${decimalValue.toFixed(2)}`;
  }
}
