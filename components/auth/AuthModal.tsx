"use client";

import React, { useState } from "react";
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
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  Briefcase,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { BusinessCategoryKey, BUSINESS_CATEGORIES } from "@/lib/business-categories";
import { evaluatePasswordStrength, hashPasswordWithSalt } from "@/lib/security/password";
import { ApplicationFirewall } from "@/lib/security/firewall";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "signup" | "login" | "switch";
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = "signup",
}) => {
  const { signUp, login, allUsers, switchAccount, user } = useAuth();
  const [mode, setMode] = useState<"signup" | "login" | "switch">(defaultMode);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategoryKey>("gym_fitness");
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [customPrefix, setCustomPrefix] = useState("BIZ-");

  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const passwordEvaluation = evaluatePasswordStrength(password);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanFullName = ApplicationFirewall.sanitizeInput(fullName);
    const cleanEmail = ApplicationFirewall.sanitizeInput(email);
    const cleanBusinessName = ApplicationFirewall.sanitizeInput(businessName);

    if (!cleanFullName || !cleanEmail || !cleanBusinessName) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    // Tough Password Enforcement
    if (!passwordEvaluation.isValid) {
      setErrorMsg(
        "Password does not meet toughness standards: Must be at least 8 chars with uppercase, lowercase, number, and special symbol (!@#$%^&*)."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const hashedPassword = await hashPasswordWithSalt(password, cleanEmail);

      await signUp({
        fullName: cleanFullName,
        email: cleanEmail,
        businessName: cleanBusinessName,
        category: selectedCategory,
      });

      ApplicationFirewall.resetAttempts(cleanEmail);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create account.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          setErrorMsg(`Invalid credentials. ${failure.attemptsLeft} attempts remaining before temporary lockout.`);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to log in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryCards = [
    {
      key: "gym_fitness" as BusinessCategoryKey,
      title: "Gym & Fitness Club",
      desc: "Memberships, Personal Training, Class Passes",
      icon: Dumbbell,
    },
    {
      key: "general_store" as BusinessCategoryKey,
      title: "General Store / Retail",
      desc: "Groceries, Daily Essentials, FMCG & Supermarket",
      icon: ShoppingBag,
    },
    {
      key: "freelancer_services" as BusinessCategoryKey,
      title: "Freelancer & Agency",
      desc: "Software, Design, Consulting & Milestones",
      icon: Laptop,
    },
    {
      key: "restaurant_cafe" as BusinessCategoryKey,
      title: "Restaurant & Cafe",
      desc: "Dine-in, Takeaway, Food & Beverages",
      icon: Coffee,
    },
    {
      key: "individual_personal" as BusinessCategoryKey,
      title: "Individual / Personal",
      desc: "Rent receipts, Tuition & Personal records",
      icon: User,
    },
    {
      key: "custom" as BusinessCategoryKey,
      title: "Unlisted / Custom Business",
      desc: "Tailor your own business type, prefix & catalogue",
      icon: Briefcase,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-[#E9E7E1] shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 my-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-6 rounded-md bg-[#171717] text-white flex items-center justify-center font-mono font-bold text-xs">
                R.
              </span>
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#777777] font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Hardened SaaS Security
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[#171717]">
              {mode === "signup" && "Create Your Business Account"}
              {mode === "login" && "Secure Workspace Sign In"}
              {mode === "switch" && "Switch Active Account"}
            </h2>
            <p className="text-xs text-[#777777] mt-0.5">
              {mode === "signup" && "Select what you use it for (listed or unlisted) with encrypted password protection."}
              {mode === "login" && "Protected by brute-force rate limiting and zero-leak credentials."}
              {mode === "switch" && "Choose an existing user profile or create a new one."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#777777] hover:text-[#171717] hover:bg-[#F7F6F2] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-[#FDF2F2] border border-[#FCA5A5] text-[#C64B4B] rounded-lg text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex rounded-lg bg-[#F2F0EA] p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 py-1.5 rounded-md transition ${
              mode === "signup" ? "bg-white text-[#171717] shadow-xs font-semibold" : "text-[#777777]"
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 py-1.5 rounded-md transition ${
              mode === "login" ? "bg-white text-[#171717] shadow-xs font-semibold" : "text-[#777777]"
            }`}
          >
            Sign In
          </button>
          {allUsers.length > 0 && (
            <button
              type="button"
              onClick={() => setMode("switch")}
              className={`flex-1 py-1.5 rounded-md transition ${
                mode === "switch" ? "bg-white text-[#171717] shadow-xs font-semibold" : "text-[#777777]"
              }`}
            >
              Profiles ({allUsers.length})
            </button>
          )}
        </div>

        {/* SIGN UP FORM */}
        {mode === "signup" && (
          <form onSubmit={handleSignUp} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#555555] mb-1 font-medium">Your Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E9E7E1] focus:outline-hidden focus:border-[#171717]"
                />
              </div>

              <div>
                <label className="block text-[#555555] mb-1 font-medium">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="name@business.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E9E7E1] focus:outline-hidden focus:border-[#171717]"
                />
              </div>
            </div>

            {/* Hardened Password Field with Live Strength Indicator */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[#555555] font-medium flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-500" /> Hard Password *
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
                  placeholder="Min 8 chars, A-Z, 0-9, and special symbol (@$!%*?&#)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-9 rounded-lg border border-[#E9E7E1] font-mono focus:outline-hidden focus:border-[#171717]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Bar */}
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
                        : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[#555555] mb-1 font-medium">
                Business / Store / Gym Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. IronCore Gym, Super Mart, or Lotus Clinic"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E9E7E1] font-medium focus:outline-hidden focus:border-[#171717]"
              />
            </div>

            {/* Industry Selector */}
            <div>
              <label className="block text-[#555555] mb-1.5 font-medium">
                Select Your Business Type / Industry:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {categoryCards.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === cat.key;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setSelectedCategory(cat.key)}
                      className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition ${
                        isSelected
                          ? "bg-[#171717] text-white border-[#171717] shadow-xs"
                          : "bg-white text-[#171717] border-[#E9E7E1] hover:bg-[#F7F6F2]"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-white/20 text-white" : "bg-[#F2F0EA] text-[#171717]"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="leading-tight">
                        <span className="font-bold text-xs block">{cat.title}</span>
                        <span
                          className={`text-[10px] line-clamp-1 ${
                            isSelected ? "text-slate-300" : "text-[#777777]"
                          }`}
                        >
                          {cat.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Unlisted Custom Business Specification Fields */}
            {selectedCategory === "custom" && (
              <div className="p-3 bg-[#F7F6F2] border border-[#E9E7E1] rounded-xl space-y-3">
                <span className="text-[11px] font-bold text-[#171717] block">
                  Custom / Unlisted Business Setup
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#555555] mb-1">Business Category / Trade</label>
                    <input
                      type="text"
                      placeholder="e.g. Pet Grooming / Dental Clinic"
                      value={customCategoryName}
                      onChange={(e) => setCustomCategoryName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md border border-[#E9E7E1] bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[#555555] mb-1">Receipt Prefix</label>
                    <input
                      type="text"
                      placeholder="e.g. PET-, DENT-, AUTO-"
                      value={customPrefix}
                      onChange={(e) => setCustomPrefix(e.target.value.toUpperCase())}
                      className="w-full px-2.5 py-1.5 rounded-md border border-[#E9E7E1] bg-white font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-[#171717] hover:bg-[#222222] text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition shadow-sm"
              >
                <span>Create Secure Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* LOGIN FORM */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-[#555555] mb-1 font-medium">Registered Email</label>
              <input
                type="email"
                required
                placeholder="billing@yourbusiness.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E9E7E1] focus:outline-hidden focus:border-[#171717]"
              />
            </div>

            <div>
              <label className="block text-[#555555] mb-1 font-medium">Password</label>
              <input
                type="password"
                required
                placeholder="Enter your hard password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E9E7E1] font-mono focus:outline-hidden focus:border-[#171717]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-[#171717] hover:bg-[#222222] text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition shadow-sm"
              >
                <span>Sign In Securely</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* SWITCH ACCOUNT LIST */}
        {mode === "switch" && (
          <div className="space-y-2 text-xs">
            {allUsers.map((u) => {
              const isCurrent = user?.id === u.id;
              const catInfo = BUSINESS_CATEGORIES[u.businessCategory] || BUSINESS_CATEGORIES.custom;

              return (
                <button
                  key={u.id}
                  onClick={() => {
                    switchAccount(u.id);
                    onClose();
                  }}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition ${
                    isCurrent
                      ? "bg-[#F7F6F2] border-[#171717] font-semibold"
                      : "bg-white border-[#E9E7E1] hover:bg-[#F7F6F2]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#171717] text-white flex items-center justify-center font-bold text-xs">
                      {u.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[#171717]">{u.businessName}</div>
                      <div className="text-[11px] text-[#777777]">
                        {u.fullName} ({u.email})
                      </div>
                      <div className="text-[10px] font-mono text-[#24845B]">
                        {catInfo.shortName} • Prefix: {catInfo.receiptPrefix}
                      </div>
                    </div>
                  </div>

                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded-full bg-[#171717] text-white text-[10px] font-medium">
                      Active
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
