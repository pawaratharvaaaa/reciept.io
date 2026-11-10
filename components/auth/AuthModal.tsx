"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Building2,
  Mail,
  User,
  Check,
  Dumbbell,
  ShoppingBag,
  Laptop,
  Coffee,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  Briefcase,
  MapPin,
  Phone,
  Coins,
  FileText,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { BusinessCategoryKey, BUSINESS_CATEGORIES } from "@/lib/business-categories";
import { evaluatePasswordStrength, hashPasswordWithSalt } from "@/lib/security/password";
import { ApplicationFirewall } from "@/lib/security/firewall";
import { db } from "@/lib/offline/db";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "signup" | "login" | "switch";
  isDismissible?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = "login",
  isDismissible = true,
}) => {
  const { signUp, login, allUsers, switchAccount, deleteAccount, user } = useAuth();

  // Mode: "login" | "register" | "survey" | "switch"
  const [mode, setMode] = useState<"login" | "register" | "survey" | "switch">(() => {
    if (defaultMode === "switch") return "switch";
    if (defaultMode === "signup") return "register";
    return "login";
  });

  // Survey sub-steps: 1 = Business Name, 2 = Category & Prefix, 3 = Location & Currency
  const [surveyStep, setSurveyStep] = useState<1 | 2 | 3>(1);

  // User credentials
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Business profile & survey fields
  const [businessName, setBusinessName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategoryKey>("general_store");
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [customPrefix, setCustomPrefix] = useState("REC-");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Mumbai");
  const [addressLine, setAddressLine] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [taxIdentifier, setTaxIdentifier] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update default mode if prop changes
  useEffect(() => {
    if (defaultMode === "switch") setMode("switch");
    else if (defaultMode === "signup") {
      setMode("register");
      setSurveyStep(1);
    } else {
      setMode("login");
    }
  }, [defaultMode]);

  // When industry changes, set reasonable default prefix
  useEffect(() => {
    const cat = BUSINESS_CATEGORIES[selectedCategory];
    if (cat && selectedCategory !== "custom") {
      setCustomPrefix(cat.receiptPrefix);
    }
  }, [selectedCategory]);

  if (!isOpen) return null;

  const passwordEvaluation = evaluatePasswordStrength(password);

  // 1. Handle Login (for users who already have an account)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanEmail = ApplicationFirewall.sanitizeInput(email);

    // Rate Limiting Firewall Check
    const rateCheck = ApplicationFirewall.isRateLimited(cleanEmail);
    if (rateCheck.locked) {
      setErrorMsg(
        `Firewall Lockout Active: Too many failed login attempts. Please wait ${rateCheck.remainingSeconds}s before retrying.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await login(cleanEmail);
      if (ok) {
        ApplicationFirewall.resetAttempts(cleanEmail);
        onClose();
      } else {
        const failure = ApplicationFirewall.recordFailedAttempt(cleanEmail);
        if (failure.locked) {
          setErrorMsg("Account locked for 15 minutes due to 5 consecutive failed login attempts.");
        } else {
          setErrorMsg(
            `No account found with this email, or password mismatch. (${failure.attemptsLeft} attempts remaining).`
          );
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to log in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Validate Step 1 (Register credentials) & advance to Survey
  const handleProceedToSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanFullName = ApplicationFirewall.sanitizeInput(fullName);
    const cleanEmail = ApplicationFirewall.sanitizeInput(email);

    if (!cleanFullName || !cleanEmail || !password) {
      setErrorMsg("Please fill in your full name, email, and password.");
      return;
    }

    // Check if email already exists
    const existing = await db.users.filter((u) => u.email.toLowerCase() === cleanEmail.toLowerCase()).first();
    if (existing) {
      setErrorMsg("An account with this email already exists on this device. Please sign in instead.");
      return;
    }

    // Tough Password Enforcement
    if (!passwordEvaluation.isValid) {
      setErrorMsg(
        "Password must be at least 8 characters with uppercase, lowercase, number, and special symbol (!@#$%^&*)."
      );
      return;
    }

    // Advance to Survey Step 1 (Business Name)
    setMode("survey");
    setSurveyStep(1);
  };

  // 3. Final Step: Submit Survey & Complete Account Creation
  const handleCompleteSurveyAndSignUp = async () => {
    setErrorMsg("");
    const cleanFullName = ApplicationFirewall.sanitizeInput(fullName);
    const cleanEmail = ApplicationFirewall.sanitizeInput(email);
    const cleanBusinessName = ApplicationFirewall.sanitizeInput(businessName);

    if (!cleanBusinessName) {
      setErrorMsg("Please provide your business or store name.");
      setSurveyStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      await hashPasswordWithSalt(password, cleanEmail);

      await signUp({
        fullName: cleanFullName,
        email: cleanEmail,
        businessName: cleanBusinessName,
        category: selectedCategory,
        defaultCurrency: currency,
        phone: phone.trim() || undefined,
        city: city.trim() || undefined,
        addressLine: addressLine.trim() || undefined,
        taxIdentifier: taxIdentifier.trim() || undefined,
        receiptPrefix: customPrefix.trim() || undefined,
      });

      ApplicationFirewall.resetAttempts(cleanEmail);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to complete account registration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryCards = [
    {
      key: "general_store" as BusinessCategoryKey,
      title: "General Store / Retail",
      desc: "Groceries, Daily Essentials, FMCG & Supermarket",
      icon: ShoppingBag,
      defaultPrefix: "STR-",
    },
    {
      key: "gym_fitness" as BusinessCategoryKey,
      title: "Gym & Fitness Club",
      desc: "Memberships, Personal Training, Class Passes",
      icon: Dumbbell,
      defaultPrefix: "GYM-",
    },
    {
      key: "restaurant_cafe" as BusinessCategoryKey,
      title: "Restaurant & Cafe",
      desc: "Dine-in, Takeaway, Food & Beverages",
      icon: Coffee,
      defaultPrefix: "CAFE-",
    },
    {
      key: "freelancer_services" as BusinessCategoryKey,
      title: "Freelancer & Agency",
      desc: "Software, Design, Consulting & Milestones",
      icon: Laptop,
      defaultPrefix: "SVC-",
    },
    {
      key: "individual_personal" as BusinessCategoryKey,
      title: "Individual / Personal",
      desc: "Rent receipts, Tuition & Personal records",
      icon: User,
      defaultPrefix: "PERS-",
    },
    {
      key: "custom" as BusinessCategoryKey,
      title: "Unlisted / Custom Trade",
      desc: "Tailor your own business type, prefix & catalogue",
      icon: Briefcase,
      defaultPrefix: "BIZ-",
    },
  ];

  const currencies = [
    { code: "INR", symbol: "₹", name: "Indian Rupee (INR)" },
    { code: "USD", symbol: "$", name: "US Dollar (USD)" },
    { code: "EUR", symbol: "€", name: "Euro (EUR)" },
    { code: "GBP", symbol: "£", name: "British Pound (GBP)" },
    { code: "AED", symbol: "د.إ", name: "UAE Dirham (AED)" },
    { code: "CAD", symbol: "$", name: "Canadian Dollar (CAD)" },
    { code: "AUD", symbol: "$", name: "Australian Dollar (AUD)" },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && isDismissible) {
          onClose();
        }
      }}
    >
      <div className="bg-white dark:bg-[#171717] rounded-2xl border border-[#E9E7E1] dark:border-[#2D2D2D] shadow-2xl max-w-lg w-full p-5 sm:p-7 space-y-4 my-6 text-[#171717] dark:text-[#F5F5F5] transition-all">
        {/* Header Bar */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-6 rounded-md bg-[#171717] dark:bg-white text-white dark:text-[#171717] flex items-center justify-center font-mono font-bold text-xs">
                R.
              </span>
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#777777] dark:text-[#A1A1A1] font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                {!isDismissible ? "Authentication Required" : "Hardened Workspace"}
              </span>
            </div>

            <h2 className="text-xl font-bold tracking-tight">
              {mode === "login" && "Sign In to Your Workspace"}
              {mode === "register" && "Create New Business Account"}
              {mode === "survey" && (
                <>
                  {surveyStep === 1 && "Business Name & Brand"}
                  {surveyStep === 2 && "Select Business Type"}
                  {surveyStep === 3 && "Store Details & Currency"}
                </>
              )}
              {mode === "switch" && "Select or Manage Profiles"}
            </h2>

            <p className="text-xs text-[#777777] dark:text-[#A1A1A1] mt-0.5">
              {mode === "login" && "Enter your credentials to access your store receipts and settings."}
              {mode === "register" && "Step 1 of 4: Create your personal owner credentials."}
              {mode === "survey" && (
                <>
                  {surveyStep === 1 && "Step 2 of 4: What name appears on your receipts and bills?"}
                  {surveyStep === 2 && "Step 3 of 4: Choose your industry to configure catalog & prefix."}
                  {surveyStep === 3 && "Step 4 of 4: Complete your receipt footer contact and currency."}
                </>
              )}
              {mode === "switch" && "Choose an active profile or remove old test accounts."}
            </p>
          </div>

          {isDismissible && (
            <button
              onClick={onClose}
              className="p-1 rounded-md text-[#777777] hover:text-[#171717] dark:hover:text-white hover:bg-[#F7F6F2] dark:hover:bg-[#252525] transition cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Survey Progress Bar (When in Register or Survey Mode) */}
        {(mode === "register" || mode === "survey") && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#777777] dark:text-[#A1A1A1]">
              <span className="flex items-center gap-1 text-[#171717] dark:text-white">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Account Setup Survey
              </span>
              <span>
                Step {mode === "register" ? 1 : surveyStep + 1} of 4
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 4].map((s) => {
                const currentNum = mode === "register" ? 1 : surveyStep + 1;
                return (
                  <div
                    key={s}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      s <= currentNum
                        ? "bg-[#171717] dark:bg-white"
                        : "bg-[#E9E7E1] dark:bg-[#2B2B2B]"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-[#2B1414] border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-medium flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Top Navigation Tabs */}
        {mode !== "survey" && (
          <div className="flex rounded-lg bg-[#F2F0EA] dark:bg-[#222222] p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMsg("");
              }}
              className={`flex-1 py-1.5 rounded-md transition cursor-pointer ${
                mode === "login"
                  ? "bg-white dark:bg-[#171717] text-[#171717] dark:text-white shadow-xs font-semibold"
                  : "text-[#777777] dark:text-[#A1A1A1] hover:text-[#171717] dark:hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setErrorMsg("");
              }}
              className={`flex-1 py-1.5 rounded-md transition cursor-pointer ${
                mode === "register"
                  ? "bg-white dark:bg-[#171717] text-[#171717] dark:text-white shadow-xs font-semibold"
                  : "text-[#777777] dark:text-[#A1A1A1] hover:text-[#171717] dark:hover:text-white"
              }`}
            >
              Register Account
            </button>
            {allUsers.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setMode("switch");
                  setErrorMsg("");
                }}
                className={`flex-1 py-1.5 rounded-md transition cursor-pointer ${
                  mode === "switch"
                    ? "bg-white dark:bg-[#171717] text-[#171717] dark:text-white shadow-xs font-semibold"
                    : "text-[#777777] dark:text-[#A1A1A1] hover:text-[#171717] dark:hover:text-white"
                }`}
              >
                Profiles ({allUsers.length})
              </button>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* 1. SIGN IN SCREEN                                            */}
        {/* ============================================================ */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4 text-xs pt-1">
            <div>
              <label className="block text-[#555555] dark:text-[#A1A1A1] mb-1 font-medium">
                Registered Email *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@business.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 pl-9 rounded-lg border border-[#E9E7E1] dark:border-[#333333] bg-white dark:bg-[#222222] focus:outline-hidden focus:border-[#171717] dark:focus:border-white"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-[#555555] dark:text-[#A1A1A1] mb-1 font-medium">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter your account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pl-9 pr-9 rounded-lg border border-[#E9E7E1] dark:border-[#333333] bg-white dark:bg-[#222222] font-mono focus:outline-hidden focus:border-[#171717] dark:focus:border-white"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-[#171717] dark:bg-white hover:bg-[#2A2A2A] dark:hover:bg-neutral-200 text-white dark:text-[#171717] rounded-lg font-semibold flex items-center justify-center gap-2 transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                <span>{isSubmitting ? "Signing In..." : "Sign In to Workspace"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center pt-2 border-t border-[#F2F0EA] dark:border-[#262626]">
              <span className="text-[#777777] dark:text-[#A1A1A1]">Don&apos;t have an account yet? </span>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setErrorMsg("");
                }}
                className="font-bold text-[#171717] dark:text-white underline cursor-pointer hover:opacity-80"
              >
                Register &amp; set up business
              </button>
            </div>
          </form>
        )}

        {/* ============================================================ */}
        {/* 2. REGISTRATION SCREEN (Step 1: Credentials)                 */}
        {/* ============================================================ */}
        {mode === "register" && (
          <form onSubmit={handleProceedToSurvey} className="space-y-3.5 text-xs pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#555555] dark:text-[#A1A1A1] mb-1 font-medium">
                  Your Full Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 pl-9 rounded-lg border border-[#E9E7E1] dark:border-[#333333] bg-white dark:bg-[#222222] focus:outline-hidden focus:border-[#171717] dark:focus:border-white"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-[#555555] dark:text-[#A1A1A1] mb-1 font-medium">
                  Email Address *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="name@business.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 pl-9 rounded-lg border border-[#E9E7E1] dark:border-[#333333] bg-white dark:bg-[#222222] focus:outline-hidden focus:border-[#171717] dark:focus:border-white"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>
            </div>

            {/* Hardened Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[#555555] dark:text-[#A1A1A1] font-medium flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-500" /> Account Password *
                </label>
                {password && (
                  <span
                    className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                      passwordEvaluation.score <= 2
                        ? "bg-rose-100 text-rose-700"
                        : passwordEvaluation.score === 3
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    Strength: {passwordEvaluation.level}
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Min 8 chars, uppercase, lowercase, number & symbol"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pl-9 pr-9 rounded-lg border border-[#E9E7E1] dark:border-[#333333] bg-white dark:bg-[#222222] font-mono focus:outline-hidden focus:border-[#171717] dark:focus:border-white"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      passwordEvaluation.score >= step
                        ? passwordEvaluation.score <= 2
                          ? "bg-rose-500"
                          : passwordEvaluation.score === 3
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                        : "bg-slate-200 dark:bg-neutral-800"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-[#171717] dark:bg-white hover:bg-[#2A2A2A] dark:hover:bg-neutral-200 text-white dark:text-[#171717] rounded-lg font-semibold flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
              >
                <span>Continue to Business Survey</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center pt-2 border-t border-[#F2F0EA] dark:border-[#262626]">
              <span className="text-[#777777] dark:text-[#A1A1A1]">Already have an account? </span>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMsg("");
                }}
                className="font-bold text-[#171717] dark:text-white underline cursor-pointer hover:opacity-80"
              >
                Sign In instead
              </button>
            </div>
          </form>
        )}

        {/* ============================================================ */}
        {/* 3. BUSINESS CREATION SURVEY (Steps 2, 3, 4)                  */}
        {/* ============================================================ */}
        {mode === "survey" && (
          <div className="space-y-4 text-xs pt-1">
            {/* SURVEY STEP 1: Business Name */}
            {surveyStep === 1 && (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <label className="block text-sm font-bold text-[#171717] dark:text-white mb-1">
                    What is the name of your business or store? *
                  </label>
                  <p className="text-xs text-[#777777] dark:text-[#A1A1A1] mb-2">
                    This official name will be printed on the header of all customer receipts and tax invoices.
                  </p>
                  <div className="relative">
                    <input
                      type="text"
                      autoFocus
                      required
                      placeholder="e.g. IronCore Gym, The Daily Roast Cafe, or Super Mart"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full px-3.5 py-2.5 pl-10 rounded-xl border border-[#E9E7E1] dark:border-[#333333] bg-white dark:bg-[#222222] text-sm font-semibold focus:outline-hidden focus:border-[#171717] dark:focus:border-white shadow-xs"
                    />
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                {/* Live Receipt Header Preview */}
                <div className="p-3.5 rounded-xl border border-dashed border-[#D1CFCA] dark:border-[#3A3A3A] bg-[#FAF9F5] dark:bg-[#1E1E1E] space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#777777] dark:text-[#888888] font-bold block">
                    Receipt Header Live Preview:
                  </span>
                  <div className="text-center py-2 bg-white dark:bg-[#252525] rounded-lg border border-[#E9E7E1] dark:border-[#333333] shadow-xs">
                    <div className="font-bold text-sm text-[#171717] dark:text-white">
                      {businessName.trim() || "Your Business Name"}
                    </div>
                    <div className="text-[10px] text-[#777777] dark:text-[#A1A1A1]">
                      Official Tax Invoice &amp; Payment Receipt
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMode("register")}
                    className="px-4 py-2.5 rounded-lg border border-[#E9E7E1] dark:border-[#333333] hover:bg-[#F2F0EA] dark:hover:bg-[#252525] font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    disabled={!businessName.trim()}
                    onClick={() => {
                      if (!businessName.trim()) {
                        setErrorMsg("Please enter your business or store name.");
                        return;
                      }
                      setErrorMsg("");
                      setSurveyStep(2);
                    }}
                    className="flex-1 py-2.5 bg-[#171717] dark:bg-white hover:bg-[#2A2A2A] dark:hover:bg-neutral-200 text-white dark:text-[#171717] rounded-lg font-semibold flex items-center justify-center gap-2 transition shadow-sm cursor-pointer disabled:opacity-40"
                  >
                    <span>Next: Choose Business Type</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* SURVEY STEP 2: Business Category & Prefix */}
            {surveyStep === 2 && (
              <div className="space-y-3.5 animate-in fade-in">
                <div>
                  <label className="block text-sm font-bold text-[#171717] dark:text-white mb-1">
                    What type of business are you running? *
                  </label>
                  <p className="text-xs text-[#777777] dark:text-[#A1A1A1] mb-2">
                    We automatically tailor your catalogue items, tax presets, and receipt prefix.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
                  {categoryCards.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = selectedCategory === cat.key;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat.key);
                          setCustomPrefix(cat.defaultPrefix);
                        }}
                        className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition cursor-pointer ${
                          isSelected
                            ? "bg-[#171717] dark:bg-white text-white dark:text-[#171717] border-[#171717] dark:border-white shadow-xs"
                            : "bg-white dark:bg-[#222222] text-[#171717] dark:text-[#F5F5F5] border-[#E9E7E1] dark:border-[#333333] hover:bg-[#F7F6F2] dark:hover:bg-[#282828]"
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "bg-white/20 dark:bg-black/10 text-white dark:text-black"
                              : "bg-[#F2F0EA] dark:bg-[#2D2D2D] text-[#171717] dark:text-white"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="leading-tight">
                          <span className="font-bold text-xs block">{cat.title}</span>
                          <span
                            className={`text-[10px] line-clamp-1 ${
                              isSelected ? "text-slate-300 dark:text-neutral-600" : "text-[#777777] dark:text-[#A1A1A1]"
                            }`}
                          >
                            {cat.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Prefix Field */}
                <div className="p-2.5 bg-[#FAF9F5] dark:bg-[#202020] rounded-xl border border-[#E9E7E1] dark:border-[#333333] flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-xs block">Receipt Number Prefix</span>
                    <span className="text-[10px] text-[#777777] dark:text-[#A1A1A1]">
                      Your slips will be numbered e.g. {customPrefix}0001
                    </span>
                  </div>
                  <input
                    type="text"
                    value={customPrefix}
                    onChange={(e) => setCustomPrefix(e.target.value.toUpperCase())}
                    className="w-24 px-2.5 py-1.5 rounded-lg border border-[#E9E7E1] dark:border-[#333333] bg-white dark:bg-[#171717] font-mono text-center text-xs font-bold"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSurveyStep(1)}
                    className="px-4 py-2.5 rounded-lg border border-[#E9E7E1] dark:border-[#333333] hover:bg-[#F2F0EA] dark:hover:bg-[#252525] font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg("");
                      setSurveyStep(3);
                    }}
                    className="flex-1 py-2.5 bg-[#171717] dark:bg-white hover:bg-[#2A2A2A] dark:hover:bg-neutral-200 text-white dark:text-[#171717] rounded-lg font-semibold flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
                  >
                    <span>Next: Store Details &amp; Currency</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* SURVEY STEP 3: Store Details & Currency */}
            {surveyStep === 3 && (
              <div className="space-y-3.5 animate-in fade-in">
                <div>
                  <label className="block text-sm font-bold text-[#171717] dark:text-white mb-1">
                    Store Contact &amp; Currency Setup
                  </label>
                  <p className="text-xs text-[#777777] dark:text-[#A1A1A1]">
                    Add your contact number, city, and billing currency to finish configuration.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#555555] dark:text-[#A1A1A1] mb-1 font-medium">
                      Phone Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. +91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2 pl-9 rounded-lg border border-[#E9E7E1] dark:border-[#333333] bg-white dark:bg-[#222222] focus:outline-hidden"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#555555] dark:text-[#A1A1A1] mb-1 font-medium">
                      City / Area
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. Mumbai / Delhi"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3 py-2 pl-9 rounded-lg border border-[#E9E7E1] dark:border-[#333333] bg-white dark:bg-[#222222] focus:outline-hidden"
                      />
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#555555] dark:text-[#A1A1A1] mb-1 font-medium">
                      Default Currency *
                    </label>
                    <div className="relative">
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full px-3 py-2 pl-9 rounded-lg border border-[#E9E7E1] dark:border-[#333333] bg-white dark:bg-[#222222] font-semibold"
                      >
                        {currencies.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.symbol} {c.name}
                          </option>
                        ))}
                      </select>
                      <Coins className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#555555] dark:text-[#A1A1A1] mb-1 font-medium">
                      GSTIN / Tax ID (Optional)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. 27AABCC1234F1Z5"
                        value={taxIdentifier}
                        onChange={(e) => setTaxIdentifier(e.target.value)}
                        className="w-full px-3 py-2 pl-9 rounded-lg border border-[#E9E7E1] dark:border-[#333333] bg-white dark:bg-[#222222] font-mono uppercase focus:outline-hidden"
                      />
                      <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>
                </div>

                {/* Final Workspace Summary Card */}
                <div className="p-3 bg-emerald-50/70 dark:bg-[#14281E] border border-emerald-200 dark:border-emerald-900 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Ready to Initialize Workspace</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    Store: <span className="font-semibold">{businessName}</span> • Prefix:{" "}
                    <span className="font-mono font-semibold">{customPrefix}</span> • Currency:{" "}
                    <span className="font-semibold">{currency}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSurveyStep(2)}
                    className="px-4 py-2.5 rounded-lg border border-[#E9E7E1] dark:border-[#333333] hover:bg-[#F2F0EA] dark:hover:bg-[#252525] font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleCompleteSurveyAndSignUp}
                    className="flex-1 py-2.5 bg-[#171717] dark:bg-white hover:bg-[#2A2A2A] dark:hover:bg-neutral-200 text-white dark:text-[#171717] rounded-lg font-semibold flex items-center justify-center gap-2 transition shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <span>{isSubmitting ? "Creating Workspace..." : "🚀 Launch Workspace"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* 4. SWITCH / MANAGE PROFILES (With Profile Delete Action)      */}
        {/* ============================================================ */}
        {mode === "switch" && (
          <div className="space-y-3 text-xs pt-1">
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {allUsers.map((u) => {
                const isCurrent = user?.id === u.id;
                const catInfo = BUSINESS_CATEGORIES[u.businessCategory] || BUSINESS_CATEGORIES.custom;

                return (
                  <div
                    key={u.id}
                    className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition ${
                      isCurrent
                        ? "bg-[#F7F6F2] dark:bg-[#242424] border-[#171717] dark:border-white font-semibold"
                        : "bg-white dark:bg-[#1F1F1F] border-[#E9E7E1] dark:border-[#333333] hover:bg-[#FAF9F5] dark:hover:bg-[#282828]"
                    }`}
                  >
                    <div
                      onClick={() => {
                        switchAccount(u.id);
                        onClose();
                      }}
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#171717] dark:bg-white text-white dark:text-[#171717] flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                        {u.fullName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-[#171717] dark:text-[#F5F5F5]">
                          {u.businessName}
                        </div>
                        <div className="text-[11px] text-[#777777] dark:text-[#A1A1A1]">
                          {u.fullName} ({u.email})
                        </div>
                        <div className="text-[10px] font-mono text-[#24845B] dark:text-emerald-400">
                          {catInfo.shortName} • Prefix: {catInfo.receiptPrefix}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded-full bg-[#171717] dark:bg-white text-white dark:text-[#171717] text-[10px] font-medium">
                          Active
                        </span>
                      )}

                      {/* Delete Profile Trash Button */}
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (
                            confirm(
                              `Are you sure you want to permanently delete profile "${u.businessName}" (${u.email})?`
                            )
                          ) {
                            await deleteAccount(u.id);
                            if (allUsers.length <= 1) {
                              setMode("register");
                            }
                          }
                        }}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition cursor-pointer"
                        title="Delete this profile"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#F2F0EA] dark:border-[#262626] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setErrorMsg("");
                }}
                className="px-3.5 py-2 bg-[#171717] dark:bg-white text-white dark:text-[#171717] rounded-lg font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Create Another Business Account</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMsg("");
                }}
                className="text-xs text-[#777777] dark:text-[#A1A1A1] hover:text-[#171717] dark:hover:text-white underline cursor-pointer"
              >
                Sign In With Password
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
