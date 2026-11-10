import Dexie, { type Table } from "dexie";
import {
  Receipt,
  Customer,
  Product,
  BusinessProfile,
  PaymentRecord,
  Organization,
  UserProfile,
} from "../types/receipt";

export interface SyncQueueRecord {
  id: string;
  entityType: "receipt" | "customer" | "product" | "payment" | "business_profile";
  entityId: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  payload: any;
  clientTimestamp: string;
  retryCount: number;
}

export class RecieptDatabase extends Dexie {
  receipts!: Table<Receipt, string>;
  customers!: Table<Customer, string>;
  products!: Table<Product, string>;
  businessProfiles!: Table<BusinessProfile, string>;
  payments!: Table<PaymentRecord, string>;
  organizations!: Table<Organization, string>;
  syncQueue!: Table<SyncQueueRecord, string>;
  users!: Table<UserProfile, string>;

  constructor() {
    super("RecieptIoDatabase");
    this.version(1).stores({
      receipts:
        "id, organizationId, receiptNumber, receiptType, status, currency, issueDate, totalMinor, balanceDueMinor, updatedAt, [organizationId+receiptNumber]",
      customers: "id, organizationId, name, email, phone, updatedAt",
      products: "id, organizationId, name, sku, unitPriceMinor, isActive",
      businessProfiles: "id, organizationId, businessName",
      payments: "id, receiptId, organizationId, paymentDate, status",
      organizations: "id, slug, workspaceType",
      syncQueue: "id, entityType, entityId, clientTimestamp, retryCount",
    });
    this.version(2).stores({
      users: "id, email, organizationId, createdAt",
    });
  }
}

export const db = new RecieptDatabase();

// Database is empty by default: zero accounts active until user registers or signs in
export async function seedInitialDataIfEmpty() {
  // Zero accounts active by default: user must register or login first before using.
  return;
}
