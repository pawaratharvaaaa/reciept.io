import { ReceiptTemplateKey } from "./types/receipt";

export type BusinessCategoryKey =
  | "gym_fitness"
  | "general_store"
  | "freelancer_services"
  | "restaurant_cafe"
  | "individual_personal"
  | "custom";

export interface StarterProduct {
  name: string;
  description: string;
  sku: string;
  unit: string;
  unitPriceMinor: number;
  defaultTaxRate: number;
}

export interface BusinessCategoryConfig {
  key: BusinessCategoryKey;
  label: string;
  shortName: string;
  tagline: string;
  iconName: string;
  receiptPrefix: string;
  defaultTemplate: ReceiptTemplateKey;
  defaultCurrency: string;
  termsPlaceholder: string;
  starterProducts: StarterProduct[];
}

export const BUSINESS_CATEGORIES: Record<BusinessCategoryKey, BusinessCategoryConfig> = {
  gym_fitness: {
    key: "gym_fitness",
    label: "Gym, Fitness & Health Club",
    shortName: "Gym / Fitness",
    tagline: "Memberships, Personal Training, Class Passes & Nutrition",
    iconName: "Dumbbell",
    receiptPrefix: "GYM-",
    defaultTemplate: "retail",
    defaultCurrency: "INR",
    termsPlaceholder: "Memberships are non-transferable. Please bring your membership card/receipt on your first visit.",
    starterProducts: [
      {
        name: "Annual Gold Membership (12 Months)",
        description: "Unlimited cardio, weight floor, steam room and locker access.",
        sku: "GYM-ANN-01",
        unit: "Year",
        unitPriceMinor: 1800000, // ₹18,000.00
        defaultTaxRate: 18.0,
      },
      {
        name: "Quarterly Fitness Pass (3 Months)",
        description: "Full gym floor access with general trainer guidance.",
        sku: "GYM-QTR-02",
        unit: "3 Months",
        unitPriceMinor: 550000, // ₹5,500.00
        defaultTaxRate: 18.0,
      },
      {
        name: "Monthly Workout Plan",
        description: "Standard 30-day membership access.",
        sku: "GYM-MTH-03",
        unit: "Month",
        unitPriceMinor: 220000, // ₹2,200.00
        defaultTaxRate: 18.0,
      },
      {
        name: "Personal Training Pack (12 Sessions)",
        description: "One-on-one customized workout & diet coaching with a certified trainer.",
        sku: "GYM-PT-04",
        unit: "Sessions",
        unitPriceMinor: 900000, // ₹9,000.00
        defaultTaxRate: 18.0,
      },
      {
        name: "Whey Protein Isolate (1kg)",
        description: "100% Ultra-filtered whey protein powder (Chocolate flavor).",
        sku: "GYM-NUT-05",
        unit: "Jar",
        unitPriceMinor: 280000, // ₹2,800.00
        defaultTaxRate: 18.0,
      },
      {
        name: "Day Workout Guest Pass",
        description: "Single-day trial workout pass for visitor.",
        sku: "GYM-DAY-06",
        unit: "Day",
        unitPriceMinor: 35000, // ₹350.00
        defaultTaxRate: 18.0,
      },
    ],
  },

  general_store: {
    key: "general_store",
    label: "General Store, Kirana & Supermarket",
    shortName: "General Store / Retail",
    tagline: "Daily Groceries, Packed Foods, FMCG & Household Essentials",
    iconName: "ShoppingBag",
    receiptPrefix: "STR-",
    defaultTemplate: "retail",
    defaultCurrency: "INR",
    termsPlaceholder: "Goods once sold can only be exchanged within 48 hours with original receipt.",
    starterProducts: [
      {
        name: "Daawat Rozana Basmati Rice (5kg)",
        description: "Long grain aromatic basmati rice pouch.",
        sku: "GROC-RICE-01",
        unit: "Bag",
        unitPriceMinor: 45000, // ₹450.00
        defaultTaxRate: 0.0,
      },
      {
        name: "Aashirvaad Shudh Chakki Atta (10kg)",
        description: "100% whole wheat whole meal flour.",
        sku: "GROC-ATTA-02",
        unit: "Bag",
        unitPriceMinor: 39500, // ₹395.00
        defaultTaxRate: 0.0,
      },
      {
        name: "Fortune Sunlite Refined Sunflower Oil (1L)",
        description: "Enriched with Vitamin A & D cooking oil.",
        sku: "GROC-OIL-03",
        unit: "Pouch",
        unitPriceMinor: 14500, // ₹145.00
        defaultTaxRate: 5.0,
      },
      {
        name: "Tata Tea Gold (500g)",
        description: "Premium Assam CTC tea with gently rolled long leaves.",
        sku: "GROC-TEA-04",
        unit: "Pack",
        unitPriceMinor: 26000, // ₹260.00
        defaultTaxRate: 5.0,
      },
      {
        name: "Cadbury Dairy Milk Silk (150g)",
        description: "Creamy milk chocolate bar.",
        sku: "GROC-CHOC-05",
        unit: "Bar",
        unitPriceMinor: 17500, // ₹175.00
        defaultTaxRate: 18.0,
      },
      {
        name: "Amul Taaza Homogenised Toned Milk (1L)",
        description: "UHT treated pasteurised milk.",
        sku: "GROC-MLK-06",
        unit: "Tetra",
        unitPriceMinor: 7400, // ₹74.00
        defaultTaxRate: 0.0,
      },
    ],
  },

  freelancer_services: {
    key: "freelancer_services",
    label: "Freelancers, Agencies & Consultants",
    shortName: "Freelancer / Agency",
    tagline: "Software, Design, Digital Marketing, Legal & Consulting",
    iconName: "Laptop",
    receiptPrefix: "INV-",
    defaultTemplate: "retail",
    defaultCurrency: "INR",
    termsPlaceholder: "Payment due within 14 days of issue. Wire transfer instructions provided below.",
    starterProducts: [
      {
        name: "UI/UX Product Design Sprint",
        description: "User research, wireframing, component design system and clickable prototype.",
        sku: "SVC-DES-01",
        unit: "Sprint",
        unitPriceMinor: 5000000, // ₹50,000.00
        defaultTaxRate: 18.0,
      },
      {
        name: "Fullstack Web Application Milestone",
        description: "Frontend & backend feature engineering, API integration, and staging deployment.",
        sku: "SVC-DEV-02",
        unit: "Milestone",
        unitPriceMinor: 8500000, // ₹85,000.00
        defaultTaxRate: 18.0,
      },
      {
        name: "Monthly Strategic Advisory Retainer",
        description: "Weekly consultations, architecture reviews, and technical direction.",
        sku: "SVC-ADV-03",
        unit: "Month",
        unitPriceMinor: 3500000, // ₹35,000.00
        defaultTaxRate: 18.0,
      },
      {
        name: "Security Audit & Performance Optimization",
        description: "Database indexing, Lighthouse audit, CWV improvements and pen-testing.",
        sku: "SVC-OPT-04",
        unit: "Audit",
        unitPriceMinor: 2500000, // ₹25,000.00
        defaultTaxRate: 18.0,
      },
    ],
  },

  restaurant_cafe: {
    key: "restaurant_cafe",
    label: "Restaurant, Cafe & Eatery",
    shortName: "Restaurant / Cafe",
    tagline: "Dine-in, Takeaway, Coffee, Pastries & Beverages",
    iconName: "Coffee",
    receiptPrefix: "CAFE-",
    defaultTemplate: "retail",
    defaultCurrency: "INR",
    termsPlaceholder: "Thank you for dining with us! Service tax included where applicable.",
    starterProducts: [
      {
        name: "Specialty Cappuccino (Double Shot)",
        description: "Freshly roasted single origin beans with microfoam milk.",
        sku: "FD-BEV-01",
        unit: "Cup",
        unitPriceMinor: 22000, // ₹220.00
        defaultTaxRate: 5.0,
      },
      {
        name: "Woodfired Margherita Pizza (11 inch)",
        description: "San Marzano tomato base, fresh buffalo mozzarella and fresh basil.",
        sku: "FD-PIZ-02",
        unit: "Pie",
        unitPriceMinor: 48000, // ₹480.00
        defaultTaxRate: 5.0,
      },
      {
        name: "Belgian Dark Chocolate Waffle",
        description: "Warm crisp waffle served with vanilla bean gelato.",
        sku: "FD-DES-03",
        unit: "Plate",
        unitPriceMinor: 29000, // ₹290.00
        defaultTaxRate: 5.0,
      },
      {
        name: "Cold Brew Tonic & Lime",
        description: "16-hour slow steeped cold brew infused with tonic water.",
        sku: "FD-BEV-04",
        unit: "Glass",
        unitPriceMinor: 24000, // ₹240.00
        defaultTaxRate: 5.0,
      },
    ],
  },

  individual_personal: {
    key: "individual_personal",
    label: "Individual & Personal Records",
    shortName: "Personal / Individual",
    tagline: "Rent Receipts, Medical Bills, Coaching & Personal Documentation",
    iconName: "User",
    receiptPrefix: "REC-",
    defaultTemplate: "retail",
    defaultCurrency: "INR",
    termsPlaceholder: "Official receipt acknowledging financial payment received in full.",
    starterProducts: [
      {
        name: "Residential House Rent Receipt",
        description: "Monthly residential rental fee acknowledgement for HRA exemption.",
        sku: "PER-RENT-01",
        unit: "Month",
        unitPriceMinor: 2500000, // ₹25,000.00
        defaultTaxRate: 0.0,
      },
      {
        name: "Private Academic Tutoring",
        description: "Monthly coaching and exam preparation sessions.",
        sku: "PER-TUT-02",
        unit: "Month",
        unitPriceMinor: 400000, // ₹4,000.00
        defaultTaxRate: 0.0,
      },
      {
        name: "Society Maintenance & Parking Dues",
        description: "Quarterly housing society maintenance charges.",
        sku: "PER-SOC-03",
        unit: "Quarter",
        unitPriceMinor: 650000, // ₹6,500.00
        defaultTaxRate: 0.0,
      },
    ],
  },

  custom: {
    key: "custom",
    label: "Custom Business / Other",
    shortName: "Custom Business",
    tagline: "Tailor your products, pricing, and receipts freely",
    iconName: "Briefcase",
    receiptPrefix: "REC-",
    defaultTemplate: "retail",
    defaultCurrency: "INR",
    termsPlaceholder: "Thank you for your business.",
    starterProducts: [],
  },
};
