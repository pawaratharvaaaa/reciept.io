"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Search,
  Tag,
  DollarSign,
  Percent,
  Trash2,
  Edit2,
  X,
  Check,
  Dumbbell,
  ShoppingBag,
  Laptop,
  Coffee,
  Sparkles,
} from "lucide-react";
import { Product } from "@/lib/types/receipt";
import { formatCurrency, SUPPORTED_CURRENCIES } from "@/lib/financial/currencies";
import { toMinorUnits, fromMinorUnits } from "@/lib/financial/calculations";
import { db } from "@/lib/offline/db";
import { generateUUID } from "@/lib/utils";
import { pushAllToCloud } from "@/lib/sync/sync-coordinator";
import { useAuth } from "@/lib/auth/auth-context";
import { BUSINESS_CATEGORIES, BusinessCategoryKey } from "@/lib/business-categories";

export const ProductCatalog: React.FC = () => {
  const { user, businessProfile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sku, setSku] = useState("");
  const [unit, setUnit] = useState("Item");
  const [unitPriceStr, setUnitPriceStr] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [defaultTaxRate, setDefaultTaxRate] = useState(18);

  const currentCategory = (businessProfile?.businessCategory || user?.businessCategory || "gym_fitness") as BusinessCategoryKey;

  useEffect(() => {
    loadProducts();
  }, [user, businessProfile]);

  const loadProducts = async () => {
    const orgId = businessProfile?.organizationId || user?.organizationId;
    const all = orgId
      ? await db.products.filter((p) => p.organizationId === orgId).toArray()
      : await db.products.toArray();

    setProducts(all.length > 0 ? all : await db.products.toArray());
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setName(product.name);
      setDescription(product.description || "");
      setSku(product.sku || "");
      setUnit(product.unit || "Item");
      setUnitPriceStr(fromMinorUnits(product.unitPriceMinor).toString());
      setCurrency(product.currency);
      setDefaultTaxRate(product.defaultTaxRate);
    } else {
      setEditingProduct(null);
      setName("");
      setDescription("");
      setSku(`SKU-${Math.floor(100 + Math.random() * 900)}`);
      setUnit(currentCategory === "gym_fitness" ? "Month" : "Pack");
      setUnitPriceStr(currentCategory === "gym_fitness" ? "2500" : "150");
      setCurrency("INR");
      setDefaultTaxRate(currentCategory === "general_store" ? 5 : 18);
    }
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const unitPriceMinor = toMinorUnits(unitPriceStr || 0);
    const orgId = businessProfile?.organizationId || user?.organizationId || "org-default-001";

    const productData: Product = {
      id: editingProduct?.id || generateUUID(),
      organizationId: orgId,
      name: name.trim(),
      description: description.trim() || undefined,
      sku: sku.trim() || undefined,
      unit: unit.trim() || undefined,
      unitPriceMinor,
      currency,
      defaultTaxRate: Number(defaultTaxRate) || 0,
      isActive: true,
      createdAt: editingProduct?.createdAt || new Date().toISOString(),
    };

    await db.products.put(productData);
    pushAllToCloud().catch(console.error);
    setIsModalOpen(false);
    loadProducts();

    setNotification(`Product "${name}" saved!`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to remove this item from the catalogue?")) {
      await db.products.delete(id);
      pushAllToCloud().catch(console.error);
      loadProducts();
    }
  };

  const handleDeleteAllProducts = async () => {
    if (products.length === 0) return;
    if (
      confirm(
        `Are you sure you want to permanently delete ALL ${products.length} products from your catalogue? This cannot be undone.`
      )
    ) {
      await db.products.clear();
      pushAllToCloud().catch(console.error);
      loadProducts();
      setNotification("All catalogue items have been deleted.");
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // 1-Click Load Starter Products for an Industry
  const handleLoadStarterKit = async (catKey: BusinessCategoryKey) => {
    const orgId = businessProfile?.organizationId || user?.organizationId || "org-default-001";
    const kit = BUSINESS_CATEGORIES[catKey];
    if (!kit || kit.starterProducts.length === 0) return;

    const newItems: Product[] = kit.starterProducts.map((p) => ({
      id: generateUUID(),
      organizationId: orgId,
      name: p.name,
      description: p.description,
      sku: p.sku,
      unit: p.unit,
      unitPriceMinor: p.unitPriceMinor,
      currency: "INR",
      defaultTaxRate: p.defaultTaxRate,
      isActive: true,
      createdAt: new Date().toISOString(),
    }));

    await db.products.bulkAdd(newItems);
    await loadProducts();

    setNotification(`Loaded ${newItems.length} starter items for ${kit.shortName}!`);
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#171717]">Product Catalogue</h1>
          <p className="text-xs text-[#777777] mt-1">
            Maintain your reusable products, gym membership plans, retail items, and services.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {products.length > 0 && (
            <button
              onClick={handleDeleteAllProducts}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-slate-300 hover:border-rose-300 rounded-lg text-xs font-medium transition cursor-pointer"
              title="Delete all products in catalogue"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete All</span>
            </button>
          )}

          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#171717] hover:bg-[#222222] text-white rounded-lg text-xs font-medium transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product / Plan</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-[#EAF5F0] text-[#24845B] rounded-lg text-xs font-medium flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* 1-Click Starter Kits Banner */}
      <div className="bg-white p-4 rounded-xl border border-[#E9E7E1] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold text-[#171717]">Quick Load Industry Starter Packs:</span>
            <span className="text-[#777777] block text-[11px]">
              Add ready-to-use pricing plans and inventory items with 1 click:
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleLoadStarterKit("gym_fitness")}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#F7F6F2] hover:bg-[#E9E7E1] text-[#171717] rounded-lg border border-[#E9E7E1] text-xs font-medium transition"
          >
            <Dumbbell className="w-3.5 h-3.5 text-blue-600" />
            <span>+ Gym & Fitness Plans</span>
          </button>

          <button
            onClick={() => handleLoadStarterKit("general_store")}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#F7F6F2] hover:bg-[#E9E7E1] text-[#171717] rounded-lg border border-[#E9E7E1] text-xs font-medium transition"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
            <span>+ General Store Items</span>
          </button>

          <button
            onClick={() => handleLoadStarterKit("freelancer_services")}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#F7F6F2] hover:bg-[#E9E7E1] text-[#171717] rounded-lg border border-[#E9E7E1] text-xs font-medium transition"
          >
            <Laptop className="w-3.5 h-3.5 text-purple-600" />
            <span>+ Agency Milestones</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E9E7E1] shadow-xs flex items-center gap-3">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-[#777777] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by product name, SKU, plan description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E9E7E1] text-xs focus:outline-hidden focus:border-[#171717]"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-[#E9E7E1] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F7F6F2] border-b border-[#E9E7E1] text-[#777777] font-mono uppercase text-[11px]">
                <th className="py-3 px-4 font-medium">Item / Plan Name</th>
                <th className="py-3 px-4 font-medium">SKU / Code</th>
                <th className="py-3 px-4 font-medium">Billing Unit</th>
                <th className="py-3 px-4 font-medium text-right">Standard Rate</th>
                <th className="py-3 px-4 font-medium text-right">Default Tax</th>
                <th className="py-3 px-4 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F0EA]">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-[#F7F6F2] transition">
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-[#171717] block">{p.name}</span>
                    {p.description && (
                      <span className="text-[11px] text-[#777777] line-clamp-1">{p.description}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#777777]">{p.sku || "—"}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">
                    <span className="bg-[#F2F0EA] px-2 py-0.5 rounded text-[11px]">
                      {p.unit || "Item"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-[#171717]">
                    {formatCurrency(p.unitPriceMinor, p.currency)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-[#777777]">
                    {p.defaultTaxRate}%
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleOpenModal(p)}
                        className="p-1 text-[#777777] hover:text-[#171717] rounded hover:bg-[#E9E7E1]"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1 text-[#777777] hover:text-[#C64B4B] rounded hover:bg-[#FDF2F2]"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-[#E9E7E1] shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#F2F0EA] pb-3">
              <h2 className="text-base font-bold text-[#171717]">
                {editingProduct ? "Edit Product / Plan" : "Add Product or Service Plan"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#777777] hover:text-[#171717]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#777777] mb-1">
                  Product / Plan Name * (e.g. "Monthly Gym Pass" or "Basmati Rice 5kg")
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Annual Gym Membership"
                  className="w-full px-3 py-2 rounded-lg border border-[#E9E7E1] focus:outline-hidden focus:border-[#171717]"
                />
              </div>

              <div>
                <label className="block text-[#777777] mb-1">Description / Features</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Plan benefits, duration, or specifications..."
                  className="w-full px-3 py-2 rounded-lg border border-[#E9E7E1] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#777777] mb-1">SKU / Item Code</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E9E7E1] font-mono focus:outline-hidden focus:border-[#171717]"
                  />
                </div>
                <div>
                  <label className="block text-[#777777] mb-1">Billing Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-[#E9E7E1] bg-white font-medium"
                  >
                    <option value="Month">Month (Gym/Retainer)</option>
                    <option value="Year">Year (Annual Pass)</option>
                    <option value="Session">Session (PT / Class)</option>
                    <option value="Pack">Pack / Packet</option>
                    <option value="Bag">Bag (Rice/Atta)</option>
                    <option value="kg">kg (Kilogram)</option>
                    <option value="pcs">pcs (Pieces)</option>
                    <option value="1L">1L (Liter / Bottle)</option>
                    <option value="Item">Item / General</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#777777] mb-1">Standard Rate ({currency}) *</label>
                  <input
                    type="text"
                    required
                    value={unitPriceStr}
                    onChange={(e) => setUnitPriceStr(e.target.value)}
                    placeholder="1000.00"
                    className="w-full px-3 py-2 rounded-lg border border-[#E9E7E1] font-mono text-right font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[#777777] mb-1">Default Tax (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={defaultTaxRate}
                    onChange={(e) => setDefaultTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E9E7E1] font-mono text-center"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#F2F0EA]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-[#E9E7E1] rounded-lg text-[#777777] hover:bg-[#F7F6F2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#171717] hover:bg-[#222222] text-white rounded-lg font-medium"
                >
                  Save to Catalogue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
