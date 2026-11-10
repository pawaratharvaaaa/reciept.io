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

// Sample seed data to ensure instant out-of-the-box readiness
export async function seedInitialDataIfEmpty() {
  if (typeof window === "undefined") return;

  const orgCount = await db.organizations.count();
  if (orgCount > 0) return; // Already seeded

  const defaultOrgId = "org-default-001";

  const defaultOrg: Organization = {
    id: defaultOrgId,
    name: "Craft Studio & Labs",
    slug: "craft-studio",
    workspaceType: "business",
    defaultCurrency: "INR",
    timezone: "Asia/Kolkata",
    createdAt: new Date().toISOString(),
  };

  const defaultBusinessProfile: BusinessProfile = {
    id: "biz-001",
    organizationId: defaultOrgId,
    businessName: "Craft Studio & Labs Pvt Ltd",
    logoUrl: "",
    email: "billing@craftstudio.in",
    phone: "+91 98765 43210",
    address: {
      line1: "Suite 402, Innov8 Hub, BKC",
      line2: "Bandra East",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400051",
      country: "India",
    },
    taxIdentifier: "27AABCC1234F1Z5", // Sample Indian GSTIN
    website: "https://craftstudio.in",
  };

  const sampleCustomers: Customer[] = [
    {
      id: "cust-001",
      organizationId: defaultOrgId,
      name: "Rohan Mehta",
      email: "rohan.mehta@acmeventures.com",
      phone: "+91 98200 11223",
      billingAddress: {
        line1: "12 Marine Lines",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400020",
        country: "India",
      },
      taxIdentifier: "27AAGPM1122L1Z9",
      notes: "Preferred payment via UPI or NEFT. Net 15.",
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: "cust-002",
      organizationId: defaultOrgId,
      name: "Priya Sharma",
      email: "priya@sharmadesign.co",
      phone: "+91 98110 99887",
      billingAddress: {
        line1: "88 Indiranagar 100ft Road",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560038",
        country: "India",
      },
      notes: "Monthly retainer client.",
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
    {
      id: "cust-003",
      organizationId: defaultOrgId,
      name: "Apex Global Tech Ltd",
      email: "accounts@apextech.io",
      phone: "+91 80 4123 9900",
      billingAddress: {
        line1: "Cyber City, DLF Phase 2",
        city: "Gurugram",
        state: "Haryana",
        postalCode: "122002",
        country: "India",
      },
      taxIdentifier: "06AAACT9988K1ZR",
      notes: "Corporate account, PO required.",
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ];

  const sampleProducts: Product[] = [
    {
      id: "prod-001",
      organizationId: defaultOrgId,
      name: "UI/UX Product Design Sprint",
      description: "End-to-end user research, interactive wireframing, high-fidelity Figma components and user testing.",
      sku: "SVC-DES-01",
      unitPriceMinor: 8500000, // ₹85,000.00
      currency: "INR",
      defaultTaxRate: 18.0,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "prod-002",
      organizationId: defaultOrgId,
      name: "Next.js Fullstack Web Engineering",
      description: "Custom SaaS application development with Next.js App Router, Supabase, and Tailwind CSS.",
      sku: "SVC-DEV-02",
      unitPriceMinor: 12500000, // ₹1,25,000.00
      currency: "INR",
      defaultTaxRate: 18.0,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "prod-003",
      organizationId: defaultOrgId,
      name: "Brand Identity & Design System",
      description: "Complete typography, brand guidelines, color system, icon sets and marketing collateral.",
      sku: "SVC-BRD-03",
      unitPriceMinor: 4500000, // ₹45,000.00
      currency: "INR",
      defaultTaxRate: 18.0,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "prod-004",
      organizationId: defaultOrgId,
      name: "Monthly Cloud Infrastructure Maintenance",
      description: "Vercel, Supabase, database backups, uptime monitoring, and security patching.",
      sku: "RET-OPS-04",
      unitPriceMinor: 2500000, // ₹25,000.00
      currency: "INR",
      defaultTaxRate: 18.0,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];

  const todayStr = new Date().toISOString().split("T")[0];
  const lastWeekStr = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const twoWeeksAgoStr = new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0];

  const sampleReceipts: Receipt[] = [
    {
      id: "rec-001",
      organizationId: defaultOrgId,
      businessProfileId: defaultBusinessProfile.id,
      customerId: "cust-001",
      receiptNumber: "REC-00101",
      receiptType: "sales",
      status: "paid",
      currency: "INR",
      issueDate: twoWeeksAgoStr,
      transactionDate: twoWeeksAgoStr,
      subtotalMinor: 8500000,
      discountMinor: 0,
      taxMinor: 1530000,
      totalMinor: 10030000, // ₹1,00,300.00
      amountPaidMinor: 10030000,
      balanceDueMinor: 0,
      customerSnapshot: {
        name: "Rohan Mehta",
        email: "rohan.mehta@acmeventures.com",
        phone: "+91 98200 11223",
        address: sampleCustomers[0].billingAddress,
        taxIdentifier: sampleCustomers[0].taxIdentifier,
      },
      businessSnapshot: {
        businessName: defaultBusinessProfile.businessName,
        email: defaultBusinessProfile.email,
        phone: defaultBusinessProfile.phone,
        address: defaultBusinessProfile.address,
        taxIdentifier: defaultBusinessProfile.taxIdentifier,
        website: defaultBusinessProfile.website,
      },
      items: [
        {
          id: "item-101",
          productId: "prod-001",
          description: "UI/UX Product Design Sprint - Phase 1 Deliverables",
          skuSnapshot: "SVC-DES-01",
          quantity: 1,
          unitPriceMinor: 8500000,
          discountMinor: 0,
          taxRate: 18.0,
          taxMinor: 1530000,
          lineTotalMinor: 10030000,
          sortOrder: 0,
        },
      ],
      payments: [
        {
          id: "pay-101",
          receiptId: "rec-001",
          organizationId: defaultOrgId,
          amountMinor: 10030000,
          currency: "INR",
          paymentMethod: "bank_transfer",
          paymentReference: "NEFT-HDFC-9928172",
          paymentDate: twoWeeksAgoStr,
          status: "recorded",
          isManualEntry: true,
          notes: "Settled in full via HDFC Corporate Banking.",
          createdAt: twoWeeksAgoStr,
        },
      ],
      notes: "Thank you for partnering with Craft Studio & Labs!",
      terms: "This is a computer-generated tax invoice and payment acknowledgement.",
      footerMessage: "Questions? Email billing@craftstudio.in or call +91 98765 43210.",
      templateKey: "retail",
      templateConfig: {
        accentColor: "#222222",
        fontSize: "base",
        logoPosition: "left",
        showTaxBreakdown: true,
        showSignature: true,
      },
      version: 1,
      createdBy: "usr-admin",
      createdAt: twoWeeksAgoStr,
      updatedAt: twoWeeksAgoStr,
    },
    {
      id: "rec-002",
      organizationId: defaultOrgId,
      businessProfileId: defaultBusinessProfile.id,
      customerId: "cust-002",
      receiptNumber: "REC-00102",
      receiptType: "sales",
      status: "partially_paid",
      currency: "INR",
      issueDate: lastWeekStr,
      transactionDate: lastWeekStr,
      subtotalMinor: 12500000,
      discountMinor: 500000,
      taxMinor: 2160000,
      totalMinor: 14160000, // ₹1,41,600.00
      amountPaidMinor: 7000000, // ₹70,000.00 paid
      balanceDueMinor: 7160000, // ₹71,600.00 balance due
      customerSnapshot: {
        name: "Priya Sharma",
        email: "priya@sharmadesign.co",
        phone: "+91 98110 99887",
        address: sampleCustomers[1].billingAddress,
      },
      businessSnapshot: {
        businessName: defaultBusinessProfile.businessName,
        email: defaultBusinessProfile.email,
        phone: defaultBusinessProfile.phone,
        address: defaultBusinessProfile.address,
        taxIdentifier: defaultBusinessProfile.taxIdentifier,
        website: defaultBusinessProfile.website,
      },
      items: [
        {
          id: "item-201",
          productId: "prod-002",
          description: "Next.js Fullstack Web Engineering - Sprint Milestone",
          skuSnapshot: "SVC-DEV-02",
          quantity: 1,
          unitPriceMinor: 12500000,
          discountMinor: 500000,
          taxRate: 18.0,
          taxMinor: 2160000,
          lineTotalMinor: 14160000,
          sortOrder: 0,
        },
      ],
      payments: [
        {
          id: "pay-201",
          receiptId: "rec-002",
          organizationId: defaultOrgId,
          amountMinor: 7000000,
          currency: "INR",
          paymentMethod: "upi",
          paymentReference: "UPI-40918237910@okaxis",
          paymentDate: lastWeekStr,
          status: "recorded",
          isManualEntry: true,
          notes: "Initial 50% mobilization advance received.",
          createdAt: lastWeekStr,
        },
      ],
      notes: "Balance 50% due upon staging server deployment.",
      terms: "Payment due within 14 days of issue.",
      templateKey: "retail",
      templateConfig: {
        accentColor: "#1E40AF",
        fontSize: "base",
        logoPosition: "left",
        showTaxBreakdown: true,
      },
      version: 1,
      createdBy: "usr-admin",
      createdAt: lastWeekStr,
      updatedAt: lastWeekStr,
    },
    {
      id: "rec-003",
      organizationId: defaultOrgId,
      businessProfileId: defaultBusinessProfile.id,
      customerId: "cust-003",
      receiptNumber: "REC-00103",
      receiptType: "payment",
      status: "issued",
      currency: "INR",
      issueDate: todayStr,
      transactionDate: todayStr,
      subtotalMinor: 5000000,
      discountMinor: 0,
      taxMinor: 900000,
      totalMinor: 5900000, // ₹59,000.00
      amountPaidMinor: 0,
      balanceDueMinor: 5900000,
      customerSnapshot: {
        name: "Apex Global Tech Ltd",
        email: "accounts@apextech.io",
        phone: "+91 80 4123 9900",
        address: sampleCustomers[2].billingAddress,
        taxIdentifier: sampleCustomers[2].taxIdentifier,
      },
      businessSnapshot: {
        businessName: defaultBusinessProfile.businessName,
        email: defaultBusinessProfile.email,
        phone: defaultBusinessProfile.phone,
        address: defaultBusinessProfile.address,
        taxIdentifier: defaultBusinessProfile.taxIdentifier,
        website: defaultBusinessProfile.website,
      },
      items: [
        {
          id: "item-301",
          productId: "prod-004",
          description: "Monthly Cloud Infrastructure Maintenance (2 Months)",
          skuSnapshot: "RET-OPS-04",
          quantity: 2,
          unitPriceMinor: 2500000,
          discountMinor: 0,
          taxRate: 18.0,
          taxMinor: 900000,
          lineTotalMinor: 5900000,
          sortOrder: 0,
        },
      ],
      payments: [],
      notes: "Invoice issued for upcoming 2-month maintenance period.",
      terms: "Kindly quote receipt number REC-00103 in your bank transfer description.",
      templateKey: "retail",
      templateConfig: {
        accentColor: "#222222",
        fontSize: "base",
        logoPosition: "center",
        showTaxBreakdown: true,
        showSignature: true,
      },
      version: 1,
      createdBy: "usr-admin",
      createdAt: todayStr,
      updatedAt: todayStr,
    },
  ];

  const defaultUser: UserProfile = {
    id: "usr-admin-01",
    email: "admin@craftstudio.in",
    fullName: "Rohan Mehta (Admin)",
    businessName: "Craft Studio & Labs Pvt Ltd",
    businessCategory: "freelancer_services",
    organizationId: defaultOrgId,
    createdAt: new Date().toISOString(),
  };

  await db.organizations.add(defaultOrg);
  await db.businessProfiles.add(defaultBusinessProfile);
  await db.customers.bulkAdd(sampleCustomers);
  await db.products.bulkAdd(sampleProducts);
  await db.receipts.bulkAdd(sampleReceipts);
  await db.users.add(defaultUser);
}
