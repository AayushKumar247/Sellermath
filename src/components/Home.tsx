import { useState, useEffect, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { PageId } from '@/components/Sidebar';
import {
  Calculator,
  Sparkles,
  PenTool,
  Image as ImageIcon,
  FileText,
  FileSpreadsheet,
  Zap,
  Shield,
  DollarSign,
  TrendingDown,
  BarChart3,
  Rocket,
  Target,
  Globe,
  Truck,
  Search,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Package,
  Star,
  Users,
  Wallet,
  Layers,
  Gauge,
  GraduationCap,
  Lightbulb,
  Clock,
  BadgeCheck,
  Trash2,
  Send,
  MessageSquare,
  X,
} from 'lucide-react';

/* ============================================================
   TYPES
============================================================ */
type ToolStatus = 'active' | 'coming-soon' | 'new';

interface Tool {
  icon: ReactNode;
  iconBg: string;
  title: string;
  description: string;
  tools: string[];
  status?: ToolStatus;
  onClick?: () => void;
}

interface ToolCategory {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  items: Tool[];
}

interface HomeProps {
  onNavigate: (page: PageId) => void;
}

interface Review {
  id: string;
  name: string;
  rating: number;
  marketplace: string;
  favoriteTool: string;
  text: string;
  createdAt: number;
}

/* ============================================================
   HELPERS / DATA
============================================================ */
const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

interface Marketplace {
  id: string;
  name: string;
  commission: number;
  closing: number;
  shipping: number;
  accent: string;
  dot: string;
}

const MARKETPLACES: Marketplace[] = [
  { id: 'amazon', name: 'Amazon', commission: 0.15, closing: 25, shipping: 65, accent: 'text-orange-500', dot: 'bg-orange-500' },
  { id: 'flipkart', name: 'Flipkart', commission: 0.16, closing: 20, shipping: 60, accent: 'text-blue-500', dot: 'bg-blue-500' },
  { id: 'meesho', name: 'Meesho', commission: 0.05, closing: 0, shipping: 70, accent: 'text-pink-500', dot: 'bg-pink-500' },
  { id: 'myntra', name: 'Myntra', commission: 0.22, closing: 30, shipping: 80, accent: 'text-red-500', dot: 'bg-red-500' },
  { id: 'blinkit', name: 'Blinkit', commission: 0.18, closing: 15, shipping: 55, accent: 'text-yellow-500', dot: 'bg-yellow-500' },
];

function estimate(price: number, mp: Marketplace) {
  const commission = price * mp.commission;
  const feesBeforeGst = commission + mp.closing + mp.shipping;
  const gst = feesBeforeGst * 0.18;
  const totalFees = feesBeforeGst + gst;
  const payout = price - totalFees;
  return { commission, gst, totalFees, payout };
}

const FEE_ALERTS = [
  { mp: 'Amazon', text: 'Electronics referral fee updated to 17% — effective Nov 2026', tone: 'amber' },
  { mp: 'Flipkart', text: 'Shipping fee revised for tier-2 & tier-3 cities from Dec 2026', tone: 'blue' },
  { mp: 'Meesho', text: 'New GST-compliant settlement format — re-verify your invoices', tone: 'pink' },
  { mp: 'Myntra', text: 'Closing fee for apparel increased by ₹5 per order', tone: 'red' },
];

/* ============================================================
   TOOL LIBRARY
============================================================ */
const TOOL_GROUPS: ToolCategory[] = [
  {
    id: 'calculators',
    label: 'Calculators',
    title: 'Profit Calculators',
    subtitle: 'Know your exact margin before you spend a rupee on ads or inventory.',
    items: [
      {
        icon: <Calculator className="w-5 h-5" />,
        iconBg: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400',
        title: 'Product Profit Calculator',
        description: 'Exact margins across Amazon, Flipkart, Meesho, Myntra & Blinkit with category commissions and GST slabs.',
        tools: ['Commission', 'Shipping', 'GST', 'Break-even'],
        onClick: () => {},
      },
      {
        icon: <DollarSign className="w-5 h-5" />,
        iconBg: 'bg-blue-500/10 border border-blue-500/20 text-blue-500 dark:text-blue-400',
        title: 'ROAS & Break-Even Calculator',
        description: 'Find the exact ad spend that keeps you profitable and stop flying blind on campaigns.',
        tools: ['ROAS', 'Break-even', 'Ad spend', 'Pricing'],
        onClick: () => {},
      },
      {
        icon: <Truck className="w-5 h-5" />,
        iconBg: 'bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400',
        title: 'Shipping & RTO Calculator',
        description: 'Factor real shipping cost and return-to-origin rates into your landed cost per order.',
        tools: ['Shipping fee', 'RTO analysis', 'Landed cost', 'Return rate'],
        onClick: () => {},
      },
    ],
  },
  {
    id: 'ai-studio',
    label: 'AI Studio',
    title: 'AI Studio',
    subtitle: 'Automate listings and SEO so you rank higher and convert more.',
    items: [
      {
        icon: <PenTool className="w-5 h-5" />,
        iconBg: 'bg-purple-500/10 border border-purple-500/20 text-purple-500 dark:text-purple-400',
        title: 'AI Product Listing Writer',
        description: 'SEO-optimized titles, descriptions and bullets for Amazon, Flipkart & Meesho.',
        tools: ['AI titles', 'SEO descriptions', 'Bullets', 'Multi-marketplace'],
        onClick: () => {},
      },
      {
        icon: <Sparkles className="w-5 h-5" />,
        iconBg: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400',
        title: 'SEO Keyword Generator',
        description: 'High-performing keywords researched by AI for your niche.',
        tools: ['Keyword research', 'SEO optimization', 'Search ranking'],
        onClick: () => {},
      },
      {
        icon: <Rocket className="w-5 h-5" />,
        iconBg: 'bg-zinc-500/10 border border-zinc-500/20 text-zinc-500 dark:text-zinc-400',
        title: 'Listing Optimizer',
        description: 'Improve visibility and conversion on existing listings.',
        tools: ['Listing optimization', 'Conversion rate', 'Visibility'],
        onClick: () => {},
      },
    ],
  },
  {
    id: 'product-studio',
    label: 'Product Studio',
    title: 'Product Studio',
    subtitle: 'Generate marketplace-ready visuals without a design team.',
    items: [
      {
        icon: <ImageIcon className="w-5 h-5" />,
        iconBg: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400',
        title: 'Product Image Resizer',
        description: 'Resize and optimize images for every marketplace automatically.',
        tools: ['Image resizing', 'Optimization', 'Multi-platform'],
        onClick: () => {},
      },
      {
        icon: <ImageIcon className="w-5 h-5" />,
        iconBg: 'bg-zinc-500/10 border border-zinc-500/20 text-zinc-500 dark:text-zinc-400',
        title: 'AI Background Remover',
        description: 'Studio-quality background removal for product images.',
        tools: ['Background removal', 'Studio visuals', 'Product photography'],
        status: 'coming-soon',
      },
      {
        icon: <Sparkles className="w-5 h-5" />,
        iconBg: 'bg-zinc-500/10 border border-zinc-500/20 text-zinc-500 dark:text-zinc-400',
        title: 'White BG & Lifestyle Generator',
        description: 'Clean white backgrounds and lifestyle shots for any product.',
        tools: ['White background', 'Lifestyle images', 'Product photos'],
        status: 'coming-soon',
      },
    ],
  },
  {
    id: 'csv',
    label: 'CSV Intelligence',
    title: 'CSV Intelligence',
    subtitle: 'Upload bulk SKUs and get multi-channel profit analysis in seconds.',
    items: [
      {
        icon: <FileSpreadsheet className="w-5 h-5" />,
        iconBg: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400',
        title: 'Bulk CSV Profit Calculator',
        description: 'Upload hundreds of SKUs and get profit analysis across channels instantly.',
        tools: ['Bulk SKU upload', 'Multi-channel', 'CSV export', 'Summary'],
        status: 'new',
        onClick: () => {},
      },
      {
        icon: <FileText className="w-5 h-5" />,
        iconBg: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400',
        title: 'Settlement Reconciliation',
        description: 'Reconcile marketplace settlements with your orders automatically.',
        tools: ['Settlement match', 'Order reconciliation', 'Payments'],
        status: 'new',
        onClick: () => {},
      },
      {
        icon: <Truck className="w-5 h-5" />,
        iconBg: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400',
        title: 'Returns & RTO Analytics',
        description: 'Spot return patterns and RTO rates across marketplaces.',
        tools: ['Return analysis', 'RTO tracking', 'Category insights', 'Bulk CSV'],
        onClick: () => {},
      },
    ],
  },
  {
    id: 'gst',
    label: 'GST Invoice',
    title: 'GST Invoicing',
    subtitle: 'Create compliant B2B/B2C tax invoices in seconds.',
    items: [
      {
        icon: <FileText className="w-5 h-5" />,
        iconBg: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400',
        title: 'GST Invoice Generator',
        description: 'Compliant invoices with auto tax calc, HSN codes and 2026 GST slabs.',
        tools: ['B2B/B2C', '2026 GST slabs', 'HSN codes', 'Auto tax calc'],
        onClick: () => {},
      },
    ],
  },
  {
    id: 'learn',
    label: 'Learn',
    title: 'Learn & Grow',
    subtitle: 'Guides and strategies to scale profitably on every marketplace.',
    items: [
      {
        icon: <BarChart3 className="w-5 h-5" />,
        iconBg: 'bg-zinc-500/10 border border-zinc-500/20 text-zinc-500 dark:text-zinc-400',
        title: 'E-Commerce Guides',
        description: 'Deep dives on profit optimization, marketplace fees and GST compliance.',
        tools: ['Profit guides', 'Strategies', 'Fee updates', 'Seller tips'],
        status: 'coming-soon',
      },
      {
        icon: <Rocket className="w-5 h-5" />,
        iconBg: 'bg-zinc-500/10 border border-zinc-500/20 text-zinc-500 dark:text-zinc-400',
        title: 'Marketplace Selling Guides',
        description: 'Platform-specific playbooks for Amazon, Flipkart, Meesho & more.',
        tools: ['Platform strategy', 'Best practices', 'Growth tactics'],
        status: 'coming-soon',
      },
      {
        icon: <GraduationCap className="w-5 h-5" />,
        iconBg: 'bg-zinc-500/10 border border-zinc-500/20 text-zinc-500 dark:text-zinc-400',
        title: 'Seller Tutorials',
        description: 'Step-by-step tutorials for every SellerMath tool.',
        tools: ['Tool tutorials', 'Video guides', 'Tips & tricks'],
        status: 'coming-soon',
      },
    ],
  },
];

const PAIN_POINTS: { icon: React.ElementType; problem: string; detail: string; solution: string; page: PageId }[] = [
  {
    icon: TrendingDown,
    problem: 'My margins vanish after fees',
    detail: 'You price at 30% but commission + GST + shipping quietly eats it all.',
    solution: 'Product Profit Calculator',
    page: 'calculator',
  },
  {
    icon: Target,
    problem: "I don't know my break-even ad spend",
    detail: 'Running ads blind and hoping ROAS magically works out.',
    solution: 'ROAS & Break-Even Calculator',
    page: 'roas',
  },
  {
    icon: Package,
    problem: 'Returns are killing my profit',
    detail: 'RTO rates silently eat 10–15% of revenue every month.',
    solution: 'Returns & RTO Analytics',
    page: 'rto-analytics',
  },
  {
    icon: FileText,
    problem: 'Listings & invoicing take hours',
    detail: 'Copy-pasting SKUs and making GST invoices by hand, every single time.',
    solution: 'AI Listing Writer + GST Invoice',
    page: 'listing-writer',
  },
];

const LEAK_CHECKS = [
  { label: "I don't factor RTO / returns into my pricing", leak: 8 },
  { label: 'I guess shipping fees instead of calculating exact', leak: 6 },
  { label: 'I forget GST charged on platform fees', leak: 5 },
  { label: "I haven't rechecked commissions since last year", leak: 7 },
];

/* ============================================================
   REVIEW SYSTEM CONSTANTS
============================================================ */
const REVIEWS_KEY = 'sellermath_user_reviews_v1';
const MARKETPLACE_OPTIONS = [
  'Amazon India',
  'Flipkart',
  'Meesho',
  'Myntra',
  'Quick Commerce',
  'D2C Brand',
];
const FAVORITE_TOOL_OPTIONS = [
  'Product Profit Calculator',
  'Returns & RTO Analytics',
  'Product Image Resizer',
  'AI Listing Optimizer',
  'GST Invoice Generator',
  'Shipping & RTO Calculator',
];
const MAX_REVIEW_LEN = 500;

/* ============================================================
   SMALL COMPONENTS
============================================================ */

function MoneyInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block select-none">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <div className="relative mt-1.5">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-medium">
          ₹
        </span>
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition"
        />
      </div>
    </label>
  );
}

