'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calculator,
  Clock,
  GraduationCap,
  Lightbulb,
  Rocket,
  Search,
  X,
  ArrowRight,
  BookOpen,
  Truck,
  CreditCard,
  Image,
  Sparkles,
  Check,
} from 'lucide-react';

const STORAGE_KEY = 'sellermath_completed_tutorials';

type Category =
  | 'All Tutorials'
  | 'Profit & Pricing'
  | 'AI Product Photography'
  | 'Settlements & RTO'
  | 'GST & Compliance';
type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

interface TutorialStep {
  n: number;
  text: string;
}
interface Tutorial {
  id: string;
  title: string;
  category: Category;
  readTime: string;
  difficulty: Difficulty;
  targetPage: string;
  toolName: string;
  Icon: React.ElementType;
  steps: TutorialStep[];
  proFormula: string;
}

const CATEGORIES: Category[] = [
  'All Tutorials',
  'Profit & Pricing',
  'AI Product Photography',
  'Settlements & RTO',
  'GST & Compliance',
];

const DIFF_BADGE: Record<Difficulty, string> = {
  Beginner: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  Intermediate: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  Advanced: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
};

const CAT_BADGE: Record<Category, string> = {
  'All Tutorials': 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800',
  'Profit & Pricing': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  'AI Product Photography': 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  'Settlements & RTO': 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  'GST & Compliance': 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
};

