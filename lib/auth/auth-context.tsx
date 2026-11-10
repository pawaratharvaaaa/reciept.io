"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile, Organization, BusinessProfile } from "../types/receipt";
import { BusinessCategoryKey, BUSINESS_CATEGORIES } from "../business-categories";
import { db, seedInitialDataIfEmpty } from "../offline/db";
import { generateUUID } from "../utils";

interface AuthContextType {
  user: UserProfile | null;
  organization: Organization | null;
  businessProfile: BusinessProfile | null;
  allUsers: UserProfile[];
  isLoading: boolean;
  login: (email: string) => Promise<boolean>;
  signUp: (params: {
    fullName: string;
    email: string;
    businessName: string;
    category: BusinessCategoryKey;
    defaultCurrency?: string;
    phone?: string;
    city?: string;
    addressLine?: string;
    taxIdentifier?: string;
    receiptPrefix?: string;
  }) => Promise<boolean>;
  switchAccount: (userId: string) => Promise<void>;
  switchIndustry: (category: BusinessCategoryKey) => Promise<void>;
  deleteAccount: (userId: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserWorkspace = React.useCallback(async (targetUser: UserProfile) => {
    setUser(targetUser);
    localStorage.setItem("reciept_io_current_user_id", targetUser.id);

    const org = await db.organizations.get(targetUser.organizationId);
    if (org) {
      setOrganization(org);
    }

    const bProfile = await db.businessProfiles
      .filter((bp) => bp.organizationId === targetUser.organizationId)
      .first();

    if (bProfile) {
      setBusinessProfile(bProfile);
    }
  }, []);

  // Load current session or default on mount
  useEffect(() => {
    async function initAuth() {
      await seedInitialDataIfEmpty();

      // AUTO PURGE DEMO SEEDED ACCOUNT (Craft Studio & Labs / Rohan Mehta / admin@craftstudio.in)
      try {
        const demoUsers = await db.users.filter((u) =>
          u.id === "usr-admin-01" ||
          u.email.toLowerCase() === "admin@craftstudio.in" ||
          u.email.toLowerCase() === "billing@craftstudio.in" ||
          (u.businessName ? u.businessName.toLowerCase().includes("craft studio") : false) ||
          (u.fullName ? u.fullName.toLowerCase().includes("rohan mehta") : false)
        ).toArray();

        for (const du of demoUsers) {
          await db.users.delete(du.id);
          if (du.organizationId) {
            await db.organizations.delete(du.organizationId);
            await db.businessProfiles.where("organizationId").equals(du.organizationId).delete();
            await db.receipts.where("organizationId").equals(du.organizationId).delete();
            await db.customers.where("organizationId").equals(du.organizationId).delete();
            await db.products.where("organizationId").equals(du.organizationId).delete();
            await db.payments.where("organizationId").equals(du.organizationId).delete();
          }
        }

        // Clean up legacy default IDs directly
        await db.users.delete("usr-admin-01");
        await db.organizations.delete("org-default-001");
        await db.businessProfiles.delete("biz-001");
        const demoBiz = await db.businessProfiles.filter((bp) =>
          bp.businessName ? bp.businessName.toLowerCase().includes("craft studio") : false
        ).toArray();
        for (const bp of demoBiz) {
          await db.businessProfiles.delete(bp.id);
        }
        await db.receipts.where("organizationId").equals("org-default-001").delete();
        await db.customers.where("organizationId").equals("org-default-001").delete();
        await db.products.where("organizationId").equals("org-default-001").delete();
        await db.payments.where("organizationId").equals("org-default-001").delete();
      } catch (e) {
        console.error("Purge demo account error:", e);
      }

      const usersList = await db.users.toArray();
      setAllUsers(usersList);

      const savedUserId = localStorage.getItem("reciept_io_current_user_id");
      
      // If previous session was old dummy seeded user, purge it so zero accounts are active by default
      if (savedUserId === "usr-admin-01" || !usersList.some((u) => u.id === savedUserId)) {
        try {
          localStorage.removeItem("reciept_io_current_user_id");
        } catch (e) {}
      }

      const effectiveSavedId = localStorage.getItem("reciept_io_current_user_id");
      const activeUser = usersList.find((u) => u.id === effectiveSavedId);

      // Zero accounts active by default: user must register or login first before using
      if (activeUser) {
        await loadUserWorkspace(activeUser);
      } else {
        setUser(null);
        setOrganization(null);
        setBusinessProfile(null);
      }
      setIsLoading(false);
    }

    initAuth();
  }, [loadUserWorkspace]);

  const login = async (email: string): Promise<boolean> => {
    const existing = await db.users.filter((u) => u.email.toLowerCase() === email.toLowerCase()).first();
    if (existing) {
      await loadUserWorkspace(existing);
      const updatedList = await db.users.toArray();
      setAllUsers(updatedList);
      return true;
    }
    return false;
  };

  const signUp = async ({
    fullName,
    email,
    businessName,
    category,
    defaultCurrency = "INR",
    phone,
    city,
    addressLine,
    taxIdentifier,
    receiptPrefix,
  }: {
    fullName: string;
    email: string;
    businessName: string;
    category: BusinessCategoryKey;
    defaultCurrency?: string;
    phone?: string;
    city?: string;
    addressLine?: string;
    taxIdentifier?: string;
    receiptPrefix?: string;
  }): Promise<boolean> => {
    const categoryConfig = BUSINESS_CATEGORIES[category] || BUSINESS_CATEGORIES.custom;

    const orgId = generateUUID();
    const userId = generateUUID();
    const bizId = generateUUID();

    const newOrg: Organization = {
      id: orgId,
      name: businessName,
      slug: businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      workspaceType: category === "individual_personal" ? "personal" : "business",
      defaultCurrency,
      timezone: "Asia/Kolkata",
      createdAt: new Date().toISOString(),
    };

    const newProfile: BusinessProfile = {
      id: bizId,
      organizationId: orgId,
      businessName,
      businessCategory: category,
      receiptPrefix: receiptPrefix?.trim() || categoryConfig.receiptPrefix,
      email,
      phone: phone?.trim() || undefined,
      taxIdentifier: taxIdentifier?.trim() || undefined,
      address: {
        line1: addressLine?.trim() || "Main Street",
        city: city?.trim() || "Mumbai",
        country: "India",
      },
    };

    const newUser: UserProfile = {
      id: userId,
      email: email.trim().toLowerCase(),
      fullName,
      businessName,
      businessCategory: category,
      organizationId: orgId,
      createdAt: new Date().toISOString(),
    };

    // Preload Starter Products for this industry
    const starterProducts = categoryConfig.starterProducts.map((p, idx) => ({
      id: generateUUID(),
      organizationId: orgId,
      name: p.name,
      description: p.description,
      sku: p.sku,
      unit: p.unit,
      unitPriceMinor: p.unitPriceMinor,
      currency: defaultCurrency,
      defaultTaxRate: p.defaultTaxRate,
      isActive: true,
      createdAt: new Date().toISOString(),
    }));

    // Preload a default customer for convenience
    const defaultCustomer = {
      id: generateUUID(),
      organizationId: orgId,
      name: category === "gym_fitness" ? "Alex Rivera (Member #101)" : "Standard Customer",
      email: "client@example.com",
      phone: "+91 98000 11222",
      billingAddress: { line1: "City Center", city: "Mumbai" },
      notes: "Default customer profile",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.organizations.add(newOrg);
    await db.businessProfiles.add(newProfile);
    await db.users.add(newUser);
    if (starterProducts.length > 0) {
      await db.products.bulkAdd(starterProducts);
    }
    await db.customers.add(defaultCustomer);

    const updatedUsers = await db.users.toArray();
    setAllUsers(updatedUsers);
    await loadUserWorkspace(newUser);
    return true;
  };

  const switchAccount = async (userId: string) => {
    const target = allUsers.find((u) => u.id === userId);
    if (target) {
      await loadUserWorkspace(target);
      window.location.reload();
    }
  };

  const switchIndustry = async (category: BusinessCategoryKey) => {
    if (!user || !businessProfile) return;

    const categoryConfig = BUSINESS_CATEGORIES[category] || BUSINESS_CATEGORIES.custom;

    const updatedProfile: BusinessProfile = {
      ...businessProfile,
      businessCategory: category,
      receiptPrefix: categoryConfig.receiptPrefix,
    };

    const updatedUser: UserProfile = {
      ...user,
      businessCategory: category,
    };

    await db.businessProfiles.put(updatedProfile);
    await db.users.put(updatedUser);

    // Optionally load starter products for this category if currently empty
    const currentProducts = await db.products.filter((p) => p.organizationId === user.organizationId).toArray();
    if (currentProducts.length === 0 && categoryConfig.starterProducts.length > 0) {
      const newItems = categoryConfig.starterProducts.map((p) => ({
        id: generateUUID(),
        organizationId: user.organizationId,
        name: p.name,
        description: p.description,
        sku: p.sku,
        unit: p.unit,
        unitPriceMinor: p.unitPriceMinor,
        currency: organization?.defaultCurrency || "INR",
        defaultTaxRate: p.defaultTaxRate,
        isActive: true,
        createdAt: new Date().toISOString(),
      }));
      await db.products.bulkAdd(newItems);
    }

    setBusinessProfile(updatedProfile);
    setUser(updatedUser);
  };

  const deleteAccount = async (userId: string) => {
    try {
      const targetUser = await db.users.get(userId);
      if (targetUser) {
        await db.users.delete(userId);

        const otherUsersInOrg = await db.users.filter((u) => u.organizationId === targetUser.organizationId).count();
        if (otherUsersInOrg === 0) {
          await db.organizations.delete(targetUser.organizationId);
          await db.businessProfiles.where("organizationId").equals(targetUser.organizationId).delete();
          await db.receipts.where("organizationId").equals(targetUser.organizationId).delete();
          await db.customers.where("organizationId").equals(targetUser.organizationId).delete();
          await db.products.where("organizationId").equals(targetUser.organizationId).delete();
          await db.payments.where("organizationId").equals(targetUser.organizationId).delete();
        }

        const remainingUsers = await db.users.toArray();
        setAllUsers(remainingUsers);

        if (user?.id === userId) {
          try {
            localStorage.removeItem("reciept_io_current_user_id");
          } catch (e) {}

          if (remainingUsers.length > 0) {
            await loadUserWorkspace(remainingUsers[0]);
          } else {
            setUser(null);
            setOrganization(null);
            setBusinessProfile(null);
          }
        }
      }
    } catch (err) {
      console.error("Failed to delete account:", err);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem("reciept_io_current_user_id");
    } catch (e) {}
    setUser(null);
    setOrganization(null);
    setBusinessProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        businessProfile,
        allUsers,
        isLoading,
        login,
        signUp,
        switchAccount,
        switchIndustry,
        deleteAccount,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
