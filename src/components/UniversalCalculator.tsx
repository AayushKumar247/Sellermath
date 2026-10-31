import { useState, useMemo, useEffect } from 'react';
import { useRemoteCalc } from '@/lib/calculateApi';
import {
  ShoppingBag,
  Store,
  Truck,
  Sparkles,
  Package,
  IndianRupee,
  Weight,
  MapPin,
  Percent,
  RotateCcw,
  Receipt,
  TrendingUp,
  TrendingDown,
  Printer,
  Truck as TruckIcon,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Calculator,
  Info,
  Target,
} from 'lucide-react';
import WaterfallChart from '@/components/WaterfallChart';
import AIInsights from '@/components/AIInsights';
import MarketplaceLogo from '@/components/MarketplaceLogo';
import ShippingRateEstimator from '@/components/ShippingRateEstimator';

type MarketplaceId =
  | 'amazon'
  | 'flipkart'
  | 'meesho'
  | 'myntra'
  | 'blinkit'
  | 'zepto'
  | 'instamart'
  | 'snapdeal';

type CategoryId =
  | 'fashion'
  | 'electronics'
  | 'home'
  | 'grocery'
  | 'beauty'
  | 'custom';

type ZoneId = 'local' | 'regional' | 'national';

interface MarketplacePreset {
  id: MarketplaceId;
  name: string;
  shortName: string;
  tagline: string;
  accent: string;
  gradient: string;
  icon: React.ElementType;
  categories: Record<CategoryId, { commission: number; closingFee: number }>;
  defaultCategory: CategoryId;
}

interface CategoryPreset {
  id: CategoryId;
  label: string;
}

const CATEGORIES: CategoryPreset[] = [
  { id: 'fashion', label: 'Fashion & Apparel' },
  { id: 'electronics', label: 'Electronics & Mobile' },
  { id: 'home', label: 'Home & Kitchen' },
  { id: 'grocery', label: 'Grocery & FMCG' },
  { id: 'beauty', label: 'Beauty & Personal Care' },
  { id: 'custom', label: 'Custom' },
];

const MARKETPLACES: MarketplacePreset[] = [
  {
    id: 'amazon',
    name: 'Amazon',
    shortName: 'Amazon',
    tagline: '5-15% commission',
    accent: 'amber',
    gradient: 'from-amber-400 to-orange-500',
    icon: ShoppingBag,
    defaultCategory: 'electronics',
    categories: {
      fashion: { commission: 15, closingFee: 20 },
      electronics: { commission: 5, closingFee: 15 },
      home: { commission: 10, closingFee: 15 },
      grocery: { commission: 8, closingFee: 10 },
      beauty: { commission: 12, closingFee: 15 },
      custom: { commission: 10, closingFee: 15 },
    },
  },
  {
    id: 'flipkart',
    name: 'Flipkart',
    shortName: 'Flipkart',
    tagline: '4-16% commission',
    accent: 'blue',
    gradient: 'from-blue-500 to-blue-600',
    icon: Store,
    defaultCategory: 'electronics',
    categories: {
      fashion: { commission: 16, closingFee: 18 },
      electronics: { commission: 4, closingFee: 15 },
      home: { commission: 10, closingFee: 15 },
      grocery: { commission: 7, closingFee: 10 },
      beauty: { commission: 13, closingFee: 15 },
      custom: { commission: 10, closingFee: 15 },
    },
  },
  {
    id: 'meesho',
    name: 'Meesho',
    shortName: 'Meesho',
    tagline: '0% commission',
    accent: 'fuchsia',
    gradient: 'from-fuchsia-600 to-fuchsia-700',
    icon: Sparkles,
    defaultCategory: 'fashion',
    categories: {
      fashion: { commission: 0, closingFee: 0 },
      electronics: { commission: 0, closingFee: 0 },
      home: { commission: 0, closingFee: 0 },
      grocery: { commission: 0, closingFee: 0 },
      beauty: { commission: 0, closingFee: 0 },
      custom: { commission: 0, closingFee: 0 },
    },
  },
  {
    id: 'myntra',
    name: 'Myntra',
    shortName: 'Myntra',
    tagline: '8-18% commission',
    accent: 'rose',
    gradient: 'from-pink-400 to-rose-500',
    icon: ShoppingBag,
    defaultCategory: 'fashion',
    categories: {
      fashion: { commission: 18, closingFee: 25 },
      electronics: { commission: 12, closingFee: 20 },
      home: { commission: 14, closingFee: 20 },
      grocery: { commission: 10, closingFee: 15 },
      beauty: { commission: 15, closingFee: 20 },
      custom: { commission: 14, closingFee: 20 },
    },
  },
  {
    id: 'blinkit',
    name: 'Blinkit',
    shortName: 'Blinkit',
    tagline: 'Quick Commerce 15-22%',
    accent: 'yellow',
    gradient: 'from-yellow-400 to-amber-500',
    icon: Truck,
    defaultCategory: 'grocery',
    categories: {
      fashion: { commission: 22, closingFee: 10 },
      electronics: { commission: 18, closingFee: 10 },
      home: { commission: 20, closingFee: 10 },
      grocery: { commission: 15, closingFee: 8 },
      beauty: { commission: 20, closingFee: 10 },
      custom: { commission: 18, closingFee: 10 },
    },
  },
  {
    id: 'zepto',
    name: 'Zepto',
    shortName: 'Zepto',
    tagline: 'Quick Commerce ~22%',
    accent: 'purple',
    gradient: 'from-violet-600 to-indigo-600',
    icon: Truck,
    defaultCategory: 'grocery',
    categories: {
      fashion: { commission: 25, closingFee: 10 },
      electronics: { commission: 20, closingFee: 10 },
      home: { commission: 22, closingFee: 10 },
      grocery: { commission: 18, closingFee: 8 },
      beauty: { commission: 22, closingFee: 10 },
      custom: { commission: 22, closingFee: 10 },
    },
  },
  {
    id: 'instamart',
    name: 'Instamart',
    shortName: 'Instamart',
    tagline: 'Quick Commerce ~20%',
    accent: 'orange',
    gradient: 'from-orange-500 to-red-500',
    icon: Truck,
    defaultCategory: 'grocery',
    categories: {
      fashion: { commission: 23, closingFee: 10 },
      electronics: { commission: 18, closingFee: 10 },
      home: { commission: 20, closingFee: 10 },
      grocery: { commission: 16, closingFee: 8 },
      beauty: { commission: 20, closingFee: 10 },
      custom: { commission: 20, closingFee: 10 },
    },
  },
  {
    id: 'snapdeal',
    name: 'Snapdeal',
    shortName: 'Snapdeal',
    tagline: '0-12% commission',
    accent: 'red',
    gradient: 'from-red-500 to-red-600',
    icon: Store,
    defaultCategory: 'fashion',
    categories: {
      fashion: { commission: 12, closingFee: 15 },
      electronics: { commission: 6, closingFee: 12 },
      home: { commission: 8, closingFee: 12 },
      grocery: { commission: 5, closingFee: 10 },
      beauty: { commission: 10, closingFee: 12 },
      custom: { commission: 8, closingFee: 12 },
    },
  },
];

