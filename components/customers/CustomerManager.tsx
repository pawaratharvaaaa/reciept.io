"use client";

import React, { useState, useEffect } from "react";
import { Users, Plus, Search, Mail, Phone, MapPin, Receipt, Trash2, Edit2, X, Check } from "lucide-react";
import { Customer, Receipt as ReceiptType } from "@/lib/types/receipt";
import { formatCurrency } from "@/lib/financial/currencies";
import { db } from "@/lib/offline/db";
import { generateUUID } from "@/lib/utils";
import { pushAllToCloud } from "@/lib/sync/sync-coordinator";

export const CustomerManager: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [receipts, setReceipts] = useState<ReceiptType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [taxIdentifier, setTaxIdentifier] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const custs = await db.customers.toArray();
    const recs = await db.receipts.toArray();
    setCustomers(custs);
    setReceipts(recs);
  };

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setName(customer.name);
      setEmail(customer.email || "");
      setPhone(customer.phone || "");
      setTaxIdentifier(customer.taxIdentifier || "");
      setAddressLine(customer.billingAddress?.line1 || "");
      setCity(customer.billingAddress?.city || "");
      setNotes(customer.notes || "");
    } else {
      setEditingCustomer(null);
      setName("");
      setEmail("");
      setPhone("");
      setTaxIdentifier("");
      setAddressLine("");
      setCity("");
      setNotes("");
    }
    setIsModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const customerData: Customer = {
      id: editingCustomer?.id || generateUUID(),
      organizationId: "org-default-001",
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      taxIdentifier: taxIdentifier.trim() || undefined,
      billingAddress: {
        line1: addressLine.trim() || undefined,
        city: city.trim() || undefined,
      },
      notes: notes.trim() || undefined,
      createdAt: editingCustomer?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.customers.put(customerData);
    pushAllToCloud().catch(console.error);
    setIsModalOpen(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      await db.customers.delete(id);
      pushAllToCloud().catch(console.error);
      loadData();
    }
  };

  const handleDeleteAllCustomers = async () => {
    if (customers.length === 0) return;
    if (
      confirm(
        `Are you sure you want to permanently delete ALL ${customers.length} customer records? This cannot be undone.`
      )
    ) {
      await db.customers.clear();
      pushAllToCloud().catch(console.error);
      loadData();
    }
  };

  // Helper to compute stats for a customer
  const getCustomerStats = (customerId: string) => {
    const custReceipts = receipts.filter((r) => r.customerId === customerId);
    const totalPurchasedMinor = custReceipts.reduce(
      (acc, curr) => acc + (curr.totalMinor || 0),
      0
    );
    return {
      receiptCount: custReceipts.length,
      totalPurchasedMinor,
    };
  };

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#171717]">Customer Directory</h1>
          <p className="text-xs text-[#777777] mt-1">
            Manage client profiles, contact information, and view historical purchase totals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {customers.length > 0 && (
            <button
              onClick={handleDeleteAllCustomers}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-slate-300 hover:border-rose-300 rounded-lg text-xs font-medium transition cursor-pointer"
              title="Delete all customer records"
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
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E9E7E1] shadow-xs flex items-center gap-3">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-[#777777] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by customer name, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E9E7E1] text-xs focus:outline-hidden focus:border-[#171717]"
          />
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCustomers.map((cust) => {
          const stats = getCustomerStats(cust.id);
          return (
            <div
              key={cust.id}
              className="bg-white p-5 rounded-xl border border-[#E9E7E1] shadow-xs flex flex-col justify-between space-y-4 hover:border-[#171717] transition"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-[#171717]">{cust.name}</h3>
                    {cust.taxIdentifier && (
                      <span className="text-[10px] font-mono text-[#777777]">
                        GSTIN/Tax ID: {cust.taxIdentifier}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenModal(cust)}
                      className="p-1 text-[#777777] hover:text-[#171717] rounded hover:bg-[#F7F6F2]"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cust.id)}
                      className="p-1 text-[#777777] hover:text-[#C64B4B] rounded hover:bg-[#FDF2F2]"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-[#555555]">
                  {cust.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#777777] shrink-0" />
                      <span className="truncate">{cust.email}</span>
                    </div>
                  )}
                  {cust.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#777777] shrink-0" />
                      <span>{cust.phone}</span>
                    </div>
                  )}
                  {cust.billingAddress?.line1 && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#777777] shrink-0" />
                      <span className="truncate">
                        {cust.billingAddress.line1}
                        {cust.billingAddress.city ? `, ${cust.billingAddress.city}` : ""}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Footer */}
              <div className="pt-3 border-t border-[#F2F0EA] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-[#777777] block uppercase font-mono">Total Billed</span>
                  <span className="font-mono font-bold text-[#171717]">
                    {formatCurrency(stats.totalPurchasedMinor, "INR")}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#777777] block uppercase font-mono">Receipts</span>
                  <span className="font-mono font-semibold text-[#171717]">
                    {stats.receiptCount}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-[#E9E7E1] shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#F2F0EA] pb-3">
              <h2 className="text-base font-bold text-[#171717]">
                {editingCustomer ? "Edit Customer" : "Add New Customer"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#777777] hover:text-[#171717]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#777777] mb-1">Customer / Organization Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Acme Corporation"
                  className="w-full px-3 py-2 rounded-lg border border-[#E9E7E1] focus:outline-hidden focus:border-[#171717]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#777777] mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="billing@acme.com"
                    className="w-full px-3 py-2 rounded-lg border border-[#E9E7E1] focus:outline-hidden focus:border-[#171717]"
                  />
                </div>
                <div>
                  <label className="block text-[#777777] mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="w-full px-3 py-2 rounded-lg border border-[#E9E7E1] focus:outline-hidden focus:border-[#171717]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#777777] mb-1">GSTIN / Tax Identifier</label>
                <input
                  type="text"
                  value={taxIdentifier}
                  onChange={(e) => setTaxIdentifier(e.target.value)}
                  placeholder="e.g. 27AABCC1234F1Z5"
                  className="w-full px-3 py-2 rounded-lg border border-[#E9E7E1] font-mono focus:outline-hidden focus:border-[#171717]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#777777] mb-1">Billing Address Line</label>
                  <input
                    type="text"
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    placeholder="123 Street"
                    className="w-full px-3 py-2 rounded-lg border border-[#E9E7E1] focus:outline-hidden focus:border-[#171717]"
                  />
                </div>
                <div>
                  <label className="block text-[#777777] mb-1">City / State</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Mumbai, Maharashtra"
                    className="w-full px-3 py-2 rounded-lg border border-[#E9E7E1] focus:outline-hidden focus:border-[#171717]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#777777] mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Payment preferences or terms..."
                  className="w-full px-3 py-2 rounded-lg border border-[#E9E7E1] resize-none"
                />
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
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
