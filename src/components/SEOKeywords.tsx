'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles, Copy, Check, Search, Tag, TrendingUp, AlertCircle, Plus, X,
  Download, Clock, Wand2, Target, BarChart3, Trash2, RefreshCw, History,
  ShoppingBag, Gauge, ArrowUpDown, Layers, Info, Eraser,
} from 'lucide-react';
import { postCalculate } from '@/lib/calculateApi';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface KeywordMetrics {
  volume?: number;
  competition?: number;
  relevance?: number;
}

interface SEOKeywordsResponse {
  topSearchTerms: string[];
  platinumKeywords: string[];
  misspellings: string[];
  metrics?: Record<string, KeywordMetrics>;
}

type Category = 'top' | 'platinum' | 'longtail';
type SortKey = 'relevance' | 'volume' | 'competition' | 'az';
type PlatformId = 'amazon' | 'flipkart' | 'meesho';
type CompFilter = 'all' | 'low' | 'highVolume';

/* ------------------------------------------------------------------ */
/*  Config & helpers                                                   */
/* ------------------------------------------------------------------ */

const PLATFORMS: {
  id: PlatformId;
  label: string;
  short: string;
  limit: number;
  unit: 'bytes' | 'chars';
  hint: string;
}[] = [
  { id: 'amazon', label: 'Amazon India', short: 'Amazon', limit: 250, unit: 'bytes', hint: 'Backend search terms · 250 bytes max' },
  { id: 'flipkart', label: 'Flipkart', short: 'Flipkart', limit: 200, unit: 'chars', hint: 'Search keywords · 200 characters' },
  { id: 'meesho', label: 'Meesho', short: 'Meesho', limit: 150, unit: 'chars', hint: 'Listing tags · 150 characters' },
];

const TABS: { id: Category; label: string; short: string; icon: typeof Search; desc: string }[] = [
  { id: 'top', label: 'Top Search Terms', short: 'Top', icon: Search, desc: 'High-volume backend keywords' },
  { id: 'platinum', label: 'Platinum Keywords', short: 'Platinum', icon: TrendingUp, desc: 'High-conversion premium terms' },
  { id: 'longtail', label: 'Long-tail & Misspellings', short: 'Long-tail', icon: Tag, desc: 'Low-competition, high-intent variations' },
];

const SAMPLE_PRESETS: {
  label: string;
  platform: PlatformId;
  productName: string;
  keyFeatures: string;
}[] = [
  {
    label: '🛏️ Cotton King Bedsheet',
    platform: 'amazon',
    productName: 'Jaipuri Printed 100% Cotton King Size Bedsheet',
    keyFeatures:
      '108x108 inches, 300 TC breathable pure cotton, 2 pillow covers, colorfast machine washable, bedroom home decor',
  },
  {
    label: '🎧 ANC Wireless Earbuds',
    platform: 'flipkart',
    productName: 'Bluetooth 5.3 TWS Wireless Earbuds with ANC',
    keyFeatures:
      'active noise cancellation, 50 hours battery backup, quad mic ENC calling, 40ms low latency gaming, IPX5 water resistant',
  },
  {
    label: "👗 Women's Kurta Set",
    platform: 'meesho',
    productName: 'Women Embroidered Rayon Straight Kurta Pant Dupatta Set',
    keyFeatures:
      'festive party wear, soft breathable rayon fabric, ethnic wear combo, wedding season special, all sizes S to XXL',
  },
  {
    label: '🧴 Vitamin C Face Serum',
    platform: 'amazon',
    productName: '20% Vitamin C Face Serum with Hyaluronic Acid & Niacinamide',
    keyFeatures:
      'glowing skin, dark spot removal, paraben free, dermatologist tested, all skin types men and women, 30ml',
  },
];

const COMP_FILTERS: { id: CompFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'low', label: 'Low Comp' },
  { id: 'highVolume', label: 'High Volume' },
];

const HIGH_VOLUME_THRESHOLD = 3000;

const byteSize = (s: string) => new TextEncoder().encode(s).length;

const measureByPlatform = (text: string, pid: PlatformId) => {
  const cfg = PLATFORMS.find((p) => p.id === pid);
  return cfg?.unit === 'bytes' ? byteSize(text) : text.length;
};

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const hashStr = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
};