const GST_RATES = [0, 5, 12, 18, 28];

const ZONES: { id: ZoneId; label: string; multiplier: number }[] = [
  { id: 'local', label: 'Local', multiplier: 0.7 },
  { id: 'regional', label: 'Regional', multiplier: 1.0 },
  { id: 'national', label: 'National', multiplier: 1.4 },
];

interface CalcState {
  marketplace: MarketplaceId;
  category: CategoryId;
  sellingPrice: number;
  cogs: number;
  shippingWeight: number;
  zone: ZoneId;
  productGstRate: number;
  returnRate: number;
  commissionRate: number;
  closingFee: number;
}

function formatINR(val: number): string {
  const sign = val < 0 ? '-' : '';
  return `${sign}₹${Math.abs(val).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

interface CalcResult {
  taxableValue: number;
  productGst: number;
  commissionAmount: number;
  closingFee: number;
  shippingFee: number;
  totalMarketplaceFees: number;
  gstOnMarketplaceFees: number;
  tcsTds: number;
  totalDeductions: number;
  netSettlement: number;
  netProfit: number;
  netProfitMargin: number;
  breakEvenPrice: number;
  effectiveReturnCost: number;
}

const STORAGE_KEY = 'sellermath_universal_calc';

const EMPTY_RESULT: CalcResult = {
  taxableValue: 0,
  productGst: 0,
  commissionAmount: 0,
  closingFee: 0,
  shippingFee: 0,
  totalMarketplaceFees: 0,
  gstOnMarketplaceFees: 0,
  tcsTds: 0,
  totalDeductions: 0,
  netSettlement: 0,
  netProfit: 0,
  netProfitMargin: 0,
  breakEvenPrice: 0,
  effectiveReturnCost: 0,
};

const DEFAULT_STATE: CalcState = {
  marketplace: 'amazon',
  category: 'electronics',
  sellingPrice: 1500,
  cogs: 600,
  shippingWeight: 500,
  zone: 'national',
  productGstRate: 18,
  returnRate: 15,
  commissionRate: 5,
  closingFee: 15,
};

function loadState(): CalcState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_STATE, ...parsed };
    }
  } catch {
    // ignore
  }
  return DEFAULT_STATE;
}

export default function UniversalCalculator() {
  const [state, setState] = useState<CalcState>(() => loadState());
  const [shippingEstimatorOpen, setShippingEstimatorOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  const activeMarketplace = useMemo(
    () => MARKETPLACES.find((m) => m.id === state.marketplace)!,
    [state.marketplace],
  );

  const selectMarketplace = (id: MarketplaceId) => {
    const mp = MARKETPLACES.find((m) => m.id === id)!;
    const cat = mp.categories[mp.defaultCategory];
    setState((prev) => ({
      ...prev,
      marketplace: id,
      category: mp.defaultCategory,
      commissionRate: cat.commission,
      closingFee: cat.closingFee,
    }));
  };

  const selectCategory = (cat: CategoryId) => {
    const preset = activeMarketplace.categories[cat];
    setState((prev) => ({
      ...prev,
      category: cat,
      commissionRate: preset.commission,
      closingFee: preset.closingFee,
    }));
  };

  const update = <K extends keyof CalcState>(key: K, value: CalcState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyShippingFee = (fee: number, courierName: string) => {
    // Convert shipping fee (₹) to approximate weight (grams)
    // Using rough conversion of ~₹50 per kg for estimation
    // This is a limitation - the calculator uses weight, not direct fee
    const estimatedWeightGrams = Math.round((fee / 50) * 1000);
    update('shippingWeight', estimatedWeightGrams);
  };

  const { result, error } = useRemoteCalc<CalcResult>(
    '/api/calculate/universal',
    {
      sellingPrice: state.sellingPrice,
      cogs: state.cogs,
      productGstRate: state.productGstRate,
      commissionRate: state.commissionRate,
      closingFee: state.closingFee,
      shippingWeight: state.shippingWeight,
      zone: state.zone,
      returnRate: state.returnRate,
    },
    EMPTY_RESULT,
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="space-y-6">
        {/* Tagline */}
        <div className="no-print">
          <p className="text-base sm:text-lg md:text-xl font-semibold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent mb-6">
            India's most accurate e-commerce profit engine — all marketplaces, one tool
          </p>
        </div>

        {error && (
          <p className="no-print text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
            {error} Start the API with `npm run server`.
          </p>
        )}

        {/* Marketplace Selector */}
        <div className="no-print">
          <p className="text-xs font-semibold text-slate-400 dark:text-zinc-300 uppercase tracking-wide mb-3">
            Select Marketplace
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {MARKETPLACES.map((mp) => {
              const isActive = state.marketplace === mp.id;
              const isBlinkit = mp.id === 'blinkit';
              return (
                <button
                  key={mp.id}
                  onClick={() => selectMarketplace(mp.id)}
                  className={`
                    relative flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-xl border-2
                    transition-all duration-200 group
                    ${
                      isActive
                        ? `bg-gradient-to-br ${mp.gradient} ${isBlinkit ? 'text-slate-900' : 'text-white'} border-transparent shadow-lg scale-105`
                        : 'bg-white dark:bg-zinc-900/90 border-slate-200 dark:border-zinc-700/80 hover:border-slate-300 dark:hover:border-zinc-600 hover:shadow-md'
                    }
                  `}
                >
                  <MarketplaceLogo id={mp.id} size="lg" />
                  <span className={`text-xs font-bold ${isActive ? (isBlinkit ? 'text-slate-900' : 'text-white') : 'text-slate-700 dark:text-zinc-50'}`}>
                    {mp.shortName}
                  </span>
                  <span className={`text-[10px] leading-tight text-center ${isActive ? (isBlinkit ? 'text-slate-900/80' : 'text-white/80') : 'text-slate-400 dark:text-zinc-300'}`}>
                    {mp.tagline}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Grid: Inputs + Tax Ledger */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Inputs (2 cols) */}
          <div className="lg:col-span-2 space-y-4 no-print">
            {/* Category */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                  <Package className="w-4 h-4 text-slate-600 dark:text-zinc-300" strokeWidth={2} />
                </div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-50 uppercase tracking-wide">
                  Product Category
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => {
                  const isActive = state.category === cat.id;
                  const isBlinkit = activeMarketplace.id === 'blinkit';
                  return (
                    <button
                      key={cat.id}
                      onClick={() => selectCategory(cat.id)}
                      className={`
                        px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                        ${
                          isActive
                            ? `bg-gradient-to-r ${activeMarketplace.gradient} ${isBlinkit ? 'text-slate-900' : 'text-white'} shadow-md`
                            : 'bg-slate-50 dark:bg-zinc-900/90 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700/80'
                        }
                      `}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price & Cost */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NumberInput
                label="Cost of Goods"
                hint="Manufacturing / sourcing cost"
                icon={Package}
                prefix="₹"
                value={state.cogs}
                onChange={(v) => update('cogs', v)}
              />
              <NumberInput
                label="Selling Price (incl. GST)"
                hint="Price shown to customer"
                icon={IndianRupee}
                prefix="₹"
                value={state.sellingPrice}
                onChange={(v) => update('sellingPrice', v)}
              />
            </div>

            {/* Weight & Zone */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Weight className="w-4 h-4 text-slate-500 dark:text-zinc-300" />
                    <label className="text-sm font-semibold text-slate-700 dark:text-zinc-50">
                      Shipping Weight
                    </label>
                    <div className="relative ml-auto">
                      <input
                        type="number"
                        value={state.shippingWeight || ''}
                        onChange={(e) => update('shippingWeight', parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="w-20 text-sm font-bold text-slate-900 dark:text-zinc-50 bg-slate-50 dark:bg-zinc-900/90 rounded-lg border-2 border-slate-200 dark:border-zinc-700/80 px-2 py-1 text-right focus:outline-none focus:border-emerald-500"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-zinc-300 pointer-events-none">g</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={5000}
                    step={100}
                    value={state.shippingWeight}
                    onChange={(e) => update('shippingWeight', parseInt(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                  <div className="flex justify-between text-xs text-slate-400 dark:text-zinc-300 mt-1">
                    <span>100g</span>
                    <span>5kg</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {[250, 500, 1000, 2000, 5000].map((weight) => {
                      const isSelected = state.shippingWeight === weight;
                      const isBlinkit = activeMarketplace.id === 'blinkit';
                      return (
                        <button
                          key={weight}
                          onClick={() => update('shippingWeight', weight)}
                          className={`
                            px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                            ${
                              isSelected
                                ? `bg-gradient-to-r ${activeMarketplace.gradient} ${isBlinkit ? 'text-slate-900' : 'text-white'} shadow-md`
                                : 'bg-slate-50 dark:bg-zinc-900/90 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700/80'
                            }
                          `}
                        >
                          {weight >= 1000 ? `${weight / 1000}kg` : `${weight}g`}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-300 mt-2">1000g = 1kg</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-slate-500 dark:text-zinc-300" />
                    <label className="text-sm font-semibold text-slate-700 dark:text-zinc-50">Shipping Zone</label>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {ZONES.map((z) => {
                      const isActive = state.zone === z.id;
                      const isBlinkit = activeMarketplace.id === 'blinkit';
                      return (
                        <button
                          key={z.id}
                          onClick={() => update('zone', z.id)}
                          className={`
                            px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                            ${
                              isActive
                                ? `bg-gradient-to-r ${activeMarketplace.gradient} ${isBlinkit ? 'text-slate-900' : 'text-white'} shadow-md`
                                : 'bg-slate-50 dark:bg-zinc-900/90 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700/80'
                            }
                          `}
                        >
                          {z.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* GST Rate & Return Rate */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Percent className="w-4 h-4 text-slate-500 dark:text-zinc-300" />
                  <label className="text-sm font-semibold text-slate-700 dark:text-zinc-50">Product GST Rate</label>
                  <InfoTooltip text="The tax rate applicable to your physical product category." />
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {GST_RATES.map((r) => {
                    const isActive = state.productGstRate === r;
                    return (
                      <button
                        key={r}
                        onClick={() => update('productGstRate', r)}
                        className={`
                          py-2.5 rounded-lg text-sm font-bold transition-all
                          ${
                            isActive
                              ? 'bg-zinc-950 dark:bg-zinc-950 text-white shadow-md'
                              : 'bg-slate-50 dark:bg-zinc-900/90 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700/80'
                          }
                        `}
                      >
                        {r}%
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <RotateCcw className="w-4 h-4 text-slate-500 dark:text-zinc-300" />
                  <label className="text-sm font-semibold text-slate-700 dark:text-zinc-50">Return / RTO Rate</label>
                  <span className="text-sm font-bold text-slate-900 dark:text-zinc-50 ml-auto">
                    {state.returnRate}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={1}
                  value={state.returnRate}
                  onChange={(e) => update('returnRate', parseInt(e.target.value))}
                  className="w-full accent-rose-500"
                />
                <div className="flex justify-between text-xs text-slate-400 dark:text-zinc-300 mt-1">
                  <span>0%</span>
                  <span>50%</span>
                </div>
              </div>
            </div>

            {/* Auto-filled Fee Fields */}
            <div className="bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-zinc-800 flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-slate-600 dark:text-zinc-300" strokeWidth={2} />
                </div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-50 uppercase tracking-wide">
                  Marketplace Fees (Auto-filled, Editable)
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <NumberInput
                  label="Commission Rate"
                  hint={`${activeMarketplace.name} ${CATEGORIES.find((c) => c.id === state.category)?.label}`}
                  icon={Percent}
                  suffix="%"
                  value={state.commissionRate}
                  onChange={(v) => update('commissionRate', v)}
                  compact
                />
                <NumberInput
                  label="Fixed Closing Fee"
                  hint="Per-order closing charge"
                  icon={IndianRupee}
                  prefix="₹"
                  value={state.closingFee}
                  onChange={(v) => update('closingFee', v)}
                  compact
                  tooltip="A fixed fee charged by the marketplace per item sold, based on price tiers."
                />
                <div className="bg-white dark:bg-zinc-900/90 rounded-xl border-2 border-slate-200 dark:border-zinc-700/80 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TruckIcon className="w-4 h-4 text-slate-500 dark:text-zinc-300" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-zinc-300">Pick & Pack Fee</span>
                  </div>
                  <p className="text-lg font-bold text-slate-900 dark:text-zinc-50">
                    ₹{result.shippingFee.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-zinc-300">
                    {state.shippingWeight}g · {ZONES.find((z) => z.id === state.zone)?.label}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Tax Ledger */}
          <div className="lg:col-span-1">
            <TaxLedger
              marketplace={activeMarketplace}
              state={state}
              result={result}
              onPrint={handlePrint}
              onUpdateSellingPrice={(price) => update('sellingPrice', price)}
              marketplaceId={activeMarketplace.id}
            />
          </div>
        </div>

        {/* Waterfall Chart */}
        <WaterfallChart
          revenue={state.sellingPrice}
          commission={result.commissionAmount + state.closingFee}
          shipping={result.shippingFee}
          gst={result.gstOnMarketplaceFees + result.tcsTds + result.productGst}
          rto={result.effectiveReturnCost}
          cogs={state.cogs}
          netProfit={result.netProfit}
          marketplaceName={activeMarketplace.name}
          categoryName={CATEGORIES.find((c) => c.id === state.category)?.label || state.category}
          marketplaceGradient={activeMarketplace.gradient}
          marketplaceId={activeMarketplace.id}
        />

        {/* AI Strategic Insights */}
        <AIInsights
          key={`${activeMarketplace.name}-${state.sellingPrice}-${state.cogs}-${state.commissionRate}`}
          marketplaceName={activeMarketplace.name}
          categoryName={CATEGORIES.find((c) => c.id === state.category)?.label || state.category}
          marketplaceGradient={activeMarketplace.gradient}
          marketplaceId={activeMarketplace.id}
          sellingPrice={state.sellingPrice}
          commissionRate={state.commissionRate}
          shippingFee={result.shippingFee}
          gstAmount={result.gstOnMarketplaceFees + result.tcsTds + result.productGst}
          returnRate={state.returnRate}
          netProfit={result.netProfit}
          cogs={state.cogs}
          breakEvenPrice={result.breakEvenPrice}
        />

        {/* Cross-Platform Profit Comparison */}
        <CrossPlatformComparison
          sellingPrice={state.sellingPrice}
          cogs={state.cogs}
          shippingWeight={state.shippingWeight}
          zone={state.zone}
          productGstRate={state.productGstRate}
          returnRate={state.returnRate}
          category={state.category}
          currentMarketplace={state.marketplace}
          onMarketplaceSelect={selectMarketplace}
        />

        {/* Affiliate Card */}
        <div className="no-print bg-gradient-to-br from-zinc-950 to-zinc-900 rounded-2xl p-6 border border-zinc-800 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20 bg-emerald-500" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg flex-shrink-0">
                <TruckIcon className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-50">
                  Losing money on RTO shipping?
                </h3>
                <p className="text-sm text-zinc-300 mt-0.5">
                  Compare shipping costs and understand forward and RTO charges before shipping your orders.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShippingEstimatorOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition-all whitespace-nowrap flex-shrink-0"
            >
              <TruckIcon className="w-4 h-4" />
              Check Shipping Rates
            </button>
          </div>
        </div>

        {/* SEO: Fee Matrix Table */}
        <FeeMatrixTable />

        {/* SEO: FAQ */}
        <FAQAccordion />

        {/* Print-only Tax Ledger */}
        <div className="print-only">
          <PrintTaxLedger marketplace={activeMarketplace} state={state} result={result} marketplaceId={activeMarketplace.id} />
        </div>
      </div>

      {/* Shipping Rate Estimator Modal */}
      <ShippingRateEstimator
        isOpen={shippingEstimatorOpen}
        onClose={() => setShippingEstimatorOpen(false)}
        onApplyShippingFee={handleApplyShippingFee}
      />
    </>
  );
}

interface NumberInputProps {
  label: string;
  hint: string;
  icon: React.ElementType;
  prefix?: string;
  suffix?: string;
  value: number;
  onChange: (v: number) => void;
  compact?: boolean;
  tooltip?: string;
}

function NumberInput({
  label,
  hint,
  icon: Icon,
  prefix,
  suffix,
  value,
  onChange,
  compact,
  tooltip,
}: NumberInputProps) {
  return (
    <div className={`bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-slate-500 dark:text-zinc-300" />
        <div>
          <label className="text-sm font-semibold text-slate-700 dark:text-zinc-50 block leading-tight">
            {label}
          </label>
          {tooltip && <InfoTooltip text={tooltip} />}
          <p className="text-xs text-slate-400 dark:text-zinc-300">{hint}</p>
        </div>
      </div>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-300 font-semibold pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          type="number"
          inputMode="decimal"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          placeholder="0"
          className={`w-full font-semibold text-slate-900 dark:text-zinc-50 bg-slate-50 dark:bg-zinc-900/90 rounded-xl border-2 border-slate-200 dark:border-zinc-700/80 transition-all focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-900/90 ${
            prefix ? 'pl-8' : 'pl-3'
          } ${suffix ? 'pr-8' : 'pr-3'} ${compact ? 'py-2 text-sm' : 'py-3 text-lg'}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-300 font-semibold pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

interface TaxLedgerProps {
  marketplace: MarketplacePreset;
  state: CalcState;
  result: CalcResult;
  onPrint: () => void;
  onUpdateSellingPrice: (price: number) => void;
  marketplaceId?: string;
}

function TaxLedger({ marketplace, state, result, onPrint, onUpdateSellingPrice, marketplaceId }: TaxLedgerProps) {
  const isBlinkit = marketplaceId === 'blinkit';
  const isProfit = result.netProfit >= 0;
  const Icon = marketplace.icon;
  const categoryName = CATEGORIES.find((c) => c.id === state.category)?.label || state.category;
  const [targetProfit, setTargetProfit] = useState(500);

  const { result: targetPriceResult } = useRemoteCalc<{ recommendedPrice: number }>(
    '/api/calculate/target-price',
    {
      cogs: state.cogs,
      commissionRate: state.commissionRate,
      closingFee: state.closingFee,
      productGstRate: state.productGstRate,
      shippingWeight: state.shippingWeight,
      returnRate: state.returnRate,
      zone: state.zone,
      desiredProfit: targetProfit,
    },
    { recommendedPrice: 0 },
  );

  const recommendedPrice = targetPriceResult.recommendedPrice;

  return (
    <div className="sticky top-20 bg-white dark:bg-zinc-900 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 overflow-hidden shadow-lg">
      {/* Header */}
      <div className={`bg-gradient-to-r ${marketplace.gradient} p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-lg ${isBlinkit ? 'bg-slate-900/20' : 'bg-white/20'} flex items-center justify-center backdrop-blur-sm`}>
              <Icon className={`w-5 h-5 ${isBlinkit ? 'text-slate-900' : 'text-white'}`} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className={`text-sm font-bold ${isBlinkit ? 'text-slate-900' : 'text-white'}`}>CA Tax Ledger</h3>
              <p className={`text-xs ${isBlinkit ? 'text-slate-900/80' : 'text-white/80'}`}>{marketplace.name} Settlement Receipt</p>
            </div>
          </div>
          <div className={`${isBlinkit ? 'bg-slate-900/20 text-slate-900 border-slate-900/30' : 'bg-white/20 backdrop-blur-sm text-white border-white/30'} text-xs font-semibold px-3 py-1 rounded-full border`}>
            {marketplace.name} ({categoryName})
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-2.5 max-h-[600px] overflow-y-auto">
        <LedgerRow label="Taxable Selling Value" value={result.taxableValue} />
        <LedgerRow
          label="Product GST Remittance"
          value={result.productGst}
          sub="Payable to Govt"
          tone="amber"
        />
        <Divider />
        <LedgerRow
          label={`Commission (${state.commissionRate}%)`}
          value={result.commissionAmount}
        />
        <LedgerRow label="Fixed Closing Fee" value={state.closingFee} />
        <LedgerRow label="Pick & Pack / Shipping" value={result.shippingFee} />
        <LedgerRow
          label="GST Input on Mkt Fees (18%)"
          value={result.gstOnMarketplaceFees}
          tone="blue"
        />
        <LedgerRow
          label="TCS/TDS (1% u/s 194-O)"
          value={result.tcsTds}
          tone="purple"
          tooltip="Tax Collected at Source: 1% deducted by e-commerce operators under Indian tax law."
        />
        <LedgerRow
          label="RTO Return Cost"
          value={result.effectiveReturnCost}
          sub={`${state.returnRate}% of shipping`}
          tone="rose"
        />
        <Divider />
        <LedgerRow
          label="Total Deductions"
          value={result.totalDeductions + result.effectiveReturnCost}
          bold
        />
        <LedgerRow
          label="Net Settlement Payout"
          value={result.netSettlement}
          bold
          tone="emerald"
        />

        {/* Net Profit Hero */}
        <div
          className={`mt-4 rounded-xl p-4 border-2 ${
            isProfit
              ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200'
              : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {isProfit ? (
              <TrendingUp className="w-5 h-5 text-emerald-500" strokeWidth={2.5} />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-500" strokeWidth={2.5} />
            )}
            <span className="text-sm font-bold text-slate-700 dark:text-zinc-50">Final Net Profit</span>
          </div>
          <p
            className={`text-3xl font-bold tracking-tight ${
              isProfit ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {formatINR(result.netProfit)}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                isProfit
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {isProfit ? 'PROFITABLE' : 'LOSS'}
            </span>
            <span className="text-xs text-slate-400 dark:text-zinc-300">
              Margin: {result.netProfitMargin.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Break-Even */}
        <div className="bg-slate-50 dark:bg-zinc-900/90 rounded-xl p-3 border border-slate-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold text-slate-600 dark:text-zinc-300">Break-Even Selling Price</span>
          </div>
          <p className="text-lg font-bold text-slate-900 dark:text-zinc-50">{formatINR(result.breakEvenPrice)}</p>
          <p className="text-xs text-slate-400 dark:text-zinc-300">Minimum price to avoid losses</p>
        </div>

        {/* Target Profit Solver */}
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-3 border border-emerald-200">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-semibold text-slate-700 dark:text-zinc-50">Target Profit Solver</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="number"
              value={targetProfit || ''}
              onChange={(e) => setTargetProfit(parseFloat(e.target.value) || 0)}
              placeholder="Desired profit"
              className="flex-1 text-sm font-semibold text-slate-900 dark:text-zinc-50 bg-white dark:bg-zinc-900/90 rounded-lg border-2 border-emerald-200 dark:border-zinc-700/80 px-2 py-1.5 focus:outline-none focus:border-emerald-500"
            />
            <span className="text-xs text-slate-500 dark:text-zinc-300">₹</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] text-slate-500 dark:text-zinc-300">Recommended Price</p>
              <p className="text-sm font-bold text-emerald-700">{formatINR(recommendedPrice)}</p>
            </div>
            <button
              onClick={() => onUpdateSellingPrice(recommendedPrice)}
              className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-500 transition-colors"
            >
              Apply Price
            </button>
          </div>
        </div>

        {/* Print Button */}
        <button
          onClick={onPrint}
          className="no-print w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-zinc-950 dark:bg-zinc-950 text-white shadow-md hover:bg-zinc-900 dark:hover:bg-zinc-800 transition-all mt-2"
        >
          <Printer className="w-4 h-4" />
          Download / Print Tax Breakdown
        </button>
      </div>
    </div>
  );
}

interface LedgerRowProps {
  label: string;
  value: number;
  sub?: string;
  bold?: boolean;
  tone?: 'amber' | 'blue' | 'purple' | 'rose' | 'emerald';
  tooltip?: string;
}

function LedgerRow({ label, value, sub, bold, tone, tooltip }: LedgerRowProps) {
  const toneClass =
    tone === 'amber'
      ? 'text-amber-600'
      : tone === 'blue'
      ? 'text-blue-600'
      : tone === 'purple'
      ? 'text-violet-600'
      : tone === 'rose'
      ? 'text-rose-600'
      : tone === 'emerald'
      ? 'text-emerald-600'
      : 'text-slate-700 dark:text-zinc-50';

  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className={`text-xs ${bold ? 'font-bold text-slate-700 dark:text-zinc-50' : 'text-slate-500 dark:text-zinc-300'} flex items-center gap-1`}>
          {label}
          {tooltip && <InfoTooltip text={tooltip} />}
        </p>
        {sub && <p className="text-[10px] text-slate-400 dark:text-zinc-300">{sub}</p>}
      </div>
      <p className={`text-sm ${bold ? 'font-bold' : 'font-semibold'} ${toneClass} whitespace-nowrap`}>
        {formatINR(value)}
      </p>
    </div>
  );
}

function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="text-slate-400 dark:text-zinc-300 hover:text-emerald-500 transition-colors"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 left-1/2 -translate-x-1/2 top-full mt-1.5 w-56 bg-zinc-950 dark:bg-zinc-950 text-white text-xs font-medium leading-relaxed rounded-lg px-3 py-2 shadow-xl pointer-events-none">
            {text}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-zinc-950 dark:bg-zinc-950 rotate-45" />
          </div>
        </>
      )}
    </span>
  );
}

function Divider() {
  return <div className="border-t border-slate-100 my-1" />;
}

function FeeMatrixTable() {
  const tableData: { marketplace: string; commission: string; closingFee: string; shipping: string; gst: string; notes: string }[] = [
    { marketplace: 'Amazon', commission: '5-15%', closingFee: '₹15-20', shipping: '₹35-70', gst: '18% on fees', notes: 'Category-tiered commission + FBA storage' },
    { marketplace: 'Flipkart', commission: '4-16%', closingFee: '₹15-18', shipping: '₹35-70', gst: '18% on fees', notes: 'Plus & Smart fulfillment tiers' },
    { marketplace: 'Meesho', commission: '0%', closingFee: '₹0', shipping: '₹30-60', gst: '18% on shipping', notes: 'Zero commission, seller pays shipping' },
    { marketplace: 'Myntra', commission: '8-18%', closingFee: '₹20-25', shipping: '₹40-80', gst: '18% on fees', notes: 'Fashion-focused, high returns' },
    { marketplace: 'Blinkit', commission: '15-22%', closingFee: '₹8-10', shipping: '₹25-40', gst: '18% on fees', notes: 'Quick commerce, dark store model' },
    { marketplace: 'Zepto', commission: '18-25%', closingFee: '₹8-10', shipping: '₹25-40', gst: '18% on fees', notes: '10-min delivery, premium fees' },
    { marketplace: 'Instamart', commission: '16-23%', closingFee: '₹8-10', shipping: '₹25-40', gst: '18% on fees', notes: 'Swiggy quick commerce network' },
    { marketplace: 'Snapdeal', commission: '0-12%', closingFee: '₹10-15', shipping: '₹30-60', gst: '18% on fees', notes: 'Value-focused tiers' },
  ];

  return (
    <div className="no-print bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
      <div className="p-5 border-b border-slate-200 dark:border-zinc-800">
        <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50">
          2026 Marketplace Fee Matrix
        </h3>
        <p className="text-sm text-slate-500 dark:text-zinc-300 mt-1">
          Amazon vs Flipkart vs Meesho vs Quick Commerce — all commission rates at a glance
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-zinc-950/50 border-b border-slate-200 dark:border-zinc-800">
              <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-zinc-300">Marketplace</th>
              <th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-zinc-300">Commission</th>
              <th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-zinc-300">Closing Fee</th>
              <th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-zinc-300">Shipping</th>
              <th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-zinc-300">GST on Fees</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-zinc-300">Notes</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, i) => (
              <tr
                key={row.marketplace}
                className={`border-b border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors ${
                  i % 2 === 1 ? 'bg-slate-50/50 dark:bg-zinc-900/30' : ''
                }`}
              >
                <td className="px-4 py-3 font-bold text-slate-900 dark:text-zinc-50">{row.marketplace}</td>
                <td className="text-center px-4 py-3 font-medium text-slate-700 dark:text-zinc-300">{row.commission}</td>
                <td className="text-center px-4 py-3 text-slate-600 dark:text-zinc-300">{row.closingFee}</td>
                <td className="text-center px-4 py-3 text-slate-600 dark:text-zinc-300">{row.shipping}</td>
                <td className="text-center px-4 py-3 text-slate-600 dark:text-zinc-300">{row.gst}</td>
                <td className="px-4 py-3 text-xs text-slate-500 dark:text-zinc-300">{row.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const FAQS: { q: string; a: string }[] = [
  {
    q: 'How is GST calculated on marketplace seller fees in India?',
    a: 'Marketplace commission, closing fees, and shipping fees charged by platforms like Amazon, Flipkart, and Meesho are taxable services. The marketplace charges 18% GST on the total of these fees. As a seller, you can claim this as Input Tax Credit (ITC) in your GSTR-2B, effectively recovering the GST paid on marketplace fees — provided you are a registered GST taxpayer and the fees are for business use.',
  },
  {
    q: 'What is Section 194-O TCS deduction for e-commerce operators?',
    a: 'Under Section 194-O of the Income Tax Act, e-commerce operators (Amazon, Flipkart, Meesho, etc.) are required to deduct 1% TCS (Tax Collected at Source) on the gross sales amount of every transaction before remitting the payout to the seller. This 1% is not an additional tax — it can be claimed as a credit against your total income tax liability when filing your annual ITR. The TCS amount appears in your Form 26AS and AIS, and the marketplace provides a TCS certificate (Form 16O) annually.',
  },
  {
    q: 'How do customer returns (RTO) affect net profit on Meesho and Flipkart?',
    a: 'RTO (Return to Origin) impacts profit in three ways: (1) You lose the forward shipping cost since the product was shipped but not delivered, (2) Return shipping fees may apply (especially on Flipkart), and (3) The product may arrive damaged, reducing resale value. On Meesho, where commission is 0%, RTO is the single biggest profit killer since the entire shipping cost is borne by the seller. A 15% RTO rate on a ₹60 shipping fee means an effective cost of ₹9 per order across your total volume. Our calculator factors this in automatically using the Return/RTO rate slider.',
  },
];

interface CrossPlatformComparisonProps {
  sellingPrice: number;
  cogs: number;
  shippingWeight: number;
  zone: ZoneId;
  productGstRate: number;
  returnRate: number;
  category: CategoryId;
  currentMarketplace: MarketplaceId;
  onMarketplaceSelect: (id: MarketplaceId) => void;
}

function CrossPlatformComparison({
  sellingPrice,
  cogs,
  shippingWeight,
  zone,
  productGstRate,
  returnRate,
  category,
  currentMarketplace,
  onMarketplaceSelect,
}: CrossPlatformComparisonProps) {
  const { result: comparisonResult } = useRemoteCalc<{ comparisons: Array<{ marketplaceId: string; netProfit: number; netProfitMargin: number }> }>(
    '/api/calculate/cross-platform',
    {
      sellingPrice,
      cogs,
      shippingWeight,
      zone,
      productGstRate,
      returnRate,
      category,
    },
    { comparisons: [] },
  );

  const sortedComparisons = comparisonResult.comparisons.map((comp) => ({
    ...comp,
    marketplace: MARKETPLACES.find((mp) => mp.id === comp.marketplaceId as MarketplaceId)!,
  })).sort((a, b) => b.netProfit - a.netProfit);

  return (
    <div className="no-print bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
      <div className="p-5 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50">Cross-Platform Profit Comparison</h3>
            <p className="text-sm text-slate-500 dark:text-zinc-300">Which marketplace pays best for your product?</p>
          </div>
        </div>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {sortedComparisons.map((item, index) => {
            const isBest = index === 0;
            const isCurrent = item.marketplace.id === currentMarketplace;

            return (
              <button
                key={item.marketplace.id}
                onClick={() => onMarketplaceSelect(item.marketplace.id)}
                className={`
                  relative p-4 rounded-xl border-2 transition-all duration-200 text-left
                  ${
                    isBest
                      ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-300 shadow-md'
                      : isCurrent
                      ? 'bg-slate-50 dark:bg-zinc-900/90 border-slate-300 dark:border-zinc-700/80'
                      : 'bg-white dark:bg-zinc-900/90 border-slate-200 dark:border-zinc-700/80 hover:border-slate-300 dark:hover:border-zinc-600 hover:shadow-sm'
                  }
                `}
              >
                {isBest && (
                  <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Best Margin
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <MarketplaceLogo id={item.marketplace.id} size="md" />
                  <span className={`text-sm font-bold ${isBest ? 'text-emerald-700' : 'text-slate-700 dark:text-zinc-50'}`}>
                    {item.marketplace.name}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-zinc-300">Net Profit</span>
                    <span
                      className={`text-sm font-bold ${
                        item.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {formatINR(item.netProfit)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-zinc-300">Margin</span>
                    <span
                      className={`text-xs font-semibold ${
                        item.netProfitMargin >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {item.netProfitMargin.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="no-print bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
      <div className="p-5 border-b border-slate-200 dark:border-zinc-800">
        <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50">
          Frequently Asked Questions
        </h3>
        <p className="text-sm text-slate-500 dark:text-zinc-300 mt-1">
          Everything Indian e-commerce sellers need to know about fees, GST, and profitability
        </p>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-zinc-800">
        {FAQS.map((faq, i) => {
          const isOpen = open === i;
          return (
            <div key={i}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <span className="text-sm font-semibold text-slate-700 dark:text-zinc-50">{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 dark:text-zinc-300 flex-shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-4">
                  <p className="text-sm text-slate-500 dark:text-zinc-300 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface PrintTaxLedgerProps {
  marketplace: MarketplacePreset;
  state: CalcState;
  result: CalcResult;
  marketplaceId?: string;
}

function PrintTaxLedger({ marketplace, state, result, marketplaceId }: PrintTaxLedgerProps) {
  const isBlinkit = marketplaceId === 'blinkit';
  const isProfit = result.netProfit >= 0;
  const Icon = marketplace.icon;
  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6 border-b-2 border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${marketplace.gradient} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${isBlinkit ? 'text-slate-900' : 'text-white'}`} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">SellerMath — CA Tax Ledger</h1>
            <p className="text-xs text-slate-500">{marketplace.name} Settlement Breakdown</p>
          </div>
        </div>
        <p className="text-xs text-slate-500">{today}</p>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Marketplace</p>
          <p className="text-sm font-semibold text-slate-800">{marketplace.name}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Category</p>
          <p className="text-sm font-semibold text-slate-800">
            {CATEGORIES.find((c) => c.id === state.category)?.label}
          </p>
        </div>
      </div>

      <table className="w-full text-sm mb-4">
        <thead>
          <tr className="bg-slate-100">
            <th className="text-left px-3 py-2 font-semibold text-slate-700">Line Item</th>
            <th className="text-right px-3 py-2 font-semibold text-slate-700">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <PrintRow label="Selling Price (incl. GST)" value={state.sellingPrice} />
          <PrintRow label="Taxable Selling Value" value={result.taxableValue} />
          <PrintRow label="Product GST Remittance" value={result.productGst} />
          <PrintRow label={`Commission (${state.commissionRate}%)`} value={result.commissionAmount} />
          <PrintRow label="Fixed Closing Fee" value={state.closingFee} />
          <PrintRow label="Pick & Pack / Shipping" value={result.shippingFee} />
          <PrintRow label="GST Input on Marketplace Fees (18%)" value={result.gstOnMarketplaceFees} />
          <PrintRow label="TCS/TDS (1% u/s 194-O)" value={result.tcsTds} />
          <PrintRow label={`RTO Return Cost (${state.returnRate}%)`} value={result.effectiveReturnCost} />
          <tr className="border-t-2 border-slate-300">
            <td className="px-3 py-2 font-bold text-slate-900">Total Deductions</td>
            <td className="text-right px-3 py-2 font-bold text-slate-900">
              {formatINR(result.totalDeductions + result.effectiveReturnCost)}
            </td>
          </tr>
          <tr>
            <td className="px-3 py-2 font-bold text-emerald-700">Net Settlement Payout</td>
            <td className="text-right px-3 py-2 font-bold text-emerald-700">
              {formatINR(result.netSettlement)}
            </td>
          </tr>
          <tr>
            <td className="px-3 py-2 font-semibold text-slate-600">Cost of Goods</td>
            <td className="text-right px-3 py-2 font-semibold text-slate-600">
              {formatINR(state.cogs)}
            </td>
          </tr>
          <tr className="border-t-2 border-slate-800 bg-slate-900 text-white">
            <td className="px-3 py-3 font-bold text-white">
              {isProfit ? 'NET PROFIT' : 'NET LOSS'}
            </td>
            <td className={`text-right px-3 py-3 font-bold text-xl ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatINR(result.netProfit)}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <p className="text-xs text-slate-400 mb-1">Net Profit Margin</p>
          <p className="text-lg font-bold text-slate-900">{result.netProfitMargin.toFixed(2)}%</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <p className="text-xs text-slate-400 mb-1">Break-Even Selling Price</p>
          <p className="text-lg font-bold text-slate-900">{formatINR(result.breakEvenPrice)}</p>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-6 border-t border-slate-200 pt-4">
        Generated by SellerMath — India's Most Accurate E-Commerce Profit Engine. This breakdown is
        for estimation purposes only and should be verified with your marketplace settlement reports.
      </p>
    </div>
  );
}

function PrintRow({ label, value }: { label: string; value: number }) {
  return (
    <tr className="border-b border-slate-100">
      <td className="px-3 py-2 text-slate-600">{label}</td>
      <td className="text-right px-3 py-2 font-medium text-slate-700">{formatINR(value)}</td>
    </tr>
  );
}