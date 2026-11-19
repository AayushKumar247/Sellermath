import { useCallback, useMemo, useState, useEffect } from 'react';
import type { PageId } from '@/components/Sidebar';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Clock,
  FileText,
  Image,
  Lightbulb,
  Package,
  RotateCcw,
  Search,
  ShieldAlert,
  TrendingUp,
  Truck,
  Wallet,
  Rocket,
  BarChart3,
} from 'lucide-react';

const STORAGE_KEY = 'sellermath_ecom_guides_progress';
const CHECKLIST_KEY = 'sellermath_ecom_guides_checklists';
const TOTAL_GUIDES = 8;

type Category =
  | 'All Guides'
  | 'Unit Economics'
  | 'GST & Compliance'
  | 'RTO & Logistics'
  | 'Ads & Growth'
  | 'Catalog & Ops';

const CATEGORIES: Category[] = [
  'All Guides',
  'Unit Economics',
  'GST & Compliance',
  'RTO & Logistics',
  'Ads & Growth',
  'Catalog & Ops',
];

const CAT_BADGE: Record<Category, string> = {
  'All Guides':
    'border-zinc-200/80 bg-white text-zinc-700 dark:border-zinc-800/80 dark:bg-zinc-900 dark:text-zinc-300',
  'Unit Economics':
    'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-400',
  'GST & Compliance':
    'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:border-rose-500/30 dark:text-rose-400',
  'RTO & Logistics':
    'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:border-amber-500/30 dark:text-amber-400',
  'Ads & Growth':
    'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:border-blue-500/30 dark:text-blue-400',
  'Catalog & Ops':
    'border-purple-500/20 bg-purple-500/10 text-purple-700 dark:border-purple-500/30 dark:text-purple-400',
};

interface BreakdownRow {
  label: string;
  amount: string;
  highlight?: boolean;
  negative?: boolean;
}

interface Guide {
  id: string;
  title: string;
  category: Category;
  readTime: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  formulaLabel: string;
  formula: string;
  breakdown: BreakdownRow[];
  checklist: string[];
  toolPage: PageId;
  toolLabel: string;
  toolAction: string;
}

