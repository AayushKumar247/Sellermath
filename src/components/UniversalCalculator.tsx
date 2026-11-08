import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  ShoppingBag, Store, Truck, Sparkles, Package, IndianRupee, Weight, MapPin, Percent,
  RotateCcw, Receipt, TrendingUp, TrendingDown, Printer, Truck as TruckIcon, ChevronDown,
  CheckCircle2, AlertCircle, Calculator, Info, Target, Share2, MessageSquare, Activity,
  ShieldAlert, Lightbulb, PieChart, Gauge, ArrowRight, ArrowUpRight, Trophy, Rocket, Zap,
  Download, Copy, Wallet, Flame, Layers, BarChart3,
} from 'lucide-react';
import { useRemoteCalc } from '@/lib/calculateApi';
import WaterfallChart from '@/components/WaterfallChart';
import AIInsights from '@/components/AIInsights';
import MarketplaceLogo from '@/components/MarketplaceLogo';
import ShippingRateEstimator from '@/components/ShippingRateEstimator';

type MarketplaceId = 'amazon'|'flipkart'|'meesho'|'myntra'|'blinkit'|'zepto'|'instamart'|'snapdeal';
type CategoryId = 'fashion'|'electronics'|'home'|'grocery'|'beauty'|'custom';
type ZoneId = 'local'|'regional'|'national';

interface MarketplacePreset {
  id: MarketplaceId; name: string; shortName: string; tagline: string;
  accent: string; gradient: string; icon: React.ElementType;
  categories: Record<CategoryId, { commission: number; closingFee: number }>;
  defaultCategory: CategoryId;
}
interface CategoryPreset { id: CategoryId; label: string; }

const CATEGORIES: CategoryPreset[] = [
  { id: 'fashion', label: 'Fashion & Apparel' },
  { id: 'electronics', label: 'Electronics & Mobile' },
  { id: 'home', label: 'Home & Kitchen' },
  { id: 'grocery', label: 'Grocery & FMCG' },
  { id: 'beauty', label: 'Beauty & Personal Care' },
  { id: 'custom', label: 'Custom' },
];

const MARKETPLACES: MarketplacePreset[] = [
  { id:'amazon', name:'Amazon', shortName:'Amazon', tagline:'5-15% commission', accent:'amber', gradient:'from-amber-400 to-orange-500', icon:ShoppingBag, defaultCategory:'electronics',
    categories:{ fashion:{commission:15,closingFee:20}, electronics:{commission:5,closingFee:15}, home:{commission:10,closingFee:15}, grocery:{commission:8,closingFee:10}, beauty:{commission:12,closingFee:15}, custom:{commission:10,closingFee:15} } },
  { id:'flipkart', name:'Flipkart', shortName:'Flipkart', tagline:'4-16% commission', accent:'blue', gradient:'from-blue-500 to-blue-600', icon:Store, defaultCategory:'electronics',
    categories:{ fashion:{commission:16,closingFee:18}, electronics:{commission:4,closingFee:15}, home:{commission:10,closingFee:15}, grocery:{commission:7,closingFee:10}, beauty:{commission:13,closingFee:15}, custom:{commission:10,closingFee:15} } },
  { id:'meesho', name:'Meesho', shortName:'Meesho', tagline:'0% commission', accent:'fuchsia', gradient:'from-fuchsia-600 to-fuchsia-700', icon:Sparkles, defaultCategory:'fashion',
    categories:{ fashion:{commission:0,closingFee:0}, electronics:{commission:0,closingFee:0}, home:{commission:0,closingFee:0}, grocery:{commission:0,closingFee:0}, beauty:{commission:0,closingFee:0}, custom:{commission:0,closingFee:0} } },
  { id:'myntra', name:'Myntra', shortName:'Myntra', tagline:'8-18% commission', accent:'rose', gradient:'from-pink-400 to-rose-500', icon:ShoppingBag, defaultCategory:'fashion',
    categories:{ fashion:{commission:18,closingFee:25}, electronics:{commission:12,closingFee:20}, home:{commission:14,closingFee:20}, grocery:{commission:10,closingFee:15}, beauty:{commission:15,closingFee:20}, custom:{commission:14,closingFee:20} } },
  { id:'blinkit', name:'Blinkit', shortName:'Blinkit', tagline:'Quick Commerce 15-22%', accent:'yellow', gradient:'from-yellow-400 to-amber-500', icon:Truck, defaultCategory:'grocery',
    categories:{ fashion:{commission:22,closingFee:10}, electronics:{commission:18,closingFee:10}, home:{commission:20,closingFee:10}, grocery:{commission:15,closingFee:8}, beauty:{commission:20,closingFee:10}, custom:{commission:18,closingFee:10} } },
  { id:'zepto', name:'Zepto', shortName:'Zepto', tagline:'Quick Commerce ~22%', accent:'purple', gradient:'from-violet-600 to-indigo-600', icon:Truck, defaultCategory:'grocery',
    categories:{ fashion:{commission:25,closingFee:10}, electronics:{commission:20,closingFee:10}, home:{commission:22,closingFee:10}, grocery:{commission:18,closingFee:8}, beauty:{commission:22,closingFee:10}, custom:{commission:22,closingFee:10} } },
  { id:'instamart', name:'Instamart', shortName:'Instamart', tagline:'Quick Commerce ~20%', accent:'orange', gradient:'from-orange-500 to-red-500', icon:Truck, defaultCategory:'grocery',
    categories:{ fashion:{commission:23,closingFee:10}, electronics:{commission:18,closingFee:10}, home:{commission:20,closingFee:10}, grocery:{commission:16,closingFee:8}, beauty:{commission:20,closingFee:10}, custom:{commission:20,closingFee:10} } },
  { id:'snapdeal', name:'Snapdeal', shortName:'Snapdeal', tagline:'0-12% commission', accent:'red', gradient:'from-red-500 to-red-600', icon:Store, defaultCategory:'fashion',
    categories:{ fashion:{commission:12,closingFee:15}, electronics:{commission:6,closingFee:12}, home:{commission:8,closingFee:12}, grocery:{commission:5,closingFee:10}, beauty:{commission:10,closingFee:12}, custom:{commission:8,closingFee:12} } },
];

const GST_RATES = [0, 5, 12, 18, 28];
const ZONES: { id: ZoneId; label: string; multiplier: number }[] = [
  { id: 'local', label: 'Local', multiplier: 0.7 },
  { id: 'regional', label: 'Regional', multiplier: 1.0 },
  { id: 'national', label: 'National', multiplier: 1.4 },
];

interface CalcState {
  marketplace: MarketplaceId; category: CategoryId; sellingPrice: number; cogs: number;
  shippingWeight: number; directShippingFee: number | null; zone: ZoneId;
  productGstRate: number; returnRate: number; commissionRate: number; closingFee: number;
}
interface CalcResult {
  taxableValue:number; productGst:number; commissionAmount:number; closingFee:number;
  shippingFee:number; totalMarketplaceFees:number; gstOnMarketplaceFees:number; tcsTds:number;
  totalDeductions:number; netSettlement:number; netProfit:number; netProfitMargin:number;
  breakEvenPrice:number; effectiveReturnCost:number;
}

