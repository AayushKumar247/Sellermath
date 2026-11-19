import { useState, useCallback, useMemo, useEffect } from 'react';
import type { PageId } from '@/components/Sidebar';
import MarketplaceLogo from '@/components/MarketplaceLogo';
import {
  ArrowRight,
  Check,
  ChevronRight,
  ShieldAlert,
  TrendingUp,
  Wallet,
} from 'lucide-react';

interface MarketplaceGuideProps {
  onNavigate: (page: PageId) => void;
}

interface MarketplaceGuideData {
  id: string;
  name: string;
  tag: string;
  category: 'horizontal' | 'fashion' | 'quick-commerce';
  commissionRange: string;
  settlementCycle: string;
  rtoRisk: string;
  minEntry: string;
  onboardingSteps: string[];
  referralFee: string;
  closingFee: string;
  shippingSlabs: string;
  volumetricFormula: string;
  gstTcsTds: string;
  rankingLevers: string[];
  rtoClaimWindow: string;
  rtoRules: string[];
  rtoSteps: string[];
  comparison: {
    commission: string;
    closingFee: string;
    courierRto: string;
    customerReturn: string;
    payoutCycle: string;
    bestCategories: string;
  };
}

const MARKETPLACE_GUIDES: MarketplaceGuideData[] = [
  {
    id: 'amazon',
    name: 'Amazon India',
    tag: 'FBA & Easy Ship',
    category: 'horizontal',
    commissionRange: '3%–18%',
    settlementCycle: '7 Days post-delivery',
    rtoRisk: 'Courier RTO: ₹30–₹60 | Customer Return: Forward + Reverse shipping',
    minEntry: 'Regular GSTIN + Bank Account',
    onboardingSteps: [
      'GSTIN registration & PAN verification',
      'Seller Central account setup',
      'Bank account & KYC verification',
      'Product category approval (if gated)',
      'FBA / Easy Ship enrollment',
      'Pickup pin-code serviceability check',
      'Packaging material compliance',
      'Catalog listing activation',
    ],
    referralFee: '3%–18% by category',
    closingFee: '₹0–₹50 per order',
    shippingSlabs: '₹30–₹120 by weight slab',
    volumetricFormula: 'L × B × H ÷ 5000 (cm)',
    gstTcsTds: '18% GST on fees | 1% TCS | 0.1% TDS',
    rankingLevers: [
      'Prime badge eligibility (FBA)',
      'Backend search keywords (250 bytes)',
      'Order Defect Rate < 1%',
      'Inventory Health & in-stock rate',
    ],
    rtoClaimWindow: '7 days from delivery',
    rtoRules: [
      'Unboxing video mandatory for damage claims',
      'Barcode (FNSKU) label must be intact',
      'Original packaging required for return',
    ],
    rtoSteps: [
      'Raise claim in Seller Central within 7 days',
      'Attach unboxing video & label photos',
      'Challenge weight dispute with dimensional proof',
    ],
    comparison: {
      commission: '3%–18%',
      closingFee: '₹0–₹50',
      courierRto: '₹30–₹60',
      customerReturn: 'Forward + Reverse',
      payoutCycle: '7 Days',
      bestCategories: 'Electronics, Home, Fashion, Grocery',
    },
  },
  {
    id: 'flipkart',
    name: 'Flipkart',
    tag: 'Tiered Smart Fulfillment',
    category: 'horizontal',
    commissionRange: '4%–20%',
    settlementCycle: 'T+5 Days',
    rtoRisk: 'Courier RTO: ₹35–₹70 | Customer Return: Forward shipping charged',
    minEntry: 'GSTIN + Bank Account + PAN',
    onboardingSteps: [
      'GSTIN registration & PAN verification',
      'Flipkart Seller Hub registration',
      'Category-wise approval',
      'Smart Fulfillment / Flipkart Assured enrollment',
      'Pickup pin-code verification',
      'Packaging guideline compliance',
      'Catalog listing activation',
    ],
    referralFee: '4%–20% by category slab',
    closingFee: 'Flat ₹10–₹50 per order',
    shippingSlabs: 'Regional slabs: ₹35–₹110',
    volumetricFormula: 'L × B × H ÷ 5000 (cm)',
    gstTcsTds: '18% GST on fees | 1% TCS | 0.1% TDS',
    rankingLevers: [
      'Flipkart Assured badge',
      'Next-Day Dispatch SLA compliance',
      'Seller rating & cancellation rate',
      'Buy Box win percentage',
    ],
    rtoClaimWindow: '14 days from delivery',
    rtoRules: [
      'Unboxing video mandatory for all claims',
      'Barcode label must be scannable',
      'Weight proof photos required',
    ],
    rtoSteps: [
      'File claim in Seller Hub within 14 days',
      'Submit unboxing video & invoice copy',
      'Challenge weight via dimensional weight report',
    ],
    comparison: {
      commission: '4%–20%',
      closingFee: '₹10–₹50',
      courierRto: '₹35–₹70',
      customerReturn: 'Forward shipping',
      payoutCycle: 'T+5 Days',
      bestCategories: 'Electronics, Fashion, Home, Furniture',
    },
  },
  {
    id: 'meesho',
    name: 'Meesho',
    tag: '0% Commission',
    category: 'horizontal',
    commissionRange: '0%',
    settlementCycle: 'Bi-weekly (T+10)',
    rtoRisk: 'Supplier bears RTO cost | Self-ship or Meesho Delivery',
    minEntry: 'GSTIN (optional for low value) + Bank Account',
    onboardingSteps: [
      'Meesho Supplier Panel registration',
      'GSTIN / HSN code setup (if applicable)',
      'Bank account & KYC verification',
      'Product catalog creation',
      'Pickup pin-code verification',
      'Packaging standard compliance',
      'Catalog listing activation',
    ],
    referralFee: '0% commission — no referral fee',
    closingFee: 'Payment gateway fee only',
    shippingSlabs: 'Meesho Delivery slabs or self-ship',
    volumetricFormula: 'L × B × H ÷ 5000 (cm)',
    gstTcsTds: '18% GST on fees | 1% TCS',
    rankingLevers: [
      'Supplier Score (fulfillment rating)',
      'Lowest Price Lock competitiveness',
      'Order cancellation rate',
      'Customer review rating',
    ],
    rtoClaimWindow: '7 days from delivery',
    rtoRules: [
      'Supplier bears RTO cost for self-ship',
      'Unboxing video recommended for disputes',
      'Barcode label required for tracking',
    ],
    rtoSteps: [
      'Raise dispute in Supplier Panel within 7 days',
      'Provide packing slip & courier receipt',
      'Submit weight challenge with measurements',
    ],
    comparison: {
      commission: '0%',
      closingFee: 'Gateway fee only',
      courierRto: 'Supplier bears cost',
      customerReturn: 'Self-ship / Meesho Delivery',
      payoutCycle: 'Bi-weekly (T+10)',
      bestCategories: 'Fashion, Home, Kitchen, Beauty',
    },
  },
  {
    id: 'myntra',
    name: 'Myntra',
    tag: 'Curated Fashion',
    category: 'fashion',
    commissionRange: '12%–24%',
    settlementCycle: 'Weekly (T+7)',
    rtoRisk: 'High apparel RTO | Forward + Reverse + Quality check',
    minEntry: 'Brand Trademark + Curated Approval + GSTIN',
    onboardingSteps: [
      'Brand trademark registration',
      'Myntra partnership application',
      'Curated brand approval',
      'GSTIN + Bank account setup',
      'Fashion category onboarding',
      'Fashion packaging guidelines compliance',
      'Pin-code serviceability check',
      'Catalog listing activation',
    ],
    referralFee: '12%–24% (apparel higher)',
    closingFee: '₹15–₹40 per order',
    shippingSlabs: '₹35–₹85 by weight slab',
    volumetricFormula: 'L × B × H ÷ 5000 (cm)',
    gstTcsTds: '18% GST on fees | 1% TCS',
    rankingLevers: [
      'Brand visibility & search placement',
      'Sell-through rate (STR)',
      'Return rate (lower is better)',
      'Customer rating & review score',
    ],
    rtoClaimWindow: '7 days from delivery',
    rtoRules: [
      'Unboxing video mandatory for damage/defect',
      'Brand tag & barcode intact required',
      'Original packaging with hanger/packaging',
    ],
    rtoSteps: [
      'File claim via Myntra Seller Panel within 7 days',
      'Attach unboxing video & tag photos',
      'Challenge size/weight dispute with measurements',
    ],
    comparison: {
      commission: '12%–24%',
      closingFee: '₹15–₹40',
      courierRto: 'High (apparel)',
      customerReturn: 'Forward + Reverse + QC',
      payoutCycle: 'Weekly (T+7)',
      bestCategories: 'Apparel, Footwear, Accessories',
    },
  },
  {
    id: 'blinkit',
    name: 'Blinkit',
    tag: '10-Min Dark Store',
    category: 'quick-commerce',
    commissionRange: '15%–22%',
    settlementCycle: 'Weekly',
    rtoRisk: 'Minimal RTO (instant delivery) | Damaged/shortage claims',
    minEntry: 'APOOB / Dark Store GST + FSSAI License',
    onboardingSteps: [
      'Dark Store partnership application',
      'FSSAI food license registration',
      'GST registration (Dark Store / APOOB)',
      'APOOB compliance setup',
      'Pin-code within dark store radius',
      'Cold chain compliance (if applicable)',
      'SKU catalog onboarding',
      'Inventory sync activation',
    ],
    referralFee: '15%–22% margin share',
    closingFee: 'Slotting fee per SKU',
    shippingSlabs: 'Last-mile delivery included',
    volumetricFormula: 'N/A (dark store — unit-based)',
    gstTcsTds: '18% GST on fees | 1% TCS',
    rankingLevers: [
      'Stock Fill Rate (SKU availability)',
      'Dark Store replenishment speed',
      'Order acceptance rate',
      'Customer rating & review score',
    ],
    rtoClaimWindow: 'Immediate (same-day)',
    rtoRules: [
      'Photo evidence of damaged/shortage goods',
      'No unboxing video required (instant)',
      'Barcode scan at delivery required',
    ],
    rtoSteps: [
      'Raise claim via Blinkit Partner app immediately',
      'Attach damaged goods photo',
      'Claim shortage with weight discrepancy proof',
    ],
    comparison: {
      commission: '15%–22%',
      closingFee: 'Slotting fee',
      courierRto: 'Minimal (instant)',
      customerReturn: 'Damaged / shortage only',
      payoutCycle: 'Weekly',
      bestCategories: 'Grocery, Dairy, Personal Care',
    },
  },
  {
    id: 'zepto',
    name: 'Zepto',
    tag: 'Rapid Dark Store',
    category: 'quick-commerce',
    commissionRange: '10%–18%',
    settlementCycle: 'Weekly',
    rtoRisk: 'Minimal RTO | Damaged / shortage claims',
    minEntry: 'Dark Store GST + FSSAI License',
    onboardingSteps: [
      'Zepto dark store partnership registration',
      'FSSAI food license',
      'GST registration (dark store model)',
      'Pin-code within dark store catchment',
      'Cold chain compliance (if applicable)',
      'SKU onboarding & catalog setup',
      'Inventory & replenishment sync',
      'Quality check compliance',
    ],
    referralFee: '10%–18% margin share',
    closingFee: 'SKU listing fee',
    shippingSlabs: 'Dark store last-mile included',
    volumetricFormula: 'N/A (unit-based dark store)',
    gstTcsTds: '18% GST on fees | 1% TCS',
    rankingLevers: [
      'Stock Fill Rate (SKU availability)',
      'Dark Store replenishment SLA',
      'Order acceptance rate',
      'Customer rating',
    ],
    rtoClaimWindow: 'Immediate (same-day)',
    rtoRules: [
      'Photo proof of damage / shortage',
      'Barcode scan mandatory at handover',
      'No unboxing video (instant model)',
    ],
    rtoSteps: [
      'Raise claim in Zepto Partner portal',
      'Upload damage / shortage photo',
      'Submit weight / quantity discrepancy proof',
    ],
    comparison: {
      commission: '10%–18%',
      closingFee: 'SKU listing fee',
      courierRto: 'Minimal',
      customerReturn: 'Damaged / shortage only',
      payoutCycle: 'Weekly',
      bestCategories: 'Grocery, Beverages, Snacks',
    },
  },
  {
    id: 'instamart',
    name: 'Instamart (Swiggy)',
    tag: 'Swiggy Quick Commerce',
    category: 'quick-commerce',
    commissionRange: '12%–20%',
    settlementCycle: 'Weekly',
    rtoRisk: 'Minimal RTO | Damaged / shortage claims',
    minEntry: 'Dark Store GST + FSSAI + Swiggy Onboarding',
    onboardingSteps: [
      'Swiggy Instamart partnership registration',
      'FSSAI food license',
      'GST registration (dark store)',
      'Swiggy vendor onboarding',
      'Pin-code within dark store radius',
      'Cold chain compliance (if applicable)',
      'SKU catalog activation',
      'Inventory sync setup',
    ],
    referralFee: '12%–20% margin share',
    closingFee: 'Platform listing fee',
    shippingSlabs: 'Last-mile included in margin',
    volumetricFormula: 'N/A (unit-based)',
    gstTcsTds: '18% GST on fees | 1% TCS',
    rankingLevers: [
      'Stock Fill Rate (SKU availability)',
      'Dark Store replenishment speed',
      'Order acceptance rate',
      'Customer rating & review score',
    ],
    rtoClaimWindow: 'Immediate (same-day)',
    rtoRules: [
      'Photo evidence of damaged / shortage goods',
      'Barcode scan at delivery',
      'No unboxing video required',
    ],
    rtoSteps: [
      'Raise claim via Swiggy Partner app',
      'Attach goods damage photo',
      'Submit shortage / weight proof',
    ],
    comparison: {
      commission: '12%–20%',
      closingFee: 'Listing fee',
      courierRto: 'Minimal',
      customerReturn: 'Damaged / shortage only',
      payoutCycle: 'Weekly',
      bestCategories: 'Grocery, Dairy, Ready-to-eat',
    },
  },
  {
    id: 'snapdeal',
    name: 'Snapdeal',
    tag: 'Value Tier Marketplace',
    category: 'horizontal',
    commissionRange: '5%–15%',
    settlementCycle: '15 Days (Bi-weekly)',
    rtoRisk: 'Courier RTO: ₹30–₹55 | Customer Return: Forward + Reverse',
    minEntry: 'GSTIN + Bank Account + PAN',
    onboardingSteps: [
      'Snapdeal seller registration',
      'GSTIN & PAN verification',
      'Bank account & KYC setup',
      'Product category approval',
      'Logistics partner selection',
      'Pickup pin-code verification',
      'Packaging compliance',
      'Catalog listing activation',
    ],
    referralFee: '5%–15% by category',
    closingFee: '₹5–₹30 per order',
    shippingSlabs: '₹30–₹100 by weight slab',
    volumetricFormula: 'L × B × H ÷ 5000 (cm)',
    gstTcsTds: '18% GST on fees | 1% TCS',
    rankingLevers: [
      'Seller rating & feedback score',
      'Price competitiveness vs market',
      'Order fulfillment rate',
      'Product quality & return rate',
    ],
    rtoClaimWindow: '7 days from delivery',
    rtoRules: [
      'Unboxing video recommended for claims',
      'Barcode label intact for tracking',
      'Original packaging required',
    ],
    rtoSteps: [
      'File claim in Snapdeal Seller Panel within 7 days',
      'Attach unboxing video & label photos',
      'Challenge weight with dimensional report',
    ],
    comparison: {
      commission: '5%–15%',
      closingFee: '₹5–₹30',
      courierRto: '₹30–₹55',
      customerReturn: 'Forward + Reverse',
      payoutCycle: '15 Days',
      bestCategories: 'Electronics, Home, Value Goods',
    },
  },
];