const GUIDES: Guide[] = [
  {
    id: 'unit-economics-pricing',
    title: 'True Unit Economics & Pricing Formula',
    category: 'Unit Economics',
    readTime: '7 min',
    description:
      'Price a ₹599–₹1,499 SKU factoring COGS, packaging, referral + closing fees, 18% GST on fees, and RTO burn before you lose money on every sale.',
    icon: Wallet,
    iconBg: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    formulaLabel: 'Golden Rule — Net Margin per Order',
    formula:
      'Net Margin = Selling Price − (Referral + Closing + Shipping) − 18% GST on Fees − 1% TCS − COGS − Packaging − Avg. RTO Burn',
    breakdown: [
      { label: 'Selling Price (₹999 SKU)', amount: '₹999' },
      { label: 'Referral Fee (12%)', amount: '−₹120', negative: true },
      { label: 'Closing Fee', amount: '−₹30', negative: true },
      { label: 'Shipping Fee', amount: '−₹60', negative: true },
      { label: 'GST on Fees (18%)', amount: '−₹38', negative: true },
      { label: 'TCS u/s 194-O (1%)', amount: '−₹10', negative: true },
      { label: 'Net Bank Settlement', amount: '₹741', highlight: true },
      { label: 'COGS + Packaging', amount: '−₹345', negative: true },
      { label: 'Avg. RTO Burn', amount: '−₹15', negative: true },
      { label: 'Final Margin', amount: '₹381 (38.1%)', highlight: true },
    ],
    checklist: [
      'Land COGS below 35% of selling price',
      'Cap combined marketplace fees at 22–25%',
      'Price every SKU at least 2× COGS after fees',
      'Track RTO % per pin-code weekly',
      'Re-price whenever slab or commission changes',
    ],
    toolPage: 'calculator',
    toolLabel: 'Universal Calculator',
    toolAction: 'Price this SKU',
  },
  {
    id: 'gst-itc-194o',
    title: 'Indian E-Commerce GST, ITC & Sec 194-O Playbook',
    category: 'GST & Compliance',
    readTime: '8 min',
    description:
      '1% TCS under Sec 194-O, 0.1% TDS, GSTR-1 vs. GSTR-2B matching, and claiming 100% Input Tax Credit on marketplace fee invoices.',
    icon: FileText,
    iconBg: 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400',
    formulaLabel: 'Golden Rule — GST Cash Outflow',
    formula:
      'Net GST Payable = Output GST on Sales − ITC on Marketplace Fee Invoices. TCS 1% (Sec 194-O) is deducted at source and credited to your GST portal.',
    breakdown: [
      { label: 'Gross Sales', amount: '₹1,200' },
      { label: 'TCS u/s 194-O (1%)', amount: '−₹12', negative: true },
      { label: 'Marketplace Commission (15%)', amount: '−₹180', negative: true },
      { label: 'Closing Fee', amount: '−₹25', negative: true },
      { label: 'GST on Marketplace Fees (18%)', amount: '−₹37', negative: true },
      { label: 'Net Bank Settlement', amount: '₹946', highlight: true },
      { label: 'ITC Claimable on Fee Invoices', amount: '+₹37' },
      { label: 'Effective Settlement', amount: '₹983', highlight: true },
    ],
    checklist: [
      'Register GSTIN before listing on any marketplace',
      'Match GSTR-1 sales with GSTR-2B ITC monthly',
      'Download fee invoices from Seller Central / Flipkart Hub',
      'Claim 100% ITC on marketplace commission & closing fees',
      'File GSTR-3B by the 20th to avoid late fees',
    ],
    toolPage: 'gst-invoice',
    toolLabel: 'GST Invoice',
    toolAction: 'Generate GST Invoice',
  },


  {
    id: 'rto-reduction',
    title: 'The RTO Reduction Playbook (25% → <10%)',
    category: 'RTO & Logistics',
    readTime: '6 min',
    description:
      'NDR call/WhatsApp verification, COD-to-Prepaid nudges, size-chart optimization, and high-RTO pin-code filtering.',
    icon: Truck,
    iconBg: 'bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400',
    formulaLabel: 'Golden Rule — RTO Cost per Order',
    formula:
      'RTO Cost = Forward Shipping + Reverse Shipping + Packaging + Blocked Capital − Recovery. Cutting RTO from 25% to 10% adds roughly ₹40–₹60 margin per order.',
    breakdown: [
      { label: 'Selling Price (COD order)', amount: '₹799' },
      { label: 'Forward Shipping', amount: '−₹65', negative: true },
      { label: 'Reverse Shipping (RTO)', amount: '−₹65', negative: true },
      { label: 'Packaging', amount: '−₹25', negative: true },
      { label: 'COGS', amount: '−₹240', negative: true },
      { label: 'Net Settlement (Delivered)', amount: '₹404', highlight: true },
      { label: 'Margin Saved by Cutting RTO', amount: '+₹55', highlight: true },
    ],
    checklist: [
      'Enable NDR call + WhatsApp verification within 4 hours',
      'Nudge COD buyers to prepaid with a small discount',
      'Add size charts & fit videos to apparel listings',
      'Block or cap shipping to high-RTO pin-codes',
      'Review the RTO report weekly and act on the top 5 pin-codes',
    ],
    toolPage: 'shipping',
    toolLabel: 'Shipping Calculator',
    toolAction: 'Compare Shipping Slabs',
  },
  {
    id: 'volumetric-weight',
    title: 'Volumetric vs. Dead Weight Mastery (L×B×H ÷ 5000)',
    category: 'RTO & Logistics',
    readTime: '5 min',
    description:
      'How 2 cm of extra box air jumps shipping slabs from 500 g to 1 kg and costs ₹28–₹45 extra per order.',
    icon: Package,
    iconBg: 'bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400',
    formulaLabel: 'Golden Rule — Volumetric Weight',
    formula:
      'Volumetric Weight (kg) = Length × Breadth × Height (cm) ÷ 5000. You are billed on the higher of Actual Weight vs Volumetric Weight.',
    breakdown: [
      { label: 'Actual Weight', amount: '0.5 kg (500 g slab)' },
      { label: 'Volumetric Weight (20×15×10 ÷ 5000)', amount: '0.6 kg → 1 kg slab' },
      { label: 'Shipping at 500 g slab', amount: '₹65' },
      { label: 'Shipping at 1 kg slab', amount: '₹90' },
      { label: 'Extra Cost per Order', amount: '+₹25' },
      { label: 'Extra Cost per 1,000 Orders', amount: '+₹25,000', highlight: true },
    ],
    checklist: [
      'Measure every box: L × B × H in cm',
      'Use the smallest box that fits with <2 cm cushion',
      'Compare actual vs volumetric weight before shipping',
      'Negotiate slab breaks with your courier partner',
      'Audit 50 past shipments for volumetric leakage',
    ],
    toolPage: 'shipping',
    toolLabel: 'Shipping Calculator',
    toolAction: 'Check Volumetric Weight',
  },

  {
    id: 'break-even-roas',
    title: 'Break-Even ROAS & Marketplace Ads Scaling',
    category: 'Ads & Growth',
    readTime: '6 min',
    description:
      'Calculating true Break-Even ROAS vs Target ACOS across Amazon SP, Flipkart PLA, and Meesho Ads.',
    icon: TrendingUp,
    iconBg: 'bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400',
    formulaLabel: 'Golden Rule — Break-Even ROAS',
    formula:
      'Break-Even ROAS = 1 ÷ Profit Margin %. If your margin is 25%, you break even at 4× ROAS. Scale only above your Target ROAS.',
    breakdown: [
      { label: 'Selling Price', amount: '₹999' },
      { label: 'Product Margin (30%)', amount: '₹300' },
      { label: 'Break-Even ROAS', amount: '4.0×' },
      { label: 'Ad Spend to Break Even', amount: '₹250 / sale' },
      { label: 'Target ROAS for Profit', amount: '6.0×' },
      { label: 'Max Sustainable ACOS', amount: '16.7%', highlight: true },
    ],
    checklist: [
      'Compute Break-Even ROAS per product before launching ads',
      'Set Target ROAS at 1.5× break-even for safe scale',
      'Separate Amazon SP, Flipkart PLA, and Meesho campaigns',
      'Pause keywords below 2× Break-Even ROAS weekly',
      'Reinvest winning ad profits into inventory, not ad spend',
    ],
    toolPage: 'roas',
    toolLabel: 'ROAS Calculator',
    toolAction: 'Calculate Break-Even ROAS',
  },
  {
    id: 'catalog-photography',
    title: 'High-CTR Catalog Photography & A+ Blueprint',
    category: 'Catalog & Ops',
    readTime: '5 min',
    description:
      'Pure #FFFFFF main image compliance + 5 conversion-focused lifestyle/infographic image slots.',
    icon: Image,
    iconBg: 'bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400',
    formulaLabel: 'Golden Rule — Image Stack',
    formula:
      '1 main #FFFFFF image + 1 size/fit + 1 material detail + 1 in-use lifestyle + 1 USP infographic + 1 A+ comparison = 6-image conversion stack.',
    breakdown: [
      { label: 'Main Image (self-shot)', amount: '₹0' },
      { label: 'Main Image (pro shoot)', amount: '₹250' },
      { label: '5 Lifestyle / Infographic Slots', amount: '₹1,200' },
      { label: 'A+ Content / Brand Store', amount: '₹0 (self-built)' },
      { label: 'One-time Catalog Investment', amount: '₹1,200–₹1,450' },
      { label: 'Expected CTR Uplift', amount: '+15–25%', highlight: true },
    ],
    checklist: [
      'Shoot main image on a pure #FFFFFF background',
      'Add 1 size/fit and 1 material close-up image',
      'Add 1 in-use lifestyle image showing scale',
      'Add 1 infographic with the top 3 USPs',
      'Publish A+ content with a comparison table',
    ],
    toolPage: 'bg-remover',
    toolLabel: 'AI Background Remover',
    toolAction: 'Make #FFFFFF Main Image',
  },
  {
    id: 'settlement-audit',
    title: 'Monthly Settlement Audit & Leakage Recovery SOP',
    category: 'Unit Economics',
    readTime: '7 min',
    description:
      'Step-by-step monthly reconciliation workflow to recover 2%–5% revenue lost to weight anomalies and missing returns.',
    icon: ShieldAlert,
    iconBg: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    formulaLabel: 'Golden Rule — Leakage Recovery',
    formula:
      'Recoverable Leakage = Weight Dispute Claims + Missing Return Credits + Incorrect Commission + Short Payouts. Typical recovery is 2–5% of monthly GMV.',
    breakdown: [
      { label: 'Monthly GMV', amount: '₹10,00,000' },
      { label: 'Weight Anomaly Claims', amount: '₹15,000' },
      { label: 'Missing Return Credits', amount: '₹10,000' },
      { label: 'Incorrect Commission / GST', amount: '₹8,000' },
      { label: 'Total Identified Leakage', amount: '₹33,000' },
      { label: 'Recovery at 85% Success', amount: '₹28,050', highlight: true },
    ],
    checklist: [
      'Download monthly settlement & TCS reports by the 5th',
      'Match every order ID to payout line items',
      'Raise weight-dispute claims with dimensional proof',
      'Claim missing return credits within 7 days',
      'Reconcile GSTR-2B ITC against fee invoices monthly',
    ],
    toolPage: 'settlement-reconciliation',
    toolLabel: 'Settlement Reconciliation',
    toolAction: 'Audit Monthly Settlement',
  },
  {
    id: 'apob-regional-warehousing',
    title: 'Scaling to 500 Orders/Day (APOB & Regional Warehousing)',
    category: 'Ads & Growth',
    readTime: '8 min',
    description:
      'When to register Additional Place of Business (APOB) GSTINs for FBA/FBF/Dark Stores to cut national shipping fees.',
    icon: BarChart3,
    iconBg: 'bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400',
    formulaLabel: 'Golden Rule — APOB Threshold',
    formula:
      'Register an APOB GSTIN when >30% of orders ship to one zone. Regional stock cuts first-mile freight by ₹35–₹60 per order.',
    breakdown: [
      { label: 'Orders per Day', amount: '500' },
      { label: 'National Avg Shipping', amount: '₹90' },
      { label: 'Regional (APOB) Avg Shipping', amount: '₹45' },
      { label: 'Saving per Order', amount: '₹45' },
      { label: 'Monthly Saving (30 days)', amount: '₹6,75,000', highlight: true },
    ],
    checklist: [
      'Analyze top 5 order pin-codes by zone weekly',
      'Register an APOB GSTIN for your warehouse state',
      'Enroll in the FBA / FBF / Dark Store network',
      'Shift 30%+ of inventory to regional warehouses',
      'Re-check slab economics every quarter',
    ],
    toolPage: 'roas',
    toolLabel: 'ROAS Calculator',
    toolAction: 'Model Regional Scaling',
  },
  // Sentinel: array continues below
];