const fmtNum = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1000
      ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}K`
      : `${n}`;

function deriveMetrics(term: string, category: Category): Required<KeywordMetrics> {
  const h = hashStr(`${category}:${term}`);
  const words = term.trim().split(/\s+/).length;
  const base = category === 'top' ? 7000 : category === 'platinum' ? 3200 : 550;
  const volume = Math.round(base * (0.35 + ((h % 1000) / 1000) * 1.65));
  const competition = Math.min(
    100,
    category === 'top' ? 55 + (h % 40) : category === 'platinum' ? 38 + (h % 45) : 8 + (h % 35),
  );
  const relevance = Math.min(
    99,
    (category === 'platinum' ? 78 : category === 'top' ? 68 : 52) + (h % 20) + Math.min(words, 4) * 2,
  );
  return { volume, competition, relevance };
}

const competitionTone = (c: number) =>
  c >= 70 ? 'bg-red-500' : c >= 40 ? 'bg-amber-500' : 'bg-emerald-500';

const competitionLabel = (c: number) => (c >= 70 ? 'High' : c >= 40 ? 'Medium' : 'Low');

const isTermInText = (term: string, text: string) => {
  if (!text) return false;
  const regex = new RegExp(`(^|\\s)${escapeRegex(term)}(\\s|$)`, 'i');
  return regex.test(text);
};

const removeTermFromText = (term: string, text: string) => {
  const regex = new RegExp(`(^|\\s)${escapeRegex(term)}(\\s|$)`, 'gi');
  return text.replace(regex, ' ').replace(/\s+/g, ' ').trim();
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SEOKeywords() {
  /* --------------------------- Core state --------------------------- */
  const [productName, setProductName] = useState('');
  const [keyFeatures, setKeyFeatures] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SEOKeywordsResponse | null>(null);

  /* ------------------------ UI-only state -------------------------- */
  const [platform, setPlatform] = useState<PlatformId>('amazon');
  const [activeTab, setActiveTab] = useState<Category>('top');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('relevance');
  const [compFilter, setCompFilter] = useState<CompFilter>('all');

  /* ------------------- Backend builder state ----------------------- */
  const [builderText, setBuilderText] = useState('');
  const [dedupedSaved, setDedupedSaved] = useState(0);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  /* ------------------------- Misc state --------------------------- */
  const [recent, setRecent] = useState<{ productName: string; keyFeatures: string }[]>([]);
  const [toast, setToast] = useState<{ msg: string; tone: 'ok' | 'err' } | null>(null);

  const toastTimer = useRef<number | undefined>(undefined);
  const dedupeTimer = useRef<number | undefined>(undefined);

  const platformCfg = PLATFORMS.find((p) => p.id === platform) ?? PLATFORMS[0];

  /* ----------------------------- Toast ----------------------------- */
  const showToast = useCallback((msg: string, tone: 'ok' | 'err' = 'ok') => {
    setToast({ msg, tone });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(
    () => () => {
      window.clearTimeout(toastTimer.current);
      window.clearTimeout(dedupeTimer.current);
    },
    [],
  );

  /* ---------------------- Recent searches (LS) --------------------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem('seo-kw-recent');
      if (raw) setRecent(JSON.parse(raw).slice(0, 5));
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  const persistRecent = useCallback((entry: { productName: string; keyFeatures: string }) => {
    setRecent((prev) => {
      const next = [entry, ...prev.filter((r) => r.productName !== entry.productName)].slice(0, 5);
      try {
        localStorage.setItem('seo-kw-recent', JSON.stringify(next));
      } catch {
        /* ignore quota errors */
      }
      return next;
    });
  }, []);

  /* -------------------------- Keyword data ------------------------- */
  const categories: Record<Category, string[]> = useMemo(
    () => ({
      top: result?.topSearchTerms ?? [],
      platinum: result?.platinumKeywords ?? [],
      longtail: result?.misspellings ?? [],
    }),
    [result],
  );

  const getMetrics = useCallback(
    (term: string, category: Category): Required<KeywordMetrics> => {
      const api = result?.metrics?.[term];
      const fallback = deriveMetrics(term, category);
      return {
        volume: api?.volume ?? fallback.volume,
        competition: api?.competition ?? fallback.competition,
        relevance: api?.relevance ?? fallback.relevance,
      };
    },
    [result],
  );

  const allKnownKeywords = useMemo(
    () => [...categories.platinum, ...categories.top, ...categories.longtail],
    [categories],
  );

  const selectedKeywords = useMemo(
    () => allKnownKeywords.filter((term) => isTermInText(term, builderText)),
    [allKnownKeywords, builderText],
  );

  /* --------------------------- Byte meter -------------------------- */
  const used = byteSize(builderText);
  const usedPct = Math.min(100, Math.round((used / platformCfg.limit) * 100));
  const emeraldThreshold = platformCfg.limit * 0.8;
  const amberThreshold = platformCfg.limit * 0.98;

  const meterToneClass =
    used >= amberThreshold
      ? 'bg-gradient-to-r from-rose-500 to-red-500'
      : used >= emeraldThreshold
        ? 'bg-gradient-to-r from-amber-500 to-orange-400'
        : 'bg-gradient-to-r from-emerald-500 to-teal-400';

  const usedTextClass =
    used >= amberThreshold
      ? 'text-rose-500'
      : used >= emeraldThreshold
        ? 'text-amber-500'
        : 'text-emerald-500';

  /* ------------------------ Filtered results ----------------------- */
  const visibleTerms = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = categories[activeTab]
      .filter((t) => !q || t.toLowerCase().includes(q))
      .map((t) => ({ term: t, category: activeTab, m: getMetrics(t, activeTab) }));

    if (compFilter === 'low') {
      list = list.filter((x) => x.m.competition < 40);
    } else if (compFilter === 'highVolume') {
      list = list.filter((x) => x.m.volume >= HIGH_VOLUME_THRESHOLD);
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case 'volume':
          return b.m.volume - a.m.volume;
        case 'competition':
          return a.m.competition - b.m.competition;
        case 'az':
          return a.term.localeCompare(b.term);
        default:
          return b.m.relevance - a.m.relevance;
      }
    });
    return list;
  }, [categories, activeTab, query, sortBy, compFilter, getMetrics]);

  const stats = useMemo(() => {
    const all = (Object.keys(categories) as Category[]).flatMap((c) =>
      categories[c].map((t) => getMetrics(t, c)),
    );
    if (!all.length) return null;
    const total = all.length;
    const avgRelevance = Math.round(all.reduce((s, m) => s + m.relevance, 0) / total);
    const lowCompetition = all.filter((m) => m.competition < 40).length;
    const avgVolume = Math.round(all.reduce((s, m) => s + m.volume, 0) / total);
    return { total, avgRelevance, lowCompetition, avgVolume };
  }, [categories, getMetrics]);

  /* ------------------------- Builder actions ----------------------- */
  const toggleKeyword = (term: string) => {
    if (isTermInText(term, builderText)) {
      setBuilderText(removeTermFromText(term, builderText));
      return;
    }
    const candidate = (builderText + ' ' + term).trim();
    const size = platformCfg.unit === 'bytes' ? byteSize(candidate) : candidate.length;
    if (size > platformCfg.limit) {
      showToast(
        `Cannot add — would exceed ${platformCfg.limit} ${platformCfg.unit} limit`,
        'err',
      );
      return;
    }
    setBuilderText(candidate);
  };

  const autoFill = () => {
    const ordered = [...categories.platinum, ...categories.top, ...categories.longtail];
    let text = builderText;
    let added = 0;
    for (const term of ordered) {
      if (isTermInText(term, text)) continue;
      const candidate = (text + ' ' + term).trim();
      const size = platformCfg.unit === 'bytes' ? byteSize(candidate) : candidate.length;
      if (size <= platformCfg.limit) {
        text = candidate;
        added++;
      }
    }
    if (!added) {
      showToast('No more keywords fit inside the limit', 'err');
      return;
    }
    setBuilderText(text);
    showToast(`Added ${added} keyword${added > 1 ? 's' : ''} within limit`, 'ok');
  };

  const deduplicateWords = () => {
    const tokens = builderText.split(/\s+/).filter(Boolean);
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const t of tokens) {
      const key = t.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(t);
      }
    }
    const deduped = unique.join(' ');
    if (deduped === builderText) {
      showToast('No duplicate words to remove', 'ok');
      return;
    }
    const saved = byteSize(builderText) - byteSize(deduped);
    setBuilderText(deduped);
    setDedupedSaved(saved);
    window.clearTimeout(dedupeTimer.current);
    dedupeTimer.current = window.setTimeout(() => setDedupedSaved(0), 4000);
    showToast(`Removed duplicate words • Saved ${saved} bytes!`, 'ok');
  };

  const clearBuilder = () => {
    setBuilderText('');
    setDedupedSaved(0);
    showToast('Builder cleared', 'ok');
  };

  /* ------------------------------ Generate -------------------------- */
  const handleGenerate = async () => {
    if (!productName.trim()) {
      setError('Please enter a product name or category');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setBuilderText('');
    setDedupedSaved(0);
    setQuery('');
    setCompFilter('all');

    const payload = { productName: productName.trim(), keyFeatures: keyFeatures.trim() };

    try {
      const response = await postCalculate<SEOKeywordsResponse>('/api/seo-keywords', payload);
      setResult(response);
      setActiveTab('top');
      persistRecent(payload);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Our AI engine is currently experiencing high demand. Please try generating keywords again in a moment.',
      );
    } finally {
      setLoading(false);
    }
  };

  /* ------------- Shared generator used by demos + recents ----------- */
  const runDemoLoad = async (
    productNameValue: string,
    keyFeaturesValue: string,
    platformValue: PlatformId,
    label: string,
  ) => {
    if (loading) return;
    const presetCfg = PLATFORMS.find((p) => p.id === platformValue) ?? PLATFORMS[0];

    setProductName(productNameValue);
    setKeyFeatures(keyFeaturesValue);
    setPlatform(platformValue);
    setLoading(true);
    setError(null);
    setResult(null);
    setBuilderText('');
    setDedupedSaved(0);
    setQuery('');
    setCompFilter('all');

    try {
      const response = await postCalculate<SEOKeywordsResponse>('/api/seo-keywords', {
        productName: productNameValue,
        keyFeatures: keyFeaturesValue,
      });
      setResult(response);
      setActiveTab('top');
      persistRecent({ productName: productNameValue, keyFeatures: keyFeaturesValue });

      const target = Math.min(220, Math.floor(presetCfg.limit * 0.88));
      const ordered = [
        ...response.platinumKeywords,
        ...response.topSearchTerms,
        ...response.misspellings,
      ];
      let text = '';
      for (const term of ordered) {
        if (isTermInText(term, text)) continue;
        const candidate = (text + ' ' + term).trim();
        if (measureByPlatform(candidate, platformValue) <= target) {
          text = candidate;
        }
      }
      setBuilderText(text);
      showToast(`Demo loaded: ${label}`, 'ok');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Demo could not load. Please try again in a moment.',
      );
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = (preset: (typeof SAMPLE_PRESETS)[number]) =>
    runDemoLoad(preset.productName, preset.keyFeatures, preset.platform, preset.label);

  /** Clicking a Recent search restores + regenerates its keywords immediately. */
  const useRecent = (r: { productName: string; keyFeatures: string }) => {
    runDemoLoad(r.productName, r.keyFeatures, platform, r.productName);
  };

  /** Purely derived: is this preset the one currently reflected in the form? */
  const isPresetActive = (preset: (typeof SAMPLE_PRESETS)[number]) =>
    productName === preset.productName &&
    keyFeatures === preset.keyFeatures &&
    platform === preset.platform;

  /* ------------------------------ Copy ------------------------------ */
  const copy = async (text: string, section: string, label = 'Copied!') => {
    if (!text.trim()) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedSection(section);
      showToast(label, 'ok');
      window.setTimeout(() => setCopiedSection(null), 2000);
    } catch {
      showToast('Copy failed — please copy manually', 'err');
    }
  };

  /* ------------------------------ CSV ------------------------------- */
  const exportCsv = () => {
    if (!result) return;
    const rows: string[][] = [
      [
        'Keyword',
        'Category',
        'Est. Monthly Volume',
        'Relevance',
        'Competition',
        'Byte Size',
        'In Backend',
      ],
    ];
    (Object.keys(categories) as Category[]).forEach((c) =>
      categories[c].forEach((t) => {
        const m = getMetrics(t, c);
        rows.push([
          t,
          c,
          String(m.volume),
          `${m.relevance}%`,
          `${m.competition} (${competitionLabel(m.competition)})`,
          String(byteSize(t)),
          isTermInText(t, builderText) ? 'Yes' : 'No',
        ]);
      }),
    );
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seo-keywords-${productName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'export'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('CSV exported', 'ok');
  };

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <style>{`
        @keyframes kwFadeUp { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform: translateY(0); } }
        .kw-fade-up { animation: kwFadeUp .35s cubic-bezier(.22,1,.36,1) both; }
        @keyframes kwShimmer { 100% { transform: translateX(100%); } }
        .kw-shimmer::after { content:''; position:absolute; inset:0; transform: translateX(-100%);
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent);
          animation: kwShimmer 1.8s infinite; }
        @media (prefers-reduced-motion: reduce) {
          .kw-fade-up, .kw-shimmer::after { animation: none !important; }
        }
      `}</style>

      <div className="mx-auto w-full max-w-[1360px] px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-6 box-border overflow-x-hidden">
        {/* Studio Header */}
        <div className="relative select-none">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-24 max-w-md rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 opacity-20 blur-3xl" />
          <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200/80 bg-white/80 p-5 shadow-xl backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/80 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI-Powered SEO Studio
                </div>
                <h1 className="truncate text-2xl font-bold text-zinc-900 dark:text-zinc-50 md:text-3xl">
                  SEO Keyword Generator
                </h1>
                <p className="mt-1 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
                  Generate high-converting search terms for Amazon India, Flipkart & Meesho — then
                  build a backend string that fits the exact byte limit.
                </p>
              </div>
              {result && (
                <div className="flex shrink-0 items-center gap-2 self-start rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <Check className="h-3.5 w-3.5" />
                  {stats?.total ?? 0} keywords ready
                </div>
              )}
            </div>

            {/* 1-Click Sample Demo Bar — 4 preset pills only, active pill highlighted */}
            <div className="min-w-0 select-none">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                ✨ Try Sample Demo:
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {SAMPLE_PRESETS.map((s) => {
                  const active = isPresetActive(s);
                  return (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => loadPreset(s)}
                      disabled={loading}
                      aria-pressed={active}
                      className={`group max-w-full truncate rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 ${
                        active
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 shadow-sm shadow-emerald-500/20 dark:text-emerald-300'
                          : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-emerald-500/40 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-emerald-500/10 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300'
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* LEFT COLUMN */}
          <div className="min-w-0 space-y-6 lg:col-span-7">
            {/* Input card */}
            <div className="rounded-2xl border border-zinc-200/80 bg-white/80 p-5 shadow-xl backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/80 sm:p-6">
              {/* Platform tabs */}
              <div className="mb-5 select-none">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  <Layers className="h-3.5 w-3.5" /> Target Marketplace
                </div>
                <div className="grid grid-cols-3 gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800/60">
                  {PLATFORMS.map((p) => {
                    const active = p.id === platform;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPlatform(p.id)}
                        className={`truncate rounded-lg px-1.5 py-2 text-xs font-semibold transition-all duration-200 sm:text-sm ${
                          active
                            ? 'bg-white text-emerald-600 shadow-sm dark:bg-zinc-700 dark:text-emerald-400'
                            : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                        }`}
                      >
                        {p.short}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-500">
                  <Info className="h-3 w-3 shrink-0" /> {platformCfg.hint}
                </p>
              </div>

              <div className="space-y-4">
                <div className="select-none">
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Product Name / Category <span className="text-emerald-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !loading) handleGenerate();
                      }}
                      placeholder="e.g., Cotton Bedsheet, Wireless Earbuds"
                      className="w-full rounded-xl border border-zinc-300 bg-zinc-100 px-4 py-3 pr-16 text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 select-none text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">
                      {productName.length}/80
                    </span>
                  </div>
                </div>

                <div className="select-none">
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Key Features or Target Audience{' '}
                    <span className="text-zinc-400 dark:text-zinc-500">(optional)</span>
                  </label>
                  <textarea
                    value={keyFeatures}
                    onChange={(e) => setKeyFeatures(e.target.value)}
                    placeholder="e.g., 100% cotton, king size, for double beds"
                    rows={3}
                    maxLength={400}
                    className="w-full resize-none rounded-xl border border-zinc-300 bg-zinc-100 px-4 py-3 text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  />
                  <div className="mt-1 text-right text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">
                    {keyFeatures.length}/400
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="flex-1">{error}</div>
                    <button
                      type="button"
                      onClick={handleGenerate}
                      className="shrink-0 rounded-md p-1 transition-colors hover:bg-red-500/10"
                      aria-label="Retry"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={loading || !productName.trim()}
                  className="group relative flex w-full select-none items-center justify-center gap-2 overflow-hidden rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:bg-emerald-400 hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[.99] disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none dark:disabled:bg-zinc-700"
                >
                  {loading ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Generating Keywords...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
                      Generate SEO Keywords
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Skeletons */}
            {loading && (
              <div className="rounded-2xl border border-zinc-200/80 bg-white/80 p-5 shadow-xl backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/80 sm:p-6">
                <div className="mb-4 h-8 w-2/5 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-8 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800"
                      style={{ width: `${60 + ((i * 37) % 90)}px`, animationDelay: `${i * 40}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Results */}
            {result && (
              <div className="kw-fade-up space-y-4">
                {stats && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { icon: Layers, label: 'Keywords', value: stats.total, tone: 'text-zinc-900 dark:text-zinc-100' },
                      { icon: Target, label: 'Avg. relevance', value: `${stats.avgRelevance}%`, tone: 'text-emerald-600 dark:text-emerald-400' },
                      { icon: BarChart3, label: 'Avg. volume', value: `${fmtNum(stats.avgVolume)}/mo`, tone: 'text-teal-600 dark:text-teal-400' },
                      { icon: Gauge, label: 'Low competition', value: stats.lowCompetition, tone: 'text-amber-600 dark:text-amber-400' },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="group min-w-0 select-none rounded-xl border border-zinc-200/80 bg-white/80 p-3 shadow-sm backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/80"
                      >
                        <div className="flex items-center gap-1.5 truncate text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400 sm:text-[11px]">
                          <s.icon className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{s.label}</span>
                        </div>
                        <div className={`mt-1 truncate text-lg font-bold tabular-nums ${s.tone}`}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-2xl border border-zinc-200/80 bg-white/80 shadow-xl backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/80">
                  {/* Tabs */}
                  <div className="flex flex-wrap gap-2 border-b border-zinc-200/80 p-4 dark:border-zinc-800/80">
                    {TABS.map((t) => {
                      const active = t.id === activeTab;
                      const count = categories[t.id].length;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setActiveTab(t.id)}
                          className={`flex select-none items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 sm:text-sm ${
                            active
                              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 dark:bg-zinc-800/60 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
                          }`}
                        >
                          <t.icon className="h-3.5 w-3.5 shrink-0" />
                          <span className="hidden sm:inline">{t.label}</span>
                          <span className="sm:hidden">{t.short}</span>
                          <span
                            className={`rounded px-1 text-[10px] tabular-nums ${
                              active ? 'bg-white/20' : 'bg-zinc-200 dark:bg-zinc-700'
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Toolbar */}
                  <div className="space-y-3 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <div className="relative min-w-0 flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <input
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Filter keywords..."
                          className="w-full rounded-lg border border-zinc-300 bg-zinc-100 py-2 pl-9 pr-8 text-sm text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100"
                        />
                        {query && (
                          <button
                            type="button"
                            onClick={() => setQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                            aria-label="Clear filter"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <ArrowUpDown className="h-4 w-4 shrink-0 text-zinc-400" />
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as SortKey)}
                          className="min-w-0 rounded-lg border border-zinc-300 bg-zinc-100 px-2 py-2 text-sm text-zinc-700 outline-none transition-colors focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300"
                        >
                          <option value="relevance">Relevance</option>
                          <option value="volume">Volume</option>
                          <option value="competition">Low competition</option>
                          <option value="az">A → Z</option>
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            copy(
                              visibleTerms.map((v) => v.term).join(', '),
                              `tab-${activeTab}`,
                              `${visibleTerms.length} keywords copied — Copied!`,
                            )
                          }
                          className="shrink-0 rounded-lg bg-zinc-100 p-2 text-zinc-600 transition-all hover:bg-zinc-200 hover:text-zinc-900 active:scale-95 dark:bg-zinc-800/50 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                          aria-label="Copy visible keywords"
                        >
                          {copiedSection === `tab-${activeTab}` ? (
                            <Check className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Comp filter + legend */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-1.5 select-none">
                        {COMP_FILTERS.map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setCompFilter(f.id)}
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all duration-200 ${
                              compFilter === f.id
                                ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25'
                                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-400 dark:hover:bg-zinc-800'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Low
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-amber-500" /> Medium
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-red-500" /> High
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Chips */}
                  <div className="border-t border-zinc-200/80 p-4 dark:border-zinc-800/80">
                    {visibleTerms.length === 0 ? (
                      <div className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
                        No keywords match your filters.
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {visibleTerms.map(({ term, category, m }, index) => {
                          const isAdded = isTermInText(term, builderText);
                          const bytes = byteSize(term);
                          return (
                            <button
                              key={`${category}-${term}`}
                              type="button"
                              onClick={() => toggleKeyword(term)}
                              title={`Volume: ${fmtNum(m.volume)}/mo · Relevance: ${m.relevance}% · Competition: ${competitionLabel(m.competition)} · ${bytes}B`}
                              style={{ animationDelay: `${Math.min(index, 14) * 22}ms` }}
                              className={`kw-fade-up group relative inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 active:translate-y-0 ${
                                isAdded
                                  ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-700 shadow-sm shadow-emerald-500/20 dark:text-emerald-300'
                                  : 'border-zinc-200/70 bg-zinc-100 text-zinc-700 hover:border-emerald-500/40 hover:bg-white dark:border-zinc-700/50 dark:bg-zinc-800/50 dark:text-zinc-300 dark:hover:border-emerald-500/40 dark:hover:bg-zinc-800'
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${competitionTone(m.competition)}`} />
                              <span className="min-w-0 break-words text-left">{term}</span>
                              <span className="shrink-0 rounded bg-zinc-900/5 px-1 text-[10px] font-semibold tabular-nums text-zinc-500 dark:bg-white/5 dark:text-zinc-400">
                                {fmtNum(m.volume)}
                              </span>
                              {isAdded ? (
                                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                              ) : (
                                <Plus className="h-3.5 w-3.5 shrink-0 opacity-40 transition-opacity duration-200 group-hover:opacity-100" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <p className="mt-4 flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-500">
                      <Info className="h-3 w-3 shrink-0" />
                      {TABS.find((t) => t.id === activeTab)?.desc}. Tap any chip to add or remove it from the builder.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="select-none rounded-xl border border-zinc-200/50 bg-zinc-50/80 p-4 dark:border-zinc-800/50 dark:bg-zinc-900/50">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                Pro Tips
              </h4>
              <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                <li>• Use specific categories (“Cotton Bedsheet”, not “Bedsheet”) for sharper keyword sets.</li>
                <li>• Amazon counts <strong>bytes</strong>: accented/regional characters cost 2 bytes each.</li>
                <li>• Mix Platinum keywords into your title; keep long-tail terms for bullet points.</li>
                <li>• Use <strong>Dedupe Words</strong> — Amazon ignores repeated words and it saves 30–50% of the limit.</li>
              </ul>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <aside className="min-w-0 space-y-4 self-start lg:sticky lg:top-24 lg:col-span-5">
            {/* Backend builder */}
            <div className="rounded-2xl border border-zinc-200/80 bg-white/80 p-5 shadow-xl backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/80">
              <div className="mb-3 flex items-center gap-2 select-none">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10">
                  <ShoppingBag className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Backend Keyword Builder
                  </h3>
                  <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">{platformCfg.label} limit</p>
                </div>
              </div>

              {/* Byte meter */}
              <div className="mb-3 select-none">
                <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium">
                  <span className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                    <Gauge className="h-3 w-3" /> {platformCfg.unit === 'bytes' ? 'Bytes' : 'Characters'} used
                  </span>
                  <span className={`tabular-nums ${usedTextClass}`}>
                    {used}/{platformCfg.limit}
                  </span>
                </div>
                <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className={`kw-shimmer relative h-full rounded-full transition-all duration-500 ${meterToneClass}`}
                    style={{ width: `${usedPct}%` }}
                  />
                </div>
              </div>

              {/* Dedupe saved badge */}
              {dedupedSaved > 0 && (
                <div className="kw-fade-up mb-2 flex items-center gap-1.5 select-none rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <Check className="h-3 w-3" /> Saved {dedupedSaved} {platformCfg.unit === 'bytes' ? 'bytes' : 'chars'}
                </div>
              )}

              {/* Editable builder textarea */}
              <textarea
                value={builderText}
                onChange={(e) => setBuilderText(e.target.value)}
                placeholder="Click keywords above, or type directly here..."
                rows={4}
                className="mb-3 w-full resize-none rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 px-3 py-2.5 text-sm text-zinc-800 outline-none transition-colors placeholder:text-zinc-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-700 dark:bg-zinc-800/30 dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:bg-zinc-800/60"
              />

              {/* Selected chips (removable) */}
              {selectedKeywords.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {selectedKeywords.map((term) => (
                    <span
                      key={term}
                      className="group inline-flex max-w-full items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300"
                    >
                      <span className="min-w-0 truncate">{term}</span>
                      <button
                        type="button"
                        onClick={() => toggleKeyword(term)}
                        className="shrink-0 rounded p-0.5 transition-colors hover:bg-emerald-500/20"
                        aria-label={`Remove ${term}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => copy(builderText, 'builder', 'Copied!')}
                  disabled={!builderText.trim()}
                  className="flex select-none items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-500/25 transition-all hover:bg-emerald-400 active:scale-[.98] disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none dark:disabled:bg-zinc-700"
                >
                  {copiedSection === 'builder' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  Copy
                </button>
                <button
                  type="button"
                  onClick={autoFill}
                  disabled={!result}
                  className="flex select-none items-center justify-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-700 transition-all hover:bg-zinc-200 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-800/60 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <Wand2 className="h-3.5 w-3.5" /> Auto-fill
                </button>
                <button
                  type="button"
                  onClick={deduplicateWords}
                  disabled={!builderText.trim()}
                  className="flex select-none items-center justify-center gap-1.5 rounded-lg bg-teal-500/10 px-3 py-2 text-xs font-semibold text-teal-700 transition-all hover:bg-teal-500/20 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 dark:text-teal-300"
                >
                  <Eraser className="h-3.5 w-3.5" /> Dedupe Words
                </button>
                <button
                  type="button"
                  onClick={exportCsv}
                  disabled={!result}
                  className="flex select-none items-center justify-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-700 transition-all hover:bg-zinc-200 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-800/60 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <Download className="h-3.5 w-3.5" /> CSV
                </button>
                <button
                  type="button"
                  onClick={clearBuilder}
                  disabled={!builderText.trim()}
                  className="col-span-2 flex select-none items-center justify-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-700 transition-all hover:bg-red-500/10 hover:text-red-600 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-800/60 dark:text-zinc-300 dark:hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Clear
                </button>
              </div>
            </div>

            {/* Recent searches */}
            {recent.length > 0 && (
              <div className="rounded-2xl border border-zinc-200/80 bg-white/80 p-5 shadow-xl backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/80">
                <div className="mb-3 flex items-center gap-2 select-none">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10">
                    <History className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                  </div>
                  <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">Recent searches</h3>
                </div>
                <div className="space-y-1.5">
                  {recent.map((r) => (
                    <button
                      key={r.productName}
                      type="button"
                      onClick={() => useRecent(r)}
                      disabled={loading}
                      className="group flex w-full items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-left text-xs transition-all hover:border-zinc-200 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/60"
                    >
                      <Clock className="h-3.5 w-3.5 shrink-0 text-zinc-400 transition-colors group-hover:text-emerald-500" />
                      <span className="min-w-0 truncate text-zinc-700 dark:text-zinc-300">{r.productName}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          className={`kw-fade-up fixed bottom-6 left-1/2 z-50 flex max-w-[90vw] -translate-x-1/2 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-2xl backdrop-blur-xl ${
            toast.tone === 'ok'
              ? 'border-emerald-500/30 bg-white/95 text-emerald-700 dark:bg-zinc-900/95 dark:text-emerald-300'
              : 'border-red-500/30 bg-white/95 text-red-600 dark:bg-zinc-900/95 dark:text-red-400'
          }`}
        >
          {toast.tone === 'ok' ? <Check className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <span className="truncate">{toast.msg}</span>
        </div>
      )}
    </div>
  );
}