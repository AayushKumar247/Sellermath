import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import {
  Sparkles, Copy, Check, Rocket, LayoutList, FileText, ShoppingBag,
  Tag, Gauge, TrendingUp, ChevronDown, ChevronUp, Download, History,
  RefreshCw, AlertCircle, CheckCircle2, XCircle, Zap, Target, Trash2,
  Crown, Smile, Briefcase, Lightbulb, X, ArrowRight, Loader2, Star,
  Eye, ClipboardList, Wand2,
} from 'lucide-react';
import MarketplaceLogo from '@/components/MarketplaceLogo';

/* ================= TYPES ================= */
type Marketplace = 'Amazon India' | 'Flipkart' | 'Meesho' | 'Myntra';
type Tone = 'Professional' | 'Conversational' | 'Luxury' | 'Value';
type Category = 'apparel' | 'bottle' | 'electronics' | 'fitness' | 'kitchen' | 'general';
type ViewMode = 'seo' | 'preview';

interface ListingResult { title: string; description: string; highlights: string[]; }
interface MarketplaceSpec {
  titleMax: number; bullets: number; bulletMax: number;
  descMin: number; descMax: number; tagline: string;
  guidance: string; indexingTip: string; icon: typeof ShoppingBag;
}
interface QualityCheck { label: string; pass: boolean; detail: string; weight: number; }
interface HistoryItem {
  id: string; marketplace: Marketplace; tone: Tone;
  productName: string; keyFeatures: string; targetKeywords: string[];
  result: ListingResult; score: number; createdAt: number;
}
interface ToastMsg { id: number; type: 'success' | 'error' | 'info'; msg: string; }
interface Preset {
  label: string; productName: string; keyFeatures: string;
  targetKeywords: string[]; marketplace: Marketplace; tone: Tone;
}

/* ================= SPECS ================= */
const MARKETPLACE_SPECS: Record<Marketplace, MarketplaceSpec> = {
  'Amazon India': {
    titleMax: 200, bullets: 5, bulletMax: 500, descMin: 200, descMax: 2000,
    tagline: 'SEO-rich • keyword-dense',
    guidance: 'Keyword-dense title, exactly 5 benefit-led bullets, comprehensive description.',
    indexingTip: 'Front-load your primary keyword in first 60 chars — mobile CTR drops 40% past that.',
    icon: ShoppingBag,
  },
  Flipkart: {
    titleMax: 120, bullets: 5, bulletMax: 250, descMin: 150, descMax: 1500,
    tagline: 'Concise • scannable',
    guidance: 'Short title, exactly 5 bullets. Lead with specs, dimensions, material.',
    indexingTip: 'Place top spec keywords in title — 80% of mobile traffic skims only first 100 chars.',
    icon: Zap,
  },
  Meesho: {
    titleMax: 100, bullets: 5, bulletMax: 200, descMin: 100, descMax: 1000,
    tagline: 'Simple • value-first',
    guidance: 'Plain-language bullets, value & affordability focused, short sentences.',
    indexingTip: 'Use plain, searchable words — jargon reduces discoverability on Meesho vernacular search.',
    icon: Tag,
  },
  Myntra: {
    titleMax: 110, bullets: 5, bulletMax: 300, descMin: 150, descMax: 1500,
    tagline: 'Fashion • aspirational',
    guidance: 'Fashion-forward title, 5 bullets on fabric, fit, style, care, occasion.',
    indexingTip: 'Include fabric, fit, and occasion in bullets — shoppers filter by these attributes.',
    icon: Crown,
  },
};

/* ================= TONES ================= */
const TONES: { key: Tone; icon: typeof Briefcase; hint: string }[] = [
  { key: 'Professional', icon: Briefcase, hint: 'Trust & clarity' },
  { key: 'Conversational', icon: Smile, hint: 'Friendly & warm' },
  { key: 'Luxury', icon: Crown, hint: 'Premium & aspirational' },
  { key: 'Value', icon: Target, hint: 'Budget-conscious' },
];

