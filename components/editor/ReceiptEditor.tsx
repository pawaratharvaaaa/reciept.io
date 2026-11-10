"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Printer,
  Download,
  Share2,
  Plus,
  Trash2,
  CheckCircle2,
  BookmarkPlus,
  Copy,
  Check,
  Building2,
  UserCheck,
  FileText,
  CreditCard,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  Dumbbell,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { Receipt, LineItem, Customer, Product, ReceiptTemplateKey } from "@/lib/types/receipt";
import {
  calculateReceiptTotals,
  calculateLineItem,
  toMinorUnits,
  fromMinorUnits,
  determineReceiptStatus,
} from "@/lib/financial/calculations";
import { formatCurrency, SUPPORTED_CURRENCIES } from "@/lib/financial/currencies";
import { db } from "@/lib/offline/db";
import { ReceiptRenderer } from "../templates/ReceiptRenderer";
import { generateUUID } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import { BUSINESS_CATEGORIES, BusinessCategoryKey } from "@/lib/business-categories";
import { ThermalPrinterEngine, ThermalPaperWidth } from "@/lib/printing/thermal-printer";
import { pushAllToCloud } from "@/lib/sync/sync-coordinator";

interface ReceiptEditorProps {
  initialReceipt?: Receipt;
}

export const ReceiptEditor: React.FC<ReceiptEditorProps> = ({ initialReceipt }) => {
  const router = useRouter();
  const { user, businessProfile } = useAuth();

  // Stable internal Receipt ID
  const [receiptPermanentId, setReceiptPermanentId] = useState<string>(
    initialReceipt?.id || "rec-" + generateUUID().slice(0, 8)
  );
  const [copiedId, setCopiedId] = useState(false);

  // Pocket printer settings
  const [autoPrintToPocketMachine, setAutoPrintToPocketMachine] = useState<boolean>(false);
  const [thermalWidth, setThermalWidth] = useState<ThermalPaperWidth>("58mm");
  const [printerMenuOpen, setPrinterMenuOpen] = useState(false);

  // Reference data loaded from IndexedDB
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [previewZoom, setPreviewZoom] = useState<number>(100);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Category context
  const currentCategory = (businessProfile?.businessCategory || user?.businessCategory || "gym_fitness") as BusinessCategoryKey;
  const categoryConfig = BUSINESS_CATEGORIES[currentCategory] || BUSINESS_CATEGORIES.custom;

  // Form State
  const [receiptType, setReceiptType] = useState<"sales" | "payment">(
    initialReceipt?.receiptType || "sales"
  );
  const [receiptNumber, setReceiptNumber] = useState<string>(
    initialReceipt?.receiptNumber || "REC-10042"
  );
  const [currency, setCurrency] = useState<string>(initialReceipt?.currency || "INR");
  const [issueDate, setIssueDate] = useState<string>(
    initialReceipt?.issueDate || "2026-11-09"
  );
  const [transactionDate, setTransactionDate] = useState<string>(
    initialReceipt?.transactionDate || "2026-11-09"
  );

  // Business Snapshot
  const [businessName, setBusinessName] = useState(
    initialReceipt?.businessSnapshot?.businessName || businessProfile?.businessName || "My Business"
  );
  const [businessTaxId, setBusinessTaxId] = useState(
    initialReceipt?.businessSnapshot?.taxIdentifier || businessProfile?.taxIdentifier || ""
  );
  const [businessEmail, setBusinessEmail] = useState(
    initialReceipt?.businessSnapshot?.email || businessProfile?.email || "billing@business.com"
  );
  const [businessPhone, setBusinessPhone] = useState(
    initialReceipt?.businessSnapshot?.phone || businessProfile?.phone || "+91 98765 43210"
  );
  const [businessAddress, setBusinessAddress] = useState(
    initialReceipt?.businessSnapshot?.address?.line1 || businessProfile?.address?.line1 || "Main Commercial Complex"
  );

  // Customer Snapshot
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialReceipt?.customerId || ""
  );
  const [customerName, setCustomerName] = useState(
    initialReceipt?.customerSnapshot?.name || (currentCategory === "gym_fitness" ? "Member: Rahul Verma" : "Walk-in Customer")
  );
  const [customerEmail, setCustomerEmail] = useState(
    initialReceipt?.customerSnapshot?.email || "customer@example.com"
  );
  const [customerPhone, setCustomerPhone] = useState(
    initialReceipt?.customerSnapshot?.phone || "+91 98200 11223"
  );
  const [customerTaxId, setCustomerTaxId] = useState(
    initialReceipt?.customerSnapshot?.taxIdentifier || ""
  );
  const [customerAddress, setCustomerAddress] = useState(
    initialReceipt?.customerSnapshot?.address?.line1 || "Mumbai, India"
  );

  // Line items state
  const [items, setItems] = useState<
    Array<{
      id: string;
      productId?: string;
      description: string;
      skuSnapshot?: string;
      unit?: string;
      quantity: number;
      unitPriceStr: string;
      discountStr: string;
      taxRate: number;
    }>
  >(
    initialReceipt?.items.map((it) => ({
      id: it.id,
      productId: it.productId,
      description: it.description,
      skuSnapshot: it.skuSnapshot,
      quantity: it.quantity,
      unitPriceStr: fromMinorUnits(it.unitPriceMinor).toString(),
      discountStr: fromMinorUnits(it.discountMinor).toString(),
      taxRate: it.taxRate,
    })) || [
      {
        id: "item-1",
        description: currentCategory === "gym_fitness" ? "Quarterly Gym Membership Plan (3 Months)" : "Daily Store Essentials Pack",
        skuSnapshot: currentCategory === "gym_fitness" ? "GYM-QTR-01" : "STR-PK-01",
        quantity: 1,
        unitPriceStr: currentCategory === "gym_fitness" ? "5500" : "1250",
        discountStr: "0",
        taxRate: 18,
      },
    ]
  );

  // Payments & terms
  const [orderDiscountStr, setOrderDiscountStr] = useState<string>(
    fromMinorUnits(initialReceipt?.discountMinor || 0).toString()
  );
  const [amountPaidStr, setAmountPaidStr] = useState<string>(
    fromMinorUnits(initialReceipt?.amountPaidMinor || 0).toString()
  );
  const [paymentMethod, setPaymentMethod] = useState<string>("upi");
  const [paymentRef, setPaymentRef] = useState<string>("");

  const [notes, setNotes] = useState(
    initialReceipt?.notes || (currentCategory === "gym_fitness" ? "Includes full locker, steam bath & cardio deck access." : "Thank you for shopping with us!")
  );
  const [terms, setTerms] = useState(
    initialReceipt?.terms || categoryConfig.termsPlaceholder
  );
  const [footerMessage, setFooterMessage] = useState(
    initialReceipt?.footerMessage || "For inquiries or support, please contact us."
  );

  // Template settings (Standardized to Retail POS format)
  const [templateKey, setTemplateKey] = useState<ReceiptTemplateKey>("retail");
  const [accentColor, setAccentColor] = useState<string>(
    initialReceipt?.templateConfig?.accentColor || "#171717"
  );

  // On mount or profile change
  useEffect(() => {
    const prefs = ThermalPrinterEngine.getPreferences();
    setAutoPrintToPocketMachine(prefs.autoPrintOnSave);
    setThermalWidth(prefs.paperWidth);

    if (!initialReceipt) {
      const today = new Date().toISOString().split("T")[0];
      const prefix = businessProfile?.receiptPrefix || categoryConfig.receiptPrefix || "REC-";
      setReceiptNumber(`${prefix}${Math.floor(1000 + Math.random() * 9000)}`);
      setIssueDate(today);
      setTransactionDate(today);

      if (businessProfile) {
        setBusinessName(businessProfile.businessName);
        if (businessProfile.taxIdentifier) setBusinessTaxId(businessProfile.taxIdentifier);
        if (businessProfile.email) setBusinessEmail(businessProfile.email);
        if (businessProfile.phone) setBusinessPhone(businessProfile.phone);
        if (businessProfile.address?.line1) setBusinessAddress(businessProfile.address.line1);
      }
    }

    async function loadData() {
      const orgId = businessProfile?.organizationId || user?.organizationId;
      const allCustomers = orgId
        ? await db.customers.filter((c) => c.organizationId === orgId).toArray()
        : await db.customers.toArray();

      const allProducts = orgId
        ? await db.products.filter((p) => p.organizationId === orgId).toArray()
        : await db.products.toArray();

      setCustomers(allCustomers.length > 0 ? allCustomers : await db.customers.toArray());
      setProducts(allProducts.length > 0 ? allProducts : await db.products.toArray());
    }
    loadData();
  }, [initialReceipt, businessProfile, user]);

  const handleCustomerSelect = (custId: string) => {
    setSelectedCustomerId(custId);
    const found = customers.find((c) => c.id === custId);
    if (found) {
      setCustomerName(found.name);
      setCustomerEmail(found.email || "");
      setCustomerPhone(found.phone || "");
      setCustomerTaxId(found.taxIdentifier || "");
      setCustomerAddress(
        found.billingAddress?.line1
          ? `${found.billingAddress.line1}, ${found.billingAddress.city || ""}`
          : ""
      );
    }
  };

  // Convert items to LineItem format with calculated minor values
  const calculatedItems: LineItem[] = items.map((it, idx) => {
    const unitPriceMinor = toMinorUnits(it.unitPriceStr || 0);
    const discountMinor = toMinorUnits(it.discountStr || 0);
    const calc = calculateLineItem({
      quantity: it.quantity,
      unitPriceMinor,
      discountMinor,
      taxRate: it.taxRate,
    });

    return {
      id: it.id || `item-${idx}`,
      productId: it.productId,
      description: it.description,
      skuSnapshot: it.skuSnapshot,
      quantity: it.quantity,
      unitPriceMinor,
      discountMinor,
      taxRate: it.taxRate,
      taxMinor: calc.taxMinor,
      lineTotalMinor: calc.lineTotalMinor,
      sortOrder: idx,
    };
  });

  const rawItemInputs = items.map((it) => ({
    quantity: it.quantity,
    unitPriceMinor: toMinorUnits(it.unitPriceStr || 0),
    discountMinor: toMinorUnits(it.discountStr || 0),
    taxRate: it.taxRate,
  }));

  const orderDiscountMinor = toMinorUnits(orderDiscountStr || 0);
  const amountPaidMinor = toMinorUnits(amountPaidStr || 0);

  const totals = calculateReceiptTotals(rawItemInputs, orderDiscountMinor, amountPaidMinor);
  const status = determineReceiptStatus(totals.totalMinor, totals.amountPaidMinor, false);

  // Construct current real-time Receipt object for live preview
  const liveReceipt: Receipt = {
    id: receiptPermanentId,
    organizationId: businessProfile?.organizationId || user?.organizationId || "org-default-001",
    businessProfileId: businessProfile?.id || "biz-001",
    customerId: selectedCustomerId || undefined,
    receiptNumber: receiptNumber,
    receiptType: receiptType,
    status: status,
    currency: currency,
    issueDate: issueDate,
    transactionDate: transactionDate,
    subtotalMinor: totals.subtotalMinor,
    discountMinor: totals.discountMinor,
    taxMinor: totals.taxMinor,
    totalMinor: totals.totalMinor,
    amountPaidMinor: totals.amountPaidMinor,
    balanceDueMinor: totals.balanceDueMinor,
    customerSnapshot: {
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      address: { line1: customerAddress },
      taxIdentifier: customerTaxId,
    },
    businessSnapshot: {
      businessName: businessName,
      email: businessEmail,
      phone: businessPhone,
      address: { line1: businessAddress },
      taxIdentifier: businessTaxId,
    },
    items: calculatedItems,
    payments:
      amountPaidMinor > 0
        ? [
            {
              id: "pay-current",
              receiptId: receiptPermanentId,
              organizationId: businessProfile?.organizationId || "org-default-001",
              amountMinor: amountPaidMinor,
              currency: currency,
              paymentMethod: paymentMethod as any,
              paymentReference: paymentRef,
              paymentDate: transactionDate,
              status: "recorded",
              isManualEntry: true,
              createdAt: transactionDate,
            },
          ]
        : [],
    notes: notes,
    terms: terms,
    footerMessage: footerMessage,
    templateKey: templateKey,
    templateConfig: {
      accentColor: accentColor,
      fontSize: "base",
      showTaxBreakdown: true,
    },
    version: (initialReceipt?.version || 0) + 1,
    createdBy: user?.id || "usr-admin",
    createdAt: initialReceipt?.createdAt || issueDate,
    updatedAt: issueDate,
  };

  // Add Item
  const handleAddItem = (product?: Product) => {
    if (product) {
      setItems([
        ...items,
        {
          id: generateUUID(),
          productId: product.id,
          description: product.name,
          skuSnapshot: product.sku,
          unit: product.unit,
          quantity: 1,
          unitPriceStr: fromMinorUnits(product.unitPriceMinor).toString(),
          discountStr: "0",
          taxRate: product.defaultTaxRate,
        },
      ]);
    } else {
      setItems([
        ...items,
        {
          id: generateUUID(),
          description: currentCategory === "gym_fitness" ? "Fitness Class Pass / Session" : "Product Item",
          quantity: 1,
          unitPriceStr: "1000",
          discountStr: "0",
          taxRate: 18,
        },
      ]);
    }
  };

  // Quick-save line item to catalogue
  const handleSaveItemToCatalogue = async (item: (typeof items)[0]) => {
    if (!item.description.trim()) return;

    const orgId = businessProfile?.organizationId || user?.organizationId || "org-default-001";
    const newProduct: Product = {
      id: generateUUID(),
      organizationId: orgId,
      name: item.description,
      sku: item.skuSnapshot || `SKU-${Math.floor(100 + Math.random() * 900)}`,
      unitPriceMinor: toMinorUnits(item.unitPriceStr || 0),
      currency,
      defaultTaxRate: item.taxRate,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    await db.products.put(newProduct);
    const updated = await db.products.toArray();
    setProducts(updated);
    setSaveSuccessNotice(`"${item.description}" added to your catalogue!`);
    setTimeout(() => setSaveSuccessNotice(null), 3000);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  // Save receipt to Dexie.js (local-first)
  const handleSave = async (asDraft: boolean = false) => {
    const finalStatus = asDraft ? "draft" : status;

    const receiptToSave: Receipt = {
      ...liveReceipt,
      id: receiptPermanentId,
      status: finalStatus,
    };

    await db.receipts.put(receiptToSave);
    pushAllToCloud(receiptToSave.organizationId).catch(console.error);

    setSaveSuccessNotice(
      asDraft
        ? `Draft #${receiptNumber} saved!`
        : `Receipt #${receiptNumber} issued! ${autoPrintToPocketMachine ? "Auto-printing to pocket machine..." : ""}`
    );

    // Auto-feed to pocket thermal printer if enabled
    if (!asDraft && autoPrintToPocketMachine) {
      setTimeout(() => {
        ThermalPrinterEngine.prepareAndPrint(thermalWidth);
      }, 350);
    }

    setTimeout(() => {
      setSaveSuccessNotice(null);
    }, 4000);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(receiptPermanentId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handlePrint = (width: ThermalPaperWidth = "standard") => {
    ThermalPrinterEngine.prepareAndPrint(width);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] rounded-3xl border border-[#E5E3DC] shadow-sm overflow-hidden bg-white print:border-none print:shadow-none print:rounded-none print:h-auto print:overflow-visible">
      {/* Top Action Bar */}
      <div className="h-14 bg-white border-b border-[#EBE8E1] px-5 sm:px-6 flex items-center justify-between shrink-0 no-print">
        {/* Left Side: Receipt Type Switch & Receipt Number */}
        <div className="flex items-center gap-3">
          {/* Segmented Switch for Sales vs Payment with Animated Sliding Spring Pill */}
          <div className="relative flex items-center bg-[#F4F2EC] p-1 rounded-full border border-[#E5E2D9]">
            {/* Sliding white pill indicator */}
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-white shadow-xs pointer-events-none transition-transform duration-300 ease-[cubic-bezier(0.34,1.35,0.64,1)] ${
                receiptType === "sales" ? "translate-x-0" : "translate-x-full"
              }`}
            />
            <button
              type="button"
              onClick={() => setReceiptType("sales")}
              className={`relative z-10 px-3.5 py-1 rounded-full text-xs font-semibold transition-colors duration-200 cursor-pointer ${
                receiptType === "sales"
                  ? "text-[#171717]"
                  : "text-[#666666] hover:text-[#171717]"
              }`}
            >
              Sales Receipt
            </button>
            <button
              type="button"
              onClick={() => setReceiptType("payment")}
              className={`relative z-10 px-3.5 py-1 rounded-full text-xs font-semibold transition-colors duration-200 cursor-pointer ${
                receiptType === "payment"
                  ? "text-[#171717]"
                  : "text-[#666666] hover:text-[#171717]"
              }`}
            >
              Payment Receipt
            </button>
          </div>

          <div className="h-4 w-[1px] bg-[#E5E2D9]" />

          {/* Receipt Number Badge */}
          <div className="flex items-center gap-1.5 text-xs text-[#666666]">
            <span className="font-mono text-[#888888] font-semibold">#</span>
            <input
              type="text"
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
              className="font-mono font-bold text-[#171717] bg-[#F7F6F2] hover:bg-[#EFECE5] px-2.5 py-1 rounded-lg border border-[#E5E2D9] w-28 text-xs transition outline-hidden focus:border-[#171717]"
              title="Receipt Number"
            />
          </div>

          {/* Permanent ID Badge */}
          <button
            type="button"
            onClick={handleCopyId}
            className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-[#666666] hover:text-[#171717] bg-[#F7F6F2] hover:bg-[#EFECE5] px-2.5 py-1 rounded-lg border border-[#E5E2D9] transition cursor-pointer"
            title="Click to copy permanent Receipt ID"
          >
            <span className="text-[#999999]">ID:</span>
            <span className="font-semibold text-[#171717] max-w-[90px] truncate">{receiptPermanentId.slice(0, 8)}...</span>
            {copiedId ? <Check className="w-3 h-3 text-[#24845B]" /> : <Copy className="w-3 h-3 text-[#888888]" />}
          </button>

          {saveSuccessNotice && (
            <div className="flex items-center gap-1.5 text-xs text-[#24845B] bg-[#EAF5F0] px-3 py-1 rounded-full animate-fade-in font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{saveSuccessNotice}</span>
            </div>
          )}
        </div>

        {/* Right Side: Clean Actions */}
        <div className="flex items-center gap-2">
          {/* Print Dropdown with Pocket Auto-Print Option */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setPrinterMenuOpen(!printerMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E2D9] hover:bg-[#F7F6F2] text-[#171717] rounded-xl text-xs font-semibold transition cursor-pointer"
              title="Print formatting & thermal settings"
            >
              <Printer className="w-3.5 h-3.5 text-[#555555]" />
              <span>Print ({thermalWidth})</span>
              <ChevronDown className="w-3 h-3 text-[#888888]" />
            </button>

            {printerMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setPrinterMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-xl border border-black/10 rounded-2xl shadow-2xl z-50 p-2 text-xs space-y-1">
                  <div className="px-2 py-1 text-[10px] font-mono uppercase text-[#888888] border-b border-[#F2F0EA]">
                    Print Format:
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setThermalWidth("58mm");
                      setTemplateKey("retail");
                      handlePrint("58mm");
                      setPrinterMenuOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-xl transition cursor-pointer ${
                      thermalWidth === "58mm" ? "bg-[#171717] text-white" : "hover:bg-[#F7F6F2] text-[#171717]"
                    }`}
                  >
                    <div className="font-bold">Pocket Printer (58mm)</div>
                    <div className={`text-[10px] ${thermalWidth === "58mm" ? "text-slate-300" : "text-[#777777]"}`}>
                      Handheld Bluetooth 2" slip
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setThermalWidth("80mm");
                      setTemplateKey("retail");
                      handlePrint("80mm");
                      setPrinterMenuOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-xl transition cursor-pointer ${
                      thermalWidth === "80mm" ? "bg-[#171717] text-white" : "hover:bg-[#F7F6F2] text-[#171717]"
                    }`}
                  >
                    <div className="font-bold">Supermarket POS (80mm)</div>
                    <div className={`text-[10px] ${thermalWidth === "80mm" ? "text-slate-300" : "text-[#777777]"}`}>
                      Checkout counter 3" roll
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setThermalWidth("standard");
                      handlePrint("standard");
                      setPrinterMenuOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-xl transition cursor-pointer border-t border-[#F2F0EA] ${
                      thermalWidth === "standard" ? "bg-[#171717] text-white" : "hover:bg-[#F7F6F2] text-[#171717]"
                    }`}
                  >
                    <div className="font-bold">Standard A4 / PDF</div>
                    <div className={`text-[10px] ${thermalWidth === "standard" ? "text-slate-300" : "text-[#777777]"}`}>
                      Full page document format
                    </div>
                  </button>

                  {/* Pocket Auto-Print Toggle inside menu */}
                  <div className="pt-2 mt-1 border-t border-[#F2F0EA] px-2 py-1">
                    <label className="flex items-center justify-between cursor-pointer text-xs">
                      <span className="font-medium text-[#171717]">⚡ Pocket Auto-Print</span>
                      <input
                        type="checkbox"
                        checked={autoPrintToPocketMachine}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setAutoPrintToPocketMachine(val);
                          ThermalPrinterEngine.savePreferences({
                            paperWidth: thermalWidth,
                            autoPrintOnSave: val,
                            soundNotification: true,
                          });
                        }}
                        className="rounded text-[#171717] focus:ring-0"
                      />
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleSave(true)}
            className="px-3.5 py-1.5 border border-[#E5E2D9] hover:bg-[#F7F6F2] text-[#171717] rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Save Draft
          </button>

          <button
            type="button"
            onClick={() => handleSave(false)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#171717] hover:bg-[#2c2c2c] text-white rounded-xl text-xs font-semibold transition shadow-xs cursor-pointer active:scale-95"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save & Issue</span>
          </button>
        </div>
      </div>

      {/* Main Dual-Panel Area */}
      <div className="flex-1 flex overflow-hidden print:overflow-visible print:block">
        {/* LEFT PANEL: Editable Input Form */}
        <div className="w-1/2 border-r border-[#E9E7E1] bg-white overflow-y-auto p-6 space-y-6 no-print">
          {/* Section 1: Business Profile */}
          <div className="space-y-3 pb-6 border-b border-[#F2F0EA]">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#777777] font-semibold flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Business / Store Information
              </span>
              <span className="text-[10px] bg-[#F2F0EA] px-2 py-0.5 rounded font-medium text-[#555555]">
                {categoryConfig.shortName} Mode
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[#777777] mb-1">Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-[#E9E7E1] font-semibold focus:outline-hidden focus:border-[#171717]"
                />
              </div>
              <div>
                <label className="block text-[#777777] mb-1">Tax ID / GSTIN</label>
                <input
                  type="text"
                  value={businessTaxId}
                  onChange={(e) => setBusinessTaxId(e.target.value)}
                  placeholder="e.g. 27AABCC1234F1Z5"
                  className="w-full px-3 py-1.5 rounded-md border border-[#E9E7E1] font-mono focus:outline-hidden focus:border-[#171717]"
                />
              </div>
              <div>
                <label className="block text-[#777777] mb-1">Billing Email</label>
                <input
                  type="email"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-[#E9E7E1] focus:outline-hidden focus:border-[#171717]"
                />
              </div>
              <div>
                <label className="block text-[#777777] mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-[#E9E7E1] focus:outline-hidden focus:border-[#171717]"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[#777777] mb-1">Address / Location</label>
                <input
                  type="text"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-[#E9E7E1] focus:outline-hidden focus:border-[#171717]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Customer / Member Snapshot */}
          <div className="space-y-3 pb-6 border-b border-[#F2F0EA]">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#777777] font-semibold flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                {currentCategory === "gym_fitness" ? "Gym Member Details" : "Customer Information"}
              </span>
              {customers.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#777777]">Select Saved:</span>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className="text-xs px-2 py-1 rounded border border-[#E9E7E1] bg-white font-medium"
                  >
                    <option value="">-- Choose customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[#777777] mb-1">
                  {currentCategory === "gym_fitness" ? "Member Name *" : "Customer Name *"}
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-[#E9E7E1] font-semibold focus:outline-hidden focus:border-[#171717]"
                />
              </div>
              <div>
                <label className="block text-[#777777] mb-1">
                  {currentCategory === "gym_fitness" ? "Member ID / Reg #" : "Tax ID / GSTIN"}
                </label>
                <input
                  type="text"
                  value={customerTaxId}
                  onChange={(e) => setCustomerTaxId(e.target.value)}
                  placeholder={currentCategory === "gym_fitness" ? "MEM-101" : "GSTIN"}
                  className="w-full px-3 py-1.5 rounded-md border border-[#E9E7E1] font-mono focus:outline-hidden focus:border-[#171717]"
                />
              </div>
              <div>
                <label className="block text-[#777777] mb-1">Email</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-[#E9E7E1] focus:outline-hidden focus:border-[#171717]"
                />
              </div>
              <div>
                <label className="block text-[#777777] mb-1">Phone</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-[#E9E7E1] focus:outline-hidden focus:border-[#171717]"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[#777777] mb-1">Billing / Residential Address</label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-[#E9E7E1] focus:outline-hidden focus:border-[#171717]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Receipt Metadata & Currency */}
          <div className="grid grid-cols-3 gap-3 pb-6 border-b border-[#F2F0EA] text-xs">
            <div>
              <label className="block text-[#777777] mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md border border-[#E9E7E1] bg-white font-medium"
              >
                {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[#777777] mb-1">Issue Date</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md border border-[#E9E7E1]"
              />
            </div>
            <div>
              <label className="block text-[#777777] mb-1">Transaction Date</label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md border border-[#E9E7E1]"
              />
            </div>
          </div>

          {/* Section 4: Line Items with Quick Add to Catalogue */}
          <div className="space-y-3 pb-6 border-b border-[#F2F0EA]">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#777777] font-semibold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                {currentCategory === "gym_fitness" ? "Gym Plans & Products" : "Items & Products"}
              </span>

              {products.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#777777]">Choose Plan / Item:</span>
                  <select
                    onChange={(e) => {
                      const prod = products.find((p) => p.id === e.target.value);
                      if (prod) handleAddItem(prod);
                      e.target.value = "";
                    }}
                    className="text-xs px-2 py-1 rounded border border-[#E9E7E1] bg-white font-medium max-w-[200px]"
                  >
                    <option value="">+ Add from catalogue...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatCurrency(p.unitPriceMinor, p.currency)})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              {items.map((item, index) => {
                const lineCalc = calculateLineItem({
                  quantity: item.quantity,
                  unitPriceMinor: toMinorUnits(item.unitPriceStr || 0),
                  discountMinor: toMinorUnits(item.discountStr || 0),
                  taxRate: item.taxRate,
                });

                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border border-[#E9E7E1] bg-[#F7F6F2] text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        placeholder={currentCategory === "gym_fitness" ? "e.g. 6-Month Gold Gym Pass" : "e.g. Basmati Rice (5kg)"}
                        value={item.description}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[index].description = e.target.value;
                          setItems(updated);
                        }}
                        className="flex-1 px-2.5 py-1 rounded border border-[#E9E7E1] bg-white font-medium"
                      />

                      {/* Quick bookmark to catalogue */}
                      <button
                        type="button"
                        onClick={() => handleSaveItemToCatalogue(item)}
                        className="p-1 text-[#555555] hover:text-[#171717] rounded hover:bg-[#E9E7E1] flex items-center gap-1 text-[10px]"
                        title="Save this product to catalogue permanently"
                      >
                        <BookmarkPlus className="w-3.5 h-3.5 text-blue-600" />
                        <span className="hidden sm:inline text-blue-700">Save to Catalogue</span>
                      </button>

                      <button
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length === 1}
                        className="p-1 text-[#777777] hover:text-[#C64B4B] disabled:opacity-30"
                        title="Delete line"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="text-[10px] text-[#777777] block mb-0.5">Quantity</label>
                        <input
                          type="number"
                          step="any"
                          min="0.001"
                          value={item.quantity}
                          onChange={(e) => {
                            const updated = [...items];
                            updated[index].quantity = parseFloat(e.target.value) || 0;
                            setItems(updated);
                          }}
                          className="w-full px-2 py-1 rounded border border-[#E9E7E1] bg-white font-mono text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#777777] block mb-0.5">
                          Price ({currency})
                        </label>
                        <input
                          type="text"
                          value={item.unitPriceStr}
                          onChange={(e) => {
                            const updated = [...items];
                            updated[index].unitPriceStr = e.target.value;
                            setItems(updated);
                          }}
                          className="w-full px-2 py-1 rounded border border-[#E9E7E1] bg-white font-mono text-right"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#777777] block mb-0.5">Tax (%)</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={item.taxRate}
                          onChange={(e) => {
                            const updated = [...items];
                            updated[index].taxRate = parseFloat(e.target.value) || 0;
                            setItems(updated);
                          }}
                          className="w-full px-2 py-1 rounded border border-[#E9E7E1] bg-white font-mono text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#777777] block mb-0.5">Line Total</label>
                        <div className="px-2 py-1 rounded bg-[#E9E7E1] font-mono font-semibold text-right text-[#171717]">
                          {formatCurrency(lineCalc.lineTotalMinor, currency)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <button
                onClick={() => handleAddItem()}
                className="w-full py-2 border border-dashed border-[#E9E7E1] hover:border-[#171717] rounded-lg text-xs font-medium text-[#777777] hover:text-[#171717] flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Line Item / Plan</span>
              </button>
            </div>
          </div>

          {/* Section 5: Payments & Settlement */}
          <div className="space-y-3 pb-6 border-b border-[#F2F0EA] text-xs">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#777777] font-semibold flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" /> Payment & Settlement
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#777777] mb-1">
                  Discount ({currency})
                </label>
                <input
                  type="text"
                  value={orderDiscountStr}
                  onChange={(e) => setOrderDiscountStr(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-[#E9E7E1] font-mono"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-[#777777] mb-1">
                  Amount Received / Paid ({currency})
                </label>
                <input
                  type="text"
                  value={amountPaidStr}
                  onChange={(e) => setAmountPaidStr(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-[#E9E7E1] font-mono font-semibold text-emerald-700"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-[#777777] mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-[#E9E7E1] bg-white capitalize"
                >
                  <option value="upi">UPI / GPay / PhonePe / QR</option>
                  <option value="cash">Cash Tendered</option>
                  <option value="card">Credit / Debit Card</option>
                  <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[#777777] mb-1">Reference / UTR #</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. UPI-982172189"
                  className="w-full px-3 py-1.5 rounded-md border border-[#E9E7E1] font-mono"
                />
              </div>
            </div>

            {/* Quick Balance Preview Card */}
            <div className="bg-[#F7F6F2] p-3 rounded-lg border border-[#E9E7E1] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#777777] block uppercase font-mono">Calculated Status</span>
                <span className="font-semibold capitalize text-[#171717]">{status.replace("_", " ")}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#777777] block uppercase font-mono">Outstanding Balance</span>
                <span className={`font-mono font-bold text-sm ${totals.balanceDueMinor > 0 ? "text-[#C64B4B]" : "text-[#24845B]"}`}>
                  {formatCurrency(totals.balanceDueMinor, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 6: Notes, Terms, and Footer */}
          <div className="space-y-3 pb-6 text-xs">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#777777] font-semibold">
              Terms & Message
            </span>
            <div>
              <label className="block text-[#777777] mb-1">Notes / Instructions</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md border border-[#E9E7E1] text-xs resize-none"
              />
            </div>
            <div>
              <label className="block text-[#777777] mb-1">Terms & Conditions</label>
              <textarea
                rows={2}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md border border-[#E9E7E1] text-xs resize-none"
              />
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Live WYSIWYG Receipt Preview */}
        <div className="w-1/2 bg-[#EFECE6] overflow-y-auto p-6 sm:p-8 flex flex-col items-center justify-start print-only-container print:w-full print:bg-white print:p-0 print:overflow-visible">
          <div className="w-full max-w-[595px] flex items-center justify-between mb-4 no-print gap-2">
            {/* Active Format Badge */}
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-[#DDD9CE] shadow-xs">
              <span className="text-[10px] uppercase font-mono text-[#888888] font-semibold">
                Format:
              </span>
              <span className="text-xs font-bold text-[#171717] font-mono">
                Retail &amp; POS
              </span>
            </div>

            {/* Scale / Zoom Controls */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#DDD9CE] shadow-xs text-[#777777]">
              <span className="text-[10px] font-mono font-semibold px-1.5">
                {previewZoom}%
              </span>
              <button
                type="button"
                onClick={() => setPreviewZoom(Math.max(60, previewZoom - 10))}
                className="p-1 hover:bg-[#F7F6F2] rounded-md cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewZoom(Math.min(140, previewZoom + 10))}
                className="p-1 hover:bg-[#F7F6F2] rounded-md cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Printable Document Box - Centered horizontally, scale reset on print */}
          <div
            className="w-full max-w-[595px] transition-transform origin-top print-document-box print:max-w-none print:transform-none"
            style={{ transform: `scale(${previewZoom / 100})` }}
          >
            <ReceiptRenderer receipt={liveReceipt} />
          </div>
        </div>
      </div>
    </div>
  );
};