interface EcommerceGuidesProps {
  onNavigate: (page: PageId) => void;
}

export default function EcommerceGuides({ onNavigate }: EcommerceGuidesProps) {
  const [cat, setCat] = useState<Category>('All Guides');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [checklists, setChecklists] = useState<Record<string, boolean[]>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCompleted(new Set(JSON.parse(raw)));
    } catch {
      /* ignore */
    }
    try {
      const raw = localStorage.getItem(CHECKLIST_KEY);
      if (raw) setChecklists(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const toggleComplete = useCallback((id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const isCompleted = (id: string) => completed.has(id);

  const toggleChecklist = useCallback((guideId: string, index: number) => {
    setChecklists((prev) => {
      const next = { ...prev };
      const current =
        next[guideId] ?? GUIDES.find((g) => g.id === guideId)!.checklist.map(() => false);
      current[index] = !current[index];
      next[guideId] = current;
      try {
        localStorage.setItem(CHECKLIST_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const isChecklistDone = (guideId: string, index: number) => {
    return checklists[guideId]?.[index] ?? false;
  };

  const categoryCounts = useMemo(() => {
    const m = new Map<Category, number>();
    m.set('All Guides', GUIDES.length);
    GUIDES.forEach((g) => m.set(g.category, (m.get(g.category) || 0) + 1));
    return m;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GUIDES.filter((g) => {
      const matchCat = cat === 'All Guides' || g.category === cat;
      const matchQ =
        !q ||
        g.title.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        g.checklist.some((c) => c.toLowerCase().includes(q));
      return matchCat && matchQ;
    });
  }, [cat, query]);

  const completedCount = completed.size;
  const progressPct = Math.round((completedCount / TOTAL_GUIDES) * 100);
  const guide = selectedId ? GUIDES.find((g) => g.id === selectedId) : null;

  return (
    <section className="mx-auto w-full max-w-[1360px] overflow-x-hidden px-3 py-6 box-border sm:px-6 sm:py-8 lg:px-8">
      {/* Hero Banner */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-zinc-200/80 bg-gradient-to-br from-emerald-50/60 to-zinc-50/40 p-5 sm:p-7 dark:border-zinc-800/80 dark:from-zinc-900 dark:to-zinc-900/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-400">
              📚 SellerMath Business Academy
            </span>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50 select-none">
              E-Commerce Strategy &amp; Profit Guides
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 select-none max-w-xl">
              Master unit economics, GST &amp; Section 194-O compliance, RTO reduction frameworks,
              volumetric packaging math, and profitable ROAS scaling for Indian online brands.
            </p>
          </div>
          <div className="flex shrink-0 flex-col sm:flex-row items-end sm:items-center gap-3 sm:gap-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{completedCount}</span>
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">/ {TOTAL_GUIDES}</span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">Masterclasses Completed</span>
            </div>
            <div className="h-1.5 w-full sm:w-48 overflow-hidden rounded-full bg-zinc-200/70 dark:bg-zinc-800/70">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700 ease-out shadow-lg shadow-emerald-500/30"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Search + Category Filters */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:w-auto min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search guides (e.g. GST, RTO, ROAS)"
            className="w-full min-w-0 pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition"
          />
        </div>
        <div className="-mx-1 flex flex-wrap gap-2 px-1 pb-1 lg:mx-0 lg:px-0 lg:pb-0 overflow-x-auto lg:overflow-visible">
          {CATEGORIES.map((c) => {
            const active = cat === c;
            const count = categoryCounts.get(c) || 0;
            return (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`group whitespace-nowrap inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? 'border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                    : 'border-zinc-200/80 bg-white text-zinc-700 hover:border-emerald-500/40 hover:text-emerald-600 dark:border-zinc-800/80 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-emerald-400'
                }`}
              >
                {c}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums font-bold ${active ? 'bg-white text-emerald-500' : 'bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 text-zinc-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {/* Empty State */}
      {filtered.length === 0 && !selectedId ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <Search className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400" />
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">No guides match "{query || cat}"</p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Try clearing the filter or a different keyword.
          </p>
          <button
            onClick={() => {
              setQuery('');
              setCat('All Guides');
            }}
            className="mt-4 inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset filters
          </button>
        </div>
      ) : null}

      {/* Guide Card Grid */}
      {!selectedId && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {GUIDES.map((g) => {
            const done = isCompleted(g.id);
            return (
              <div
                key={g.id}
                onClick={() => setSelectedId(g.id)}
                className="group cursor-pointer rounded-2xl border border-zinc-200/80 bg-white/80 p-5 sm:p-6 transition-all hover:border-emerald-500/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:hover:bg-zinc-900 select-none"
              >
                <div className="flex items-center gap-3">
                  <div className={`${g.iconBg} w-9 h-9 shrink-0 rounded-xl flex items-center justify-center`}>
                    <g.icon className="w-5 h-5" />
                  </div>
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    {g.readTime}
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-bold leading-snug text-zinc-900 transition-colors group-hover:text-emerald-600 dark:text-zinc-100 dark:group-hover:text-emerald-400">
                  {g.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {g.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${CAT_BADGE[g.category]}`}>
                    {g.category}
                  </span>
                  {done && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      <Check className="h-2.5 w-2.5" /> Done
                    </span>
                  )}
                </div>
                <footer className="mt-auto border-t border-zinc-100 pt-3 dark:border-zinc-800/60 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                    <Clock className="h-3 w-3" /> {g.readTime}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 transition-transform group-hover:translate-x-0.5 dark:text-emerald-400">
                    Open masterclass <ArrowRight className="h-3 w-3" />
                  </span>
                </footer>
              </div>
            );
          })}
        </div>
      )}

      {/* Masterclass Reader View */}
      {guide && (
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <button
              onClick={() => setSelectedId(null)}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition select-none"
            >
              <ChevronLeft className="h-4 w-4" /> Back to All Guides
            </button>
            <div className="flex items-center gap-2 ml-auto sm:ml-0">
              <button
                onClick={() => toggleComplete(guide.id)}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  isCompleted(guide.id)
                    ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : 'border border-zinc-300 text-zinc-700 hover:border-emerald-500/50 hover:text-emerald-600 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-emerald-400'
                }`}
              >
                <Check className={`h-4 w-4 ${isCompleted(guide.id) ? 'fill-current' : ''}`} />
                {isCompleted(guide.id) ? 'Completed' : 'Mark Completed'}
              </button>
              <span className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                <Clock className="h-3 w-3" /> {guide.readTime}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 sm:p-8 dark:border-zinc-800/80 dark:bg-zinc-900">
            <div className="flex items-center gap-2 mb-3">
              <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${CAT_BADGE[guide.category]}`}>
                {guide.category}
              </span>
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{guide.readTime} read</span>
            </div>
            <h2 className="mt-1 mb-4 text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-snug">
              {guide.title}
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{guide.description}</p>

            {/* Key Formula / Golden Rule Callout */}
            <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 sm:p-6 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    {guide.formulaLabel}
                  </p>
                  <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 select-none">
                    {guide.formula}
                  </p>
                </div>
              </div>
            </div>

            {/* Worked Indian Seller Example — ₹ Breakdown Table */}
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 select-none">
                Worked Example — ₹ Breakdown
              </h3>
              <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/60 dark:border-zinc-800/80 dark:bg-zinc-800/40 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-zinc-100/60 dark:bg-zinc-800/60">
                      <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">Line Item</th>
                      <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300 text-right">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                    {guide.breakdown.map((row, i) => (
                      <tr
                        key={i}
                        className={`transition hover:bg-zinc-100/40 dark:hover:bg-zinc-800/40 ${
                          row.highlight
                            ? 'bg-emerald-50/60 font-bold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border-l-3 border-emerald-500'
                            : ''
                        }`}
                      >
                        <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{row.label}</td>
                        <td className="px-4 py-3 text-right font-mono text-zinc-700 dark:text-zinc-300">
                          {row.negative ? '−' : ''}{row.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>


            {/* Interactive 5-Point Action Checklist */}
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 select-none">
                Action Checklist
              </h3>
              <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400 select-none">
                Tick off each step — your progress is saved automatically.
              </p>
              <div className="space-y-2">
                {guide.checklist.map((item, i) => (
                  <label
                    key={i}
                    onClick={() => toggleChecklist(guide.id, i)}
                    className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition select-none"
                  >
                    <div className="shrink-0">
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={isChecklistDone(guide.id, i)}
                        onChange={() => toggleChecklist(guide.id, i)}
                      />
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                          isChecklistDone(guide.id, i)
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'dark:border-zinc-700 border-zinc-300'
                        }`}
                      >
                        {isChecklistDone(guide.id, i) && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                    <span
                      className={`flex-1 text-sm leading-relaxed ${
                        isChecklistDone(guide.id, i)
                          ? 'text-zinc-500 line-through dark:text-zinc-500'
                          : 'text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {item}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* 1-Click Launch Related Tool CTA */}
            <div className="rounded-xl border border-zinc-200/80 bg-white p-5 sm:p-6 dark:border-zinc-800/80 dark:bg-zinc-900">
              <div className="flex items-center gap-3 mb-3">
                <Rocket className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Launch related SellerMath tool
                </p>
              </div>
              <button
                onClick={() => {
                  onNavigate(guide.toolPage);
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 hover:shadow-emerald-600/35 active:scale-95"
              >
                {guide.toolAction} → <span className="font-semibold">{guide.toolLabel}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


