import { useState, useMemo, useEffect } from 'react';
import {
  Sparkles, Tag, FileText, Copy, Check, Wand2, Package, Palette,
  RefreshCw, Download, History, Trash2, AlertTriangle, CheckCircle2,
  Zap, Layers, ShoppingBag, Gauge, Shirt, Smartphone,
  Home as HomeIcon, Hash, ChevronRight, Star, Plus, Target, TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type PlatformKey = 'Meesho' | 'Flipkart' | 'Blinkit' | 'Amazon';
type ToneKey = 'High-Converting' | 'Premium Brand' | 'Value / Deal Focused';

interface ListingInput {
  productName: string;
  category: string;
  platform: PlatformKey;
  keyFeatures: string;
  targetKeywords: string;
}

interface SeoReport {
  score: number;
  issues: string[];
  positives: string[];
}

interface ListingResult {
  id: string;
  input: ListingInput;
  title: string;
  bullets: string[];
  description: string;
  keywords: string[];
  fullText: string;
  seo: SeoReport;
  createdAt: number;
}

/* -------------------------------------------------------------------------- */
/*  Config                                                                    */
/* -------------------------------------------------------------------------- */

const PLATFORMS: Record<
  PlatformKey,
  { limit: number; bullets: number; tone: string; icon: LucideIcon }
> = {
  Meesho: { limit: 100, bullets: 5, tone: 'friendly, value-driven and conversational', icon: ShoppingBag },
  Flipkart: { limit: 120, bullets: 5, tone: 'spec-driven and trustworthy', icon: Package },
  Blinkit: { limit: 60, bullets: 3, tone: 'crisp, fast and to-the-point', icon: Zap },
  Amazon: { limit: 200, bullets: 5, tone: 'professional, detailed and benefit-led', icon: Layers },
};

const TONES: { key: ToneKey; label: string; hint: string }[] = [
  { key: 'High-Converting', label: 'High-Converting', hint: 'Persuasive & action-oriented' },
  { key: 'Premium Brand', label: 'Premium Brand', hint: 'Elegant & sophisticated' },
  { key: 'Value / Deal Focused', label: 'Value / Deal', hint: 'Price-conscious & value-led' },
];

const CATEGORY_TEMPLATES: Record<
  string,
  { structure: string; benefit: string; icon: LucideIcon }
> = {
  Apparel: { structure: 'fabric → comfort → fit', benefit: 'all-day comfort', icon: Shirt },
  Electronics: { structure: 'features → specs → use-case', benefit: 'reliable performance', icon: Smartphone },
  Home: { structure: 'benefit → design → practicality', benefit: 'everyday convenience', icon: HomeIcon },
  Beauty: { structure: 'ingredients → benefits → results', benefit: 'visible results', icon: Palette },
  Generic: { structure: 'features → benefits → value', benefit: 'everyday value', icon: FileText },
};

const QUICK_FEATURES: Record<string, string[]> = {
  Apparel: ['100% Pure Cotton', 'Breathable Fabric', 'Machine Washable', 'Made in India', 'Fast Dispatch'],
  Electronics: ['Fast Charging', 'Bluetooth 5.3', 'IPX5 Water Resistant', 'Long Battery Life', 'Made in India'],
  Home: ['Durable Material', 'Easy to Clean', 'Compact Design', 'Made in India', 'Fast Dispatch'],
  Beauty: ['Dermatologist Tested', 'Paraben Free', 'Cruelty Free', 'Made in India', 'Visible Results'],
  Generic: ['Premium Quality', 'Fast Dispatch', 'Made in India', 'Best Seller', 'High Durability'],
};

const QUICK_KEYWORDS: Record<string, string[]> = {
  Apparel: ['cotton t-shirt', 'casual wear', 'men fashion', 'summer wear', 'combo pack'],
  Electronics: ['wireless earbuds', 'bluetooth earbuds', 'anc earbuds', 'tws', 'gaming earbuds'],
  Home: ['home decor', 'kitchen essentials', 'storage box', 'home organizer', 'decor items'],
  Beauty: ['vitamin c serum', 'face serum', 'glowing skin', 'anti aging', 'pigmentation'],
  Generic: ['best seller', 'trending', 'gift', 'combo', 'premium'],
};

const SAMPLE_PRESETS: { id: string; label: string; emoji: string; input: ListingInput }[] = [
  {
    id: 'tee',
    label: "Men's Cotton Tee",
    emoji: '👕',
    input: {
      productName: "Men's Premium Cotton Round Neck T-Shirt",
      category: 'Apparel',
      platform: 'Meesho',
      keyFeatures: '100% breathable cotton, quick dry, machine washable, round neck, regular fit',
      targetKeywords: "cotton t-shirt, men's t-shirt, casual wear, round neck tee",
    },
  },
  {
    id: 'earbuds',
    label: 'ANC Earbuds',
    emoji: '🎧',
    input: {
      productName: 'Wireless ANC Bluetooth Earbuds with 40H Playtime',
      category: 'Electronics',
      platform: 'Flipkart',
      keyFeatures: 'Active noise cancellation, 40H battery, Bluetooth 5.3, IPX5 water resistant, fast charging',
      targetKeywords: 'wireless earbuds, anc earbuds, bluetooth earbuds, tws earbuds, gaming earbuds',
    },
  },
  {
    id: 'serum',
    label: 'Vitamin C Serum',
    emoji: '🧴',
    input: {
      productName: 'Vitamin C Face Serum with Hyaluronic Acid for Glowing Skin',
      category: 'Beauty',
      platform: 'Blinkit',
      keyFeatures: '10% vitamin C, hyaluronic acid, paraben free, dermatologist tested, visible results in 4 weeks',
      targetKeywords: 'vitamin c serum, face serum, glowing skin, anti aging serum, pigmentation serum',
    },
  },
];

const TABS = ['Full', 'Title', 'Bullets', 'Description', 'Keywords'] as const;
type Tab = (typeof TABS)[number];

const STORAGE_KEY = 'seller-listing-history';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const splitCsv = (value: string) =>
  value.split(',').map((v) => v.trim()).filter(Boolean);

function analyzeSeo(
  title: string,
  description: string,
  bullets: string[],
  keywords: string[],
  platformKey: PlatformKey
): SeoReport {
  const { limit } = PLATFORMS[platformKey];
  const positives: string[] = [];
  const issues: string[] = [];
  let score = 0;

  if (title.length >= limit * 0.6 && title.length <= limit) {
    score += 25;
    positives.push(`Title length is optimal (${title.length}/${limit})`);
  } else if (title.length > limit) {
    score += 5;
    issues.push(`Title is ${title.length - limit} chars over ${platformKey}'s limit`);
  } else {
    score += 15;
    issues.push('Title is short — add more keywords');
  }

  if (keywords.length) {
    const hits = keywords.filter((k) => title.toLowerCase().includes(k.toLowerCase())).length;
    score += Math.round((hits / keywords.length) * 25);
    if (hits === keywords.length) positives.push('All target keywords appear in title');
    else if (hits === 0) issues.push('No target keywords found in title');
    else issues.push(`${keywords.length - hits} keyword(s) missing from title`);
  } else {
    issues.push('No target keywords added');
  }

  if (bullets.length >= 3) {
    score += 15;
    positives.push(`${bullets.length} benefit-led bullet points`);
  } else {
    issues.push('Add at least 3 feature bullets');
  }

  if (description.length >= 200) {
    score += 15;
    positives.push('Description has enough detail');
  } else {
    issues.push('Description is too short');
  }

  if (keywords.length >= 3) {
    score += 10;
    positives.push('Good keyword spread');
  } else {
    issues.push('Use 3+ keywords for wider reach');
  }

  if (keywords.length) {
    const inDesc = keywords.filter((k) => description.toLowerCase().includes(k.toLowerCase())).length;
    if (inDesc >= Math.ceil(keywords.length / 2)) {
      score += 10;
      positives.push('Keywords flow naturally in description');
    } else {
      issues.push('Weave more keywords into the description');
    }
  }

  return { score: Math.max(0, Math.min(100, score)), issues, positives };
}

function buildListing(
  input: ListingInput,
  shuffle: boolean,
  toneKey: ToneKey = 'High-Converting'
): ListingResult {
  const platform = PLATFORMS[input.platform];
  const template = CATEGORY_TEMPLATES[input.category] ?? CATEGORY_TEMPLATES.Generic;
  const features = splitCsv(input.keyFeatures);
  const keywords = splitCsv(input.targetKeywords);

  /* ---- Title ---- */
  const titleKeywords = keywords.slice(0, 4).join(' ');
  let title = input.productName.trim();
  if (titleKeywords) title += ` – ${titleKeywords}`;
  if (title.length < platform.limit * 0.6) {
    title += ` | ${features[0] ?? 'Premium Quality'}`;
  }
  title = title.slice(0, platform.limit).trim();

  /* ---- Bullets ---- */
  const benefitTails = [
    `${template.benefit} you can feel`,
    'built to last wash after wash',
    'a customer favourite',
    'easy to style & maintain',
    'lightweight and durable',
  ];
  const rotate = shuffle ? Math.floor(Math.random() * benefitTails.length) : 0;
  const baseFeatures = features.length
    ? features
    : ['Premium quality materials', 'Designed for everyday use', 'Great value for money'];

  const bullets = baseFeatures
    .slice(0, platform.bullets)
    .map((f, i) => `${capitalize(f)} — ${benefitTails[(i + rotate) % benefitTails.length]}`);

  /* ---- Description ---- */
  const openers = ['Crafted for', 'Designed for', 'Built for', 'Made for'];
  const opener = openers[shuffle ? Math.floor(Math.random() * openers.length) : 0];
  const toneWord =
    toneKey === 'Premium Brand' ? 'a premium, '
    : toneKey === 'Value / Deal Focused' ? 'a value-focused, '
    : '';
  const description = [
    `${opener} ${template.benefit}, the ${input.productName} blends ${template.structure} into one reliable pick.`,
    `Written in ${toneWord}a ${platform.tone} tone for ${input.platform} shoppers.`,
    features.length ? `Highlights include ${features.slice(0, 3).join(', ')}.` : '',
    keywords.length ? `Optimised around ${keywords.slice(0, 3).join(', ')}.` : '',
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  /* ---- Full text ---- */
  const fullText = [
    title,
    '='.repeat(Math.min(title.length, 60)),
    '',
    'PRODUCT DESCRIPTION',
    '─'.repeat(20),
    description,
    '',
    'KEY HIGHLIGHTS',
    '─'.repeat(16),
    ...bullets.map((b, i) => `${i + 1}. ${b}`),
    '',
    'WHY CHOOSE THIS PRODUCT?',
    '─'.repeat(26),
    '• High customer satisfaction & repeat purchases',
    '• Competitive pricing with premium quality',
    '• Fast shipping and easy returns',
    '',
    `SEARCH KEYWORDS: ${keywords.join(', ') || '(add target keywords)'}`,
    `CATEGORY: ${input.category}`,
    `PLATFORM: ${input.platform} (title limit ${platform.limit} chars)`,
    '',
    '---',
    'Generated by SellerMath AI Listing Writer',
  ].join('\n');

  return {
    id: uid(),
    input,
    title,
    bullets,
    description,
    keywords,
    fullText,
    seo: analyzeSeo(title, description, bullets, keywords, input.platform),
    createdAt: Date.now(),
  };
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function AIListingWriter() {
  const [input, setInput] = useState<ListingInput>({
    productName: '',
    category: 'Generic',
    platform: 'Meesho',
    keyFeatures: '',
    targetKeywords: '',
  });
  const [tone, setTone] = useState<ToneKey>('High-Converting');
  const [result, setResult] = useState<ListingResult | null>(null);
  const [tab, setTab] = useState<Tab>('Full');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [history, setHistory] = useState<ListingResult[]>([]);

  /* ---------- History persistence ---------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 12)));
    } catch { /* ignore */ }
  }, [history]);

  /* ---------- Derived ---------- */
  const parsedFeatures = useMemo(() => splitCsv(input.keyFeatures), [input.keyFeatures]);
  const parsedKeywords = useMemo(() => splitCsv(input.targetKeywords), [input.targetKeywords]);
  const canGenerate = input.productName.trim().length > 0;
  const platformCfg = PLATFORMS[input.platform];

  const quickFeatures = QUICK_FEATURES[input.category] ?? QUICK_FEATURES.Generic;
  const quickKeywords = QUICK_KEYWORDS[input.category] ?? QUICK_KEYWORDS.Generic;

  /* ---------- Actions ---------- */
  const update = <K extends keyof ListingInput>(key: K, value: ListingInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }));

  const appendChip = (field: 'keyFeatures' | 'targetKeywords', value: string) => {
    setInput((prev) => {
      const existing = splitCsv(prev[field]);
      if (existing.includes(value)) return prev;
      return { ...prev, [field]: [...existing, value].join(', ') };
    });
  };

  const handleGenerate = (shuffle = false) => {
    if (!canGenerate) return;
    const next = buildListing(input, shuffle, tone);
    setResult(next);
    setTab('Full');
    setCopiedKey(null);
    setHistory((prev) => [next, ...prev].slice(0, 12));
  };

  const loadPreset = (preset: (typeof SAMPLE_PRESETS)[number]) => {
    setInput(preset.input);
    const next = buildListing(preset.input, false, tone);
    setResult(next);
    setTab('Full');
    setCopiedKey(null);
    setHistory((prev) => [next, ...prev].slice(0, 12));
  };

  const restoreFromHistory = (item: ListingResult) => {
    setResult(item);
    setInput(item.input);
    setTab('Full');
    setCopiedKey(null);
  };

  const copy = async (key: string, text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch { /* ignore */ }
  };

  const downloadTxt = () => {
    if (!result) return;
    const blob = new Blob([result.fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(result.input.productName || 'listing').replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  /* ---------- SEO ring ---------- */
  const ring = useMemo(() => {
    const radius = 32;
    const circ = 2 * Math.PI * radius;
    const score = result?.seo.score ?? 0;
    const offset = circ - (score / 100) * circ;
    const stroke =
      score >= 80 ? 'stroke-emerald-500' : score >= 60 ? 'stroke-amber-500' : 'stroke-rose-500';
    return { radius, circ, offset, stroke };
  }, [result]);

  /* ---------- Title meter ---------- */
  const titleMeter = useMemo(() => {
    if (!result) return null;
    const len = result.title.length;
    const limit = platformCfg.limit;
    const pct = Math.min(100, (len / limit) * 100);
    const compliant = len <= limit;
    return { len, limit, pct, compliant };
  }, [result, platformCfg]);

  /* ---------- Render ---------- */
  return (
    <div className="w-full max-w-full overflow-x-hidden bg-slate-50 dark:bg-zinc-950 transition-colors duration-300">
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.35s ease-out both; }
      `}</style>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 text-zinc-900 dark:text-zinc-100">

        {/* ================= Hero Header ================= */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200/60 dark:border-emerald-500/20 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-5 shadow-lg shadow-emerald-500/5">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-teal-500/10 dark:bg-teal-500/10 blur-3xl rounded-full pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
            {/* Left: Title */}
            <div className="flex items-start gap-3 min-w-0">
              <div className="relative shrink-0">
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 group cursor-default">
                  <Sparkles className="w-6 h-6 text-white transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
                </div>
                <div className="absolute inset-0 rounded-2xl bg-emerald-500 blur-xl opacity-40 -z-10" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight select-none">
                  AI Product Listing Writer
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 select-none mt-0.5 max-w-2xl">
                  Marketplace-tuned titles, bullet points, descriptions & backend search terms for Amazon, Flipkart, Meesho & Blinkit
                </p>
              </div>
            </div>

            {/* Right: Sample Presets */}
            <div className="flex flex-col gap-2 w-full lg:w-auto shrink-0">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 select-none">
                ✨ 1-Click Sample Presets
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => loadPreset(p)}
                    className="group inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 hover:-translate-y-0.5 hover:shadow-md hover:shadow-emerald-500/20 active:scale-95 transition-all duration-200 select-none focus:outline-none"
                  >
                    <span className="text-sm">{p.emoji}</span>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ================= Main Grid ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ---------- Left: Form (lg:col-span-6) ---------- */}
          <div className="min-w-0 lg:col-span-6 space-y-4">

            {/* Platform */}
            <Card>
              <FieldLabel icon={Layers} title="Platform" hint="Title length & tone auto-tune per marketplace" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(Object.keys(PLATFORMS) as PlatformKey[]).map((p) => {
                  const cfg = PLATFORMS[p];
                  const Icon = cfg.icon;
                  const active = input.platform === p;
                  return (
                    <button
                      key={p}
                      onClick={() => update('platform', p)}
                      className={`group relative flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-xs font-semibold transition-all duration-200 active:scale-95 select-none focus:outline-none ${
                        active
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 shadow-sm shadow-emerald-500/20'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:-translate-y-0.5 hover:shadow-md'
                      }`}
                    >
                      <Icon className={`w-4 h-4 transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
                      {p}
                      <span className="text-[10px] font-normal opacity-70">{cfg.limit} chars</span>
                      {active && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Product Name */}
            <Card>
              <FieldLabel icon={Tag} title="Product Name" hint="The name shoppers will search for" required />
              <input
                type="text"
                value={input.productName}
                onChange={(e) => update('productName', e.target.value)}
                placeholder="e.g. Cotton Round Neck T-Shirt"
                className="w-full text-base font-medium rounded-xl border-2 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 px-4 py-3 border-zinc-200 dark:border-zinc-700 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-all duration-200 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-zinc-800 focus:ring-4 focus:ring-emerald-500/10"
              />
            </Card>

            {/* Category */}
            <Card>
              <FieldLabel icon={Palette} title="Category" hint="Drives the narrative structure & benefit angle" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.keys(CATEGORY_TEMPLATES).map((cat) => {
                  const Icon = CATEGORY_TEMPLATES[cat].icon;
                  const active = input.category === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => update('category', cat)}
                      className={`group flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all duration-200 active:scale-95 select-none focus:outline-none ${
                        active
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:-translate-y-0.5 hover:shadow-sm'
                      }`}
                    >
                      <Icon className={`w-4 h-4 transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
                      {cat}
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Key Features */}
            <Card>
              <FieldLabel icon={Star} title="Key Features" hint="Comma-separated — become bullet points" />
              <textarea
                value={input.keyFeatures}
                onChange={(e) => update('keyFeatures', e.target.value)}
                placeholder="e.g. 100% breathable cotton, quick dry, machine washable"
                rows={3}
                className="w-full text-base font-medium rounded-xl border-2 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 px-4 py-3 border-zinc-200 dark:border-zinc-700 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-all duration-200 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-zinc-800 focus:ring-4 focus:ring-emerald-500/10 resize-none"
              />
              {/* Quick-add feature chips */}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {quickFeatures.map((f) => {
                  const added = parsedFeatures.includes(f);
                  return (
                    <button
                      key={f}
                      onClick={() => appendChip('keyFeatures', f)}
                      disabled={added}
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold transition-all duration-150 select-none ${
                        added
                          ? 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 cursor-default'
                          : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:-translate-y-0.5 active:scale-95'
                      }`}
                    >
                      {added ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                      {f}
                    </button>
                  );
                })}
              </div>
              {parsedFeatures.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 animate-fade-in">
                  {parsedFeatures.slice(0, 8).map((f, i) => (
                    <span
                      key={`${f}-${i}`}
                      className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-500/20"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </Card>

            {/* Target Keywords */}
            <Card>
              <FieldLabel icon={Hash} title="Target Keywords" hint="Comma-separated SEO keywords" />
              <textarea
                value={input.targetKeywords}
                onChange={(e) => update('targetKeywords', e.target.value)}
                placeholder="e.g. cotton t-shirt, casual wear, men's fashion"
                rows={2}
                className="w-full text-base font-medium rounded-xl border-2 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 px-4 py-3 border-zinc-200 dark:border-zinc-700 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-all duration-200 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-zinc-800 focus:ring-4 focus:ring-emerald-500/10 resize-none"
              />
              {/* Quick-add keyword chips */}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {quickKeywords.map((k) => {
                  const added = parsedKeywords.includes(k);
                  return (
                    <button
                      key={k}
                      onClick={() => appendChip('targetKeywords', k)}
                      disabled={added}
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold transition-all duration-150 select-none ${
                        added
                          ? 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 cursor-default'
                          : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:-translate-y-0.5 active:scale-95'
                      }`}
                    >
                      {added ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                      {k}
                    </button>
                  );
                })}
              </div>
              {parsedKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 animate-fade-in">
                  {parsedKeywords.slice(0, 8).map((k, i) => (
                    <span
                      key={`${k}-${i}`}
                      className="inline-flex items-center gap-1 rounded-md bg-teal-50 dark:bg-teal-500/10 px-2 py-0.5 text-[11px] font-medium text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-500/20"
                    >
                      <Hash className="w-3 h-3" />
                      {k}
                    </span>
                  ))}
                </div>
              )}
            </Card>

            {/* Tone Selector */}
            <Card>
              <FieldLabel icon={Target} title="Tone / Style" hint="How should the AI frame the copy?" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {TONES.map((t) => {
                  const active = tone === t.key;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setTone(t.key)}
                      className={`group flex flex-col items-start gap-0.5 rounded-xl border-2 px-3 py-2.5 text-left transition-all duration-200 active:scale-95 select-none focus:outline-none ${
                        active
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 hover:-translate-y-0.5 hover:shadow-sm'
                      }`}
                    >
                      <span className={`text-xs font-bold ${active ? 'text-emerald-700 dark:text-emerald-300' : 'text-zinc-700 dark:text-zinc-300'}`}>
                        {t.label}
                      </span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{t.hint}</span>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Generate */}
            <div className="flex gap-2">
              <button
                onClick={() => handleGenerate(false)}
                disabled={!canGenerate}
                className={`group relative flex-1 overflow-hidden rounded-xl px-6 py-4 font-semibold text-base transition-all duration-200 active:scale-[0.99] select-none focus:outline-none ${
                  canGenerate
                    ? 'text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                }`}
              >
                {canGenerate && (
                  <span className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 bg-[length:200%_100%] bg-left transition-all duration-500 group-hover:bg-right" />
                )}
                <span className="relative flex items-center justify-center gap-2">
                  <Wand2 className={`w-5 h-5 transition-transform duration-300 ${canGenerate ? 'group-hover:rotate-12 group-hover:scale-110' : ''}`} />
                  {result ? 'Regenerate Listing' : 'Generate Listing'}
                </span>
              </button>

              {result && (
                <button
                  onClick={() => handleGenerate(true)}
                  aria-label="Shuffle variation"
                  className="group w-14 flex items-center justify-center rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-emerald-400 hover:text-emerald-600 hover:-translate-y-0.5 hover:shadow-md active:scale-95 transition-all duration-200 select-none"
                >
                  <RefreshCw className="w-5 h-5 transition-transform duration-500 group-hover:rotate-180" />
                </button>
              )}
            </div>
          </div>

          {/* ---------- Right: Output (lg:col-span-6, sticky) ---------- */}
          <div className="min-w-0 lg:col-span-6 lg:sticky lg:top-24 self-start space-y-4">

            <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 overflow-hidden shadow-sm transition-colors duration-300">
              {/* Header */}
              <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/60">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
                  <span className="text-sm font-semibold truncate select-none">Generated Listing</span>
                  {result && (
                    <span className="hidden sm:inline-flex items-center rounded-md bg-emerald-100 dark:bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 select-none">
                      {result.input.platform}
                    </span>
                  )}
                </div>
                {result && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => copy('master', result.fullText)}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-200 select-none active:scale-95 ${
                        copiedKey === 'master'
                          ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                          : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-500/30'
                      }`}
                    >
                      {copiedKey === 'master' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedKey === 'master' ? 'Copied!' : 'Copy All'}
                    </button>
                    <IconBtn label="Download" onClick={downloadTxt}>
                      <Download className="w-4 h-4" />
                    </IconBtn>
                  </div>
                )}
              </div>

              {/* Body */}
              {result ? (
                <>
                  {/* Listing SEO Score + Title Meter */}
                  <div className="p-4 sm:p-5 border-b border-zinc-200/80 dark:border-zinc-800/80 animate-fade-in">
                    <div className="flex items-center gap-4">
                      {/* Ring */}
                      <div className="relative shrink-0">
                        <svg width="80" height="80" className="-rotate-90">
                          <circle cx="40" cy="40" r={ring.radius} strokeWidth="7" fill="none"
                            className="stroke-zinc-200 dark:stroke-zinc-800" />
                          <circle cx="40" cy="40" r={ring.radius} strokeWidth="7" fill="none"
                            strokeLinecap="round" strokeDasharray={ring.circ}
                            strokeDashoffset={ring.offset}
                            className={`${ring.stroke} transition-all duration-1000 ease-out`} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-lg font-bold tabular-nums">{result.seo.score}</span>
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400">SEO</span>
                        </div>
                      </div>

                      {/* Meter */}
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Gauge className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="text-xs font-semibold select-none">Listing Health</span>
                          <span className={`ml-auto text-[10px] font-bold uppercase tracking-wider ${
                            result.seo.score >= 80 ? 'text-emerald-600 dark:text-emerald-400'
                            : result.seo.score >= 60 ? 'text-amber-600 dark:text-amber-400'
                            : 'text-rose-600 dark:text-rose-400'
                          }`}>
                            {result.seo.score >= 80 ? 'Excellent' : result.seo.score >= 60 ? 'Good' : 'Needs Work'}
                          </span>
                        </div>

                        {titleMeter && (
                          <>
                            <div className="flex items-center justify-between text-[10px] font-medium text-zinc-500 dark:text-zinc-400 select-none">
                              <span>Title</span>
                              <span className={titleMeter.compliant ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                                {titleMeter.len} / {titleMeter.limit} chars • {titleMeter.compliant ? 'Compliant' : 'Over limit'}
                              </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${
                                  titleMeter.compliant ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${titleMeter.pct}%` }}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Positives / Issues */}
                    {(result.seo.positives.length > 0 || result.seo.issues.length > 0) && (
                      <div className="mt-3 grid gap-1">
                        {result.seo.positives.slice(0, 2).map((p, i) => (
                          <div key={`p-${i}`} className="flex items-start gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="mt-0.5 w-3 h-3 shrink-0" />
                            <span>{p}</span>
                          </div>
                        ))}
                        {result.seo.issues.slice(0, 2).map((p, i) => (
                          <div key={`i-${i}`} className="flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-400">
                            <AlertTriangle className="mt-0.5 w-3 h-3 shrink-0" />
                            <span>{p}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tabs */}
                  <div className="flex items-center gap-1 px-2 pt-2 overflow-x-auto border-b border-zinc-200/80 dark:border-zinc-800/80">
                    {TABS.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`relative whitespace-nowrap rounded-t-lg px-3 py-2 text-xs font-semibold transition-colors duration-200 select-none ${
                          tab === t
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                        }`}
                      >
                        {t}
                        <span className={`absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-emerald-500 transition-transform duration-300 origin-center ${
                          tab === t ? 'scale-x-100' : 'scale-x-0'
                        }`} />
                      </button>
                    ))}
                  </div>

                  {/* Section Cards */}
                  <div className="p-4 sm:p-5 max-h-[520px] overflow-y-auto space-y-3">
                    {tab === 'Full' ? (
                      <div className="space-y-3 animate-fade-in">
                        <SectionCard
                          keyName="title"
                          icon={Tag}
                          label="SEO Title"
                          onCopy={copy}
                          copiedKey={copiedKey}
                        >
                          <p className="text-sm font-semibold leading-relaxed text-zinc-800 dark:text-zinc-200">
                            {result.title}
                          </p>
                        </SectionCard>

                        <SectionCard
                          keyName="bullets"
                          icon={Star}
                          label="Bullet Points"
                          onCopy={copy}
                          copiedKey={copiedKey}
                        >
                          <ul className="space-y-2">
                            {result.bullets.map((b, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded bg-emerald-100 dark:bg-emerald-500/15 text-[9px] font-bold text-emerald-700 dark:text-emerald-300">
                                  {i + 1}
                                </span>
                                {b}
                              </li>
                            ))}
                          </ul>
                        </SectionCard>

                        <SectionCard
                          keyName="desc"
                          icon={FileText}
                          label="Product Description"
                          onCopy={copy}
                          copiedKey={copiedKey}
                        >
                          <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                            {result.description}
                          </p>
                        </SectionCard>

                        <SectionCard
                          keyName="keywords"
                          icon={Hash}
                          label="Search Keywords"
                          onCopy={copy}
                          copiedKey={copiedKey}
                        >
                          {result.keywords.length ? (
                            <div className="flex flex-wrap gap-1.5">
                              {result.keywords.map((k, i) => (
                                <span key={i} className="inline-flex items-center gap-1 rounded-md bg-teal-50 dark:bg-teal-500/10 px-2 py-0.5 text-[11px] font-medium text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-500/20">
                                  <Hash className="w-3 h-3" />
                                  {k}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-400">No keywords</span>
                          )}
                        </SectionCard>
                      </div>
                    ) : (
                      <div className="animate-fade-in">
                        <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed font-mono text-zinc-700 dark:text-zinc-300">
                          {tab === 'Title' ? result.title
                            : tab === 'Bullets' ? result.bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')
                            : tab === 'Description' ? result.description
                            : result.keywords.join(', ')}
                        </pre>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <EmptyBlueprint onTrySample={() => loadPreset(SAMPLE_PRESETS[0])} />
              )}
            </div>
          </div>
        </div>

        {/* ================= History ================= */}
        {history.length > 0 && (
          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 p-4 sm:p-5 shadow-sm animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 select-none">
                <History className="w-4 h-4 text-zinc-500" />
                <span className="text-sm font-semibold">Recent Listings</span>
                <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                  {history.length}
                </span>
              </div>
              <button
                onClick={clearHistory}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 transition-colors select-none"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {history.map((h) => (
                <button
                  key={h.id}
                  onClick={() => restoreFromHistory(h)}
                  className="group flex items-center gap-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-800/40 p-3 text-left transition-all duration-200 hover:border-emerald-300 dark:hover:border-emerald-500/40 hover:bg-white dark:hover:bg-zinc-800 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-teal-500 text-white text-xs font-bold">
                    {h.seo.score}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{h.input.productName}</p>
                    <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                      {h.input.platform} · {h.input.category} · {new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0 text-zinc-300 dark:text-zinc-600 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-emerald-500" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                            */
/* -------------------------------------------------------------------------- */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700">
      {children}
    </div>
  );
}

function FieldLabel({
  icon: Icon,
  title,
  hint,
  required,
}: {
  icon: LucideIcon;
  title: string;
  hint: string;
  required?: boolean;
}) {
  return (
    <div className="mb-3 select-none">
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-zinc-400" />
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {title}
        </label>
        {required && <span className="text-rose-500">*</span>}
      </div>
      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{hint}</p>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-200/70 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-all duration-200 active:scale-90"
    >
      {children}
    </button>
  );
}

function SectionCard({
  keyName,
  icon: Icon,
  label,
  onCopy,
  copiedKey,
  children,
}: {
  keyName: string;
  icon: LucideIcon;
  label: string;
  onCopy: (key: string, text: string) => void;
  copiedKey: string | null;
  children: React.ReactNode;
}) {
  // Extracts copyable text from rendered children by reading their DOM content
  const handleCopy = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = e.currentTarget.closest('[data-section]');
    if (!el) return;
    const body = el.querySelector('[data-section-body]');
    const text = body?.textContent ?? '';
    onCopy(keyName, text.replace(/\s+/g, ' ').trim());
  };

  return (
    <div data-section className="group rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-800/30 p-3 transition-colors hover:border-emerald-300/60 dark:hover:border-emerald-500/30">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 select-none">
          <Icon className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {label}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold transition-all duration-200 active:scale-95 select-none ${
            copiedKey === keyName
              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
              : 'bg-white dark:bg-zinc-800 text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 border border-zinc-200 dark:border-zinc-700'
          }`}
        >
          {copiedKey === keyName ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copiedKey === keyName ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div data-section-body>{children}</div>
    </div>
  );
}

function EmptyBlueprint({ onTrySample }: { onTrySample: () => void }) {
  const blueprint = [
    { icon: Tag, text: 'SEO Title (Auto-tuned to platform char limit)' },
    { icon: Star, text: '5 Benefit-Driven Bullet Points' },
    { icon: FileText, text: 'High-Converting Product Description' },
    { icon: Hash, text: 'Backend Search Terms & SEO Tags' },
  ];

  return (
    <div className="flex flex-col items-center text-center px-4 py-8 select-none">
      <div className="relative mb-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 flex items-center justify-center">
          <Target className="w-8 h-8 text-emerald-500" />
        </div>
        <div className="absolute -inset-2 rounded-3xl bg-emerald-500/10 blur-xl -z-10" />
      </div>

      <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
        Marketplace Blueprint Preview
      </h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
        Here's exactly what gets generated for you:
      </p>

      <div className="w-full max-w-sm mt-5 space-y-2 text-left">
        {blueprint.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className="flex items-center gap-2.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-800/40 p-2.5 transition-colors hover:border-emerald-300/60 dark:hover:border-emerald-500/30"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <Icon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{item.text}</span>
            </div>
          );
        })}
      </div>

      <button
        onClick={onTrySample}
        className="group mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
      >
        <Sparkles className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
        Try with Sample Product
      </button>
    </div>
  );
}