/* ================= PRESETS ================= */
const PRESETS: Preset[] = [
  {
    label: 'Cotton Kurta',
    productName: "Men's Pure Cotton Chikankari Straight Kurta",
    keyFeatures: '100% breathable Mulmul cotton fabric, authentic hand-embroidered Lucknowi Chikankari design, regular comfort fit tailored for Indian body types, side pockets for everyday utility, colorfast machine-washable fabric, ideal for Diwali, weddings & casual ethnic wear',
    targetKeywords: ['cotton kurta men', 'festive wear kurta', 'chikankari kurta', 'ethnic wear', 'menswear'],
    marketplace: 'Amazon India', tone: 'Professional',
  },
  {
    label: 'Steel Bottle',
    productName: 'Stainless Steel Vacuum Insulated Water Bottle 1L',
    keyFeatures: 'Food-grade 304 stainless steel, BPA-free and rust-resistant, double-wall vacuum insulation keeps drinks hot 24 hrs and cold 24 hrs, leak-proof lid with silicone gasket, wide-mouth design for easy cleaning, sweat-free matte finish for comfortable grip',
    targetKeywords: ['steel water bottle', 'insulated bottle', '1 litre bottle', 'thermos flask', 'gym bottle'],
    marketplace: 'Flipkart', tone: 'Professional',
  },
  {
    label: 'Wireless Earbuds',
    productName: 'Wireless Bluetooth 5.3 Earbuds with ENC Mic',
    keyFeatures: 'Bluetooth 5.3 for stable low-latency connectivity, 30-hour total playtime with charging case, IPX5 sweat and splash resistant, smart touch controls with voice assistant, dual-mic ENC for crystal-clear calls, fast USB-C charging',
    targetKeywords: ['wireless earbuds', 'bluetooth earbuds', 'tws earbuds', 'enc mic earbuds', 'earbuds for calls'],
    marketplace: 'Amazon India', tone: 'Conversational',
  },
  {
    label: 'Yoga Mat',
    productName: 'Anti-Slip Eco-Friendly TPE Yoga Mat 6mm',
    keyFeatures: 'Eco-friendly TPE material non-toxic and odor-free, 6mm optimal thickness for joint cushioning, dual-sided anti-slip texture, includes carry strap for easy transport, easy wipe-clean surface, ideal for yoga pilates and home workouts',
    targetKeywords: ['yoga mat', 'anti-slip yoga mat', 'tpe yoga mat', '6mm yoga mat', 'exercise mat'],
    marketplace: 'Myntra', tone: 'Luxury',
  },
];

/* ================= CATEGORY FALLBACK BULLETS ================= */
const CATEGORY_BULLETS: Record<Category, string[]> = {
  apparel: [
    'Premium breathable fabric — skin-friendly and comfortable all day',
    'Thoughtfully tailored fit designed for Indian body types',
    'Handcrafted detailing adds a refined, festive finish',
    'Colorfast and machine washable — retains shape after repeated washes',
    'Versatile styling — perfect for festivals, weddings and casual outings',
  ],
  bottle: [
    'Food-grade stainless steel — rust-free and BPA-free',
    'Double-wall insulation keeps drinks hot or cold for hours',
    'Leak-proof lid with secure silicone gasket — travel and gym safe',
    'Wide-mouth design — easy to clean and add ice cubes',
    'Sweat-free exterior finish — comfortable to hold',
  ],
  electronics: [
    'Latest Bluetooth chipset — stable, low-latency connection',
    'Long-lasting battery — extended playback per charge',
    'Smart touch controls with voice assistant support',
    'IPX-rated water resistance — sweat and splash proof',
    'Fast USB-C charging — quick top-ups on the go',
  ],
  fitness: [
    'Premium eco-friendly material — non-toxic and odor-free',
    'Optimal thickness — cushioning without losing balance',
    'Dual-sided anti-slip texture — grips any surface',
    'Includes carry strap — easy transport to gym and travel',
    'Easy wipe-clean surface — low-maintenance and durable',
  ],
  kitchen: [
    'Food-grade material — safe for daily cooking',
    'Even heat distribution — consistent cooking results',
    'Ergonomic handle — comfortable, heat-resistant grip',
    'Easy-to-clean non-stick surface — minimal oil usage',
    'Durable construction — designed for long-term use',
  ],
  general: [
    'Premium quality construction — built to last',
    'Thoughtfully designed for daily use and comfort',
    'Easy to use and maintain',
    'Great value-for-money choice',
    'Sleek design that complements any setting',
  ],
};

/* ================= STYLES ================= */
const glass =
  'rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl shadow-xl shadow-zinc-200/40 dark:shadow-black/60';
const inputCls =
  'w-full text-sm font-medium text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800/60 rounded-xl border border-zinc-200/80 dark:border-zinc-700/80 px-4 py-3 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500 outline-none transition-all';
const labelCls =
  'flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 select-none';

/* ================= HELPERS ================= */
function detectCategory(name: string, features: string): Category {
  const t = (name + ' ' + features).toLowerCase();
  if (/kurta|kurti|saree|shirt|t-shirt|tshirt|dress|top|jeans|pant|lehenga|ethnic|apparel|clothing|wear|trouser/.test(t)) return 'apparel';
  if (/bottle|flask|tumbler|thermos|mug/.test(t)) return 'bottle';
  if (/earbud|headphone|speaker|charger|cable|powerbank|bluetooth|wireless|earphone/.test(t)) return 'electronics';
  if (/yoga|mat|exercise|fitness|gym|dumbbell|resistance/.test(t)) return 'fitness';
  if (/kitchen|pan|pot|knife|container|storage|cook/.test(t)) return 'kitchen';
  return 'general';
}

function buildTitle(name: string, market: Marketplace, category: Category): string {
  const suffix: Record<Category, string> = {
    apparel: 'Premium Breathable Mulmul, Regular Fit, Ideal for Festive & Ethnic Wear',
    bottle: 'Food-Grade Stainless Steel, Double-Wall Insulated, Leak-Proof',
    electronics: 'Bluetooth 5.3, Long Battery Life, IPX5 Water Resistant',
    fitness: 'Eco-Friendly Material, Anti-Slip, Includes Carry Strap',
    kitchen: 'Food-Grade, Even Heat Distribution, Ergonomic Grip',
    general: 'Premium Quality, Durable & Reliable',
  };
  let title = `${name} — ${suffix[category]}`;
  const max = MARKETPLACE_SPECS[market].titleMax;
  if (title.length > max) title = title.slice(0, max - 1).trim() + '…';
  return title;
}