const CATEGORY_FILTERS = [
  { id: 'all', label: 'All 8 Platforms' },
  { id: 'horizontal', label: 'Horizontal Marketplaces' },
  { id: 'fashion', label: 'Fashion & Lifestyle' },
  { id: 'quick-commerce', label: 'Quick Commerce (Dark Stores)' },
] as const;

export default function MarketplaceSellingGuides({ onNavigate }: MarketplaceGuideProps) {
  const [selectedId, setSelectedId] = useState<string>('amazon');
  const [activeCat, setActiveCat] = useState<string>('all');
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  const selected = useMemo(
    () => MARKETPLACE_GUIDES.find((m) => m.id === selectedId) ?? MARKETPLACE_GUIDES[0],
    [selectedId]
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`sellermath_guide_checklist_${selectedId}`);
      if (raw) setChecklist(JSON.parse(raw));
    } catch {
      // ignore parse errors
    }
  }, [selectedId]);

  useEffect(() => {
    try {
      localStorage.setItem(
        `sellermath_guide_checklist_${selectedId}`,
        JSON.stringify(checklist)
      );
    } catch {
      // ignore storage errors
    }
  }, [selectedId, checklist]);

  const toggleStep = useCallback((index: number) => {
    setChecklist((prev) => ({ ...prev, [index]: !prev[index] }));
  }, []);

  const filtered = useMemo(() => {
    if (activeCat === 'all') return MARKETPLACE_GUIDES;
    return MARKETPLACE_GUIDES.filter((m) => m.category === activeCat);
  }, [activeCat]);

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const totalSteps = selected.onboardingSteps.length;

  return (
    <div className="min-h-[calc(100vh-4rem)] dark:bg-zinc-950 bg-zinc-50 transition-colors pb-8">
      {/* HERO BANNER */}
      <section className="px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 mb-6">
        <div className="rounded-2xl dark:bg-zinc-900/80 bg-white/70 dark:border-zinc-800 border-zinc-200/60 overflow-hidden">
          <div className="p-4 sm:p-6 md:p-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 text-xs font-medium mb-4 select-none">
              🚀 2026 India Marketplace Playbooks
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-3 sm:mb-4 select-none">
              Marketplace Selling Guides
            </h1>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6 sm:mb-8 select-none max-w-2xl">
              Complete onboarding blueprints, 2026 fee & settlement rules, RTO defense playbooks, and ranking algorithms across all 8 Indian marketplaces.
            </p>

            <div className="relative w-full min-w-0 mb-4 sm:mb-6">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0a7.5 7.5 0 10-10.607-10.607 7.5 7.5 0 0010.607 10.607z" /></svg>
              </div>
              <input
                type="text"
                placeholder="Search guides, fees, rules..."
                className="w-full min-w-0 pl-9 pr-3 py-2.5 sm:py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {CATEGORY_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveCat(f.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition border select-none ${activeCat === f.id ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' : 'dark:bg-zinc-900 bg-white dark:text-zinc-300 text-zinc-700 dark:border-zinc-800 border-zinc-200 hover:border-emerald-500/40'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 8-MARKETPLACE SELECTOR BAR */}
      <section className="px-3 sm:px-6 lg:px-8 mb-6">
        <div className="rounded-2xl dark:bg-zinc-900/80 bg-white/70 dark:border-zinc-800 border-zinc-200/60 overflow-hidden">
          <div className="p-4 sm:p-6">
            <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mb-4 sm:mb-6 select-none font-medium">
              Select a marketplace for its complete 2026 selling playbook
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {filtered.map((mp) => {
                const isSelected = selectedId === mp.id;
                return (
                  <button
                    key={mp.id}
                    onClick={() => setSelectedId(mp.id)}
                    className={`flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-4 rounded-xl border transition-all duration-200 ${isSelected ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-700 dark:text-emerald-400 shadow-sm shadow-emerald-500/10' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800/60 text-zinc-700 dark:text-zinc-300 hover:border-emerald-500/40 hover:bg-emerald-500/5'}`}
                  >
                    <MarketplaceLogo marketplace={mp.id} size="md" className="shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 select-none">{mp.name}</div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium select-none uppercase tracking-tighter">{mp.tag}</div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-zinc-400 shrink-0 select-none"><polyline points="9 18 15 12 9 6"></polyline></svg>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Row 1: KPI Strip */}
      {selected && (
        <>
          <section className="px-3 sm:px-6 lg:px-8 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="rounded-xl dark:bg-zinc-900/60 bg-white/80 dark:border-zinc-800 border-zinc-200/60 p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M12 8v13l-4-3-4 3V8z"></path><path d="M3 3h18v18H3z"></path></svg>
                  </div>
                  <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 select-none">Commission Range</h3>
                </div>
                <p className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50 select-none leading-tight">{selected.commissionRange}</p>
              </div>
              <div className="rounded-xl dark:bg-zinc-900/60 bg-white/80 dark:border-zinc-800 border-zinc-200/60 p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-blue-500/10 text-blue-500 dark:text-blue-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M12 2c6.52 0 12 5.48 12 12s-5.48 12-12 12S0 17.48 0 12 5.48 2 12 2z"></path><path d="M12 7v5"></path><path d="M12 12h1"></path></svg>
                  </div>
                  <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 select-none">Settlement Cycle</h3>
                </div>
                <p className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50 select-none leading-tight">{selected.settlementCycle}</p>
              </div>
              <div className="rounded-xl dark:bg-zinc-900/60 bg-white/80 dark:border-zinc-800 border-zinc-200/60 p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-amber-500/10 text-amber-500 dark:text-amber-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M12 9v3m0 3v.01m-6.343 6.343l-.707-.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 select-none">Return / RTO Risk</h3>
                </div>
                <p className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50 select-none leading-tight">{selected.rtoRisk}</p>
              </div>
              <div className="rounded-xl dark:bg-zinc-900/60 bg-white/80 dark:border-zinc-800 border-zinc-200/60 p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-purple-500/10 text-purple-500 dark:text-purple-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  </div>
                  <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 select-none">Min Entry Requirement</h3>
                </div>
                <p className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50 select-none leading-tight">{selected.minEntry}</p>
              </div>
            </div>
          </section>

          {/* Row 2: Onboarding Checklist + Fee Architecture */}
          <section className="px-3 sm:px-6 lg:px-8 mb-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="rounded-xl dark:bg-zinc-900/60 bg-white/80 dark:border-zinc-800 border-zinc-200/60 overflow-hidden">
                <div className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50 select-none">Step-by-Step Onboarding & KYC Checklist</h3>
                      <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 select-none mt-0.5">Persisted in your browser — tick off as you complete each step</p>
                    </div>
                    <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-semibold">{completedCount}/{totalSteps}</span>
                  </div>
                  <div className="space-y-2">
                    {selected.onboardingSteps.map((step, i) => (
                      <label key={i} onClick={() => toggleStep(i)} className="cursor-pointer select-none group">
                        <div className="flex items-start gap-3">
                          <input type="checkbox" checked={!!checklist[i]} onChange={() => toggleStep(i)} className="shrink-0 w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-emerald-500 focus:ring-emerald-500 bg-white dark:bg-zinc-900 cursor-pointer" />
                          <span className={`text-sm text-zinc-700 dark:text-zinc-300 block ${checklist[i] ? 'line-through text-zinc-500 dark:text-zinc-500' : ''}`}>{step}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t dark:border-zinc-800 border-zinc-200">
                    <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                      <span>Progress</span>
                      <span>{Math.round((completedCount / totalSteps) * 100)}%</span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 mt-1 overflow-hidden">
                      <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(completedCount / totalSteps) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-xl dark:bg-zinc-900/60 bg-white/80 dark:border-zinc-800 border-zinc-200/60 overflow-hidden">
                <div className="p-4 sm:p-5">
                  <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50 select-none mb-4">2026 Fee, Weight & Settlement Rules</h3>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3 pb-2 border-b dark:border-zinc-800/60 border-zinc-200/60 last:border-0">
                      <div>
                        <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 block select-none">Referral / Commission Fee</span>
                        <span className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 select-none">{selected.referralFee}</span>
                      </div>
                    </div>
                    <div className="flex items-start justify-between gap-3 pb-2 border-b dark:border-zinc-800/60 border-zinc-200/60 last:border-0">
                      <div>
                        <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 block select-none">Closing / Fixed Fee</span>
                        <span className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 select-none">{selected.closingFee}</span>
                      </div>
                    </div>
                    <div className="flex items-start justify-between gap-3 pb-2 border-b dark:border-zinc-800/60 border-zinc-200/60 last:border-0">
                      <div>
                        <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 block select-none">Shipping Weight Slabs</span>
                        <span className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 select-none">{selected.shippingSlabs}</span>
                      </div>
                    </div>
                    <div className="flex items-start justify-between gap-3 pb-2 border-b dark:border-zinc-800/60 border-zinc-200/60 last:border-0">
                      <div>
                        <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 block select-none">Volumetric Weight</span>
                        <span className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 select-none">{selected.volumetricFormula}</span>
                      </div>
                    </div>
                    <div className="flex items-start justify-between gap-3 pb-2 border-b dark:border-zinc-800/60 border-zinc-200/60 last:border-0">
                      <div>
                        <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 block select-none">GST + TCS + TDS</span>
                        <span className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 select-none">{selected.gstTcsTds}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Row 3: Ranking Levers + RTO Defense */}
          <section className="px-3 sm:px-6 lg:px-8 mb-8">
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="rounded-xl dark:bg-zinc-900/60 bg-white/80 dark:border-zinc-800 border-zinc-200/60 overflow-hidden">
                <div className="p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-emerald-500 dark:text-emerald-400"><path d="M23 6v12l-5-3-5 3V6z"></path><path d="M10 22h4"></path><path d="M5 10h14"></path></svg>
                    <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50 select-none">Algorithm & Buy-Box Ranking Levers</h3>
                  </div>
                  <ul className="space-y-3">
                    {selected.rankingLevers.map((lever, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[10px] font-bold">{i + 1}</span>
                        </div>
                        <span className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed select-none">{lever}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="rounded-xl dark:bg-zinc-900/60 bg-white/80 dark:border-zinc-800 border-zinc-200/60 overflow-hidden">
                <div className="p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-amber-500 dark:text-amber-400"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M12 15V7M12 7l4 3M12 7l-4 3"></path></svg>
                    <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50 select-none">RTO Reduction & Claim Defense</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4M12 8h.01"></path></svg>
                      <div>
                        <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 block select-none">Claim Window</span>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 select-none">{selected.rtoClaimWindow}</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t dark:border-zinc-800/60 border-zinc-200/60">
                      <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 block mb-2 select-none">Mandatory Rules</span>
                      <ul className="space-y-1.5">
                        {selected.rtoRules.map((rule, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            <span className="text-sm text-zinc-700 dark:text-zinc-300 select-none">{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-3 border-t dark:border-zinc-800/60 border-zinc-200/60">
                      <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 block mb-2 select-none">Weight Dispute Steps</span>
                      <ol className="space-y-1.5 list-decimal list-inside text-sm text-zinc-700 dark:text-zinc-300 select-none">
                        {selected.rtoSteps.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Row 4: Comparison Matrix */}
          <section className="px-3 sm:px-6 lg:px-8 mb-6">
            <div className="rounded-xl dark:bg-zinc-900/60 bg-white/80 dark:border-zinc-800 border-zinc-200/60 overflow-hidden">
              <div className="p-3 sm:p-4 border-b dark:border-zinc-800 border-zinc-200/60">
                <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50 select-none">Side-by-Side All-Marketplace Quick Comparison</h3>
                <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 select-none mt-0.5">Horizontally scrollable — swipe on mobile</p>
              </div>
              <div className="overflow-x-auto p-3 sm:p-4">
                <table className="w-full min-w-[720px] border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold sticky left-0 bg-white/80 dark:bg-zinc-900/80 z-10">Marketplace</th>
                      <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">Commission</th>
                      <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">Closing Fee</th>
                      <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">Courier RTO</th>
                      <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">Customer Return</th>
                      <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">Payout Cycle</th>
                      <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">Best Categories</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MARKETPLACE_GUIDES.map((mp) => (
                      <tr key={mp.id} className="border-t dark:border-zinc-800/60 border-zinc-200/60 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <MarketplaceLogo marketplace={mp.id} size="xs" className="shrink-0" />
                            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 select-none">{mp.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm text-zinc-600 dark:text-zinc-400 select-none">{mp.comparison.commission}</td>
                        <td className="px-3 py-3 text-sm text-zinc-600 dark:text-zinc-400 select-none">{mp.comparison.closingFee}</td>
                        <td className="px-3 py-3 text-sm text-zinc-600 dark:text-zinc-400 select-none">{mp.comparison.courierRto}</td>
                        <td className="px-3 py-3 text-sm text-zinc-600 dark:text-zinc-400 select-none">{mp.comparison.customerReturn}</td>
                        <td className="px-3 py-3 text-sm text-zinc-600 dark:text-zinc-400 select-none">{mp.comparison.payoutCycle}</td>
                        <td className="px-3 py-3 text-sm text-zinc-600 dark:text-zinc-400 select-none">{mp.comparison.bestCategories}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Bottom Action CTA Bar */}
          <section className="px-3 sm:px-6 lg:px-8 mb-8">
            <div className="rounded-2xl dark:bg-zinc-900/80 bg-white/70 dark:border-zinc-800 border-zinc-200/60 overflow-hidden">
              <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                  <span className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 font-medium select-none">Take action on {selected.name}</span>
                </div>
                <div className="flex flex-wrap gap-3 w-full sm:w-auto justify-end sm:justify-end">
                  <button onClick={() => onNavigate('calculator')} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition-all duration-200 select-none shadow-lg shadow-emerald-500/25 active:scale-95">
                    Calculate {selected.name} Profit <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 ml-1"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
                  </button>
                  <button onClick={() => onNavigate('listing-writer')} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-sm font-semibold transition-all duration-200 select-none active:scale-95">
                    Write {selected.name} AI Listing <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 ml-1"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
                  </button>
                  <button onClick={() => onNavigate('settlement-reconciliation')} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-sm font-semibold transition-all duration-200 select-none active:scale-95">
                    Audit {selected.name} Settlements <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 ml-1"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
                  </button>
                </div>
              </div>
            </div>
          </section>

        </>
      )}
    </div>
  );
}