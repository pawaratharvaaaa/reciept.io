import { LineItem, Receipt } from "../types/receipt";

/**
 * Converts a decimal monetary number (e.g. 199.50) to integer minor currency units (e.g. 19950 paise/cents).
 */
export function toMinorUnits(decimalAmount: number | string): number {
  if (typeof decimalAmount === "string") {
    decimalAmount = parseFloat(decimalAmount.replace(/[^0-9.-]+/g, "")) || 0;
  }
  return Math.round(decimalAmount * 100);
}

/**
 * Converts integer minor currency units (e.g. 19950) to decimal representation (199.50).
 */
export function fromMinorUnits(minorUnits: number): number {
  return (minorUnits || 0) / 100;
}

export interface LineItemCalculationInput {
  quantity: number;
  unitPriceMinor: number;
  discountMinor?: number;
  taxRate?: number;
}

/**
 * Calculates a single line item with integer minor accuracy.
 */
export function calculateLineItem(item: LineItemCalculationInput): {
  subtotalMinor: number;
  taxMinor: number;
  lineTotalMinor: number;
} {
  const quantity = Number(item.quantity) || 0;
  const unitPriceMinor = Math.round(Number(item.unitPriceMinor) || 0);
  const discountMinor = Math.round(Number(item.discountMinor) || 0);
  const taxRate = Number(item.taxRate) || 0;

  // Base raw subtotal before line discount
  const rawBase = Math.round(quantity * unitPriceMinor);
  const subtotalMinor = Math.max(0, rawBase - discountMinor);

  // Tax on discounted line amount (half-up rounding)
  const taxMinor = Math.round(subtotalMinor * (taxRate / 100));
  const lineTotalMinor = subtotalMinor + taxMinor;

  return {
    subtotalMinor,
    taxMinor,
    lineTotalMinor,
  };
}

export interface ReceiptTotalsCalculation {
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
  amountPaidMinor: number;
  balanceDueMinor: number;
}

/**
 * Calculates receipt totals from items, order discount, and paid amounts.
 */
export function calculateReceiptTotals(
  items: Array<{
    quantity: number;
    unitPriceMinor: number;
    discountMinor?: number;
    taxRate?: number;
  }>,
  additionalDiscountMinor: number = 0,
  amountPaidMinor: number = 0
): ReceiptTotalsCalculation {
  let subtotalMinor = 0;
  let lineDiscountsMinor = 0;
  let taxMinor = 0;

  for (const item of items) {
    const qty = Number(item.quantity) || 0;
    const price = Math.round(Number(item.unitPriceMinor) || 0);
    const disc = Math.round(Number(item.discountMinor) || 0);
    const taxRate = Number(item.taxRate) || 0;

    const lineBase = Math.round(qty * price);
    const lineEffective = Math.max(0, lineBase - disc);
    const lineTax = Math.round(lineEffective * (taxRate / 100));

    subtotalMinor += lineBase;
    lineDiscountsMinor += disc;
    taxMinor += lineTax;
  }

  const totalDiscountMinor = lineDiscountsMinor + Math.round(Number(additionalDiscountMinor) || 0);
  const taxableBase = Math.max(0, subtotalMinor - totalDiscountMinor);
  const totalMinor = taxableBase + taxMinor;

  const paidMinor = Math.round(Number(amountPaidMinor) || 0);
  const balanceDueMinor = Math.max(0, totalMinor - paidMinor);

  return {
    subtotalMinor,
    discountMinor: totalDiscountMinor,
    taxMinor,
    totalMinor,
    amountPaidMinor: paidMinor,
    balanceDueMinor,
  };
}

/**
 * Determines receipt status based on payment and draft state.
 */
export function determineReceiptStatus(
  totalMinor: number,
  amountPaidMinor: number,
  isDraft: boolean = false,
  isVoided: boolean = false
): Receipt["status"] {
  if (isVoided) return "voided";
  if (isDraft) return "draft";
  if (totalMinor > 0 && amountPaidMinor >= totalMinor) return "paid";
  if (amountPaidMinor > 0 && amountPaidMinor < totalMinor) return "partially_paid";
  return "issued";
}