function buildBullets(features: string, category: Category): string[] {
  const parts = features.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  const bullets: string[] = [];
  for (const p of parts) {
    if (bullets.length >= 5) break;
    if (category === 'apparel' && /warranty|guarantee/i.test(p)) continue;
    bullets.push(p.charAt(0).toUpperCase() + p.slice(1));
  }
  const defaults = CATEGORY_BULLETS[category];
  for (const d of defaults) {
    if (bullets.length >= 5) break;
    if (!bullets.some((b) => b.toLowerCase() === d.toLowerCase())) bullets.push(d);
  }
  return bullets.slice(0, 5);
}

function buildDescription(name: string, features: string, keywords: string[], category: Category, tone: Tone): string {
  const featList = features.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  const toneWord: Record<Tone, string> = { Professional: 'thoughtful', Conversational: 'friendly', Luxury: 'exquisite', Value: 'smart' };
  const noun: Record<Category, string> = { apparel: 'wardrobe', bottle: 'essentials collection', electronics: 'tech setup', fitness: 'fitness routine', kitchen: 'kitchen', general: 'everyday collection' };
  const tail: Record<Category, string> = {
    apparel: 'Perfect for festive occasions, family gatherings, and everyday ethnic wear.',
    bottle: 'A dependable companion for the office, gym, travel, and outdoor adventures.',
    electronics: 'Tuned for premium everyday performance — from calls and commutes to workouts.',
    fitness: 'Engineered for safe, effective workouts at home, the studio, or outdoors.',
    kitchen: 'Designed for effortless daily cooking with reliable, long-term performance.',
    general: 'Crafted for reliable everyday use with attention to the details that matter.',
  };
  const intro = `Elevate your ${noun[category]} with the ${name} — a standout choice that blends ${toneWord[tone]} craftsmanship with everyday practicality.`;
  const feat = featList.length ? `Built around ${featList.slice(0, 3).join(', ')}, this product delivers on both form and function.` : '';
  let text = [intro, feat, tail[category]].filter(Boolean).join(' ');
  const missing = keywords.filter((k) => k && !text.toLowerCase().includes(k.toLowerCase()));
  if (missing.length > 0) text += ` A perfect pick for shoppers searching for ${missing.join(', ')}.`;
  return text;
}

function buildListing(productName: string, features: string, marketplace: Marketplace, keywords: string[], tone: Tone): ListingResult {
  const category = detectCategory(productName, features);
  return {
    title: buildTitle(productName, marketplace, category),
    highlights: buildBullets(features, category),
    description: buildDescription(productName, features, keywords, category, tone),
  };
}

function scoreRawInput(name: string, features: string): number {
  let s = 12;
  if (name.trim().length >= 12) s += 8;
  if (name.trim().length >= 25) s += 8;
  const parts = features.split(/[,;]/).filter(Boolean).length;
  s += Math.min(parts * 3, 15);
  return Math.min(s, 45);
}

function mockPrice(category: Category): { price: number; mrp: number } {
  const map: Record<Category, { price: number; mrp: number }> = {
    apparel: { price: 1299, mrp: 1999 },
    bottle: { price: 649, mrp: 999 },
    electronics: { price: 1499, mrp: 2999 },
    fitness: { price: 799, mrp: 1299 },
    kitchen: { price: 749, mrp: 1199 },
    general: { price: 999, mrp: 1499 },
  };
  return map[category];
}