/* ============================================================
   FEE ALERT BAR
============================================================ */
function FeeAlertBar({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % FEE_ALERTS.length), 4200);
    return () => clearInterval(id);
  }, []);

  const a = FEE_ALERTS[i];
  const tone: Record<string, string> = {
    amber: 'text-amber-500',
    blue: 'text-blue-500',
    pink: 'text-pink-500',
    red: 'text-red-500',
  };

  return (
    <button
      onClick={() => onNavigate('calculator')}
      className="group w-full flex items-center gap-2.5 px-3 py-2 sm:px-3.5 sm:py-2 rounded-lg dark:bg-zinc-900/70 bg-white/80 dark:border-zinc-800/80 border-zinc-200/80 text-left transition hover:border-emerald-500/40 select-none"
    >
      <span className="flex items-center gap-1.5 shrink-0">
        <AlertTriangle className={`w-3.5 h-3.5 ${tone[a.tone] ?? 'text-amber-500'}`} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Fee update
        </span>
      </span>
      <span className="flex-1 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 truncate">
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{a.mp}:</span> {a.text}
      </span>
      <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-emerald-500 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition">
        View impact <ArrowRight className="w-3 h-3" />
      </span>
    </button>
  );
}

/* ============================================================
   QUICK PROFIT CALCULATOR — unchanged logic, wider on mobile
============================================================ */
function QuickProfitCalculator({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const [price, setPrice] = useState(999);
  const [cost, setCost] = useState(400);
  const [mpId, setMpId] = useState('amazon');

  const mp = MARKETPLACES.find((m) => m.id === mpId) ?? MARKETPLACES[0];

  const r = useMemo(() => {
    const base = estimate(price, mp);
    const profit = base.payout - cost;
    const margin = price > 0 ? (profit / price) * 100 : 0;
    const denom = Math.max(price, cost + base.totalFees, 1);
    return {
      ...base,
      profit,
      margin,
      costPct: (cost / denom) * 100,
      feePct: (base.totalFees / denom) * 100,
      profitPct: (Math.abs(profit) / denom) * 100,
    };
  }, [price, cost, mp]);

  const profitable = r.profit >= 0;

  return (
    // FIX: p-3.5 on mobile instead of p-5, so the card gets more horizontal room
    <div className="relative rounded-2xl dark:bg-zinc-900/80 bg-white/90 dark:border-zinc-800/80 border-zinc-200/80 shadow-2xl shadow-emerald-500/5 p-3.5 sm:p-5 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Calculator className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 select-none">Quick Profit Check</h3>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 select-none">
              Live · no signup
            </p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider text-emerald-500 dark:text-emerald-400 select-none">
          Live
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {MARKETPLACES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMpId(m.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition border select-none ${
              mpId === m.id
                ? 'dark:bg-zinc-800 bg-zinc-900 text-white dark:border-zinc-700 border-zinc-900'
                : 'dark:bg-zinc-950 bg-white text-zinc-600 dark:text-zinc-400 dark:border-zinc-800 border-zinc-200 hover:border-zinc-400'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
            {m.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <MoneyInput label="Selling price" value={price} onChange={setPrice} />
        <MoneyInput label="Product cost" value={cost} onChange={setCost} />
      </div>

      <div
        className={`rounded-xl p-3.5 sm:p-4 mb-3 border ${
          profitable ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'
        }`}
      >
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400 select-none">
              Net profit / order
            </p>
            <p className={`text-2xl font-extrabold leading-tight ${profitable ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500'}`}>
              {fmt(r.profit)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400 select-none">
              Margin
            </p>
            <p className={`text-lg font-bold ${profitable ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500'}`}>
              {r.margin.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="mt-3 h-2.5 w-full rounded-full overflow-hidden flex bg-zinc-200 dark:bg-zinc-800">
          <div className="bg-blue-500/70" style={{ width: `${r.costPct}%` }} />
          <div className="bg-amber-500/70" style={{ width: `${r.feePct}%` }} />
          <div className={profitable ? 'bg-emerald-500' : 'bg-red-500'} style={{ width: `${r.profitPct}%` }} />
        </div>
        <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-500 dark:text-zinc-400 select-none">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500/70" />Cost</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500/70" />Fees</span>
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${profitable ? 'bg-emerald-500' : 'bg-red-500'}`} />
            {profitable ? 'Profit' : 'Loss'}
          </span>
        </div>
      </div>

      <div className="space-y-1.5 text-xs mb-4">
        {[
          ['Commission', r.commission],
          ['Closing fee', mp.closing],
          ['Shipping', mp.shipping],
          ['GST on fees', r.gst],
        ].map(([label, val]) => (
          <div key={label as string} className="flex items-center justify-between select-none">
            <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-200">{fmt(val as number)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between pt-1.5 border-t dark:border-zinc-800 border-zinc-200 select-none">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">Net payout</span>
          <span className="font-bold text-zinc-900 dark:text-zinc-100">{fmt(r.payout)}</span>
        </div>
      </div>

      <button
        onClick={() => onNavigate('calculator')}
        className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition flex items-center justify-center gap-2 select-none"
      >
        Full breakdown & category fees
        <ArrowRight className="w-4 h-4" />
      </button>
      <p className="text-center text-[10px] text-zinc-400 dark:text-zinc-500 mt-2 select-none">
        Estimates use typical fees. Exact rates vary by category & weight.
      </p>
    </div>
  );
}

/* ============================================================
   HERO — transparent on mobile (no tinted box), full-width on all screens
============================================================ */
function Hero({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  return (
    <section className="relative overflow-hidden rounded-3xl p-0 sm:p-6 md:px-10 md:py-12 bg-transparent sm:bg-zinc-50/80 sm:dark:bg-zinc-900/60 border-0 sm:border sm:border-zinc-200/80 sm:dark:border-zinc-800/80">
      {/* Decorative glows — hidden on mobile since the tinted box is gone there */}
      <div className="hidden sm:block absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
      <div className="hidden sm:block absolute top-[-20%] left-[-10%] w-[45%] h-[45%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="hidden sm:block absolute bottom-[-20%] right-[-10%] w-[45%] h-[45%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 grid lg:grid-cols-[1.15fr_1fr] gap-6 sm:gap-8 lg:gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 text-xs font-medium mb-5 select-none">
            <Zap className="w-3.5 h-3.5" />
            Fee data updated: Nov 2026
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] text-zinc-900 dark:text-white mb-4 select-none">
            Know your real profit
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-400">
              before you sell.
            </span>
          </h1>

          <p className="text-base md:text-lg text-zinc-500 dark:text-zinc-400 max-w-xl leading-relaxed select-none mb-6">
            The profit engine for Indian sellers. Calculate exact margins, catch fee leaks, and scale
            across Amazon, Flipkart, Meesho, Myntra & Blinkit — with AI precision.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => onNavigate('calculator')}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-2 select-none"
            >
              <Rocket className="w-5 h-5" /> Launch Calculator
            </button>
            <button
              onClick={() => onNavigate('settlement-reconciliation')}
              className="px-6 py-3 dark:bg-zinc-900 hover:dark:bg-zinc-800 bg-white hover:bg-zinc-100 dark:border-zinc-700 border-zinc-200 dark:text-zinc-100 text-zinc-900 rounded-xl font-semibold shadow-lg transition-all flex items-center justify-center gap-2 select-none"
            >
              <FileText className="w-5 h-5" /> Settlement Reconciliation
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-6 text-xs text-zinc-500 dark:text-zinc-400 select-none">
            <span className="flex items-center gap-1.5">
              <BadgeCheck className="w-4 h-4 text-emerald-500" /> No signup to calculate
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-500" /> 2026 fee & GST compliant
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-500" /> Built for Indian Marketplace Sellers • 100% Free & No Signup
            </span>
          </div>
        </div>

        {/* FIX: w-full, no max-w constraint on mobile/tablet, fills the grid cell on desktop */}
        <div className="w-full lg:ml-auto">
          <QuickProfitCalculator onNavigate={onNavigate} />
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   STATS BAR — honest + full width
============================================================ */
function StatsBar() {
  const stats = [
    {
      icon: Globe,
      value: '8',
      label: 'Marketplaces',
      detail: 'Amazon, Flipkart, Meesho, Myntra, Blinkit, Zepto, Instamart & Snapdeal',
    },
    {
      icon: Layers,
      value: '11+',
      label: 'Live Seller Tools',
      detail: 'Profit, ROAS, RTO, CSV, AI & GST Suite',
    },
    {
      icon: Shield,
      value: '100%',
      label: 'Client-Side Privacy',
      detail: 'Zero data leaks • Your SKU data stays on your device',
    },
    {
      icon: Wallet,
      value: '₹0',
      label: 'Free Forever',
      detail: 'No paywalls, no watermarks, no signup required',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
      {stats.map((s, idx) => (
        <div
          key={idx}
          className="rounded-xl dark:bg-zinc-900/60 bg-white/80 dark:border-zinc-800/80 border-zinc-200/80 p-3.5 sm:p-4 flex items-start gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <s.icon className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-zinc-50 leading-tight select-none">
              {s.value}{' '}
              <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{s.label}</span>
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug mt-0.5 select-none">
              {s.detail}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   PAIN POINTS
============================================================ */
function PainPoints({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  return (
    <section className="space-y-5 sm:space-y-6">
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 text-xs font-medium mb-3 select-none">
          <Lightbulb className="w-3.5 h-3.5" /> Sound familiar?
        </div>
        <h2 className="text-2xl md:text-4xl font-bold dark:text-zinc-50 text-zinc-900 mb-2 select-none">
          The hidden leaks every seller faces
        </h2>
        <p className="dark:text-zinc-400 text-zinc-600 select-none text-sm sm:text-base">
          We built SellerMath around the exact problems that quietly drain Indian sellers' margins.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
        {PAIN_POINTS.map((p, i) => (
          <div
            key={i}
            className="group rounded-2xl dark:bg-zinc-900/60 bg-white/80 dark:border-zinc-800/80 border-zinc-200/80 p-4 sm:p-5 transition hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <p.icon className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm md:text-base mb-1 select-none">
                  "{p.problem}"
                </h3>
                <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3 select-none">
                  {p.detail}
                </p>
                <div className="flex items-center justify-between pt-3 border-t dark:border-zinc-800/60 border-zinc-200/60">
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 select-none">
                    Fix with <span className="font-semibold text-emerald-500 dark:text-emerald-400">{p.solution}</span>
                  </span>
                  <button
                    onClick={() => onNavigate(p.page)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500 dark:text-emerald-400 hover:gap-2 transition-all select-none"
                  >
                    Open <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   TOOL CARD — tighter mobile padding
============================================================ */
function ToolCard({ icon, iconBg, title, description, tools, status, onClick }: Tool) {
  const [hovered, setHovered] = useState(false);
  const isDisabled = status === 'coming-soon';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick && !isDisabled ? onClick : undefined}
      className={`group relative dark:bg-zinc-900/80 bg-white/80 dark:border-zinc-800/80 border-zinc-200/80 rounded-2xl p-4 sm:p-5 transition-all duration-300 ${
        hovered ? 'border-emerald-500/50 shadow-2xl shadow-emerald-500/15 -translate-y-1' : ''
      } ${isDisabled ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer dark:hover:bg-zinc-900/90 hover:bg-zinc-100'}`}
    >
      <div className="absolute top-4 right-4 flex gap-2">
        {status === 'coming-soon' && (
          <span className="px-2 py-0.5 rounded-full dark:bg-zinc-800 bg-zinc-200 dark:border-zinc-700/60 border-zinc-300/60 dark:text-zinc-400 text-zinc-600 text-[10px] font-semibold tracking-wider uppercase select-none">
            Soon
          </span>
        )}
        {status === 'new' && (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold tracking-wider uppercase animate-pulse shadow-lg shadow-emerald-500/30 select-none">
            NEW
          </span>
        )}
      </div>

      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mb-3 transition-all duration-300 group-hover:scale-110 ${iconBg}`}>
        {icon}
      </div>

      <h3 className="text-base font-bold dark:text-zinc-100 text-zinc-900 mb-1.5 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors select-none">
        {title}
      </h3>
      <p className="dark:text-zinc-400 text-zinc-600 text-xs leading-relaxed mb-3 select-none">{description}</p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {tools.slice(0, 3).map((tool, i) => (
          <span
            key={i}
            className="px-2 py-0.5 rounded-md dark:bg-zinc-800/60 bg-zinc-100 dark:border-zinc-800 border-zinc-200 text-[10px] font-medium dark:text-zinc-400 text-zinc-600 uppercase tracking-wider select-none"
          >
            {tool}
          </span>
        ))}
        {tools.length > 3 && (
          <span className="px-2 py-0.5 rounded-md dark:bg-zinc-800/60 bg-zinc-100 dark:text-zinc-500 text-zinc-500 text-[10px] font-medium select-none">
            +{tools.length - 3}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t dark:border-zinc-800/50 border-zinc-200/50">
        <span className={isDisabled ? 'text-zinc-500 text-xs select-none' : 'text-emerald-500 dark:text-emerald-400 text-xs font-semibold select-none'}>
          {isDisabled ? 'Coming soon' : 'Open tool'}
        </span>
        {!isDisabled && (
          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${hovered ? 'bg-emerald-500' : 'dark:bg-zinc-800 bg-zinc-900'} text-white`}>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {isDisabled && (
        <div className="absolute inset-0 dark:bg-zinc-900/40 bg-zinc-900/20 rounded-2xl backdrop-blur-[2px] pointer-events-none" />
      )}
    </div>
  );
}

/* ============================================================
   TOOL EXPLORER
============================================================ */
function mapToolPage(title: string): PageId {
  const map: Record<string, PageId> = {
    'Product Profit Calculator': 'calculator',
    'ROAS & Break-Even Calculator': 'roas',
    'Shipping & RTO Calculator': 'shipping',
    'Product Image Resizer': 'image-resizer',
    'AI Product Listing Writer': 'listing-writer',
    'SEO Keyword Generator': 'seo-keywords',
    'Listing Optimizer': 'listing-optimizer',
    'Bulk CSV Profit Calculator': 'bulk-csv',
    'Settlement Reconciliation': 'settlement-reconciliation',
    'Returns & RTO Analytics': 'rto-analytics',
    'GST Invoice Generator': 'gst-invoice',
  };
  return map[title] ?? 'calculator';
}

function ToolExplorer({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState('all');

  const visibleGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOOL_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((it) => {
        const matchCat = activeCat === 'all' || activeCat === g.id;
        const matchQ =
          !q ||
          it.title.toLowerCase().includes(q) ||
          it.description.toLowerCase().includes(q) ||
          it.tools.some((t) => t.toLowerCase().includes(q));
        return matchCat && matchQ;
      }),
    })).filter((g) => g.items.length > 0);
  }, [query, activeCat]);

  const totalVisible = visibleGroups.reduce((n, g) => n + g.items.length, 0);

  return (
    <section className="space-y-5 w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold dark:text-zinc-50 text-zinc-900 tracking-tight select-none">
            Every tool you need to scale
          </h2>
          <p className="dark:text-zinc-400 text-zinc-600 text-sm mt-1 max-w-md select-none">
            One platform, every marketplace. Search or filter to jump straight to what you need.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools (e.g. GST, RTO, ROAS)"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCat('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition border select-none ${
            activeCat === 'all'
              ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
              : 'dark:bg-zinc-900 bg-white dark:text-zinc-300 text-zinc-700 dark:border-zinc-800 border-zinc-200 hover:border-emerald-500/40'
          }`}
        >
          All tools
        </button>
        {TOOL_GROUPS.map((g) => (
          <button
            key={g.id}
            onClick={() => setActiveCat(g.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition border select-none ${
              activeCat === g.id
                ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
                : 'dark:bg-zinc-900 bg-white dark:text-zinc-300 text-zinc-700 dark:border-zinc-800 border-zinc-200 hover:border-emerald-500/40'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {totalVisible === 0 ? (
        <div className="rounded-2xl border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-900/40 bg-white/60 p-10 text-center">
          <Search className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 select-none">No tools match "{query}"</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 select-none">Try "GST", "RTO", "listing" or clear the filter.</p>
        </div>
      ) : (
        <div className="space-y-8 sm:space-y-10">
          {visibleGroups.map((g) => (
            <div key={g.id} className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 select-none">{g.title}</h3>
                <span className="px-2 py-0.5 rounded-full dark:bg-zinc-800 bg-zinc-100 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 select-none">
                  {g.items.length}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 -mt-3 max-w-2xl select-none">{g.subtitle}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {g.items.map((item) => (
                  <ToolCard
                    key={item.title}
                    {...item}
                    onClick={item.onClick ? () => onNavigate(mapToolPage(item.title)) : undefined}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ============================================================
   MARKETPLACE COMPARISON — 360px safe, wider on mobile
============================================================ */
function MarketplaceComparison({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const samplePrice = 999;
  return (
    <section className="rounded-2xl dark:bg-zinc-900/60 bg-white/80 dark:border-zinc-800/80 border-zinc-200/80 overflow-hidden w-full">
      <div className="p-4 sm:p-5 md:p-6 border-b dark:border-zinc-800/60 border-zinc-200/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-50 select-none">
              Same product, wildly different payout
            </h2>
            <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mt-1 select-none">
              Estimated net payout on a {fmt(samplePrice)} sale — before your product cost.
            </p>
          </div>
          <button
            onClick={() => onNavigate('calculator')}
            className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition select-none"
          >
            Calculate yours <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <th className="px-4 sm:px-5 py-3 font-semibold select-none">Marketplace</th>
              <th className="px-3 py-3 font-semibold select-none">Commission</th>
              <th className="px-3 py-3 font-semibold select-none">Closing</th>
              <th className="px-3 py-3 font-semibold select-none">Shipping</th>
              <th className="px-4 sm:px-5 py-3 font-semibold text-right select-none">Net payout</th>
            </tr>
          </thead>
          <tbody>
            {MARKETPLACES.map((m) => {
              const e = estimate(samplePrice, m);
              return (
                <tr
                  key={m.id}
                  className="border-t dark:border-zinc-800/60 border-zinc-200/60 hover:dark:bg-zinc-800/30 hover:bg-zinc-50 transition"
                >
                  <td className="px-4 sm:px-5 py-3">
                    <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100">
                      <span className={`w-2 h-2 rounded-full ${m.dot}`} />
                      {m.name}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-zinc-600 dark:text-zinc-400">{Math.round(m.commission * 100)}%</td>
                  <td className="px-3 py-3 text-zinc-600 dark:text-zinc-400">{fmt(m.closing)}</td>
                  <td className="px-3 py-3 text-zinc-600 dark:text-zinc-400">{fmt(m.shipping)}</td>
                  <td className="px-4 sm:px-5 py-3 text-right font-bold text-emerald-500 dark:text-emerald-400">
                    {fmt(e.payout)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="px-4 sm:px-5 py-3 text-[10px] text-zinc-400 dark:text-zinc-500 border-t dark:border-zinc-800/60 border-zinc-200/60 select-none">
        Illustrative figures. Real fees vary by category, weight and seller tier.
      </p>
    </section>
  );
}

/* ============================================================
   PROFIT LEAK CHECK — 2-column diagnostic, wide on all screens
============================================================ */
function ProfitLeakCheck({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const [checked, setChecked] = useState<boolean[]>(LEAK_CHECKS.map(() => false));
  const totalLeak = LEAK_CHECKS.reduce((sum, c, i) => (checked[i] ? sum + c.leak : sum), 0);
  const gaugePct = Math.min(totalLeak * 3, 100);

  return (
    <section className="rounded-2xl dark:bg-zinc-900/60 bg-white/80 dark:border-zinc-800/80 border-zinc-200/80 p-4 sm:p-6 md:p-7 w-full">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <Gauge className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-50 select-none">Profit Leak Check</h2>
      </div>
      <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mb-5 max-w-2xl select-none">
        Tick what applies to you — we'll estimate how much margin you may be leaving on the table.
      </p>

      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-4 sm:gap-5 lg:gap-6 items-start">
        {/* Left: checkboxes */}
        <div className="space-y-2">
          {LEAK_CHECKS.map((c, i) => (
            <label
              key={i}
              className={`flex items-center gap-3 p-3 md:p-3.5 rounded-xl border cursor-pointer transition select-none ${
                checked[i]
                  ? 'border-red-500/40 bg-red-500/5'
                  : 'dark:border-zinc-800 border-zinc-200 hover:border-emerald-500/40'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                  checked[i] ? 'bg-red-500 border-red-500' : 'dark:border-zinc-700 border-zinc-300'
                }`}
              >
                {checked[i] && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </div>
              <span className="flex-1 text-xs md:text-sm text-zinc-700 dark:text-zinc-300">{c.label}</span>
              <span className="text-[10px] font-bold text-red-500">-{c.leak}%</span>
              <input
                type="checkbox"
                className="hidden"
                checked={checked[i]}
                onChange={() => setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)))}
              />
            </label>
          ))}
        </div>

        {/* Right: gauge + CTA */}
        <div className="rounded-xl p-4 sm:p-5 dark:bg-zinc-950 bg-zinc-50 border dark:border-zinc-800 border-zinc-200 lg:sticky lg:top-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 select-none">
            Estimated margin leak
          </p>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-4xl font-extrabold text-red-500 leading-none select-none">{totalLeak}%</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 pb-1 select-none">
              {totalLeak === 0 ? 'No leaks detected 🎉' : totalLeak >= 20 ? 'High — fix urgently' : 'Fixable'}
            </span>
          </div>
          <div className="h-3 w-full rounded-full dark:bg-zinc-800 bg-zinc-200 overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-500"
              style={{ width: `${gaugePct}%` }}
            />
          </div>
          <button
            onClick={() => onNavigate('calculator')}
            className="w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition flex items-center justify-center gap-2 select-none"
          >
            Plug my leaks now <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2 text-center select-none">
            Not financial advice — rough per-order margin impact estimate.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   COMMUNITY REVIEWS — real, persistent, interactive
============================================================ */
function loadReviews(): Review[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(REVIEWS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is Review =>
        r &&
        typeof r.id === 'string' &&
        typeof r.name === 'string' &&
        typeof r.rating === 'number' &&
        typeof r.text === 'string',
    );
  } catch {
    return [];
  }
}

function StarSelector({
  value,
  onChange,
  size = 'md',
}: {
  value: number;
  onChange: (v: number) => void;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  const sizeCls = size === 'lg' ? 'w-8 h-8' : size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Star rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className="p-0.5 focus:outline-none focus:ring-0 transition-transform hover:scale-110"
        >
          <Star
            className={`${sizeCls} ${
              n <= display ? 'text-amber-400 fill-current' : 'text-zinc-300 dark:text-zinc-600'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const sizeCls = size === 'md' ? 'w-5 h-5' : 'w-3.5 h-3.5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${sizeCls} ${n <= Math.round(rating) ? 'text-amber-400 fill-current' : 'text-zinc-300 dark:text-zinc-600'}`}
        />
      ))}
    </div>
  );
}

function CommunityReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [rating, setRating] = useState(0);
  const [name, setName] = useState('');
  const [marketplace, setMarketplace] = useState(MARKETPLACE_OPTIONS[0]);
  const [favoriteTool, setFavoriteTool] = useState(FAVORITE_TOOL_OPTIONS[0]);
  const [text, setText] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setReviews(loadReviews());
  }, []);

  const persist = useCallback((next: Review[]) => {
    setReviews(next);
    try {
      window.localStorage.setItem(REVIEWS_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable — reviews still live in memory */
    }
    fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviews: next }),
    }).catch(() => {});
  }, []);

  const avg = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const resetForm = () => {
    setRating(0);
    setName('');
    setMarketplace(MARKETPLACE_OPTIONS[0]);
    setFavoriteTool(FAVORITE_TOOL_OPTIONS[0]);
    setText('');
    setErrors([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: string[] = [];
    if (rating < 1) errs.push('Please select a star rating.');
    if (!name.trim()) errs.push('Please add your name.');
    if (text.trim().length < 10) errs.push('Review must be at least 10 characters.');
    if (text.length > MAX_REVIEW_LEN) errs.push(`Review must be under ${MAX_REVIEW_LEN} characters.`);
    if (errs.length) {
      setErrors(errs);
      return;
    }
    const review: Review = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim().slice(0, 60),
      rating,
      marketplace,
      favoriteTool,
      text: text.trim(),
      createdAt: Date.now(),
    };
    persist([review, ...reviews]);
    resetForm();
    setShowForm(false);
    setToast('Review posted — thank you!');
  };

  const handleDelete = (id: string) => {
    persist(reviews.filter((r) => r.id !== id));
    setToast('Review removed.');
  };

  return (
    <section className="space-y-5 w-full">
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 text-xs font-medium mb-3 select-none">
          <MessageSquare className="w-3.5 h-3.5" /> Community
        </div>
        <h2 className="text-2xl md:text-3xl font-bold dark:text-zinc-50 text-zinc-900 select-none">
          Seller Community Reviews
        </h2>
        <p className="dark:text-zinc-400 text-zinc-600 text-sm mt-1 select-none">
          Real feedback from sellers testing SellerMath — leave your honest review below.
        </p>
      </div>

      <div className="rounded-2xl dark:bg-zinc-900/60 bg-white/80 dark:border-zinc-800/80 border-zinc-200/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-baseline gap-1 select-none">
              <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
                {reviews.length ? avg.toFixed(1) : '—'}
              </span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">/ 5.0</span>
            </div>
            <div className="mt-1">
              <StarDisplay rating={reviews.length ? avg : 0} size="md" />
            </div>
          </div>
          <div className="border-l dark:border-zinc-800 border-zinc-200 pl-4 select-none">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {reviews.length === 0
                ? 'Be the first to rate'
                : `${reviews.length} review${reviews.length === 1 ? '' : 's'}`}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition select-none"
        >
          {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><PenTool className="w-4 h-4" /> Write a Review</>}
        </button>
      </div>

      {toast && (
        <div className="rounded-lg px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-medium select-none">
          {toast}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl dark:bg-zinc-900/60 bg-white/80 dark:border-zinc-800/80 border-zinc-200/80 p-4 sm:p-5 space-y-4"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 select-none">
              Your rating
            </p>
            <StarSelector value={rating} onChange={setRating} size="lg" />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block select-none">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Your Name
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                placeholder="e.g. Aayush or Verified Seller"
                className="mt-1.5 w-full px-3 py-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition"
              />
            </label>

            <label className="block select-none">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Primary Marketplace
              </span>
              <select
                value={marketplace}
                onChange={(e) => setMarketplace(e.target.value)}
                className="mt-1.5 w-full px-3 py-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition"
              >
                {MARKETPLACE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </label>
          </div>

          <label className="block select-none">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Favorite Tool
            </span>
            <select
              value={favoriteTool}
              onChange={(e) => setFavoriteTool(e.target.value)}
              className="mt-1.5 w-full px-3 py-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition"
            >
              {FAVORITE_TOOL_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>

          <label className="block select-none">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Your Review / Feature Request
            </span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_REVIEW_LEN))}
              rows={4}
              placeholder="What worked for you? What should we build next?"
              className="mt-1.5 w-full px-3 py-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition resize-y"
            />
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{text.length}/{MAX_REVIEW_LEN}</span>
          </label>

          {errors.length > 0 && (
            <div className="rounded-lg px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs space-y-0.5 select-none">
              {errors.map((err, i) => <p key={i}>• {err}</p>)}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { resetForm(); setShowForm(false); }}
              className="px-4 py-2.5 rounded-lg dark:bg-zinc-900 bg-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition select-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition inline-flex items-center gap-2 select-none"
            >
              <Send className="w-4 h-4" /> Post Review
            </button>
          </div>
        </form>
      )}

      {reviews.length === 0 ? (
        <div className="rounded-2xl dark:bg-zinc-900/40 bg-white/60 dark:border-zinc-800/80 border-zinc-200/80 p-8 text-center">
          <MessageSquare className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 select-none">
            No reviews yet — be the first!
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 mb-4 select-none">
            Your honest feedback helps other Indian sellers discover SellerMath.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition select-none"
          >
            <PenTool className="w-4 h-4" /> Write the first review
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl dark:bg-zinc-900/60 bg-white/80 dark:border-zinc-800/80 border-zinc-200/80 p-3.5 sm:p-4 flex flex-col"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[11px] font-bold text-emerald-500 dark:text-emerald-400 shrink-0 select-none">
                      {r.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate select-none">{r.name}</p>
                  </div>
                  <div className="mt-1.5">
                    <StarDisplay rating={r.rating} />
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(r.id)}
                  aria-label="Delete your review"
                  className="p-1.5 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition shrink-0"
                  title="Delete your review"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed flex-1 line-clamp-6">
                "{r.text}"
              </p>

              <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t dark:border-zinc-800/60 border-zinc-200/60">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 select-none">
                  {r.marketplace}
                </span>
                <span className="px-2 py-0.5 rounded-md dark:bg-zinc-800 bg-zinc-100 text-[10px] font-medium text-zinc-600 dark:text-zinc-400 select-none">
                  {r.favoriteTool}
                </span>
                <span className="ml-auto text-[10px] text-zinc-400 dark:text-zinc-500 select-none">
                  {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ============================================================
   FINAL CTA
============================================================ */
function FinalCTA({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  return (
    <section className="relative overflow-hidden rounded-2xl dark:bg-zinc-900/60 bg-zinc-50/80 dark:border-zinc-800/80 border-zinc-200/80 p-5 sm:p-8 md:p-12 text-center w-full">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 text-xs font-medium mb-5 select-none">
          <Clock className="w-3.5 h-3.5" /> Set up in under 2 minutes
        </div>
        <h2 className="text-2xl md:text-4xl font-bold dark:text-zinc-50 text-zinc-900 mb-3 select-none">
          Stop guessing. Start knowing.
        </h2>
        <p className="dark:text-zinc-400 text-zinc-600 mb-7 max-w-lg mx-auto select-none text-sm sm:text-base">
          Calculate exact margins, automate GST invoices, and scale across every Indian marketplace with SellerMath.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('calculator')}
            className="w-full sm:w-auto px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-semibold text-base transition-all shadow-lg shadow-emerald-500/25 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 select-none"
          >
            <Rocket className="w-5 h-5" /> Start Calculating Free
          </button>
          <button
            onClick={() => onNavigate('bulk-csv')}
            className="w-full sm:w-auto px-8 py-3.5 dark:bg-zinc-900 hover:dark:bg-zinc-800 bg-white hover:bg-zinc-100 dark:border-zinc-700 border-zinc-200 dark:text-zinc-100 text-zinc-900 rounded-xl font-semibold text-base transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 select-none"
          >
            <FileSpreadsheet className="w-5 h-5" /> Try Bulk CSV
          </button>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   HOME — wide SaaS container, single-layer padding, compact top
============================================================ */
export default function Home({ onNavigate }: HomeProps) {
  return (
    <div className="w-full max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 overflow-x-hidden box-border">
      <FeeAlertBar onNavigate={onNavigate} />
      <Hero onNavigate={onNavigate} />
      <StatsBar />
      <PainPoints onNavigate={onNavigate} />
      <ToolExplorer onNavigate={onNavigate} />
      <MarketplaceComparison onNavigate={onNavigate} />
      <ProfitLeakCheck onNavigate={onNavigate} />
      <CommunityReviews />
      <FinalCTA onNavigate={onNavigate} />
    </div>
  );
}