export type WorkspaceType = "personal" | "business";

export type BusinessCategory =
  | "gym_fitness"
  | "general_store"
  | "freelancer_services"
  | "restaurant_cafe"
  | "individual_personal"
  | "custom";

export type ReceiptType = "sales" | "payment";

export type ReceiptStatus =
  | "draft"
  | "issued"
  | "paid"
  | "partially_paid"
  | "voided"
  | "cancelled";

export type PaymentMethod =
  | "cash"
  | "card"
  | "bank_transfer"
  | "upi"
  | "other";

export type PaymentStatus = "recorded" | "reconciled" | "failed";

export type ReceiptTemplateKey =
  | "minimal"
  | "classic"
  | "modern"
  | "elegant"
  | "retail"
  | "professional";

export interface Address {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface BusinessProfile {
  id: string;
  organizationId: string;
  businessName: string;
  businessCategory?: BusinessCategory;
  receiptPrefix?: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
  address?: Address;
  taxIdentifier?: string; // e.g. GSTIN, PAN, VAT, Tax ID
  website?: string;
}

export interface Customer {
  id: string;
  organizationId: string;
  name: string;
  email?: string;
  phone?: string;
  billingAddress?: Address;
  taxIdentifier?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  sku?: string;
  unit?: string; // e.g. "kg", "pcs", "Month", "Session", "Year"
  category?: string; // e.g. "Membership", "Grocery", "Service"
  unitPriceMinor: number; // Stored in integer minor units (paise/cents)
  currency: string;
  defaultTaxRate: number; // e.g. 18.0 for 18%
  isActive: boolean;
  createdAt: string;
}

export interface LineItem {
  id: string;
  productId?: string;
  description: string;
  skuSnapshot?: string;
  quantity: number;
  unitPriceMinor: number;
  discountMinor: number;
  taxRate: number; // percentage, e.g. 18.0
  taxMinor: number;
  lineTotalMinor: number;
  sortOrder?: number;
}

export interface PaymentRecord {
  id: string;
  receiptId: string;
  organizationId: string;
  amountMinor: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  paymentDate: string;
  status: PaymentStatus;
  isManualEntry: boolean;
  notes?: string;
  createdAt: string;
}

export interface TemplateConfig {
  accentColor?: string; // hex color e.g. #222222, #1E40AF, #047857
  fontSize?: "sm" | "base" | "lg";
  logoPosition?: "left" | "right" | "center";
  showTaxBreakdown?: boolean;
  showSignature?: boolean;
  showTerms?: boolean;
}

export interface Receipt {
  id: string;
  organizationId: string;
  businessProfileId: string;
  customerId?: string;
  receiptNumber: string;
  receiptType: ReceiptType;
  status: ReceiptStatus;
  currency: string;
  issueDate: string; // YYYY-MM-DD
  transactionDate: string; // YYYY-MM-DD
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
  amountPaidMinor: number;
  balanceDueMinor: number;
  customerSnapshot: {
    name: string;
    email?: string;
    phone?: string;
    address?: Address;
    taxIdentifier?: string;
  };
  businessSnapshot: {
    businessName: string;
    logoUrl?: string;
    email?: string;
    phone?: string;
    address?: Address;
    taxIdentifier?: string;
    website?: string;
  };
  items: LineItem[];
  payments: PaymentRecord[];
  notes?: string;
  terms?: string;
  footerMessage?: string;
  signatureUrl?: string;
  templateKey: ReceiptTemplateKey;
  templateConfig: TemplateConfig;
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  workspaceType: WorkspaceType;
  defaultCurrency: string;
  timezone: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  businessName: string;
  businessCategory: BusinessCategory;
  organizationId: string;
  avatarUrl?: string;
  createdAt: string;
}