/* ================= MAIN COMPONENT ================= */
export default function MarketplaceOptimizer() {
  const [productName, setProductName] = useState('');
  const [keyFeatures, setKeyFeatures] = useState('');
  const [marketplace, setMarketplace] = useState<Marketplace>('Amazon India');
  const [tone, setTone] = useState<Tone>('Professional');
  const [targetKeywords, setTargetKeywords] = useState<string[]>([]);
  const [keywordDraft, setKeywordDraft] = useState('');
  const [result, setResult] = useState<ListingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGuidance, setShowGuidance] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('seo');
  const [copied, setCopied] = useState({
    title: false, bullets: false, description: false, all: false,
    bulletIdx: null as number | null,
  });
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const spec = MARKETPLACE_SPECS[marketplace];

  const pushToast = useCallback((type: ToastMsg['type'], msg: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2400);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('listing-history');
      if (raw) setHistory(JSON.parse(raw).slice(0, 6));
    } catch { /* ignore */ }
  }, []);

  const saveHistory = useCallback((item: HistoryItem) => {
    setHistory((prev) => {
      const next = [item, ...prev].slice(0, 6);
      try { localStorage.setItem('listing-history', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const addKeyword = useCallback(() => {
    const k = keywordDraft.trim().toLowerCase();
    if (!k) return;
    if (targetKeywords.includes(k)) { setKeywordDraft(''); return; }
    setTargetKeywords((p) => [...p, k].slice(0, 8));
    setKeywordDraft('');
  }, [keywordDraft, targetKeywords]);

  const removeKeyword = (k: string) => setTargetKeywords((p) => p.filter((x) => x !== k));

  const onKeywordKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addKeyword(); }
    else if (e.key === 'Backspace' && !keywordDraft && targetKeywords.length) {
      setTargetKeywords((p) => p.slice(0, -1));
    }
  };

  /* ---- generate (API + fallback) ---- */
  const generateListing = useCallback(async () => {
    if (!productName.trim() || !keyFeatures.trim()) {
      setError('Product name and key features are required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/optimize-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: productName.trim(),
          category: marketplace,
          keyFeatures: keyFeatures.trim(),
          targetKeywords: targetKeywords.join(', '),
          tone,
        }),
      });
      if (!response.ok) throw new Error('API returned an error');
      const data = await response.json();
      const next: ListingResult = {
        title: data.title || productName.trim(),
        description: data.description || '',
        highlights: Array.isArray(data.highlights)
          ? data.highlights.slice(0, 5)
          : Array.isArray(data.bullets) ? data.bullets.slice(0, 5) : [],
      };
      setResult(next);
      pushToast('success', 'Listing generated');
    } catch (err) {
      const fallback = buildListing(productName, keyFeatures, marketplace, targetKeywords, tone);
      setResult(fallback);
      const msg = err instanceof Error ? `${err.message} — using offline fallback` : 'Using offline fallback generator';
      setError(msg);
      pushToast('info', 'Fallback generator used');
    } finally {
      setLoading(false);
    }
  }, [productName, keyFeatures, marketplace, targetKeywords, tone, pushToast]);

  const loadPreset = useCallback((preset: Preset) => {
    setProductName(preset.productName);
    setKeyFeatures(preset.keyFeatures);
    setTargetKeywords(preset.targetKeywords);
    setMarketplace(preset.marketplace);
    setTone(preset.tone);
    setError(null);
    setResult(buildListing(preset.productName, preset.keyFeatures, preset.marketplace, preset.targetKeywords, preset.tone));
    pushToast('success', 'Sample demo loaded');
  }, [pushToast]);

  const loadSampleDemo = () => loadPreset(PRESETS[0]);

  /* ---- scoring ---- */
  const analysis = useMemo(() => {
    if (!result) return null;
    const checks: QualityCheck[] = [];
    const titleLen = result.title.length;
    checks.push({ label: 'Title length', pass: titleLen > 0 && titleLen <= spec.titleMax, detail: `${titleLen}/${spec.titleMax} chars`, weight: 20 });
    checks.push({ label: 'Bullet count', pass: result.highlights.length === spec.bullets, detail: `${result.highlights.length}/${spec.bullets}`, weight: 20 });
    const avgBullet = result.highlights.reduce((a, b) => a + b.length, 0) / Math.max(1, result.highlights.length);
    checks.push({ label: 'Bullet depth', pass: avgBullet >= 40 && avgBullet <= spec.bulletMax, detail: `${Math.round(avgBullet)} avg`, weight: 15 });
    const descWords = result.description.trim().split(/\s+/).filter(Boolean).length;
    checks.push({ label: 'Description depth', pass: descWords >= 50, detail: `${descWords} words`, weight: 20 });
    const kw = targetKeywords.filter(Boolean);
    const hay = (result.title + ' ' + result.description + ' ' + result.highlights.join(' ')).toLowerCase();
    const hits = kw.filter((k) => hay.includes(k.toLowerCase())).length;
    checks.push({ label: 'Keyword coverage', pass: kw.length === 0 || hits === kw.length, detail: kw.length === 0 ? 'None set' : `${hits}/${kw.length}`, weight: 15 });
    checks.push({ label: 'Bullet spec fit', pass: result.highlights.every((b) => b.length <= spec.bulletMax), detail: `≤${spec.bulletMax}/bullet`, weight: 10 });
    const score = Math.round(checks.reduce((acc, c) => acc + (c.pass ? c.weight : c.weight * 0.25), 0));
    return { score, checks };
  }, [result, spec, targetKeywords]);

  const keywordMatches = useMemo(() => {
    if (!result) return [];
    const hay = (result.title + ' ' + result.description + ' ' + result.highlights.join(' ')).toLowerCase();
    return targetKeywords.map((k) => ({ keyword: k, match: hay.includes(k.toLowerCase()) }));
  }, [result, targetKeywords]);

  const copyToClipboard = async (text: string, kind: 'title' | 'bullets' | 'description' | 'all' | 'single', idx?: number) => {
    try {
      await navigator.clipboard.writeText(text);
      if (kind === 'single') {
        setCopied((p) => ({ ...p, bulletIdx: idx ?? null }));
        setTimeout(() => setCopied((p) => ({ ...p, bulletIdx: null })), 1500);
        pushToast('info', 'Bullet copied');
      } else {
        setCopied((p) => ({ ...p, [kind]: true }));
        setTimeout(() => setCopied((p) => ({ ...p, [kind]: false })), 1500);
        pushToast('info', kind === 'all' ? 'Everything copied' : 'Copied');
      }
    } catch { pushToast('error', 'Clipboard unavailable'); }
  };

  const copyEverything = () => {
    if (!result) return;
    const text = [result.title, '', ...result.highlights.map((b, i) => `${i + 1}. ${b}`), '', result.description].join('\n');
    copyToClipboard(text, 'all');
  };

  const exportListing = () => {
    if (!result) return;
    const text = [
      `# ${marketplace} — ${tone}`, `Product: ${productName}`, '',
      `## Title`, result.title, '',
      `## Bullets`, ...result.highlights.map((b, i) => `${i + 1}. ${b}`), '',
      `## Description`, result.description,
    ].join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${productName.replace(/\s+/g, '-').toLowerCase()}-${marketplace.replace(/\s+/g, '-').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast('success', 'Listing exported');
  };

  const resetAll = () => {
    setProductName(''); setKeyFeatures(''); setTargetKeywords([]);
    setResult(null); setError(null); pushToast('info', 'Cleared');
  };

  const onGlobalKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!loading) generateListing();
    }
  };

  const bulletsText = result?.highlights.map((b, i) => `${i + 1}. ${b}`).join('\n') || '';
  const rawScore = scoreRawInput(productName, keyFeatures);
  const scoreColor = !analysis ? 'stroke-zinc-300 dark:stroke-zinc-700'
    : analysis.score >= 80 ? 'stroke-emerald-500'
    : analysis.score >= 55 ? 'stroke-amber-500' : 'stroke-rose-500';
  const scoreText = !analysis ? 'text-zinc-400'
    : analysis.score >= 80 ? 'text-emerald-600 dark:text-emerald-400'
    : analysis.score >= 55 ? 'text-amber-600 dark:text-amber-400'
    : 'text-rose-600 dark:text-rose-400';
  const category = detectCategory(productName, keyFeatures);

  /* ================= RENDER ================= */
  return (
    <div
      className="min-h-screen w-full max-w-full overflow-x-hidden bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300"
      onKeyDown={onGlobalKey}
    >
      <div className="relative w-full max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 box-border overflow-x-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-400/10 dark:bg-emerald-500/10 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-emerald-400/10 dark:bg-emerald-500/10 blur-3xl" />
        </div>

        {/* Toasts */}
        <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 flex flex-col gap-2 max-w-[calc(100vw-2rem)]">
          {toasts.map((t) => (
            <div key={t.id} className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium shadow-lg backdrop-blur-xl border select-none ${
              t.type === 'success' ? 'bg-emerald-50/95 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
              : t.type === 'error' ? 'bg-rose-50/95 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
              : 'bg-zinc-100/95 dark:bg-zinc-800/90 text-zinc-800 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700'}`}>
              {t.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                : t.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" />
                : <Check className="w-4 h-4 shrink-0" />}
              <span className="truncate">{t.msg}</span>
            </div>
          ))}
        </div>

        {/* HEADER */}
        <header className={`${glass} p-4 sm:p-8 mb-4 sm:mb-6 relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-500/5 pointer-events-none" />
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-start gap-3 sm:gap-4 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-400 dark:to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 select-none">
                <Rocket className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight select-none">
                  Marketplace Listing Optimizer
                </h1>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-0.5 sm:mt-1 select-none">
                  Turn any product into a marketplace-ready listing with AI-tuned titles, bullets, and descriptions.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={loadSampleDemo}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 transition-all select-none">
                <Wand2 className="w-4 h-4" /> Load Sample Demo
              </button>
              <button onClick={() => setShowHistory((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:-translate-y-0.5 transition-all select-none">
                <History className="w-4 h-4" /> History
                {history.length > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.5 text-[10px] rounded-md bg-emerald-500 text-white">{history.length}</span>
                )}
              </button>
              <button onClick={resetAll}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:-translate-y-0.5 transition-all select-none">
                <Trash2 className="w-4 h-4" /> Reset
              </button>
            </div>
          </div>

          {/* Marketplace pills — emerald active */}
          <div className="relative mt-4 sm:mt-5 flex flex-wrap gap-2">
            {Object.entries(MARKETPLACE_SPECS).map(([name, s]) => {
              const active = name === marketplace;
              return (
                <button key={name} onClick={() => setMarketplace(name as Marketplace)}
                  className={`group flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold transition-all border select-none ${
                    active
                      ? 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500 shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-emerald-300 dark:hover:border-emerald-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 hover:-translate-y-0.5'
                  }`}>
                  <MarketplaceLogo marketplace={name} size="xs" />
                  {name}
                </button>
              );
            })}
          </div>
        </header>

        {/* BODY GRID */}
        <div className="grid lg:grid-cols-5 gap-4 sm:gap-6 items-start">
          {/* LEFT — inputs */}
          <section className={`${glass} p-4 sm:p-7 lg:col-span-2 min-w-0 lg:sticky lg:top-24 self-start space-y-5`}>
            <div className="flex items-center justify-between">
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 select-none">
                Listing Inputs
              </h2>
              <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 select-none">⌘/Ctrl + ↵</span>
            </div>

            <div>
              <p className={labelCls}><Lightbulb className="w-3.5 h-3.5" /> Quick presets</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {PRESETS.map((p) => (
                  <button key={p.label} onClick={() => loadPreset(p)}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-300 hover:-translate-y-0.5 transition-all select-none">
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelCls}><ShoppingBag className="w-3.5 h-3.5" /> Product name</label>
              <input value={productName} onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Cotton Printed Kurta" className={inputCls} />
            </div>

            <div className="space-y-1.5">
              <label className={labelCls}><FileText className="w-3.5 h-3.5" /> Key features / specs</label>
              <textarea value={keyFeatures} onChange={(e) => setKeyFeatures(e.target.value)}
                placeholder="Materials, dimensions, use cases, warranty…" rows={4}
                className={`${inputCls} resize-none min-h-[110px]`} />
            </div>

            <div className="space-y-1.5">
              <label className={labelCls}>
                <Target className="w-3.5 h-3.5" /> Target keywords
                <span className="ml-auto text-[10px] normal-case font-normal text-zinc-400">
                  optional · {targetKeywords.length}/8
                </span>
              </label>
              <div className={`${inputCls} !py-2 !px-2.5 flex flex-wrap items-center gap-1.5 !min-h-[46px]`}>
                {targetKeywords.map((k) => (
                  <span key={k} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 select-none">
                    {k}
                    <button onClick={() => removeKeyword(k)} className="opacity-60 hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input value={keywordDraft} onChange={(e) => setKeywordDraft(e.target.value)}
                  onKeyDown={onKeywordKey} onBlur={addKeyword}
                  placeholder={targetKeywords.length ? '' : 'Type + Enter to add…'}
                  className="flex-1 min-w-[100px] bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelCls}><Gauge className="w-3.5 h-3.5" /> Tone of voice</label>
              <div className="grid grid-cols-2 gap-2">
                {TONES.map((t) => {
                  const Icon = t.icon;
                  const active = t.key === tone;
                  return (
                    <button key={t.key} onClick={() => setTone(t.key)}
                      className={`group flex items-center gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl border text-left transition-all select-none ${
                        active ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-emerald-500/30'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-emerald-800 hover:-translate-y-0.5'}`}>
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500'}`} />
                      <div className="min-w-0">
                        <p className={`text-[11px] sm:text-xs font-semibold truncate ${active ? 'text-emerald-800 dark:text-emerald-200' : 'text-zinc-800 dark:text-zinc-200'}`}>
                          {t.key}
                        </p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-500 truncate">{t.hint}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <button onClick={() => setShowGuidance((v) => !v)}
                className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors select-none">
                <span className="flex items-center gap-2 text-[11px] sm:text-xs font-semibold text-zinc-700 dark:text-zinc-300 min-w-0">
                  <MarketplaceLogo marketplace={marketplace} size="xs" />
                  <span className="truncate">{marketplace} — {spec.tagline}</span>
                </span>
                {showGuidance ? <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />}
              </button>
              {showGuidance && (
                <div className="px-3.5 pb-3 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800 pt-2.5 select-none">
                  {spec.guidance}
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 p-3 text-xs text-rose-700 dark:text-rose-300 select-none">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="break-words">{error}</span>
              </div>
            )}

            <button onClick={generateListing}
              disabled={loading || !productName.trim() || !keyFeatures.trim()}
              className={`group relative w-full overflow-hidden flex items-center justify-center gap-2 px-6 py-3 sm:py-3.5 rounded-xl font-bold text-sm transition-all select-none ${
                loading || !productName.trim() || !keyFeatures.trim()
                  ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 active:translate-y-0'}`}>
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Crafting your listing…</>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  Generate optimized listing
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {/* PLATFORM SEO CHECKLIST */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3.5 bg-zinc-50/70 dark:bg-zinc-800/40 select-none">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                <Target className="w-3 h-3" /> {marketplace} SEO checklist
              </p>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Max title</span>
                  <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">{spec.titleMax} chars</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Bullets</span>
                  <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">{spec.bullets} bullets</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Description</span>
                  <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">{spec.descMin}–{spec.descMax}</span>
                </div>
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-zinc-200 dark:border-zinc-800">
                <p className="text-[10.5px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  <span className="font-semibold">💡 Indexing tip:</span> {spec.indexingTip}
                </p>
              </div>
            </div>
          </section>

          {/* RIGHT — output */}
          <section className={`${glass} p-4 sm:p-7 lg:col-span-3 min-w-0`}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 select-none">
                Generated Listing
              </h2>
              {result && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <div className="flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5">
                    <button onClick={() => setViewMode('seo')}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all select-none ${
                        viewMode === 'seo' ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-300 shadow-sm' : 'text-zinc-500 dark:text-zinc-400'}`}>
                      <ClipboardList className="w-3 h-3" /> SEO View
                    </button>
                    <button onClick={() => setViewMode('preview')}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all select-none ${
                        viewMode === 'preview' ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-300 shadow-sm' : 'text-zinc-500 dark:text-zinc-400'}`}>
                      <Eye className="w-3 h-3" /> Preview
                    </button>
                  </div>
                  <button onClick={generateListing} disabled={loading}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all disabled:opacity-50 select-none">
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Regenerate
                  </button>
                  <button onClick={exportListing}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all select-none">
                    <Download className="w-3 h-3" /> Export
                  </button>
                </div>
              )}
            </div>

            {!result ? (
              <EmptyState onTryDemo={loadSampleDemo} />
            ) : (
              <>
                <BeforeAfterBanner rawScore={rawScore} optimizedScore={analysis?.score ?? 0} />

                {viewMode === 'seo' ? (
                  <div className="space-y-4 mt-4">
                    {/* Score + checks */}
                    {analysis && (
                      <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 rounded-xl bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-800/50 dark:to-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                        <div className="relative w-20 h-20 shrink-0 select-none">
                          <svg viewBox="0 0 100 100" className="w-20 h-20 -rotate-90">
                            <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" className="stroke-zinc-200 dark:stroke-zinc-800" />
                            <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" strokeLinecap="round"
                              strokeDasharray={`${(analysis.score / 100) * 264} 264`}
                              className={`${scoreColor} transition-all duration-700`} />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-xl font-black ${scoreText} tabular-nums`}>{analysis.score}</span>
                            <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">score</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 w-full">
                          <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-2 flex items-center gap-1.5 select-none">
                            <TrendingUp className="w-3.5 h-3.5" /> Optimization Report
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {analysis.checks.map((c) => (
                              <div key={c.label} className="flex items-center gap-1.5 text-[10.5px] select-none" title={c.detail}>
                                {c.pass ? <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                  : <XCircle className="w-3 h-3 text-rose-500 shrink-0" />}
                                <span className="text-zinc-600 dark:text-zinc-400 truncate">{c.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Keyword match badges */}
                    {keywordMatches.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 select-none">
                          Target keyword match
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {keywordMatches.map(({ keyword, match }) => (
                            <span key={keyword} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold select-none ${
                              match ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'}`}>
                              {match ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              {keyword}
                              {match && <span className="text-[9px] opacity-70">injected</span>}
                            </span>
                          ))}
                        </div>
                        <button onClick={copyEverything}
                          className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all select-none">
                          {copied.all ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copied.all ? 'Copied everything' : 'Copy all everything'}
                        </button>
                      </div>
                    )}

                    {/* Title */}
                    <ResultBlock icon={<FileText className="w-4 h-4" />} title="Title"
                      badge={`${result.title.length} / ${spec.titleMax}`}
                      badgeWarn={result.title.length > spec.titleMax}
                      onCopy={() => copyToClipboard(result.title, 'title')} copied={copied.title}>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-relaxed">{result.title}</p>
                    </ResultBlock>

                    {/* Bullets */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 text-zinc-500">
                          <LayoutList className="w-4 h-4" />
                          <span className="text-[11px] font-bold uppercase tracking-wider">Key bullets</span>
                          <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-mono">
                            {result.highlights.length}/{spec.bullets}
                          </span>
                        </div>
                        <button onClick={() => copyToClipboard(bulletsText, 'bullets')}
                          className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-800/30 transition-all select-none">
                          {copied.bullets ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copied.bullets ? 'Copied' : 'Copy all'}
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {result.highlights.map((b, i) => {
                          const over = b.length > spec.bulletMax;
                          return (
                            <div key={i} className="group flex items-start gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 hover:bg-emerald-50/60 dark:hover:bg-emerald-900/10 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800 transition-all">
                              <span className="w-6 h-6 shrink-0 rounded-md bg-zinc-200 dark:bg-zinc-700 group-hover:bg-emerald-500 group-hover:text-white text-zinc-600 dark:text-zinc-300 text-[11px] font-bold flex items-center justify-center transition-colors select-none">
                                {i + 1}
                              </span>
                              <p className="flex-1 text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">{b}</p>
                              <div className="flex flex-col items-end gap-1">
                                <button onClick={() => copyToClipboard(b, 'single', i)}
                                  className="opacity-60 sm:opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-white dark:hover:bg-zinc-700 text-zinc-500"
                                  title="Copy bullet">
                                  {copied.bulletIdx === i ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                </button>
                                <span className={`text-[10px] font-mono tabular-nums select-none ${over ? 'text-rose-500' : 'text-zinc-400 dark:text-zinc-500'}`}>
                                  {b.length}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Description */}
                    <ResultBlock icon={<FileText className="w-4 h-4" />} title="Description"
                      badge={`${result.description.trim().split(/\s+/).filter(Boolean).length} words`}
                      onCopy={() => copyToClipboard(result.description, 'description')} copied={copied.description}>
                      <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line">{result.description}</p>
                    </ResultBlock>
                  </div>
                ) : (
                  <MarketplacePreview
                    result={result}
                    marketplace={marketplace}
                    category={category}
                  />
                )}
              </>
            )}
          </section>
        </div>

        {/* HISTORY */}
        {showHistory && (
          <section className={`${glass} p-6 mt-6`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2 select-none">
                <History className="w-4 h-4" /> Recent generations
              </h2>
              {history.length > 0 && (
                <button onClick={() => { setHistory([]); localStorage.removeItem('listing-history'); }}
                  className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline select-none">
                  Clear all
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-500 text-center py-6 select-none">No history yet.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {history.map((h) => (
                  <button key={h.id} onClick={() => {
                    setResult(h.result); setMarketplace(h.marketplace); setTone(h.tone);
                    setProductName(h.productName); setKeyFeatures(h.keyFeatures);
                    setTargetKeywords(h.targetKeywords);
                    pushToast('info', 'Loaded from history');
                  }}
                    className="text-left p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-400 dark:hover:border-emerald-700 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10 transition-all hover:-translate-y-0.5 select-none">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">{h.marketplace}</span>
                      <span className="text-[10px] font-mono text-zinc-400">{h.score}%</span>
                    </div>
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">{h.result.title}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-500 mt-1">{new Date(h.createdAt).toLocaleString()}</p>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

/* ================= SUB-COMPONENTS ================= */

function EmptyState({ onTryDemo }: { onTryDemo: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[420px] text-center px-6">
      <div className="relative">
        <div className="absolute inset-0 rounded-3xl bg-emerald-500/20 blur-2xl" />
        <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
          <Sparkles className="w-9 h-9 text-emerald-500 animate-pulse" />
        </div>
      </div>
      <p className="mt-5 text-base font-semibold text-zinc-700 dark:text-zinc-300 select-none">Ready when you are</p>
      <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-500 max-w-xs leading-relaxed select-none">
        Fill in the product details and press{' '}
        <span className="font-semibold text-zinc-600 dark:text-zinc-400">Generate</span>{' '}
        — or try the sample demo.
      </p>
      <button onClick={onTryDemo}
        className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 transition-all select-none">
        <Wand2 className="w-4 h-4" /> Load Sample Demo
      </button>
    </div>
  );
}

function BeforeAfterBanner({ rawScore, optimizedScore }: { rawScore: number; optimizedScore: number }) {
  return (
    <div className="mt-1 p-3 rounded-xl bg-gradient-to-r from-rose-50/80 via-zinc-50 to-emerald-50/80 dark:from-rose-900/20 dark:via-zinc-900/40 dark:to-emerald-900/20 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 select-none">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center shrink-0">
          <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 tracking-wider">Before</p>
          <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
            Raw input · {rawScore}/100 · Weak SEO
          </p>
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-zinc-400 mx-auto sm:mx-0 rotate-90 sm:rotate-0 shrink-0" />
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">After</p>
          <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
            Optimized · {optimizedScore}/100 · Marketplace Ready
          </p>
        </div>
      </div>
    </div>
  );
}

function ResultBlock({
  icon, title, badge, badgeWarn, onCopy, copied, children,
}: {
  icon: ReactNode; title: string; badge: string; badgeWarn?: boolean;
  onCopy: () => void; copied: boolean; children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-zinc-500">
          {icon}
          <span className="text-[11px] font-bold uppercase tracking-wider select-none">{title}</span>
        </div>
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono select-none ${
          badgeWarn ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}>
          {badge}
        </span>
        <button onClick={onCopy}
          className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-800/30 transition-all select-none">
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60">
        {children}
      </div>
    </div>
  );
}

function MarketplacePreview({
  result, marketplace, category,
}: {
  result: ListingResult; marketplace: Marketplace; category: Category;
}) {
  const { price, mrp } = mockPrice(category);
  const discount = Math.round(((mrp - price) / mrp) * 100);

  return (
    <div className="mt-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 select-none">
      {/* Top bar */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2 flex items-center justify-between">
        <span className="text-[11px] font-bold text-white uppercase tracking-wider">
          {marketplace} · Preview
        </span>
        <span className="text-[10px] text-white/80">Shopper view</span>
      </div>

      <div className="p-4 sm:p-5">
        {/* Price row */}
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">₹{price.toLocaleString('en-IN')}</span>
          <span className="text-xs text-zinc-500 line-through">₹{mrp.toLocaleString('en-IN')}</span>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{discount}% off</span>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 leading-snug mb-2">
          {result.title}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[11px] font-bold">
            4.3 <Star className="w-2.5 h-2.5 fill-current" />
          </span>
          <span className="text-[11px] text-zinc-500">1,284 ratings</span>
        </div>

        {/* Bullets */}
        <ul className="space-y-1.5 mb-4">
          {result.highlights.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
              <span className="text-emerald-500 mt-0.5 shrink-0">●</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>

        {/* Description */}
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">About this item</p>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{result.description}</p>
        </div>

        {/* CTA */}
        <div className="flex gap-2 mt-4">
          <button className="flex-1 py-2 rounded-lg bg-amber-500 text-white text-xs font-bold">
            Add to Cart
          </button>
          <button className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold">
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}