function formatINR(val: number): string {
  const sign = val < 0 ? '-' : '';
  return `${sign}₹${Math.abs(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatCompactINR(val: number): string {
  const sign = val < 0 ? '-' : '';
  const abs = Math.abs(val);
  if (abs >= 1_00_00_000) return `${sign}₹${(abs / 1_00_00_000).toFixed(2)}Cr`;
  if (abs >= 1_00_000) return `${sign}₹${(abs / 1_00_000).toFixed(2)}L`;
  if (abs >= 1_000) return `${sign}₹${(abs / 1_000).toFixed(1)}K`;
  return `${sign}₹${abs.toFixed(0)}`;
}

const STORAGE_KEY = 'sellermath_universal_calc';

const EMPTY_RESULT: CalcResult = {
  taxableValue:0, productGst:0, commissionAmount:0, closingFee:0, shippingFee:0,
  totalMarketplaceFees:0, gstOnMarketplaceFees:0, tcsTds:0, totalDeductions:0,
  netSettlement:0, netProfit:0, netProfitMargin:0, breakEvenPrice:0, effectiveReturnCost:0,
};

const DEFAULT_STATE: CalcState = {
  marketplace:'amazon', category:'electronics', sellingPrice:1500, cogs:600,
  shippingWeight:500, directShippingFee:null, zone:'national', productGstRate:18,
  returnRate:15, commissionRate:5, closingFee:15,
};

// Quick SKU presets
const QUICK_SKUS: { id: string; emoji: string; label: string; state: Partial<CalcState> }[] = [
  { id:'apparel', emoji:'👕', label:'₹599 Apparel', state:{ sellingPrice:599, cogs:250, category:'fashion', shippingWeight:300, commissionRate:16, closingFee:18, returnRate:22, productGstRate:5 } },
  { id:'electronics', emoji:'🎧', label:'₹1,499 Electronics', state:{ sellingPrice:1499, cogs:600, category:'electronics', shippingWeight:500, commissionRate:5, closingFee:15, returnRate:8, productGstRate:18 } },
  { id:'beauty', emoji:'🧴', label:'₹449 Beauty D2C', state:{ sellingPrice:449, cogs:150, category:'beauty', shippingWeight:200, commissionRate:12, closingFee:15, returnRate:12, productGstRate:18 } },
  { id:'premium', emoji:'💍', label:'₹15,000 Premium SKU', state:{ sellingPrice:15000, cogs:7000, category:'custom', shippingWeight:400, commissionRate:10, closingFee:15, returnRate:5, productGstRate:18 } },
];

function loadState(): CalcState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_STATE;
}

interface UniversalCalculatorProps { onNavigate?: (page: string) => void; }

export default function UniversalCalculator({ onNavigate }: UniversalCalculatorProps) {
  const [state, setState] = useState<CalcState>(() => loadState());
  const [shippingEstimatorOpen, setShippingEstimatorOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);

  const activeMarketplace = useMemo(
    () => MARKETPLACES.find((m) => m.id === state.marketplace)!,
    [state.marketplace],
  );

  const selectMarketplace = (id: MarketplaceId) => setState((p) => ({ ...p, marketplace: id }));

  const selectCategory = (cat: CategoryId) => {
    const preset = activeMarketplace.categories[cat];
    setState((p) => ({ ...p, category: cat, commissionRate: preset.commission, closingFee: preset.closingFee }));
  };

  const update = <K extends keyof CalcState>(key: K, value: CalcState[K]) =>
    setState((p) => ({ ...p, [key]: value }));

  const handleApplyShippingFee = (fee: number, courierName: string) => {
    if (state.directShippingFee !== null && state.directShippingFee !== fee) {
      if (!confirm(`Replace existing shipping fee of ₹${state.directShippingFee.toFixed(2)} with ₹${fee.toFixed(2)} from ${courierName}?`)) return;
    }
    update('directShippingFee', fee);
  };
  const handleClearShippingFee = () => update('directShippingFee', null);

  const applyQuickSku = (sku: typeof QUICK_SKUS[number]) => setState((prev) => ({ ...prev, ...sku.state }));
  const resetAll = () => setState(DEFAULT_STATE);

  const { result, error } = useRemoteCalc<CalcResult>(
    '/api/calculate/universal',
    {
      sellingPrice: state.sellingPrice, cogs: state.cogs, productGstRate: state.productGstRate,
      commissionRate: state.commissionRate, closingFee: state.closingFee,
      shippingWeight: state.shippingWeight, directShippingFee: state.directShippingFee,
      zone: state.zone, returnRate: state.returnRate,
    },
    EMPTY_RESULT,
  );

  const handlePrint = () => window.print();

  return (
    <>
      <style>{`
        .ca-scroll-thin::-webkit-scrollbar{width:6px;height:6px}
        .ca-scroll-thin::-webkit-scrollbar-track{background:transparent}
        .ca-scroll-thin::-webkit-scrollbar-thumb{background:rgba(148,163,184,.35);border-radius:9999px}
        .ca-scroll-thin::-webkit-scrollbar-thumb:hover{background:rgba(148,163,184,.6)}
        .ca-scroll-thin{scrollbar-width:thin;scrollbar-color:rgba(148,163,184,.35) transparent}
      `}</style>

      <div className="space-y-6 pb-24 lg:pb-0 w-full max-w-full overflow-x-hidden">
        {/* ============ FLAGSHIP HERO BANNER ============ */}
        <div className="no-print relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-zinc-900 to-emerald-950 p-5 sm:p-7 border border-zinc-800 shadow-xl">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold tracking-wide mb-3 select-none">
              ⚡ CA-Grade Unit Economics • 2026 Marketplace Fee Engine
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight mb-2 select-none leading-tight">
              Decode Every Rupee <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Before You Ship.</span>
            </h1>
            <p className="text-sm sm:text-base text-zinc-300 max-w-3xl leading-relaxed mb-5 select-none">
              Real bank-settlement math across Amazon, Flipkart, Meesho, Myntra & Quick Commerce — factoring 18% GST on fees, Section 194-O TCS/TDS, and true RTO burn down to the last paisa.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold mr-1 select-none">✨ Load Sample SKU</span>
              {QUICK_SKUS.map((sku) => (
                <button key={sku.id} onClick={() => applyQuickSku(sku)}
                  className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/50 text-xs font-medium text-zinc-200 transition-all active:scale-95 select-none">
                  {sku.emoji} {sku.label}
                </button>
              ))}
              <button onClick={resetAll}
                className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-zinc-300 hover:text-white transition-all active:scale-95 ml-auto select-none">
                🔄 Reset
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="no-print bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">Calculation Error</p>
                <p className="text-sm text-red-700 dark:text-red-300 break-words">{error}</p>
                {error.includes('Start the API') && <p className="text-xs text-red-600 dark:text-red-400 mt-2">Start the API with `npm run server`</p>}
              </div>
            </div>
          </div>
        )}

        <SmartAlerts state={state} result={result} marketplace={activeMarketplace} />

        {/* Marketplace Selector */}
        <div className="no-print">
          <p className="text-xs font-semibold text-slate-400 dark:text-zinc-300 uppercase tracking-wide mb-3 select-none">Select Marketplace</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {MARKETPLACES.map((mp) => {
              const isActive = state.marketplace === mp.id;
              const isBlinkit = mp.id === 'blinkit';
              return (
                <button key={mp.id} onClick={() => selectMarketplace(mp.id)}
                  className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 select-none focus:outline-none focus:ring-0 hover:-translate-y-1 hover:shadow-xl active:scale-95 min-w-0 ${
                    isActive
                      ? `bg-gradient-to-br ${mp.gradient} ${isBlinkit ? 'text-slate-900' : 'text-white'} border-transparent shadow-lg scale-105`
                      : 'bg-white dark:bg-zinc-900/90 border-slate-200 dark:border-zinc-700/80 hover:border-slate-300 dark:hover:border-zinc-600 hover:shadow-md'
                  }`}>
                  <MarketplaceLogo id={mp.id} size="lg" />
                  <span className={`text-xs font-bold ${isActive ? (isBlinkit ? 'text-slate-900' : 'text-white') : 'text-slate-700 dark:text-zinc-50'}`}>{mp.shortName}</span>
                  <span className={`text-[10px] leading-tight text-center ${isActive ? (isBlinkit ? 'text-slate-900/80' : 'text-white/80') : 'text-slate-400 dark:text-zinc-300'}`}>{mp.tagline}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Inputs */}
          <div className="lg:col-span-2 space-y-4 no-print min-w-0">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5 transition-all hover:border-slate-300 dark:hover:border-zinc-700">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center"><Package className="w-4 h-4 text-slate-600 dark:text-zinc-300" strokeWidth={2} /></div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-50 uppercase tracking-wide select-none">Product Category</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => {
                  const isActive = state.category === cat.id;
                  const isBlinkit = activeMarketplace.id === 'blinkit';
                  return (
                    <button key={cat.id} onClick={() => selectCategory(cat.id)}
                      className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all select-none focus:outline-none focus:ring-0 active:scale-95 hover:-translate-y-0.5 min-w-0 truncate ${
                        isActive
                          ? `bg-gradient-to-r ${activeMarketplace.gradient} ${isBlinkit ? 'text-slate-900' : 'text-white'} shadow-md`
                          : 'bg-slate-50 dark:bg-zinc-900/90 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700/80'
                      }`}>{cat.label}</button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NumberInput label="Cost of Goods" hint="Manufacturing / sourcing cost" icon={Package} prefix="₹" value={state.cogs} onChange={(v) => update('cogs', v)} />
              <NumberInput label="Selling Price (incl. GST)" hint="Price shown to customer" icon={IndianRupee} prefix="₹" value={state.sellingPrice} onChange={(v) => update('sellingPrice', v)} />
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5 transition-all hover:border-slate-300 dark:hover:border-zinc-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <Weight className="w-4 h-4 text-slate-500 dark:text-zinc-300" />
                    <label className="text-sm font-semibold text-slate-700 dark:text-zinc-50 select-none">Shipping Weight</label>
                    <div className="relative ml-auto">
                      <input type="number" value={state.shippingWeight || ''} onChange={(e) => { const val = e.target.value; if (val === '' || val === '-') return; update('shippingWeight', parseInt(val) || 0); }} onBlur={(e) => { if (e.target.value === '' || e.target.value === '-') update('shippingWeight', 100); }} placeholder="0"
                        className="w-20 text-sm font-bold text-slate-900 dark:text-zinc-50 bg-slate-50 dark:bg-zinc-900/90 rounded-lg border-2 border-slate-200 dark:border-zinc-700/80 px-2 py-1 text-right focus:outline-none focus:border-emerald-500 transition-colors" />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-zinc-300 pointer-events-none">g</span>
                    </div>
                  </div>
                  <input type="range" min={100} max={5000} step={100} value={state.shippingWeight} onChange={(e) => update('shippingWeight', parseInt(e.target.value))} className="w-full accent-emerald-500" />
                  <div className="flex justify-between text-xs text-slate-400 dark:text-zinc-300 mt-1 select-none"><span>100g</span><span>5kg</span></div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {[250,500,1000,2000,5000].map((weight) => {
                      const isSelected = state.shippingWeight === weight;
                      const isBlinkit = activeMarketplace.id === 'blinkit';
                      return (
                        <button key={weight} onClick={() => update('shippingWeight', weight)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all select-none focus:outline-none focus:ring-0 active:scale-95 ${
                            isSelected ? `bg-gradient-to-r ${activeMarketplace.gradient} ${isBlinkit ? 'text-slate-900' : 'text-white'} shadow-md` : 'bg-slate-50 dark:bg-zinc-900/90 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700/80'
                          }`}>{weight >= 1000 ? `${weight / 1000}kg` : `${weight}g`}</button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-300 mt-2 select-none">1000g = 1kg</p>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-slate-500 dark:text-zinc-300" />
                    <label className="text-sm font-semibold text-slate-700 dark:text-zinc-50 select-none">Shipping Zone</label>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {ZONES.map((z) => {
                      const isActive = state.zone === z.id;
                      const isBlinkit = activeMarketplace.id === 'blinkit';
                      return (
                        <button key={z.id} onClick={() => update('zone', z.id)}
                          className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all select-none focus:outline-none focus:ring-0 active:scale-95 min-w-0 ${
                            isActive ? `bg-gradient-to-r ${activeMarketplace.gradient} ${isBlinkit ? 'text-slate-900' : 'text-white'} shadow-md` : 'bg-slate-50 dark:bg-zinc-900/90 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700/80'
                          }`}>{z.label}</button>
                      );
                    })}
                  </div>
                </div>
              </div>
              {state.directShippingFee !== null && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-zinc-700">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-700 dark:text-zinc-50 select-none">Applied Shipping Fee</p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 select-none">Override from courier estimator</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatINR(state.directShippingFee)}</span>
                      <button onClick={handleClearShippingFee} className="text-xs text-slate-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors active:scale-95">Clear</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5 transition-all hover:border-slate-300 dark:hover:border-zinc-700 min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  <Percent className="w-4 h-4 text-slate-500 dark:text-zinc-300" />
                  <label className="text-sm font-semibold text-slate-700 dark:text-zinc-50 select-none">Product GST Rate</label>
                  <InfoTooltip text="The tax rate applicable to your physical product category." />
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {GST_RATES.map((r) => {
                    const isActive = state.productGstRate === r;
                    return (
                      <button key={r} onClick={() => update('productGstRate', r)}
                        className={`py-2.5 rounded-lg text-sm font-bold transition-all select-none focus:outline-none focus:ring-0 active:scale-95 ${
                          isActive ? 'bg-zinc-950 dark:bg-zinc-950 text-white shadow-md' : 'bg-slate-50 dark:bg-zinc-900/90 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700/80'
                        }`}>{r}%</button>
                    );
                  })}
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5 transition-all hover:border-slate-300 dark:hover:border-zinc-700 min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  <RotateCcw className="w-4 h-4 text-slate-500 dark:text-zinc-300" />
                  <label className="text-sm font-semibold text-slate-700 dark:text-zinc-50 select-none">Return / RTO Rate</label>
                  <span className="text-sm font-bold text-slate-900 dark:text-zinc-50 ml-auto">{state.returnRate}%</span>
                </div>
                <input type="range" min={0} max={50} step={1} value={state.returnRate} onChange={(e) => update('returnRate', parseInt(e.target.value))} className="w-full accent-rose-500" />
                <div className="flex justify-between text-xs text-slate-400 dark:text-zinc-300 mt-1 select-none"><span>0%</span><span>50%</span></div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5 transition-all hover:border-slate-300 dark:hover:border-zinc-700">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-zinc-800 flex items-center justify-center"><Receipt className="w-4 h-4 text-slate-600 dark:text-zinc-300" strokeWidth={2} /></div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-50 uppercase tracking-wide select-none">Marketplace Fees (Auto-filled, Editable)</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <NumberInput label="Commission Rate" hint={`${activeMarketplace.name} ${CATEGORIES.find((c) => c.id === state.category)?.label}`} icon={Percent} suffix="%" value={state.commissionRate} onChange={(v) => update('commissionRate', v)} compact />
                <NumberInput label="Fixed Closing Fee" hint="Per-order closing charge" icon={IndianRupee} prefix="₹" value={state.closingFee} onChange={(v) => update('closingFee', v)} compact tooltip="A fixed fee charged by the marketplace per item sold, based on price tiers." />
                <div className="bg-white dark:bg-zinc-900/90 rounded-xl border-2 border-slate-200 dark:border-zinc-700/80 p-4 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <TruckIcon className="w-4 h-4 text-slate-500 dark:text-zinc-300" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-zinc-300 select-none">Pick & Pack Fee</span>
                  </div>
                  <p className="text-lg font-bold text-slate-900 dark:text-zinc-50">₹{result.shippingFee.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-slate-400 dark:text-zinc-300 select-none">{state.shippingWeight}g · {ZONES.find((z) => z.id === state.zone)?.label}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Tax Ledger */}
          <div className="lg:col-span-1 min-w-0">
            <TaxLedger marketplace={activeMarketplace} state={state} result={result} onPrint={handlePrint}
              onUpdateSellingPrice={(price) => update('sellingPrice', price)} marketplaceId={activeMarketplace.id} />
          </div>
        </div>

        {/* Analytics dashboard */}
        <div className="no-print grid grid-cols-1 lg:grid-cols-3 gap-6">
          <CostBreakdownCard state={state} result={result} marketplace={activeMarketplace} />
          <HealthScoreCard state={state} result={result} marketplace={activeMarketplace} />
          <SensitivityCard state={state} result={result} marketplace={activeMarketplace} />
        </div>

        <div className="w-full max-w-full min-w-0">
          <WaterfallChart revenue={state.sellingPrice} commission={result.commissionAmount + state.closingFee}
            shipping={result.shippingFee} gst={result.gstOnMarketplaceFees + result.tcsTds + result.productGst}
            rto={result.effectiveReturnCost} cogs={state.cogs} netProfit={result.netProfit}
            marketplaceName={activeMarketplace.name}
            categoryName={CATEGORIES.find((c) => c.id === state.category)?.label || state.category}
            marketplaceGradient={activeMarketplace.gradient} marketplaceId={activeMarketplace.id}
            commissionRate={state.commissionRate} />
        </div>

        {/* Instant Rule-Based Action Plan + AI Insights */}
        <div className="no-print w-full max-w-full min-w-0">
          <MarginActionPlan state={state} result={result} marketplace={activeMarketplace} />
        </div>

        <div className="w-full max-w-full min-w-0">
          <AIInsights key={`${activeMarketplace.name}-${state.sellingPrice}-${state.cogs}-${state.commissionRate}`}
            marketplaceName={activeMarketplace.name}
            categoryName={CATEGORIES.find((c) => c.id === state.category)?.label || state.category}
            marketplaceGradient={activeMarketplace.gradient} marketplaceId={activeMarketplace.id}
            sellingPrice={state.sellingPrice} commissionRate={state.commissionRate}
            shippingFee={result.shippingFee}
            gstAmount={result.gstOnMarketplaceFees + result.tcsTds + result.productGst}
            returnRate={state.returnRate} netProfit={result.netProfit} cogs={state.cogs}
            breakEvenPrice={result.breakEvenPrice} />
        </div>

        <CrossPlatformComparison sellingPrice={state.sellingPrice} cogs={state.cogs}
          shippingWeight={state.shippingWeight} zone={state.zone} productGstRate={state.productGstRate}
          returnRate={state.returnRate} category={state.category} currentMarketplace={state.marketplace}
          currentNetProfit={result.netProfit} currentNetProfitMargin={result.netProfitMargin}
          onMarketplaceSelect={selectMarketplace} />

        <div className="no-print bg-gradient-to-br from-zinc-950 to-zinc-900 rounded-2xl p-6 border border-zinc-800 overflow-hidden relative transition-all hover:shadow-2xl">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20 bg-emerald-500" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg flex-shrink-0"><TruckIcon className="w-5 h-5 text-white" strokeWidth={2.5} /></div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-zinc-50 select-none">Losing money on RTO shipping?</h3>
                <p className="text-sm text-zinc-300 mt-0.5 select-none">Compare shipping costs and understand forward and RTO charges before shipping your orders.</p>
              </div>
            </div>
            <button onClick={() => { onNavigate?.('shipping'); window.scrollTo(0, 0); }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 hover:shadow-emerald-500/50 transition-all whitespace-nowrap flex-shrink-0 select-none focus:outline-none focus:ring-0 active:scale-95">
              <TruckIcon className="w-4 h-4" /> Check Shiprocket Rates
            </button>
          </div>
        </div>

        <FeeMatrixTable />
        <FAQAccordion />

        <div className="print-only">
          <PrintTaxLedger marketplace={activeMarketplace} state={state} result={result} marketplaceId={activeMarketplace.id} />
        </div>
      </div>

      <MobileStickySummary state={state} result={result} marketplace={activeMarketplace} onPrint={handlePrint} />

      <ShippingRateEstimator isOpen={shippingEstimatorOpen} onClose={() => setShippingEstimatorOpen(false)} onApplyShippingFee={handleApplyShippingFee} />
    </>
  );
}

/* ==================== SMART ALERTS ==================== */
function SmartAlerts({ state, result }: { state: CalcState; result: CalcResult; marketplace: MarketplacePreset }) {
  const alerts = useMemo(() => {
    const list: { type: 'critical'|'warning'|'info'|'success'; title: string; message: string; icon: React.ElementType }[] = [];
    if (result.netProfit < 0) list.push({ type:'critical', title:'Losing Money on This SKU', message:`You're losing ${formatINR(Math.abs(result.netProfit))} per sale. Raise price above ${formatINR(result.breakEvenPrice)} or reduce costs.`, icon:ShieldAlert });
    else if (result.netProfitMargin > 0 && result.netProfitMargin < 8) list.push({ type:'warning', title:'Razor-Thin Margin', message:`Only ${result.netProfitMargin.toFixed(1)}% margin. One return could wipe out 5+ sales' profit. Consider raising price by ${formatINR(Math.max(50, result.netProfit * 0.3))}.`, icon:AlertCircle });
    if (state.returnRate > 25) list.push({ type:'warning', title:`High RTO Rate (${state.returnRate}%)`, message:`Returns are costing you ${formatINR(result.effectiveReturnCost)} per order. Improve product photos, sizing charts, or packaging to reduce this.`, icon:RotateCcw });
    if (state.marketplace === 'meesho' && state.returnRate > 15) list.push({ type:'critical', title:'Meesho RTO Trap', message:`With 0% commission but ${state.returnRate}% RTO, shipping costs can exceed your entire margin. Reduce RTO or raise price.`, icon:Zap });
    if (['blinkit','zepto','instamart'].includes(state.marketplace) && state.commissionRate >= 18 && result.netProfitMargin < 15) list.push({ type:'warning', title:'Quick Commerce Margin Squeeze', message:`Quick commerce charges ${state.commissionRate}% commission. Your margin may not justify dark store fulfillment costs.`, icon:Info });
    if (result.netProfit > 0 && state.sellingPrice < result.breakEvenPrice * 1.08 && state.sellingPrice >= result.breakEvenPrice) list.push({ type:'info', title:'Price Very Close to Break-Even', message:`Only ${formatINR(state.sellingPrice - result.breakEvenPrice)} buffer above break-even. Small fee changes could make you lose money.`, icon:AlertCircle });
    if (result.netProfitMargin >= 20) list.push({ type:'success', title:'Strong Profit Margin', message:`${result.netProfitMargin.toFixed(1)}% margin is excellent. You have room for RTO and fee fluctuations.`, icon:Trophy });
    const priority = { critical:0, warning:1, success:2, info:3 };
    return list.sort((a, b) => priority[a.type] - priority[b.type]).slice(0, 2);
  }, [state, result]);

  if (alerts.length === 0) return null;
  const styles = {
    critical: { bg:'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-950/40', border:'border-red-300 dark:border-red-800', icon:'text-red-600 dark:text-red-400', iconBg:'bg-red-100 dark:bg-red-900/50', title:'text-red-900 dark:text-red-100', msg:'text-red-700 dark:text-red-300' },
    warning: { bg:'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40', border:'border-amber-300 dark:border-amber-800', icon:'text-amber-600 dark:text-amber-400', iconBg:'bg-amber-100 dark:bg-amber-900/50', title:'text-amber-900 dark:text-amber-100', msg:'text-amber-700 dark:text-amber-300' },
    info: { bg:'bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-950/40 dark:to-sky-950/40', border:'border-blue-300 dark:border-blue-800', icon:'text-blue-600 dark:text-blue-400', iconBg:'bg-blue-100 dark:bg-blue-900/50', title:'text-blue-900 dark:text-blue-100', msg:'text-blue-700 dark:text-blue-300' },
    success: { bg:'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40', border:'border-emerald-300 dark:border-emerald-800', icon:'text-emerald-600 dark:text-emerald-400', iconBg:'bg-emerald-100 dark:bg-emerald-900/50', title:'text-emerald-900 dark:text-emerald-100', msg:'text-emerald-700 dark:text-emerald-300' },
  };
  return (
    <div className="no-print space-y-3">
      {alerts.map((alert, i) => {
        const s = styles[alert.type];
        const Icon = alert.icon;
        return (
          <div key={i} className={`${s.bg} ${s.border} border rounded-xl p-4 transition-all hover:shadow-md`}>
            <div className="flex items-start gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-lg ${s.iconBg} flex items-center justify-center flex-shrink-0`}><Icon className={`w-4 h-4 ${s.icon}`} strokeWidth={2.5} /></div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${s.title} select-none`}>{alert.title}</p>
                <p className={`text-xs sm:text-sm ${s.msg} mt-0.5 leading-relaxed break-words`}>{alert.message}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ==================== COST BREAKDOWN DONUT ==================== */
function CostBreakdownCard({ state, result }: { state: CalcState; result: CalcResult; marketplace: MarketplacePreset }) {
  const segments = useMemo(() => {
    const items = [
      { label:'COGS', value:Math.max(0, state.cogs), color:'#64748b' },
      { label:'Commission', value:Math.max(0, result.commissionAmount), color:'#3b82f6' },
      { label:'Shipping', value:Math.max(0, result.shippingFee), color:'#f59e0b' },
      { label:'Closing Fee', value:Math.max(0, state.closingFee), color:'#8b5cf6' },
      { label:'GST on Fees', value:Math.max(0, result.gstOnMarketplaceFees), color:'#06b6d4' },
      { label:'TCS', value:Math.max(0, result.tcsTds), color:'#ec4899' },
      { label:'RTO Cost', value:Math.max(0, result.effectiveReturnCost), color:'#f43f5e' },
      { label:'Product GST', value:Math.max(0, result.productGst), color:'#a855f7' },
    ].filter((s) => s.value > 0.5);
    const totalCost = items.reduce((sum, s) => sum + s.value, 0);
    const profit = result.netProfit;
    const denominator = Math.max(totalCost + Math.max(0, profit), state.sellingPrice, 1);
    if (profit > 0) items.push({ label:'Net Profit', value:profit, color:'#10b981' });
    return items.map((s) => ({ ...s, pct:(s.value / denominator) * 100 }));
  }, [state, result]);

  const size = 160, stroke = 22, radius = (size - stroke) / 2, circumference = 2 * Math.PI * radius;
  let offset = 0;
  const totalCostPct = segments.filter((s) => s.label !== 'Net Profit').reduce((sum, s) => sum + s.pct, 0);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden transition-all hover:shadow-lg hover:border-slate-300 dark:hover:border-zinc-700 min-w-0">
      <div className="p-5 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md flex-shrink-0"><PieChart className="w-4 h-4 text-white" strokeWidth={2.5} /></div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-50 select-none">Where Your Money Goes</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 select-none truncate">Cost breakdown of {formatINR(state.sellingPrice)}</p>
          </div>
        </div>
      </div>
      <div className="p-5 flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-shrink-0">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
            {segments.length === 0 && <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />}
            {segments.map((seg, i) => {
              const dash = (seg.pct / 100) * circumference;
              const el = <circle key={i} cx={size/2} cy={size/2} r={radius} fill="none" stroke={seg.color} strokeWidth={stroke} strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={-offset} className="transition-all duration-500" />;
              offset += dash;
              return el;
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-zinc-500 tracking-wider">Cost Ratio</span>
            <span className={`text-xl font-bold ${totalCostPct > 100 ? 'text-red-600' : totalCostPct > 80 ? 'text-amber-600' : 'text-emerald-600'}`}>{totalCostPct.toFixed(0)}%</span>
          </div>
        </div>
        <div className="flex-1 w-full space-y-1 min-w-0">
          {segments.slice(0, 6).map((seg) => (
            <div key={seg.label} className="flex items-center gap-2 text-xs min-w-0">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="text-slate-600 dark:text-zinc-400 truncate flex-1 min-w-0 select-none">{seg.label}</span>
              <span className="font-semibold text-slate-800 dark:text-zinc-200 whitespace-nowrap">{formatINR(seg.value)}</span>
              <span className="text-slate-400 dark:text-zinc-500 text-[10px] w-10 text-right flex-shrink-0">{seg.pct.toFixed(1)}%</span>
            </div>
          ))}
          {segments.length > 6 && <p className="text-[10px] text-slate-400 dark:text-zinc-500 pt-1 select-none">+{segments.length - 6} more categories</p>}
        </div>
      </div>
    </div>
  );
}

/* ==================== HEALTH SCORE ==================== */
function HealthScoreCard({ state, result }: { state: CalcState; result: CalcResult; marketplace: MarketplacePreset }) {
  const score = useMemo(() => {
    let s = 100;
    if (result.netProfit < 0) s -= 50;
    else if (result.netProfitMargin < 3) s -= 40;
    else if (result.netProfitMargin < 8) s -= 28;
    else if (result.netProfitMargin < 15) s -= 15;
    else if (result.netProfitMargin < 25) s -= 5;
    if (state.returnRate > 30) s -= 30;
    else if (state.returnRate > 20) s -= 18;
    else if (state.returnRate > 12) s -= 8;
    const feePct = state.sellingPrice > 0
      ? ((result.commissionAmount + result.shippingFee + result.gstOnMarketplaceFees + result.effectiveReturnCost + state.closingFee) / state.sellingPrice) * 100
      : 0;
    if (feePct > 40) s -= 15;
    else if (feePct > 30) s -= 8;
    else if (feePct > 20) s -= 3;
    return Math.max(0, Math.min(100, Math.round(s)));
  }, [state, result]);

  const config = useMemo(() => {
    if (score >= 80) return { label:'Excellent', color:'#10b981', bg:'from-emerald-500 to-teal-600', text:'text-emerald-600 dark:text-emerald-400', desc:'This SKU is healthy. Scale it up!' };
    if (score >= 60) return { label:'Healthy', color:'#22c55e', bg:'from-green-500 to-emerald-600', text:'text-green-600 dark:text-green-400', desc:'Good margin. Monitor RTO closely.' };
    if (score >= 40) return { label:'Warning', color:'#f59e0b', bg:'from-amber-500 to-orange-500', text:'text-amber-600 dark:text-amber-400', desc:'Tight margin. Optimize costs.' };
    return { label:'Critical', color:'#ef4444', bg:'from-red-500 to-rose-600', text:'text-red-600 dark:text-red-400', desc:'Losing money. Take action now.' };
  }, [score]);

  const size = 160, stroke = 14, radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden transition-all hover:shadow-lg hover:border-slate-300 dark:hover:border-zinc-700 min-w-0">
      <div className="p-5 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.bg} flex items-center justify-center shadow-md flex-shrink-0`}><Gauge className="w-4 h-4 text-white" strokeWidth={2.5} /></div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-50 select-none">Profit Health Score</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 select-none">Combined SKU viability</p>
          </div>
        </div>
      </div>
      <div className="p-5 flex flex-col items-center">
        <div className="relative">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
            <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} className="dark:stroke-zinc-800" />
            <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={config.color} strokeWidth={stroke} strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold ${config.text} tabular-nums select-none`}>{score}</span>
            <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-zinc-500 tracking-wider select-none">/ 100</span>
          </div>
        </div>
        <div className={`mt-3 px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${config.bg} shadow-md select-none`}>{config.label}</div>
        <p className="text-xs text-center text-slate-500 dark:text-zinc-400 mt-2 leading-relaxed select-none">{config.desc}</p>
        <div className="w-full mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="min-w-0"><p className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-semibold select-none">Margin</p><p className={`text-sm font-bold ${result.netProfitMargin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{result.netProfitMargin.toFixed(1)}%</p></div>
          <div className="min-w-0"><p className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-semibold select-none">RTO</p><p className="text-sm font-bold text-slate-700 dark:text-zinc-300">{state.returnRate}%</p></div>
          <div className="min-w-0"><p className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-semibold select-none">Fees</p><p className="text-sm font-bold text-slate-700 dark:text-zinc-300">{state.sellingPrice > 0 ? (((result.commissionAmount + result.shippingFee + result.gstOnMarketplaceFees) / state.sellingPrice) * 100).toFixed(0) : 0}%</p></div>
        </div>
      </div>
    </div>
  );
}

/* ==================== SENSITIVITY ==================== */
function SensitivityCard({ state, result }: { state: CalcState; result: CalcResult; marketplace: MarketplacePreset }) {
  const points = useMemo(() => {
    const currentPrice = state.sellingPrice, breakeven = result.breakEvenPrice, currentProfit = result.netProfit;
    if (!currentPrice || currentPrice <= 0) return [];
    const breakevenValid = breakeven > 0 && isFinite(breakeven);
    const minPrice = Math.max(1, Math.min(currentPrice * 0.6, breakevenValid ? breakeven * 0.8 : currentPrice * 0.6));
    const maxPrice = Math.max(currentPrice * 1.4, breakevenValid ? breakeven * 1.3 : currentPrice * 1.4);
    const steps = 24;
    const slope = breakevenValid && Math.abs(currentPrice - breakeven) > 1 ? currentProfit / (currentPrice - breakeven) : currentPrice * 0.4;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const price = minPrice + (maxPrice - minPrice) * (i / steps);
      const profit = breakevenValid ? (price - breakeven) * slope : currentProfit + (price - currentPrice) * slope;
      return { price, profit };
    });
  }, [state.sellingPrice, result.breakEvenPrice, result.netProfit]);

  const chartW = 320, chartH = 160, pad = { top:12, right:12, bottom:24, left:42 };
  const innerW = chartW - pad.left - pad.right;
  const innerH = chartH - pad.top - pad.bottom;

  const { path, currentPoint, breakevenX, minPriceV, maxPriceV, minProfit, maxProfit } = useMemo(() => {
    if (points.length === 0) return { path:'', currentPoint:null as null | { x: number; y: number; profit: number }, breakevenX:null as null | number, minPriceV:0, maxPriceV:0, minProfit:0, maxProfit:0 };
    const profits = points.map((p) => p.profit).concat([0]);
    const mnP = Math.min(...profits), mxP = Math.max(...profits);
    const prices = points.map((p) => p.price);
    const mnX = Math.min(...prices), mxX = Math.max(...prices);
    const xFor = (v: number) => pad.left + ((v - mnX) / Math.max(1, mxX - mnX)) * innerW;
    const yFor = (v: number) => pad.top + innerH - ((v - mnP) / Math.max(1, mxP - mnP)) * innerH;
    let d = '';
    points.forEach((p, i) => { d += i === 0 ? `M ${xFor(p.price)} ${yFor(p.profit)}` : ` L ${xFor(p.price)} ${yFor(p.profit)}`; });
    const current = points.reduce((best, p) => Math.abs(p.price - state.sellingPrice) < Math.abs(best.price - state.sellingPrice) ? p : best);
    const beX = result.breakEvenPrice > 0 && result.breakEvenPrice >= mnX && result.breakEvenPrice <= mxX ? xFor(result.breakEvenPrice) : null;
    return { path:d, currentPoint:{ x:xFor(current.price), y:yFor(current.profit), profit:current.profit }, breakevenX:beX, minPriceV:mnX, maxPriceV:mxX, minProfit:mnP, maxProfit:mxP };
  }, [points, state.sellingPrice, result.breakEvenPrice, innerW, innerH, pad.left, pad.top]);

  const zeroY = useMemo(() => maxProfit === minProfit ? pad.top + innerH / 2 : pad.top + innerH - ((0 - minProfit) / (maxProfit - minProfit)) * innerH, [minProfit, maxProfit, innerH, pad.top]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden transition-all hover:shadow-lg hover:border-slate-300 dark:hover:border-zinc-700 min-w-0">
      <div className="p-5 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-md flex-shrink-0"><Activity className="w-4 h-4 text-white" strokeWidth={2.5} /></div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-50 select-none">Price Sensitivity</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 select-none">Profit at different selling prices</p>
          </div>
        </div>
      </div>
      <div className="p-4">
        <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" preserveAspectRatio="xMidYMid meet">
          <defs><linearGradient id="sensGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity="0.3" /><stop offset="100%" stopColor="#10b981" stopOpacity="0" /></linearGradient></defs>
          {[0, 0.25, 0.5, 0.75, 1].map((frac) => <line key={frac} x1={pad.left} x2={pad.left + innerW} y1={pad.top + innerH * frac} y2={pad.top + innerH * frac} stroke="#e2e8f0" strokeWidth="1" className="dark:stroke-zinc-800" strokeDasharray="2 3" />)}
          <line x1={pad.left} x2={pad.left + innerW} y1={zeroY} y2={zeroY} stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3" className="dark:stroke-zinc-600" />
          {path && <path d={`${path} L ${pad.left + innerW} ${zeroY} L ${pad.left} ${zeroY} Z`} fill="url(#sensGrad)" />}
          {path && <path d={path} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300" />}
          {breakevenX !== null && <g><line x1={breakevenX} x2={breakevenX} y1={pad.top} y2={pad.top + innerH} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" /><text x={breakevenX + 3} y={pad.top + 10} fontSize="8" fill="#f59e0b" fontWeight="bold">BE</text></g>}
          {currentPoint && <g><circle cx={currentPoint.x} cy={currentPoint.y} r="6" fill="#10b981" opacity="0.25" /><circle cx={currentPoint.x} cy={currentPoint.y} r="3.5" fill="#10b981" stroke="white" strokeWidth="2" /></g>}
          <text x={pad.left} y={chartH - 6} fontSize="9" fill="#94a3b8" textAnchor="start">₹{formatCompactINR(minPriceV).replace('₹','')}</text>
          <text x={pad.left + innerW} y={chartH - 6} fontSize="9" fill="#94a3b8" textAnchor="end">₹{formatCompactINR(maxPriceV).replace('₹','')}</text>
          <text x={4} y={pad.top + 8} fontSize="9" fill="#94a3b8" textAnchor="start">{formatCompactINR(maxProfit)}</text>
          <text x={4} y={pad.top + innerH} fontSize="9" fill="#94a3b8" textAnchor="start">{formatCompactINR(minProfit)}</text>
        </svg>
        <div className="mt-2 flex items-center justify-between text-[10px] gap-2">
          <span className="text-slate-500 dark:text-zinc-400 flex items-center gap-1 min-w-0 truncate select-none"><span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" /> Current: <b className="text-slate-700 dark:text-zinc-200">{formatCompactINR(state.sellingPrice)}</b></span>
          <span className="text-slate-500 dark:text-zinc-400 flex items-center gap-1 min-w-0 truncate select-none"><span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" /> BE: <b className="text-slate-700 dark:text-zinc-200">{formatCompactINR(result.breakEvenPrice)}</b></span>
        </div>
      </div>
    </div>
  );
}

/* ==================== MARGIN ACTION PLAN (fill AI void) ==================== */
function MarginActionPlan({ state, result }: { state: CalcState; result: CalcResult; marketplace: MarketplacePreset }) {
  const targetPriceFor20 = useMemo(() => {
    if (state.sellingPrice <= 0) return 0;
    const feeRatio = (result.commissionAmount + result.shippingFee + result.gstOnMarketplaceFees + result.tcsTds + result.effectiveReturnCost + state.closingFee + result.productGst) / state.sellingPrice;
    const denom = 1 - feeRatio - 0.2;
    if (denom <= 0.05) return result.breakEvenPrice * 1.25;
    return state.cogs / denom;
  }, [state, result]);

  const maxCAC = Math.max(0, result.netProfit);
  const rtoSavings = result.shippingFee * 0.05;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden transition-all hover:shadow-lg hover:border-slate-300 dark:hover:border-zinc-700">
      <div className="p-5 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg flex-shrink-0"><Lightbulb className="w-5 h-5 text-white" strokeWidth={2.5} /></div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-50 select-none">Instant Margin Action Plan</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-300 select-none">Rule-based recommendations — no AI call needed</p>
          </div>
        </div>
      </div>
      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { n:'1', title:'Target Price for 20% Margin', value: formatINR(targetPriceFor20), hint:'Price needed to hit a healthy 20% net margin', color:'emerald' },
          { n:'2', title:'Max Affordable Ad CAC', value: formatINR(maxCAC), hint:'Max ad spend per order before you break even', color:'blue' },
          { n:'3', title:'RTO Sensitivity', value: `${formatINR(rtoSavings)} / order`, hint:'Every 5% RTO drop saves this per order', color:'rose' },
        ].map((card) => (
          <div key={card.n} className={`min-w-0 bg-${card.color}-50/60 dark:bg-${card.color}-950/30 border border-${card.color}-200 dark:border-${card.color}-800 rounded-xl p-4 transition-all hover:shadow-md`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-6 h-6 rounded-full bg-${card.color}-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 select-none`}>{card.n}</div>
              <span className="text-xs font-semibold text-slate-700 dark:text-zinc-200 select-none truncate">{card.title}</span>
            </div>
            <p className={`text-lg font-bold text-${card.color}-700 dark:text-${card.color}-400 tabular-nums`}>{card.value}</p>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed select-none">{card.hint}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==================== TAX LEDGER ==================== */
interface TaxLedgerProps {
  marketplace: MarketplacePreset; state: CalcState; result: CalcResult;
  onPrint: () => void; onUpdateSellingPrice: (price: number) => void; marketplaceId?: string;
}

function TaxLedger({ marketplace, state, result, onPrint, onUpdateSellingPrice, marketplaceId }: TaxLedgerProps) {
  const isBlinkit = marketplaceId === 'blinkit';
  const isProfit = result.netProfit >= 0;
  const Icon = marketplace.icon;
  const categoryName = CATEGORIES.find((c) => c.id === state.category)?.label || state.category;
  const [targetProfit, setTargetProfit] = useState(500);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [ordersPerMonth, setOrdersPerMonth] = useState(100);

  const buildLedgerText = useCallback(() => {
    return `
📦 ${marketplace.name} - SKU Profit Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Category: ${categoryName}
Selling Price: ${formatINR(state.sellingPrice)}
Total Deductions: ${formatINR(result.totalDeductions + result.effectiveReturnCost)}
Net Settlement: ${formatINR(result.netSettlement)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Net Profit: ${formatINR(result.netProfit)}
📊 Margin: ${result.netProfitMargin.toFixed(2)}%
${isProfit ? '🎉 PROFITABLE' : '⚠️ LOSS'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated by SellerMath`.trim();
  }, [marketplace.name, categoryName, state.sellingPrice, result, isProfit]);

  const handleShareSummary = async () => {
    const summary = buildLedgerText();
    if (navigator.share) {
      try { await navigator.share({ title: `${marketplace.name} SKU Profit Summary`, text: summary }); }
      catch (err) { if ((err as Error).name !== 'AbortError') console.log('Share failed', err); }
    } else {
      navigator.clipboard.writeText(summary).then(() => { setShareSuccess(true); setTimeout(() => setShareSuccess(false), 3000); });
    }
  };

  const handleCopyLedger = async () => {
    try {
      await navigator.clipboard.writeText(buildLedgerText());
      setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2500);
    } catch { /* ignore */ }
  };

  const handleDownload = () => {
    const blob = new Blob([buildLedgerText()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `sellermath-${marketplace.name.toLowerCase()}-receipt.txt`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const { result: targetPriceResult } = useRemoteCalc<{ recommendedPrice: number }>(
    '/api/calculate/target-price',
    { cogs: state.cogs, commissionRate: state.commissionRate, closingFee: state.closingFee,
      productGstRate: state.productGstRate, shippingWeight: state.shippingWeight,
      returnRate: state.returnRate, zone: state.zone, desiredProfit: targetProfit },
    { recommendedPrice: 0 },
  );
  const recommendedPrice = targetPriceResult.recommendedPrice;

  const monthlyProfit = result.netProfit * ordersPerMonth;
  const monthlyCogs = state.cogs * ordersPerMonth;
  const roii = state.cogs > 0 ? (result.netProfit / state.cogs) * 100 : 0;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 overflow-hidden shadow-lg transition-all hover:shadow-xl lg:sticky lg:top-24 w-full max-w-full min-w-0">
      <div className={`bg-gradient-to-r ${marketplace.gradient} p-4`}>
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-lg ${isBlinkit ? 'bg-slate-900/20' : 'bg-white/20'} flex items-center justify-center backdrop-blur-sm flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${isBlinkit ? 'text-slate-900' : 'text-white'}`} strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h3 className={`text-sm font-bold ${isBlinkit ? 'text-slate-900' : 'text-white'} select-none truncate`}>CA Tax Ledger</h3>
              <p className={`text-xs ${isBlinkit ? 'text-slate-900/80' : 'text-white/80'} select-none truncate`}>{marketplace.name} Settlement Receipt</p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={handleCopyLedger} title="Copy CA Ledger" className={`${isBlinkit ? 'bg-slate-900/20 hover:bg-slate-900/40' : 'bg-white/20 hover:bg-white/30'} p-1.5 rounded-md transition-all active:scale-95 no-print`}>
              <Copy className={`w-3.5 h-3.5 ${isBlinkit ? 'text-slate-900' : 'text-white'}`} />
            </button>
            <button onClick={handleDownload} title="Download Receipt" className={`${isBlinkit ? 'bg-slate-900/20 hover:bg-slate-900/40' : 'bg-white/20 hover:bg-white/30'} p-1.5 rounded-md transition-all active:scale-95 no-print`}>
              <Download className={`w-3.5 h-3.5 ${isBlinkit ? 'text-slate-900' : 'text-white'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-2.5 max-h-[600px] lg:max-h-none overflow-y-auto ca-scroll-thin">
        <LedgerRow label="Taxable Selling Value" value={result.taxableValue} />
        <LedgerRow label="Product GST Remittance" value={result.productGst} sub="Payable to Govt" tone="amber" />
        <Divider />
        <LedgerRow label={`Commission (${state.commissionRate}%)`} value={result.commissionAmount} />
        <LedgerRow label="Fixed Closing Fee" value={state.closingFee} />
        <LedgerRow label="Pick & Pack / Shipping" value={result.shippingFee} />
        <LedgerRow label="GST Input on Mkt Fees (18%)" value={result.gstOnMarketplaceFees} tone="blue" />
        <LedgerRow label="TCS/TDS (1% u/s 194-O)" value={result.tcsTds} tone="purple" tooltip="Tax Collected at Source: 1% deducted by e-commerce operators under Indian tax law." />
        <LedgerRow label="RTO Return Cost" value={result.effectiveReturnCost} sub={`${state.returnRate}% of shipping`} tone="rose" />
        <Divider />
        <LedgerRow label="Total Deductions" value={result.totalDeductions + result.effectiveReturnCost} bold />
        <LedgerRow label="Net Settlement Payout" value={result.netSettlement} bold tone="emerald" />

        <div className={`mt-4 rounded-xl p-4 border-2 transition-all ${isProfit ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 dark:from-emerald-950/40 dark:to-green-950/40 dark:border-emerald-800' : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200 dark:from-red-950/40 dark:to-rose-950/40 dark:border-red-800'}`}>
          <div className="flex items-center gap-2 mb-2">
            {isProfit ? <TrendingUp className="w-5 h-5 text-emerald-500" strokeWidth={2.5} /> : <TrendingDown className="w-5 h-5 text-red-500" strokeWidth={2.5} />}
            <span className="text-sm font-bold text-slate-700 dark:text-zinc-50 select-none">Final Net Profit</span>
          </div>
          <p className={`text-3xl font-bold tracking-tight ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{formatINR(result.netProfit)}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isProfit ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'}`}>{isProfit ? 'PROFITABLE' : 'LOSS'}</span>
            <span className="text-xs text-slate-400 dark:text-zinc-300">Margin: {result.netProfitMargin.toFixed(2)}%</span>
          </div>
        </div>

        {/* MONTHLY SCALE SIMULATOR */}
        <div className="mt-3 bg-white dark:bg-zinc-950 rounded-xl p-3 border-2 border-violet-200 dark:border-violet-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center flex-shrink-0"><BarChart3 className="w-3 h-3 text-violet-600 dark:text-violet-400" /></div>
            <span className="text-xs font-bold text-slate-700 dark:text-zinc-50 select-none">Monthly Scale Simulator</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <input type="number" value={ordersPerMonth || ''} onChange={(e) => setOrdersPerMonth(parseInt(e.target.value) || 0)} placeholder="100"
              className="flex-1 min-w-0 text-sm font-semibold text-slate-900 dark:text-zinc-50 bg-slate-50 dark:bg-zinc-900 rounded-lg border-2 border-slate-200 dark:border-zinc-700 px-2 py-1.5 focus:outline-none focus:border-violet-500 transition-colors" />
            <span className="text-xs text-slate-500 dark:text-zinc-400 flex-shrink-0 select-none">orders/mo</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {[50, 250, 1000, 5000].map(n => (
              <button key={n} onClick={() => setOrdersPerMonth(n)}
                className={`px-2 py-1 rounded text-[10px] font-semibold transition-all active:scale-95 ${ordersPerMonth === n ? 'bg-violet-600 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200'}`}>
                {n >= 1000 ? `${n/1000}K` : n}
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs gap-2">
              <span className="text-slate-500 dark:text-zinc-400 select-none min-w-0 truncate">Monthly Net Profit</span>
              <span title={formatINR(monthlyProfit)} className={`font-bold flex-shrink-0 ${monthlyProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{formatCompactINR(monthlyProfit)}</span>
            </div>
            <div className="flex items-center justify-between text-xs gap-2">
              <span className="text-slate-500 dark:text-zinc-400 select-none min-w-0 truncate">Monthly COGS Capital</span>
              <span title={formatINR(monthlyCogs)} className="font-bold text-slate-700 dark:text-zinc-300 flex-shrink-0">{formatCompactINR(monthlyCogs)}</span>
            </div>
            <div className="flex items-center justify-between text-xs gap-2">
              <span className="text-slate-500 dark:text-zinc-400 select-none min-w-0 truncate">ROII (Return on Inventory)</span>
              <span className={`font-bold flex-shrink-0 ${roii >= 0 ? 'text-violet-600 dark:text-violet-400' : 'text-red-600 dark:text-red-400'}`}>{roii.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-zinc-900/90 rounded-xl p-3 border border-slate-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-1"><AlertCircle className="w-4 h-4 text-amber-500" /><span className="text-xs font-semibold text-slate-600 dark:text-zinc-300 select-none">Break-Even Selling Price</span></div>
          <p className="text-lg font-bold text-slate-900 dark:text-zinc-50">{formatINR(result.breakEvenPrice)}</p>
          <p className="text-xs text-slate-400 dark:text-zinc-300 select-none">Minimum price to avoid losses</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/40 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-2 mb-2"><Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /><span className="text-xs font-semibold text-slate-700 dark:text-zinc-50 select-none">Target Profit Solver</span></div>
          <div className="flex items-center gap-2 mb-2">
            <input type="number" value={targetProfit || ''} onChange={(e) => setTargetProfit(parseFloat(e.target.value) || 0)} placeholder="Desired profit"
              className="flex-1 min-w-0 text-sm font-semibold text-slate-900 dark:text-zinc-50 bg-white dark:bg-zinc-900/90 rounded-lg border-2 border-emerald-200 dark:border-zinc-700/80 px-2 py-1.5 focus:outline-none focus:border-emerald-500 transition-colors" />
            <span className="text-xs text-slate-500 dark:text-zinc-300">₹</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 dark:text-zinc-300 select-none">Recommended Price</p>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 truncate">{formatINR(recommendedPrice)}</p>
            </div>
            <button onClick={() => onUpdateSellingPrice(recommendedPrice)} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-500 transition-colors active:scale-95 flex-shrink-0">Apply</button>
          </div>
        </div>

        <div className="flex gap-2 mt-2">
          <button onClick={handleShareSummary} className="no-print flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md hover:from-emerald-600 hover:to-teal-700 hover:shadow-lg transition-all active:scale-95 min-w-0">
            <Share2 className="w-4 h-4 flex-shrink-0" /><span className="truncate">Share</span>
          </button>
          <button onClick={onPrint} className="no-print flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-bold bg-zinc-950 dark:bg-zinc-950 text-white shadow-md hover:bg-zinc-900 dark:hover:bg-zinc-800 hover:shadow-lg transition-all active:scale-95 min-w-0">
            <Printer className="w-4 h-4 flex-shrink-0" /><span className="truncate">Print</span>
          </button>
        </div>

        {(shareSuccess || copySuccess) && (
          <div className="fixed bottom-24 lg:bottom-6 right-6 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-bounce z-50 max-w-[calc(100vw-3rem)]">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-sm">{copySuccess ? 'Ledger Copied!' : 'Summary Copied!'}</p>
              <p className="text-xs opacity-90">Ready to share with your CA</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ==================== LEDGER ROW / INFO TOOLTIP / DIVIDER ==================== */
interface LedgerRowProps { label: string; value: number; sub?: string; bold?: boolean; tone?: 'amber'|'blue'|'purple'|'rose'|'emerald'; tooltip?: string; }

function LedgerRow({ label, value, sub, bold, tone, tooltip }: LedgerRowProps) {
  const toneClass = tone === 'amber' ? 'text-amber-600' : tone === 'blue' ? 'text-blue-600' : tone === 'purple' ? 'text-violet-600' : tone === 'rose' ? 'text-rose-600' : tone === 'emerald' ? 'text-emerald-600' : 'text-slate-700 dark:text-zinc-50';
  return (
    <div className="flex items-start justify-between gap-2 min-w-0">
      <div className="min-w-0">
        <p className={`text-xs ${bold ? 'font-bold text-slate-700 dark:text-zinc-50' : 'text-slate-500 dark:text-zinc-300'} flex items-center gap-1 select-none`}>
          {label}{tooltip && <InfoTooltip text={tooltip} />}
        </p>
        {sub && <p className="text-[10px] text-slate-400 dark:text-zinc-300 select-none">{sub}</p>}
      </div>
      <p className={`text-sm ${bold ? 'font-bold' : 'font-semibold'} ${toneClass} whitespace-nowrap flex-shrink-0`}>{formatINR(value)}</p>
    </div>
  );
}

function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button type="button" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }} className="text-slate-400 dark:text-zinc-300 hover:text-emerald-500 transition-colors">
        <Info className="w-3.5 h-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 left-1/2 -translate-x-1/2 top-full mt-1.5 w-56 bg-zinc-950 text-white text-xs font-medium leading-relaxed rounded-lg px-3 py-2 shadow-xl pointer-events-none">
            {text}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-zinc-950 rotate-45" />
          </div>
        </>
      )}
    </span>
  );
}

function Divider() { return <div className="border-t border-slate-100 dark:border-zinc-800 my-1" />; }

/* ==================== MOBILE STICKY ==================== */
function MobileStickySummary({ result, marketplace, onPrint }: { state: CalcState; result: CalcResult; marketplace: MarketplacePreset; onPrint: () => void }) {
  const isProfit = result.netProfit >= 0;
  const Icon = marketplace.icon;
  return (
    <div className="no-print lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg border-t-2 border-slate-200 dark:border-zinc-800 shadow-2xl">
      <div className="px-3 py-2.5 flex items-center gap-3 max-w-full min-w-0">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${marketplace.gradient} flex items-center justify-center flex-shrink-0 shadow-md`}>
          <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-tight select-none truncate">Net Profit · {marketplace.name}</p>
          <div className="flex items-baseline gap-2 min-w-0">
            <p className={`text-lg font-bold tabular-nums truncate ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{formatINR(result.netProfit)}</p>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${isProfit ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'}`}>{result.netProfitMargin.toFixed(1)}%</span>
          </div>
        </div>
        <button onClick={onPrint} className="px-3 py-2 rounded-lg text-xs font-bold bg-zinc-950 dark:bg-zinc-800 text-white shadow-md active:scale-95 transition-all flex items-center gap-1.5 flex-shrink-0">
          <Printer className="w-3.5 h-3.5" /><span className="hidden xs:inline">Print</span>
        </button>
      </div>
    </div>
  );
}

/* ==================== CROSS PLATFORM (fixed) ==================== */
interface CrossPlatformComparisonProps {
  sellingPrice: number; cogs: number; shippingWeight: number; zone: ZoneId;
  productGstRate: number; returnRate: number; category: CategoryId; currentMarketplace: MarketplaceId;
  currentNetProfit: number; currentNetProfitMargin: number;
  onMarketplaceSelect: (id: MarketplaceId) => void;
}

function CrossPlatformComparison({ sellingPrice, cogs, shippingWeight, zone, productGstRate, returnRate, category, currentMarketplace, currentNetProfit, currentNetProfitMargin, onMarketplaceSelect }: CrossPlatformComparisonProps) {
  const { result: comparisonResult } = useRemoteCalc<{ comparisons: Array<{ marketplaceId: string; netProfit: number; netProfitMargin: number }> }>(
    '/api/calculate/cross-platform',
    { sellingPrice, cogs, shippingWeight, zone, productGstRate, returnRate, category },
    { comparisons: [] },
  );

  const sortedComparisons = useMemo(() => comparisonResult.comparisons.map((comp) => ({
    ...comp,
    marketplace: MARKETPLACES.find((mp) => mp.id === comp.marketplaceId as MarketplaceId)!,
  })).sort((a, b) => b.netProfit - a.netProfit), [comparisonResult.comparisons]);

  const accentRingColor: Record<string, string> = { amber:'ring-amber-500', blue:'ring-blue-500', fuchsia:'ring-fuchsia-500', rose:'ring-rose-500', yellow:'ring-yellow-500', purple:'ring-violet-500', orange:'ring-orange-500', red:'ring-red-500' };
  const accentBadgeColor: Record<string, { bg: string; text: string }> = {
    amber:{ bg:'bg-amber-100 dark:bg-amber-900/40', text:'text-amber-700 dark:text-amber-400' },
    blue:{ bg:'bg-blue-100 dark:bg-blue-900/40', text:'text-blue-700 dark:text-blue-400' },
    fuchsia:{ bg:'bg-fuchsia-100 dark:bg-fuchsia-900/40', text:'text-fuchsia-700 dark:text-fuchsia-400' },
    rose:{ bg:'bg-rose-100 dark:bg-rose-900/40', text:'text-rose-700 dark:text-rose-400' },
    yellow:{ bg:'bg-yellow-100 dark:bg-yellow-900/40', text:'text-yellow-700 dark:text-yellow-400' },
    purple:{ bg:'bg-violet-100 dark:bg-violet-900/40', text:'text-violet-700 dark:text-violet-400' },
    orange:{ bg:'bg-orange-100 dark:bg-orange-900/40', text:'text-orange-700 dark:text-orange-400' },
    red:{ bg:'bg-red-100 dark:bg-red-900/40', text:'text-red-700 dark:text-red-400' },
  };

  return (
    <div className="no-print bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden w-full max-w-full min-w-0">
      <div className="p-5 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20 flex-shrink-0"><TrendingUp className="w-5 h-5 text-white" /></div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-50 select-none">Cross-Platform Profit Comparison</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-300 select-none">Which marketplace pays best for your product?</p>
          </div>
        </div>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {sortedComparisons.map((item, index) => {
            const isBest = index === 0;
            const isCurrent = item.marketplace.id === currentMarketplace;
            const ringColor = accentRingColor[item.marketplace.accent] || 'ring-zinc-500';
            const badgeColor = accentBadgeColor[item.marketplace.accent] || { bg:'bg-zinc-100 dark:bg-zinc-800', text:'text-zinc-700 dark:text-zinc-300' };
            // Sync active with ledger
            const displayNetProfit = isCurrent ? currentNetProfit : item.netProfit;
            const displayMargin = isCurrent ? currentNetProfitMargin : item.netProfitMargin;

            return (
              <button key={item.marketplace.id} onClick={() => onMarketplaceSelect(item.marketplace.id)}
                className={`relative p-4 rounded-xl transition-all duration-200 text-left cursor-pointer hover:-translate-y-0.5 hover:shadow-md min-w-0 ${
                  isBest
                    ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-2 border-emerald-500 shadow-md ring-1 ring-emerald-500/20'
                    : isCurrent
                    ? `bg-slate-50 dark:bg-zinc-900/90 border-2 border-slate-200 dark:border-zinc-700 ring-2 ring-inset ${ringColor}`
                    : 'bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600'
                }`}>
                {isBest && <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">Best Margin</div>}
                {isCurrent && !isBest && <div className={`absolute top-2 right-2 ${badgeColor.bg} ${badgeColor.text} text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1`}>Active</div>}
                <div className="flex items-center gap-2 mb-2 min-w-0 pr-16">
                  <MarketplaceLogo id={item.marketplace.id} size="md" />
                  <span className={`text-sm font-bold truncate ${isBest ? 'text-emerald-800 dark:text-emerald-100' : 'text-slate-700 dark:text-zinc-50'}`}>{item.marketplace.name}</span>
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className={`text-xs select-none ${isBest ? 'text-emerald-900/80 dark:text-emerald-100/80 font-semibold' : 'text-slate-500 dark:text-zinc-300'}`}>Net Profit</span>
                    <span className={`text-sm font-bold tabular-nums truncate ${displayNetProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{formatINR(displayNetProfit)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className={`text-xs select-none ${isBest ? 'text-emerald-900/80 dark:text-emerald-100/80 font-semibold' : 'text-slate-500 dark:text-zinc-300'}`}>Margin</span>
                    <span className={`text-xs font-semibold tabular-nums truncate ${displayMargin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{displayMargin.toFixed(1)}%</span>
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

/* ==================== NUMBER INPUT ==================== */
interface NumberInputProps { label: string; hint: string; icon: React.ElementType; prefix?: string; suffix?: string; value: number; onChange: (v: number) => void; compact?: boolean; tooltip?: string; }

function NumberInput({ label, hint, icon: Icon, prefix, suffix, value, onChange, compact, tooltip }: NumberInputProps) {
  const [inputValue, setInputValue] = useState<string>(value.toString());
  useEffect(() => { setInputValue(value.toString()); }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (newValue === '' || newValue === '-') return;
    const parsed = parseFloat(newValue);
    if (!isNaN(parsed)) onChange(parsed);
  };
  const handleBlur = () => {
    if (inputValue === '' || inputValue === '-') { setInputValue('0'); onChange(0); }
    else { const parsed = parseFloat(inputValue); if (!isNaN(parsed)) { setInputValue(parsed.toString()); onChange(parsed); } }
  };

  return (
    <div className={`bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 ${compact ? 'p-4' : 'p-5'} transition-all hover:border-slate-300 dark:hover:border-zinc-700 min-w-0`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-slate-500 dark:text-zinc-300 flex-shrink-0" />
        <div className="min-w-0">
          <label className="text-sm font-semibold text-slate-700 dark:text-zinc-50 block leading-tight select-none">{label}</label>
          {tooltip && <InfoTooltip text={tooltip} />}
          <p className="text-xs text-slate-400 dark:text-zinc-300 select-none truncate">{hint}</p>
        </div>
      </div>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-300 font-semibold pointer-events-none">{prefix}</span>}
        <input type="number" inputMode="decimal" value={inputValue} onChange={handleChange} onBlur={handleBlur} placeholder="0"
          className={`w-full font-semibold text-slate-900 dark:text-zinc-50 bg-slate-50 dark:bg-zinc-900/90 rounded-xl border-2 border-slate-200 dark:border-zinc-700/80 transition-all focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-900/90 ${prefix ? 'pl-8' : 'pl-3'} ${suffix ? 'pr-8' : 'pr-3'} ${compact ? 'py-2 text-sm' : 'py-3 text-lg'}`} />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-300 font-semibold pointer-events-none">{suffix}</span>}
      </div>
    </div>
  );
}

/* ==================== FEE MATRIX ==================== */
function FeeMatrixTable() {
  const tableData = [
    { marketplace:'Amazon', commission:'5-15%', closingFee:'₹15-20', shipping:'₹35-70', gst:'18% on fees', notes:'Category-tiered commission + FBA storage' },
    { marketplace:'Flipkart', commission:'4-16%', closingFee:'₹15-18', shipping:'₹35-70', gst:'18% on fees', notes:'Plus & Smart fulfillment tiers' },
    { marketplace:'Meesho', commission:'0%', closingFee:'₹0', shipping:'₹30-60', gst:'18% on shipping', notes:'Zero commission, seller pays shipping' },
    { marketplace:'Myntra', commission:'8-18%', closingFee:'₹20-25', shipping:'₹40-80', gst:'18% on fees', notes:'Fashion-focused, high returns' },
    { marketplace:'Blinkit', commission:'15-22%', closingFee:'₹8-10', shipping:'₹25-40', gst:'18% on fees', notes:'Quick commerce, dark store model' },
    { marketplace:'Zepto', commission:'18-25%', closingFee:'₹8-10', shipping:'₹25-40', gst:'18% on fees', notes:'10-min delivery, premium fees' },
    { marketplace:'Instamart', commission:'16-23%', closingFee:'₹8-10', shipping:'₹25-40', gst:'18% on fees', notes:'Swiggy quick commerce network' },
    { marketplace:'Snapdeal', commission:'0-12%', closingFee:'₹10-15', shipping:'₹30-60', gst:'18% on fees', notes:'Value-focused tiers' },
  ];
  return (
    <div className="no-print bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden w-full max-w-full min-w-0">
      <div className="p-5 border-b border-slate-200 dark:border-zinc-800">
        <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50 select-none">2026 Marketplace Fee Matrix</h3>
        <p className="text-sm text-slate-500 dark:text-zinc-300 mt-1 select-none">Amazon vs Flipkart vs Meesho vs Quick Commerce — all commission rates at a glance</p>
      </div>
      <div className="overflow-x-auto max-w-full ca-scroll-thin">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-zinc-950/50 border-b border-slate-200 dark:border-zinc-800">
              <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-zinc-300 select-none">Marketplace</th>
              <th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-zinc-300 select-none">Commission</th>
              <th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-zinc-300 select-none">Closing Fee</th>
              <th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-zinc-300 select-none">Shipping</th>
              <th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-zinc-300 select-none">GST on Fees</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-zinc-300 select-none">Notes</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, i) => (
              <tr key={row.marketplace} className={`border-b border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors ${i % 2 === 1 ? 'bg-slate-50/50 dark:bg-zinc-900/30' : ''}`}>
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

/* ==================== FAQ ==================== */
const FAQS = [
  { q:'How is GST calculated on marketplace seller fees in India?', a:'Marketplace commission, closing fees, and shipping fees charged by platforms like Amazon, Flipkart, and Meesho are taxable services. The marketplace charges 18% GST on the total of these fees. As a seller, you can claim this as Input Tax Credit (ITC) in your GSTR-2B, effectively recovering the GST paid on marketplace fees — provided you are a registered GST taxpayer and the fees are for business use.' },
  { q:'What is Section 194-O TCS deduction for e-commerce operators?', a:'Under Section 194-O of the Income Tax Act, e-commerce operators (Amazon, Flipkart, Meesho, etc.) are required to deduct 1% TCS (Tax Collected at Source) on the gross sales amount of every transaction before remitting the payout to the seller. This 1% is not an additional tax — it can be claimed as a credit against your total income tax liability when filing your annual ITR. The TCS amount appears in your Form 26AS and AIS, and the marketplace provides a TCS certificate (Form 16O) annually.' },
  { q:'How do customer returns (RTO) affect net profit on Meesho and Flipkart?', a:'RTO (Return to Origin) impacts profit in three ways: (1) You lose the forward shipping cost since the product was shipped but not delivered, (2) Return shipping fees may apply (especially on Flipkart), and (3) The product may arrive damaged, reducing resale value. On Meesho, where commission is 0%, RTO is the single biggest profit killer since the entire shipping cost is borne by the seller. A 15% RTO rate on a ₹60 shipping fee means an effective cost of ₹9 per order across your total volume. Our calculator factors this in automatically using the Return/RTO rate slider.' },
];

function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="no-print bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden w-full max-w-full min-w-0">
      <div className="p-5 border-b border-slate-200 dark:border-zinc-800">
        <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50 select-none">Frequently Asked Questions</h3>
        <p className="text-sm text-slate-500 dark:text-zinc-300 mt-1 select-none">Everything Indian e-commerce sellers need to know about fees, GST, and profitability</p>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-zinc-800">
        {FAQS.map((faq, i) => {
          const isOpen = open === i;
          return (
            <div key={i}>
              <button onClick={() => setOpen(isOpen ? null : i)} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                <span className="text-sm font-semibold text-slate-700 dark:text-zinc-50 select-none">{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-slate-400 dark:text-zinc-300 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && <div className="px-5 pb-4"><p className="text-sm text-slate-500 dark:text-zinc-300 leading-relaxed">{faq.a}</p></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ==================== PRINT LEDGER ==================== */
interface PrintTaxLedgerProps { marketplace: MarketplacePreset; state: CalcState; result: CalcResult; marketplaceId?: string; }

function PrintTaxLedger({ marketplace, state, result, marketplaceId }: PrintTaxLedgerProps) {
  const isBlinkit = marketplaceId === 'blinkit';
  const isProfit = result.netProfit >= 0;
  const Icon = marketplace.icon;
  const today = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6 border-b-2 border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${marketplace.gradient} flex items-center justify-center`}><Icon className={`w-5 h-5 ${isBlinkit ? 'text-slate-900' : 'text-white'}`} /></div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 select-none">SellerMath — CA Tax Ledger</h1>
            <p className="text-xs text-slate-500 select-none">{marketplace.name} Settlement Breakdown</p>
          </div>
        </div>
        <p className="text-xs text-slate-500">{today}</p>
      </div>
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div><p className="text-xs font-bold text-slate-400 uppercase mb-1">Marketplace</p><p className="text-sm font-semibold text-slate-800">{marketplace.name}</p></div>
        <div><p className="text-xs font-bold text-slate-400 uppercase mb-1">Category</p><p className="text-sm font-semibold text-slate-800">{CATEGORIES.find((c) => c.id === state.category)?.label}</p></div>
      </div>
      <table className="w-full text-sm mb-4">
        <thead><tr className="bg-slate-100"><th className="text-left px-3 py-2 font-semibold text-slate-700">Line Item</th><th className="text-right px-3 py-2 font-semibold text-slate-700">Amount (₹)</th></tr></thead>
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
          <tr className="border-t-2 border-slate-300"><td className="px-3 py-2 font-bold text-slate-900">Total Deductions</td><td className="text-right px-3 py-2 font-bold text-slate-900">{formatINR(result.totalDeductions + result.effectiveReturnCost)}</td></tr>
          <tr><td className="px-3 py-2 font-bold text-emerald-700">Net Settlement Payout</td><td className="text-right px-3 py-2 font-bold text-emerald-700">{formatINR(result.netSettlement)}</td></tr>
          <tr><td className="px-3 py-2 font-semibold text-slate-600">Cost of Goods</td><td className="text-right px-3 py-2 font-semibold text-slate-600">{formatINR(state.cogs)}</td></tr>
          <tr className="border-t-2 border-slate-800 bg-slate-900 text-white">
            <td className="px-3 py-3 font-bold text-white">{isProfit ? 'NET PROFIT' : 'NET LOSS'}</td>
            <td className={`text-right px-3 py-3 font-bold text-xl ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>{formatINR(result.netProfit)}</td>
          </tr>
        </tbody>
      </table>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200"><p className="text-xs text-slate-400 mb-1">Net Profit Margin</p><p className="text-lg font-bold text-slate-900">{result.netProfitMargin.toFixed(2)}%</p></div>
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200"><p className="text-xs text-slate-400 mb-1">Break-Even Selling Price</p><p className="text-lg font-bold text-slate-900">{formatINR(result.breakEvenPrice)}</p></div>
      </div>
      <p className="text-xs text-slate-400 mt-6 border-t border-slate-200 pt-4">Generated by SellerMath — India's Most Accurate E-Commerce Profit Engine. This breakdown is for estimation purposes only and should be verified with your marketplace settlement reports.</p>
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