const TUTORIALS: Tutorial[] = [
  {
    id: 'tut-1',
    title: 'Price a ₹499 Product on Meesho & Flipkart Without Losing Money to RTO',
    category: 'Profit & Pricing',
    readTime: '3 min',
    difficulty: 'Beginner',
    targetPage: 'calculator',
    toolName: 'Universal Calculator',
    Icon: Calculator,
    steps: [
      { n: 1, text: 'Calculate landed cost + packaging (₹180).' },
      { n: 2, text: 'Account for 15% Courier Return (RTO) & forward/reverse shipping penalties (₹110 buffer).' },
      { n: 3, text: 'Add 18% GST input credit & TCS/TDS (1%).' },
      { n: 4, text: 'Set minimum break-even selling price before running ads.' },
    ],
    proFormula: 'Break-even SP = (Product Cost + Packaging + RTO Buffer + Shipping) ÷ (1 − Commission% − TCS 1%) + GST',
  },
  {
    id: 'tut-2',
    title: 'Create Amazon & Flipkart Compliant #FFFFFF Pure White Main Images from a Phone Photo',
    category: 'AI Product Photography',
    readTime: '2 min',
    difficulty: 'Beginner',
    targetPage: 'bg-remover',
    toolName: 'AI Background Remover',
    Icon: Image,
    steps: [
      { n: 1, text: 'Shoot product near window daylight without harsh flash.' },
      { n: 2, text: 'Upload to SellerMath AI Background Remover (100% browser WASM).' },
      { n: 3, text: 'Select Amazon 2000×2000 or Flipkart 1500×1500 preset with 6% padding so product fills 85% of frame for zoom eligibility.' },
      { n: 4, text: 'Export Marketplace-Compliant JPEG.' },
    ],
    proFormula: 'Keep the product centered within 85% of canvas with exactly 6% padding — the zoom-eligibility sweet spot on Amazon & Flipkart.',
  },
  {
    id: 'tut-3',
    title: 'Generate Luxury AI Lifestyle & Festive Scenes for A+ Content & Sponsored Ads',
    category: 'AI Product Photography',
    readTime: '3 min',
    difficulty: 'Intermediate',
    targetPage: 'image-generator',
    toolName: 'AI Image Generator',
    Icon: Sparkles,
    steps: [
      { n: 1, text: 'Upload transparent cutout in Product to Lifestyle mode.' },
      { n: 2, text: 'Choose a high-CTR scene preset (Luxury Marble Podium or Festive Indian Decor).' },
      { n: 3, text: 'Match lighting warmth and ground contact shadow.' },
      { n: 4, text: 'Export watermark-free 2000px PNG for secondary gallery slots.' },
    ],
    proFormula: 'Warm key light (3000K–4000K) + soft contact shadow = up to 3× higher CTR than plain white backgrounds in Sponsored Ads.',
  },
  {
    id: 'tut-4',
    title: 'Catch Volumetric Weight Traps & Shipping Overcharges in Courier Slabs',
    category: 'Settlements & RTO',
    readTime: '4 min',
    difficulty: 'Intermediate',
    targetPage: 'shipping',
    toolName: 'Shipping Calculator',
    Icon: Truck,
    steps: [
      { n: 1, text: 'Measure L × B × H (cm) ÷ 5000 to find volumetric weight.' },
      { n: 2, text: 'Compare dead weight vs. volumetric slab (e.g., 420g product in a large box billed at the 1kg tier).' },
      { n: 3, text: 'Trim polybag/box dimensions by 2cm to drop a full shipping tier and save ₹28–₹45 per order.' },
    ],
    proFormula: 'Volumetric kg = (L × B × H) ÷ 5000. Courier bills the higher of dead or volumetric weight.',
  },
  {
    id: 'tut-5',
    title: 'Audit Weekly Amazon & Flipkart Settlement Reports for Hidden Deduction Leaks',
    category: 'Settlements & RTO',
    readTime: '4 min',
    difficulty: 'Advanced',
    targetPage: 'settlement-reconciliation',
    toolName: 'Settlement Reconciliation',
    Icon: CreditCard,
    steps: [
      { n: 1, text: 'Compare promised order payout vs. actual bank NEFT settlement.' },
      { n: 2, text: 'Spot uncredited customer returns, damaged-in-transit claims, and incorrect commission tier charges.' },
      { n: 3, text: 'Raise a Seller Support Safe-T / SPF claim within the 7-day dispute window.' },
    ],
    proFormula: 'Expected Payout = (Order Value − Commission − Shipping − TCS) × GST Credit − Returns − Clawbacks. Anything less is a leak.',
  },
  {
    id: 'tut-6',
    title: 'Create B2B & Customer GST Tax Invoices with HSN Codes & UPI QR',
    category: 'GST & Compliance',
    readTime: '2 min',
    difficulty: 'Beginner',
    targetPage: 'gst-invoice',
    toolName: 'GST Invoice Generator',
    Icon: BookOpen,
    steps: [
      { n: 1, text: 'Determine Intra-state (CGST 9% + SGST 9%) vs. Inter-state (IGST 18%) supply based on customer Place of Supply.' },
      { n: 2, text: 'Enter 4/6-digit HSN code and seller GSTIN.' },
      { n: 3, text: 'Attach instant UPI QR and export A4 print-ready PDF.' },
    ],
    proFormula: 'Intra-state = CGST 9% + SGST 9% (same state). Inter-state = IGST 18% (different state). Never mix them on one invoice.',
  },
];
export default function SellerTutorials({ onNavigate }: { onNavigate: (page: any) => void }) {
  const [cat, setCat] = useState<Category>('All Tutorials');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCompleted(new Set(JSON.parse(raw)));
    } catch {}
  }, []);

  const toggleComplete = useCallback((id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }, []);

  const completedCount = completed.size;
  const progressPct = ((completedCount / TUTORIALS.length) * 100).toFixed(0);

  const filtered = useMemo(() => {
    return TUTORIALS.filter((t) => {
      const matchCat = cat === 'All Tutorials' || t.category === cat;
      const q = query.toLowerCase();
      const matchQuery =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.steps.some((s) => s.text.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [cat, query]);

  const tut = selectedId ? TUTORIALS.find((t) => t.id === selectedId) : null;
  const isCompleted = (id: string) => completed.has(id);

  return (
    <section className="w-full max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-hidden">
      {/* Progress tracker */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3 mb-2">
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 select-none">
            {completedCount} of {TUTORIALS.length} Seller Playbooks Completed
          </span>
          <button
            type="button"
            onClick={() => setCompleted(new Set())}
            className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 underline underline-offset-4 select-none"
          >
            Reset progress
          </button>
        </div>
        <div className="w-full bg-zinc-200/60 dark:bg-zinc-800/60 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
            role="progressbar"
            aria-valuenow={completedCount}
            aria-valuemin={0}
            aria-valuemax={TUTORIALS.length}
          />
        </div>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 select-none">
          Mark a tutorial complete inside its playbook to save progress (localStorage).
        </p>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 text-xs font-semibold px-3 py-1.5 mb-3 select-none">
          🎓 INTERACTIVE SELLER ACADEMY
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-2 select-none">
          Step-by-Step Marketplace &amp; Profit Tutorials
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl select-none">
          Actionable 3-minute playbooks for Amazon, Flipkart, Meesho, and Myntra sellers. Learn a workflow and launch the matching tool in one click.
        </p>
      </div>

      {/* Filter bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition select-none ${
                cat === c
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/25'
                  : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/40'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search tutorials (e.g. RTO, White Background, Volumetric)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border text-sm bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-transparent"
          />
        </div>
      </div>
      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filtered.map((t) => {
          const done = isCompleted(t.id);
          return (
            <div
              key={t.id}
              className="rounded-xl border bg-white dark:bg-zinc-900 dark:border-zinc-800/80 border-zinc-200/80 p-5 hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => setSelectedId(t.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedId(t.id)}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                  <t.Icon className="w-5 h-5" />
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${DIFF_BADGE[t.difficulty]}`}>
                  {t.difficulty}
                </span>
              </div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1.5 select-none group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {t.title}
              </h3>
              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-3 select-none">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {t.readTime}
                </span>
                <span className="flex items-center gap-1 truncate max-w-[60%]">
                  <GraduationCap className="w-3 h-3" /> {t.category}
                </span>
              </div>
              <div className="mt-auto flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleComplete(t.id);
                  }}
                  className={`flex items-center gap-1.5 text-xs font-semibold transition px-2.5 py-1 rounded border ${
                    done
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/40'
                  }`}
                >
                  <Check className={`w-3 h-3 ${done ? 'fill-current' : ''}`} /> {done ? 'Completed' : 'Mark complete'}
                </button>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-3 rounded-2xl border bg-white dark:bg-zinc-900 dark:border-zinc-800/80 border-zinc-200/80 p-12 text-center">
            <Search className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 select-none">No tutorials match "{query}"</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 select-none">Try clearing the filter or a different keyword.</p>
          </div>
        )}
      </div>

      {/* Playbook modal */}
      {tut && (
        <div className="fixed inset-0 z-50 bg-zinc-900/70 backdrop-blur-sm" onClick={() => setSelectedId(null)}>
          <div className="absolute inset-0 z-50 overflow-y-auto p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="max-w-lg mx-auto rounded-2xl border bg-white dark:bg-zinc-900 dark:border-zinc-800 border-zinc-200/80 shadow-2xl p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border text-xs font-semibold px-2.5 py-0.5 mb-2 ${CAT_BADGE[tut.category]}`}>
                    {tut.category}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 select-none">{tut.title}</h3>
                </div>
                <button type="button" onClick={() => setSelectedId(null)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mb-6 select-none">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {tut.readTime} read
                </span>
                <span className="w-px h-3 bg-zinc-300 dark:bg-zinc-700 mx-1" aria-hidden="true" />
                <span className={`px-2 py-0.5 rounded border ${DIFF_BADGE[tut.difficulty]}`}>{tut.difficulty}</span>
              </div>

              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-200 mb-3 select-none">Step-by-Step Playbook</h4>
              <div className="space-y-3 mb-6">
                {tut.steps.map((s) => (
                  <div key={s.n} className="flex gap-3">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold ${
                      isCompleted(tut.id)
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700'
                    }`}>
                      {s.n}
                    </div>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed select-none">{s.text}</p>
                  </div>
                ))}
              </div>

              {/* Pro formula callout */}
              <div className="rounded-lg border bg-emerald-50/60 dark:bg-emerald-900/20 border-emerald-200/50 dark:border-emerald-900/30 p-4 mb-6">
                <div className="flex gap-2">
                  <Lightbulb className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <p className="text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed select-none">
                    <strong className="text-emerald-900 dark:text-emerald-100">💡 Pro Seller Formula:</strong> {tut.proFormula}
                  </p>
                </div>
              </div>

              {/* Mark complete + Try button */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                <label className="flex-1 flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isCompleted(tut.id)}
                    onChange={() => toggleComplete(tut.id)}
                    className="rounded border-zinc-300 dark:border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className={`text-sm font-medium ${isCompleted(tut.id) ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                    {isCompleted(tut.id) ? 'Marked completed ✓' : 'Mark tutorial completed'}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(null);
                    onNavigate(tut.targetPage);
                  }}
                  className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 hover:shadow-emerald-600/40 transition-all"
                >
                  <Rocket className="w-4 h-4" /> 🚀 Try This in {tut.toolName} →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


