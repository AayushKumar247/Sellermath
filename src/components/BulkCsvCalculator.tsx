import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  Trash2,
  AlertCircle,
  Search,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Settings2,
  X,
  Copy,
  Check,
  Info,
  Sparkles,
  Percent,
  IndianRupee,
  Package,
  RotateCcw,
  Megaphone,
  Receipt,
  Wallet,
  BarChart3,
  ArrowUpDown,
  FileText,
  Zap,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type MarketplaceId =
  | 'amazon'
  | 'flipkart'
  | 'meesho'
  | 'myntra'
  | 'blinkit'
  | 'zepto'
  | 'instamart'
  | 'snapdeal';

interface MarketplaceConfig {
  name: string;
  commissionRate: number;
  fixedFee: number;
  gradient: string;
  dot: string;
  soft: string;
  text: string;
}

interface CSVRow {
  SKU_Name: string;
  Category: string;
  Cost_of_Goods: number;
  Selling_Price: number;
  Shipping_Fee: number;
  RTO_Percent: number;
}

interface FeeSettings {
  gstRate: number;
  tcsTdsRate: number;
  packagingCost: number;
  adsPercent: number;
  returnShippingFee: number;
  targetMargin: number;
}

interface CalculationResult {
  id: number;
  skuName: string;
  category: string;
  costOfGoods: number;
  sellingPrice: number;
  shippingFee: number;
  rtoPercent: number;
  marketplace: string;
  commissionAmount: number;
  fixedFee: number;
  gstOnFees: number;
  tcsTds: number;
  rtoLoss: number;
  packagingCost: number;
  adsSpend: number;
  totalDeductions: number;
  netProfit: number;
  marginPercent: number;
  roi: number;
  isProfitable: boolean;
  breakEvenPrice: number;
  suggestedPrice: number;
}

type SortKey = 'name' | 'profit' | 'margin' | 'price' | 'roi';
type StatusFilter = 'all' | 'profit' | 'loss';

/* ------------------------------------------------------------------ */
/*  Marketplace config                                                 */
/* ------------------------------------------------------------------ */

const MARKETPLACES: Record<MarketplaceId, MarketplaceConfig> = {
  amazon: {
    name: 'Amazon',
    commissionRate: 12,
    fixedFee: 20,
    gradient: 'from-amber-400 via-orange-500 to-orange-600',
    dot: 'bg-amber-500',
    soft: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    text: 'text-amber-600 dark:text-amber-400',
  },
  flipkart: {
    name: 'Flipkart',
    commissionRate: 12,
    fixedFee: 15,
    gradient: 'from-blue-500 via-blue-600 to-indigo-600',
    dot: 'bg-blue-500',
    soft: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    text: 'text-blue-600 dark:text-blue-400',
  },
  meesho: {
    name: 'Meesho',
    commissionRate: 3,
    fixedFee: 0,
    gradient: 'from-fuchsia-500 via-fuchsia-600 to-purple-700',
    dot: 'bg-fuchsia-500',
    soft: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400',
    text: 'text-fuchsia-600 dark:text-fuchsia-400',
  },
  myntra: {
    name: 'Myntra',
    commissionRate: 18,
    fixedFee: 25,
    gradient: 'from-pink-400 via-rose-500 to-rose-600',
    dot: 'bg-rose-500',
    soft: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    text: 'text-rose-600 dark:text-rose-400',
  },
  blinkit: {
    name: 'Blinkit',
    commissionRate: 20,
    fixedFee: 10,
    gradient: 'from-yellow-400 via-amber-500 to-orange-500',
    dot: 'bg-yellow-500',
    soft: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
    text: 'text-yellow-700 dark:text-yellow-400',
  },
  zepto: {
    name: 'Zepto',
    commissionRate: 18,
    fixedFee: 10,
    gradient: 'from-violet-500 via-purple-600 to-indigo-700',
    dot: 'bg-violet-500',
    soft: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    text: 'text-violet-600 dark:text-violet-400',
  },
  instamart: {
    name: 'Instamart',
    commissionRate: 18,
    fixedFee: 10,
    gradient: 'from-orange-500 via-red-500 to-rose-600',
    dot: 'bg-orange-500',
    soft: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    text: 'text-orange-600 dark:text-orange-400',
  },
  snapdeal: {
    name: 'Snapdeal',
    commissionRate: 12,
    fixedFee: 15,
    gradient: 'from-red-500 via-red-600 to-rose-700',
    dot: 'bg-red-500',
    soft: 'bg-red-500/10 text-red-600 dark:text-red-400',
    text: 'text-red-600 dark:text-red-400',
  },
};

const MARKETPLACE_IDS = Object.keys(MARKETPLACES) as MarketplaceId[];

const DEFAULT_SETTINGS: FeeSettings = {
  gstRate: 18,
  tcsTdsRate: 1,
  packagingCost: 0,
  adsPercent: 0,
  returnShippingFee: 0,
  targetMargin: 20,
};

const HEADER_ALIASES: Record<string, keyof CSVRow> = {
  sku_name: 'SKU_Name',
  sku: 'SKU_Name',
  product: 'SKU_Name',
  product_name: 'SKU_Name',
  item: 'SKU_Name',
  category: 'Category',
  cost_of_goods: 'Cost_of_Goods',
  cost: 'Cost_of_Goods',
  cogs: 'Cost_of_Goods',
  selling_price: 'Selling_Price',
  price: 'Selling_Price',
  mrp: 'Selling_Price',
  sp: 'Selling_Price',
  shipping_fee: 'Shipping_Fee',
  shipping: 'Shipping_Fee',
  forward_shipping: 'Shipping_Fee',
  rto_percent: 'RTO_Percent',
  rto: 'RTO_Percent',
  return_percent: 'RTO_Percent',
};

const SAMPLE_CSV = `SKU_Name,Category,Cost_of_Goods,Selling_Price,Shipping_Fee,RTO_Percent
Wireless Earbuds Pro,Electronics,899,1499,40,5
Cotton T-Shirt Pack,Clothing,349,599,50,8
Stainless Steel Water Bottle,Home & Kitchen,199,399,30,4
Ergonomic Mouse Pad,Electronics,120,349,35,6
Handloom Cushion Cover Set,Home & Kitchen,260,699,45,10
Scented Soy Candle Trio,Home Decor,180,549,40,7
Bluetooth Speaker Mini,Electronics,650,1299,45,6
Ceramic Coffee Mug Set,Home & Kitchen,180,449,35,5
Yoga Mat Premium,Fitness,320,799,50,9
Leather Wallet Classic,Fashion,180,699,30,4
`;

const PAGE_SIZE = 10;

/* ------------------------------------------------------------------ */
/*  Formatters                                                         */
/* ------------------------------------------------------------------ */

function formatINR(val: number): string {
  if (!Number.isFinite(val)) return '—';
  return `₹${val.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatCompactINR(val: number): string {
  if (!Number.isFinite(val)) return '—';
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(2)} L`;
  if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(1)} K`;
  return `${sign}₹${abs.toFixed(0)}`;
}

function formatPct(val: number): string {
  if (!Number.isFinite(val)) return '—';
  return `${val.toFixed(2)}%`;
}

/* ------------------------------------------------------------------ */
/*  CSV parsing (UNCHANGED logic)                                      */
/* ------------------------------------------------------------------ */

function parseCSV(text: string): { rows: CSVRow[]; errors: string[] } {
  const errors: string[] = [];
  const clean = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim();

  if (!clean) return { rows: [], errors: ['The file appears to be empty.'] };

  const lines = clean.split('\n').filter((l) => l.trim() !== '');
  if (lines.length < 2) {
    return {
      rows: [],
      errors: ['No data rows found. The file must contain a header and at least one row.'],
    };
  }

  const rawHeaders = lines[0]
    .split(',')
    .map((h) => h.trim().toLowerCase().replace(/\s+/g, '_').replace(/^"|"$/g, ''));

  const index: Partial<Record<keyof CSVRow, number>> = {};
  rawHeaders.forEach((h, i) => {
    const key = HEADER_ALIASES[h];
    if (key && index[key] === undefined) index[key] = i;
  });

  const required: (keyof CSVRow)[] = [
    'SKU_Name',
    'Cost_of_Goods',
    'Selling_Price',
    'Shipping_Fee',
    'RTO_Percent',
  ];
  const missing = required.filter((k) => index[k] === undefined);
  if (missing.length) {
    return {
      rows: [],
      errors: [
        `Missing required column(s): ${missing.join(', ')}. Use the template to see the exact format.`,
      ],
    };
  }

  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const readNum = (key: keyof CSVRow): number => {
      const idx = index[key];
      if (idx === undefined) return 0;
      const n = parseFloat(values[idx]);
      return Number.isFinite(n) ? n : 0;
    };
    const readStr = (key: keyof CSVRow): string => {
      const idx = index[key];
      return idx === undefined ? '' : values[idx] ?? '';
    };

    const name = readStr('SKU_Name');
    if (!name) {
      errors.push(`Row ${i + 1}: missing SKU name — skipped.`);
      continue;
    }

    const sellingPrice = readNum('Selling_Price');
    if (sellingPrice <= 0) {
      errors.push(`Row ${i + 1} (${name}): selling price must be greater than ₹0 — skipped.`);
      continue;
    }

    rows.push({
      SKU_Name: name,
      Category: readStr('Category') || 'Uncategorised',
      Cost_of_Goods: Math.max(readNum('Cost_of_Goods'), 0),
      Selling_Price: sellingPrice,
      Shipping_Fee: Math.max(readNum('Shipping_Fee'), 0),
      RTO_Percent: Math.min(Math.max(readNum('RTO_Percent'), 0), 100),
    });
  }

  return { rows, errors };
}

/* ------------------------------------------------------------------ */
/*  Small building blocks                                              */
/* ------------------------------------------------------------------ */

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  hint?: string;
  step?: number;
  icon?: React.ElementType;
}

function NumberField({
  label,
  value,
  onChange,
  suffix,
  hint,
  step = 1,
  icon: Icon,
}: NumberFieldProps) {
  return (
    <div className="group min-w-0 select-none">
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-zinc-500 transition-colors group-hover:text-zinc-700 dark:text-zinc-400 dark:group-hover:text-zinc-200">
        {Icon ? <Icon size={13} className="opacity-70" /> : null}
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          min={0}
          step={step}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 pr-10 text-sm font-medium text-zinc-900 shadow-sm transition-all hover:border-zinc-300 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600 dark:focus:border-emerald-400"
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400 dark:text-zinc-500">
            {suffix}
          </span>
        ) : null}
      </div>
      {hint ? (
        <p className="mt-1 text-[11px] leading-tight text-zinc-400 dark:text-zinc-500">{hint}</p>
      ) : null}
    </div>
  );
}

function StatusBadge({ isProfitable }: { isProfitable: boolean }) {
  return (
    <span
      className={`inline-flex select-none items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
        isProfitable
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          : 'bg-rose-500/10 text-rose-500 dark:text-rose-400'
      }`}
    >
      {isProfitable ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {isProfitable ? 'Profit' : 'Loss'}
    </span>
  );
}

function FeeBreakdown({
  calc,
  targetMargin,
}: {
  calc: CalculationResult;
  targetMargin: number;
}) {
  const items = [
    { label: 'Commission', value: calc.commissionAmount, icon: Percent },
    { label: 'Fixed fee', value: calc.fixedFee, icon: Wallet },
    { label: 'GST on fees', value: calc.gstOnFees, icon: Receipt },
    { label: 'TCS / TDS', value: calc.tcsTds, icon: IndianRupee },
    { label: 'RTO loss', value: calc.rtoLoss, icon: RotateCcw },
    { label: 'Packaging', value: calc.packagingCost, icon: Package },
  ];

  return (
    <div className="min-w-0">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-zinc-200 bg-white p-2.5 transition-all hover:-translate-y-0.5 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex select-none items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              <item.icon size={10} /> {item.label}
            </div>
            <div className="mt-0.5 text-sm font-bold tabular-nums text-zinc-800 dark:text-zinc-100">
              {formatINR(item.value)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="rounded-lg bg-zinc-200/70 px-2.5 py-1 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          Total deductions: {formatINR(calc.totalDeductions)}
        </span>
        <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
          ROI: {formatPct(calc.roi)}
        </span>
        <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
          Break-even: {formatINR(calc.breakEvenPrice)}
        </span>
        <span className="rounded-lg bg-teal-500/10 px-2.5 py-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400">
          For {targetMargin}% margin: {formatINR(calc.suggestedPrice)}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function BulkCsvCalculator() {
  /* ---------------- marketplace + rates ---------------- */
  const [selectedMarketplace, setSelectedMarketplace] = useState<MarketplaceId>('amazon');
  const [rateOverrides, setRateOverrides] = useState<
    Partial<Record<MarketplaceId, { commissionRate?: number; fixedFee?: number }>>
  >({});
  const [settings, setSettings] = useState<FeeSettings>(DEFAULT_SETTINGS);

  /* ---------------- data ---------------- */
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---------------- ui toggles ---------------- */
  const [showSettings, setShowSettings] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteValue, setPasteValue] = useState('');

  /* ---------------- what-if simulation ---------------- */
  const [priceAdjustment, setPriceAdjustment] = useState(0);
  const [rtoAdjustment, setRtoAdjustment] = useState(0);
  const isWhatIfActive = priceAdjustment !== 0 || rtoAdjustment !== 0;

  /* ---------------- filters ---------------- */
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('profit');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);

  /* ---------------- effective rates ---------------- */
  const currentMarketplace = MARKETPLACES[selectedMarketplace];
  const currentRates = {
    commissionRate:
      rateOverrides[selectedMarketplace]?.commissionRate ?? currentMarketplace.commissionRate,
    fixedFee: rateOverrides[selectedMarketplace]?.fixedFee ?? currentMarketplace.fixedFee,
  };
  const isOverridden =
    rateOverrides[selectedMarketplace]?.commissionRate !== undefined ||
    rateOverrides[selectedMarketplace]?.fixedFee !== undefined;

  const ratesFor = (id: MarketplaceId) => ({
    commissionRate: rateOverrides[id]?.commissionRate ?? MARKETPLACES[id].commissionRate,
    fixedFee: rateOverrides[id]?.fixedFee ?? MARKETPLACES[id].fixedFee,
  });

  /* ---------------- core maths (UNCHANGED formula) ---------------- */
  const computeRow = (
    row: CSVRow,
    id: number,
    mp: MarketplaceConfig,
    rates: { commissionRate: number; fixedFee: number },
    s: FeeSettings,
  ): CalculationResult => {
    const c = rates.commissionRate / 100;
    const g = s.gstRate / 100;
    const t = s.tcsTdsRate / 100;
    const a = s.adsPercent / 100;
    const rto = row.RTO_Percent / 100;

    const commissionAmount = row.Selling_Price * c;
    const fixedFee = rates.fixedFee;
    const gstOnFees = (commissionAmount + fixedFee) * g;
    const tcsTds = row.Selling_Price * t;
    const rtoLoss = (row.Cost_of_Goods + row.Shipping_Fee + s.returnShippingFee) * rto;
    const packagingCost = s.packagingCost;
    const adsSpend = row.Selling_Price * a;

    const totalDeductions =
      commissionAmount + fixedFee + gstOnFees + tcsTds + rtoLoss + packagingCost + adsSpend;

    const netProfit =
      row.Selling_Price - row.Cost_of_Goods - row.Shipping_Fee - totalDeductions;

    const marginPercent = row.Selling_Price > 0 ? (netProfit / row.Selling_Price) * 100 : 0;
    const roi = row.Cost_of_Goods > 0 ? (netProfit / row.Cost_of_Goods) * 100 : 0;

    const fixedPart =
      row.Cost_of_Goods +
      row.Shipping_Fee +
      fixedFee * (1 + g) +
      (row.Cost_of_Goods + row.Shipping_Fee + s.returnShippingFee) * rto +
      packagingCost;

    const baseDenom = 1 - c * (1 + g) - t - a;
    const breakEvenPrice = baseDenom > 0.0001 ? fixedPart / baseDenom : Infinity;

    const marginDenom = baseDenom - s.targetMargin / 100;
    const suggestedPrice = marginDenom > 0.0001 ? fixedPart / marginDenom : Infinity;

    return {
      id,
      skuName: row.SKU_Name,
      category: row.Category,
      costOfGoods: row.Cost_of_Goods,
      sellingPrice: row.Selling_Price,
      shippingFee: row.Shipping_Fee,
      rtoPercent: row.RTO_Percent,
      marketplace: mp.name,
      commissionAmount,
      fixedFee,
      gstOnFees,
      tcsTds,
      rtoLoss,
      packagingCost,
      adsSpend,
      totalDeductions,
      netProfit,
      marginPercent,
      roi,
      isProfitable: netProfit > 0,
      breakEvenPrice,
      suggestedPrice,
    };
  };

  /* ---------------- apply what-if (does NOT mutate csvData) ---------------- */
  const effectiveCsvData = useMemo<CSVRow[]>(() => {
    if (!csvData.length) return [];
    if (priceAdjustment === 0 && rtoAdjustment === 0) return csvData;
    return csvData.map((row) => ({
      ...row,
      Selling_Price: Math.max(0, row.Selling_Price * (1 + priceAdjustment / 100)),
      RTO_Percent: Math.max(0, Math.min(100, row.RTO_Percent + rtoAdjustment)),
    }));
  }, [csvData, priceAdjustment, rtoAdjustment]);

  const calculations = useMemo<CalculationResult[]>(() => {
    if (!effectiveCsvData.length) return [];
    const mp = MARKETPLACES[selectedMarketplace];
    const rates = {
      commissionRate:
        rateOverrides[selectedMarketplace]?.commissionRate ?? mp.commissionRate,
      fixedFee: rateOverrides[selectedMarketplace]?.fixedFee ?? mp.fixedFee,
    };
    return effectiveCsvData.map((row, i) => computeRow(row, i, mp, rates, settings));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCsvData, selectedMarketplace, rateOverrides, settings]);

  const comparison = useMemo(() => {
    if (!effectiveCsvData.length) return [];
    return MARKETPLACE_IDS.map((id) => {
      const mp = MARKETPLACES[id];
      const rates = {
        commissionRate: rateOverrides[id]?.commissionRate ?? mp.commissionRate,
        fixedFee: rateOverrides[id]?.fixedFee ?? mp.fixedFee,
      };
      const total = effectiveCsvData.reduce(
        (sum, row, i) => sum + computeRow(row, i, mp, rates, settings).netProfit,
        0,
      );
      return { id, name: mp.name, gradient: mp.gradient, dot: mp.dot, total };
    }).sort((x, y) => y.total - x.total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCsvData, rateOverrides, settings]);

  const summary = useMemo(() => {
    if (!calculations.length) return null;
    const totalProfit = calculations.reduce((s, c) => s + c.netProfit, 0);
    const totalRevenue = calculations.reduce((s, c) => s + c.sellingPrice, 0);
    const totalDeductions = calculations.reduce((s, c) => s + c.totalDeductions, 0);
    const profitableCount = calculations.filter((c) => c.isProfitable).length;
    const lossCount = calculations.length - profitableCount;
    const avgMargin =
      calculations.reduce((s, c) => s + c.marginPercent, 0) / calculations.length;
    return {
      totalProfit,
      totalRevenue,
      totalDeductions,
      profitableCount,
      lossCount,
      avgMargin,
      count: calculations.length,
    };
  }, [calculations]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = calculations.filter((c) => {
      const matchesQuery =
        !q || c.skuName.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'profit' && c.isProfitable) ||
        (statusFilter === 'loss' && !c.isProfitable);
      return matchesQuery && matchesStatus;
    });

    const dir = sortDir === 'asc' ? 1 : -1;
    list = [...list].sort((a, b) => {
      switch (sortKey) {
        case 'name':
          return a.skuName.localeCompare(b.skuName) * dir;
        case 'price':
          return (a.sellingPrice - b.sellingPrice) * dir;
        case 'margin':
          return (a.marginPercent - b.marginPercent) * dir;
        case 'roi':
          return (a.roi - b.roi) * dir;
        case 'profit':
        default:
          return (a.netProfit - b.netProfit) * dir;
      }
    });
    return list;
  }, [calculations, query, statusFilter, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, sortKey, sortDir, selectedMarketplace, priceAdjustment, rtoAdjustment]);

  /* ---------------- handlers ---------------- */
  const ingest = (text: string, name: string) => {
    const { rows, errors: parseErrors } = parseCSV(text);
    setErrors(parseErrors);
    if (rows.length) {
      setCsvData(rows);
      setFileName(name);
      setExpanded(new Set());
      setPage(1);
      setPriceAdjustment(0);
      setRtoAdjustment(0);
    } else if (!parseErrors.length) {
      setErrors(['No valid rows found in the CSV.']);
    }
  };

  const handleFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrors(['Please upload a valid .csv file.']);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => ingest(String(e.target?.result ?? ''), file.name);
    reader.onerror = () => setErrors(['Could not read that file. Please try again.']);
    reader.readAsText(file);
  };

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current += 1;
    setIsDragging(true);
  };
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const downloadSampleTemplate = () => {
    const header = 'SKU_Name,Category,Cost_of_Goods,Selling_Price,Shipping_Fee,RTO_Percent';
    const sample = [
      'Wireless Earbuds Pro,Electronics,899,1499,40,5',
      'Cotton T-Shirt Pack,Clothing,349,599,50,8',
      'Stainless Steel Water Bottle,Home & Kitchen,199,399,30,4',
    ];
    const blob = new Blob([[header, ...sample].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'bulk_sku_template.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  /* ---------------- CSV export (UNCHANGED logic) ---------------- */
  const buildReportCsv = () => {
    const header = [
      'SKU_Name',
      'Category',
      'Marketplace',
      'Cost_of_Goods',
      'Selling_Price',
      'Shipping_Fee',
      'RTO_Percent',
      'Commission',
      'Fixed_Fee',
      'GST_on_Fees',
      'TCS_TDS',
      'RTO_Loss',
      'Packaging',
      'Ad_Spend',
      'Total_Deductions',
      'Net_Profit',
      'Margin_Percent',
      'ROI_Percent',
      'Break_Even_Price',
      'Suggested_Price',
      'Status',
    ].join(',');

    const rows = calculations.map((c) =>
      [
        `"${c.skuName}"`,
        `"${c.category}"`,
        c.marketplace,
        c.costOfGoods.toFixed(2),
        c.sellingPrice.toFixed(2),
        c.shippingFee.toFixed(2),
        c.rtoPercent.toFixed(2),
        c.commissionAmount.toFixed(2),
        c.fixedFee.toFixed(2),
        c.gstOnFees.toFixed(2),
        c.tcsTds.toFixed(2),
        c.rtoLoss.toFixed(2),
        c.packagingCost.toFixed(2),
        c.adsSpend.toFixed(2),
        c.totalDeductions.toFixed(2),
        c.netProfit.toFixed(2),
        c.marginPercent.toFixed(2),
        c.roi.toFixed(2),
        Number.isFinite(c.breakEvenPrice) ? c.breakEvenPrice.toFixed(2) : '',
        Number.isFinite(c.suggestedPrice) ? c.suggestedPrice.toFixed(2) : '',
        c.isProfitable ? 'Profitable' : 'Loss-Making',
      ].join(','),
    );

    return [header, ...rows].join('\n');
  };

  const downloadReport = () => {
    const blob = new Blob([buildReportCsv()], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `profit_report_${selectedMarketplace}_${new Date()
      .toISOString()
      .split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(buildReportCsv());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setErrors(['Clipboard access was blocked by the browser.']);
    }
  };

  const clearData = () => {
    setCsvData([]);
    setFileName('');
    setErrors([]);
    setExpanded(new Set());
    setQuery('');
    setStatusFilter('all');
    setPage(1);
    setPriceAdjustment(0);
    setRtoAdjustment(0);
    setShowPaste(false);
    setPasteValue('');
  };

  const toggleRow = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updateOverride = (patch: { commissionRate?: number; fixedFee?: number }) => {
    setRateOverrides((prev) => ({
      ...prev,
      [selectedMarketplace]: { ...prev[selectedMarketplace], ...patch },
    }));
  };

  /* ---------------- render ---------------- */
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-zinc-50 text-zinc-900 transition-colors dark:bg-zinc-950 dark:text-zinc-100">
      {/* ============ Header ============ */}
      <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/85 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/85">
        <div className="mx-auto flex max-w-[1360px] items-center gap-3 px-3 py-3 sm:px-6 sm:py-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 shadow-lg shadow-emerald-500/25">
            <FileSpreadsheet size={20} className="text-white" />
          </div>
          <div className="mr-auto min-w-0 select-none">
            <h1 className="truncate text-base font-bold sm:text-lg">
              Bulk CSV Profit Calculator
            </h1>
            <p className="hidden truncate text-xs text-zinc-500 sm:block dark:text-zinc-400">
              Marketplace fees · GST · TCS/TDS · RTO — modelled per SKU
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1360px] space-y-4 px-3 py-4 sm:space-y-5 sm:px-6 sm:py-6 box-border overflow-x-hidden">
        {/* ============ Marketplace picker ============ */}
        <section className="min-w-0">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div className="min-w-0 select-none">
              <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Marketplace
              </h2>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Fees recalculate instantly across your whole catalogue
              </p>
            </div>
            <button
              onClick={() => setShowSettings((v) => !v)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
                showSettings
                  ? 'border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                  : 'border-zinc-200 bg-white text-zinc-600 hover:border-emerald-400 hover:text-emerald-600 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-emerald-500 dark:hover:text-emerald-400'
              }`}
            >
              <Settings2 size={14} />
              Advanced fee model
              <ChevronDown
                size={14}
                className={`transition-transform duration-300 ${showSettings ? 'rotate-180' : ''}`}
              />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8">
            {MARKETPLACE_IDS.map((id) => {
              const mp = MARKETPLACES[id];
              const active = selectedMarketplace === id;
              const rates = ratesFor(id);
              return (
                <button
                  key={id}
                  onClick={() => setSelectedMarketplace(id)}
                  className={`group relative min-w-0 select-none overflow-hidden rounded-xl border-2 p-2.5 text-left transition-all duration-200 active:scale-[0.98] sm:p-3 ${
                    active
                      ? `border-transparent bg-gradient-to-br ${mp.gradient} text-white shadow-lg shadow-zinc-900/10`
                      : 'border-zinc-200 bg-white hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700'
                  }`}
                >
                  {active && (
                    <span className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-white/20" />
                  )}
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        active ? 'bg-white' : mp.dot
                      }`}
                    />
                    <span
                      className={`truncate text-xs font-bold sm:text-sm ${
                        active ? 'text-white' : 'text-zinc-800 dark:text-zinc-100'
                      }`}
                    >
                      {mp.name}
                    </span>
                  </div>
                  <div
                    className={`mt-0.5 truncate text-[10px] font-medium sm:text-[11px] ${
                      active ? 'text-white/85' : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    {rates.commissionRate}% + ₹{rates.fixedFee}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ============ Advanced settings ============ */}
        <div
          className={`grid overflow-hidden transition-all duration-300 ${
            showSettings ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="min-h-0">
            <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm sm:p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span
                  className={`select-none rounded-lg px-2.5 py-1 text-xs font-bold ${currentMarketplace.soft}`}
                >
                  {currentMarketplace.name} fee profile
                </span>
                {isOverridden && (
                  <span className="flex select-none items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <Zap size={12} /> Custom rates active
                  </span>
                )}
                <button
                  onClick={() =>
                    setRateOverrides((prev) => {
                      const next = { ...prev };
                      delete next[selectedMarketplace];
                      return next;
                    })
                  }
                  className="ml-auto flex select-none items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                >
                  <RotateCcw size={12} /> Reset rates
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
                <NumberField
                  label="Commission"
                  icon={Percent}
                  value={currentRates.commissionRate}
                  onChange={(v) => updateOverride({ commissionRate: v })}
                  suffix="%"
                  step={0.5}
                />
                <NumberField
                  label="Fixed / closing fee"
                  icon={Wallet}
                  value={currentRates.fixedFee}
                  onChange={(v) => updateOverride({ fixedFee: v })}
                  suffix="₹"
                />
                <NumberField
                  label="GST on fees"
                  icon={Receipt}
                  value={settings.gstRate}
                  onChange={(v) => setSettings({ ...settings, gstRate: v })}
                  suffix="%"
                  hint="Charged on commission + fixed fee"
                />
                <NumberField
                  label="TCS / TDS"
                  icon={IndianRupee}
                  value={settings.tcsTdsRate}
                  onChange={(v) => setSettings({ ...settings, tcsTdsRate: v })}
                  suffix="%"
                  step={0.1}
                  hint="Deducted on selling price"
                />
                <NumberField
                  label="Packaging cost"
                  icon={Package}
                  value={settings.packagingCost}
                  onChange={(v) => setSettings({ ...settings, packagingCost: v })}
                  suffix="₹"
                />
                <NumberField
                  label="Ad spend"
                  icon={Megaphone}
                  value={settings.adsPercent}
                  onChange={(v) => setSettings({ ...settings, adsPercent: v })}
                  suffix="%"
                  step={0.5}
                  hint="% of selling price"
                />
                <NumberField
                  label="Return shipping"
                  icon={RotateCcw}
                  value={settings.returnShippingFee}
                  onChange={(v) => setSettings({ ...settings, returnShippingFee: v })}
                  suffix="₹"
                  hint="Lost per RTO order"
                />
                <NumberField
                  label="Target margin"
                  icon={TrendingUp}
                  value={settings.targetMargin}
                  onChange={(v) => setSettings({ ...settings, targetMargin: v })}
                  suffix="%"
                  hint="Used for suggested price"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ============ Upload / Loaded state ============ */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm sm:p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = '';
            }}
          />

          {/* ----- Empty state dropzone ----- */}
          {csvData.length === 0 && !showPaste && (
            <div
              onDragEnter={onDragEnter}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`group relative overflow-hidden rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-300 sm:p-8 ${
                isDragging
                  ? 'scale-[1.01] border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/10 dark:bg-emerald-950/20'
                  : 'border-emerald-500/40 bg-emerald-50/40 hover:border-emerald-500/70 hover:bg-emerald-50/70 dark:border-emerald-500/30 dark:bg-emerald-950/10 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-950/20'
              }`}
            >
              <div
                className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 ${
                  isDragging
                    ? 'scale-110 bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg'
                    : 'bg-emerald-500/10 text-emerald-500 group-hover:scale-105 group-hover:bg-emerald-500/15'
                }`}
              >
                <Upload size={26} />
              </div>
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                {isDragging ? 'Drop it — we’re ready' : 'Drag & drop your CSV here'}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Max a few thousand rows · commas, quoted fields and BOM are handled
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={openFilePicker}
                  className="flex select-none items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-emerald-500/25 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-emerald-500/40 active:translate-y-0 active:scale-95"
                >
                  <Upload size={14} /> Select CSV file
                </button>
                <button
                  onClick={() => ingest(SAMPLE_CSV, 'demo_catalogue.csv')}
                  className="flex select-none items-center gap-2 rounded-xl border border-emerald-500/30 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-500 hover:shadow-md active:translate-y-0 active:scale-95 dark:border-emerald-500/30 dark:bg-zinc-900 dark:text-emerald-300 dark:hover:border-emerald-500/60"
                >
                  <Sparkles size={14} /> Load Sample Catalogue (10 SKUs)
                </button>
                <button
                  onClick={downloadSampleTemplate}
                  className="flex select-none items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-400 hover:text-emerald-600 hover:shadow-md active:translate-y-0 active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
                >
                  <Download size={14} /> Download CSV Template
                </button>
                <button
                  onClick={() => setShowPaste(true)}
                  className="flex select-none items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-400 hover:text-emerald-600 hover:shadow-md active:translate-y-0 active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
                >
                  <FileText size={14} /> Paste CSV
                </button>
              </div>
            </div>
          )}

          {/* ----- Paste drawer ----- */}
          {showPaste && (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
              <div className="mb-2 flex select-none items-center gap-2">
                <FileText size={14} className="text-emerald-500" />
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">
                  Paste raw CSV
                </span>
              </div>
              <textarea
                value={pasteValue}
                onChange={(e) => setPasteValue(e.target.value)}
                placeholder="SKU_Name,Category,Cost_of_Goods,Selling_Price,Shipping_Fee,RTO_Percent&#10;Wireless Earbuds,Electronics,899,1499,40,5"
                rows={6}
                className="w-full resize-y rounded-xl border border-zinc-200 bg-white p-3 font-mono text-xs text-zinc-800 shadow-inner transition-all focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowPaste(false);
                    setPasteValue('');
                  }}
                  className="select-none rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    ingest(pasteValue, 'pasted_data.csv');
                    setShowPaste(false);
                    setPasteValue('');
                  }}
                  className="select-none rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm shadow-emerald-500/25 transition-all hover:shadow-md hover:shadow-emerald-500/40 active:scale-95"
                >
                  Parse &amp; calculate
                </button>
              </div>
            </div>
          )}

          {/* ----- Loaded catalogue status card ----- */}
          {csvData.length > 0 && !showPaste && (
            <div
              onDragEnter={onDragEnter}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`rounded-2xl border-2 border-dashed p-3 transition-all sm:p-5 ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-100/70 dark:bg-emerald-950/40'
                  : 'border-emerald-500/40 bg-emerald-50/60 dark:border-emerald-500/30 dark:bg-emerald-950/25'
              }`}
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25">
                    <FileSpreadsheet size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="flex select-none items-center gap-1 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 size={15} /> Catalogue Loaded
                      </span>
                      <span className="max-w-[220px] truncate rounded-md border border-emerald-500/20 bg-white px-2 py-0.5 text-[11px] font-semibold text-zinc-700 dark:border-emerald-500/30 dark:bg-zinc-900 dark:text-zinc-300">
                        {fileName}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="select-none rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        {csvData.length} SKUs Active
                      </span>
                      <span
                        className="select-none rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300"
                        title="SKU, Category, COGS, Price, Shipping, RTO"
                      >
                        ✓ Columns Verified
                        <span className="hidden sm:inline">
                          {' '}
                          (SKU, Category, COGS, Price, Shipping, RTO)
                        </span>
                      </span>
                      <span className="select-none rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        Active: {currentMarketplace.name}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 lg:shrink-0">
                  <button
                    onClick={openFilePicker}
                    className="flex select-none items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-white px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-500 hover:shadow-md active:translate-y-0 active:scale-95 dark:border-emerald-500/30 dark:bg-zinc-900 dark:text-emerald-300"
                  >
                    <Upload size={12} /> Upload Another
                  </button>
                  <button
                    onClick={() => setShowPaste(true)}
                    className="flex select-none items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-zinc-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-400 hover:text-emerald-600 hover:shadow-md active:translate-y-0 active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
                  >
                    <FileText size={12} /> Edit / Paste
                  </button>
                  <button
                    onClick={clearData}
                    className="flex select-none items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-100 hover:shadow-md active:translate-y-0 active:scale-95 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400"
                  >
                    <Trash2 size={12} /> Clear
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ============ Errors ============ */}
        {errors.length > 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 dark:border-rose-500/30 dark:bg-rose-500/10">
            <AlertCircle size={20} className="mt-0.5 shrink-0 text-rose-500" />
            <div className="min-w-0 flex-1">
              <p className="select-none text-sm font-semibold text-rose-700 dark:text-rose-300">
                {errors.length} issue{errors.length > 1 ? 's' : ''} found
              </p>
              <ul className="mt-1 space-y-0.5">
                {errors.slice(0, 5).map((err, i) => (
                  <li key={i} className="text-xs text-rose-600 dark:text-rose-400">
                    • {err}
                  </li>
                ))}
                {errors.length > 5 && (
                  <li className="text-xs text-rose-500 dark:text-rose-400">
                    • and {errors.length - 5} more…
                  </li>
                )}
              </ul>
            </div>
            <button
              onClick={() => setErrors([])}
              className="rounded-lg p-1 text-rose-400 transition-colors hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-500/20"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ============ Results ============ */}
        {calculations.length > 0 && summary && (
          <>
            {/* --- KPI summary cards --- */}
            <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="group relative min-w-0 select-none overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 p-4 text-white shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/30">
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-125" />
                <div className="flex items-center gap-2 text-xs font-semibold opacity-90">
                  <TrendingUp size={14} /> Total catalogue profit
                </div>
                <div className="mt-1 truncate text-2xl font-bold tabular-nums">
                  {formatCompactINR(summary.totalProfit)}
                </div>
                <div className="mt-0.5 truncate text-[11px] opacity-80">
                  {summary.count} SKUs · {formatCompactINR(summary.totalRevenue)} revenue
                </div>
              </div>

              <div className="group relative min-w-0 select-none overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 p-4 text-white shadow-lg shadow-teal-500/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-500/30">
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-125" />
                <div className="flex items-center gap-2 text-xs font-semibold opacity-90">
                  <BarChart3 size={14} /> Average margin
                </div>
                <div className="mt-1 truncate text-2xl font-bold tabular-nums">
                  {formatPct(summary.avgMargin)}
                </div>
                <div className="mt-0.5 truncate text-[11px] opacity-80">
                  weighted across {summary.count} SKUs
                </div>
              </div>

              <div className="group relative min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex select-none items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  <CheckCircle2 size={14} className="text-emerald-500" /> Profitable / Loss
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {summary.profitableCount}
                  </span>
                  <span className="text-zinc-300 dark:text-zinc-600">/</span>
                  <span className="text-2xl font-bold tabular-nums text-rose-500">
                    {summary.lossCount}
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700"
                    style={{ width: `${(summary.profitableCount / summary.count) * 100}%` }}
                  />
                </div>
              </div>

              <div className="group relative min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex select-none items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  <Wallet size={14} className="text-amber-500" /> Fees &amp; deductions
                </div>
                <div className="mt-1 truncate text-2xl font-bold tabular-nums text-zinc-800 dark:text-zinc-100">
                  {formatCompactINR(summary.totalDeductions)}
                </div>
                <div className="mt-0.5 truncate text-[11px] text-zinc-400 dark:text-zinc-500">
                  commission + GST + TCS + RTO + ads
                </div>
              </div>
            </section>

            {/* --- What-If Simulator --- */}
            <section
              className={`min-w-0 rounded-2xl border p-3 shadow-sm transition-colors sm:p-4 ${
                isWhatIfActive
                  ? 'border-emerald-500/40 bg-emerald-50/60 dark:border-emerald-500/30 dark:bg-emerald-950/25'
                  : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
              }`}
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <div className="flex h-7 w-7 select-none items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Zap size={14} />
                </div>
                <h3 className="select-none text-sm font-bold text-zinc-800 dark:text-zinc-100">
                  Bulk What-If Simulator
                </h3>
                {isWhatIfActive && (
                  <span className="select-none rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Simulating
                  </span>
                )}
                {isWhatIfActive && (
                  <button
                    onClick={() => {
                      setPriceAdjustment(0);
                      setRtoAdjustment(0);
                    }}
                    className="ml-auto flex select-none items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-zinc-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-400 hover:text-emerald-600 hover:shadow-md active:translate-y-0 active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
                  >
                    <RotateCcw size={12} /> Reset to Original CSV
                  </button>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="min-w-0">
                  <label className="mb-1.5 flex select-none items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    <IndianRupee size={12} /> Bulk Price Adjustment
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {[-10, -5, 0, 5, 10].map((v) => {
                      const active = priceAdjustment === v;
                      return (
                        <button
                          key={v}
                          onClick={() => setPriceAdjustment(v)}
                          className={`min-w-0 flex-1 select-none whitespace-nowrap rounded-lg border px-2.5 py-2 text-xs font-bold transition-all active:scale-95 ${
                            active
                              ? 'border-transparent bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-sm shadow-emerald-500/25'
                              : 'border-zinc-200 bg-white text-zinc-600 hover:border-emerald-400 hover:text-emerald-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-emerald-500 dark:hover:text-emerald-400'
                          }`}
                        >
                          {v > 0 ? '+' : ''}
                          {v}%
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="min-w-0">
                  <label className="mb-1.5 flex select-none items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    <RotateCcw size={12} /> RTO Reduction Goal
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { value: 0, label: 'Current' },
                      { value: -2, label: '-2% RTO' },
                      { value: -5, label: '-5% RTO' },
                    ].map((opt) => {
                      const active = rtoAdjustment === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setRtoAdjustment(opt.value)}
                          className={`min-w-0 flex-1 select-none whitespace-nowrap rounded-lg border px-2.5 py-2 text-xs font-bold transition-all active:scale-95 ${
                            active
                              ? 'border-transparent bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-sm shadow-emerald-500/25'
                              : 'border-zinc-200 bg-white text-zinc-600 hover:border-emerald-400 hover:text-emerald-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-emerald-500 dark:hover:text-emerald-400'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            {/* --- Cross-marketplace comparison --- */}
            <section className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm sm:p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <div className="flex h-7 w-7 select-none items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ArrowUpDown size={14} />
                </div>
                <h3 className="select-none text-sm font-bold text-zinc-800 dark:text-zinc-100">
                  Where should this catalogue go?
                </h3>
                <span className="ml-auto hidden select-none text-[11px] font-medium text-zinc-400 sm:block dark:text-zinc-500">
                  same SKUs · same settings
                </span>
              </div>
              <div className="space-y-1.5">
                {comparison.map((row, i) => {
                  const max = Math.max(...comparison.map((c) => Math.abs(c.total)), 1);
                  const width = Math.max(4, (Math.abs(row.total) / max) * 100);
                  const positive = row.total >= 0;
                  return (
                    <button
                      key={row.id}
                      onClick={() => setSelectedMarketplace(row.id)}
                      className={`group flex w-full min-w-0 items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-all hover:bg-zinc-50 active:scale-[0.995] sm:gap-3 dark:hover:bg-zinc-800/60 ${
                        row.id === selectedMarketplace ? 'bg-zinc-50 dark:bg-zinc-800/60' : ''
                      }`}
                    >
                      <span className="w-16 shrink-0 select-none truncate text-xs font-semibold text-zinc-700 sm:w-20 dark:text-zinc-200">
                        {row.name}
                      </span>
                      <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <span
                          className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r transition-all duration-700 ${
                            positive
                              ? 'from-emerald-400 to-teal-500'
                              : 'from-rose-400 to-rose-600'
                          }`}
                          style={{ width: `${width}%` }}
                        />
                      </span>
                      <span
                        className={`w-20 shrink-0 text-right text-xs font-bold tabular-nums transition-colors sm:w-24 ${
                          positive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-500 dark:text-rose-400'
                        }`}
                      >
                        {formatCompactINR(row.total)}
                      </span>
                      {i === 0 && positive && (
                        <span className="hidden shrink-0 select-none rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600 sm:block dark:text-emerald-400">
                          Best
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* --- Toolbar --- */}
            <section className="flex min-w-0 flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-900">
              <div className="relative min-w-0 flex-1">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search SKU or category…"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-sm text-zinc-800 transition-all placeholder:text-zinc-400 hover:border-zinc-300 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/15 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-zinc-600 dark:focus:bg-zinc-950"
                />
              </div>

              <div className="flex items-center gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
                {(['all', 'profit', 'loss'] as StatusFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`flex-1 select-none whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all sm:flex-none ${
                      statusFilter === f
                        ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                        : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white'
                    }`}
                  >
                    {f === 'all' ? 'All' : f === 'profit' ? 'Profitable' : 'Loss'}
                  </button>
                ))}
              </div>

              <div className="relative shrink-0">
                <select
                  value={`${sortKey}:${sortDir}`}
                  onChange={(e) => {
                    const [k, d] = e.target.value.split(':');
                    setSortKey(k as SortKey);
                    setSortDir(d as 'asc' | 'desc');
                  }}
                  className="w-full select-none appearance-none rounded-xl border border-zinc-200 bg-white py-2 pl-3 pr-8 text-xs font-semibold text-zinc-700 transition-all hover:border-zinc-300 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 sm:w-auto dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600"
                >
                  <option value="profit:desc">Profit ↓</option>
                  <option value="profit:asc">Profit ↑</option>
                  <option value="margin:desc">Margin ↓</option>
                  <option value="margin:asc">Margin ↑</option>
                  <option value="roi:desc">ROI ↓</option>
                  <option value="price:desc">Price ↓</option>
                  <option value="price:asc">Price ↑</option>
                  <option value="name:asc">Name A–Z</option>
                  <option value="name:desc">Name Z–A</option>
                </select>
                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
                />
              </div>
            </section>

            {/* --- Table / mobile cards --- */}
            <section className="min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              {/* Desktop table (md+) */}
              <div className="hidden md:block">
                <table className="w-full table-fixed text-sm">
                  <thead>
                    <tr className="select-none border-b border-zinc-200 bg-zinc-50/80 text-[10px] uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400">
                      <th className="w-7 px-1 py-3" />
                      <th className="w-[22%] px-2.5 py-3 text-left font-bold">SKU</th>
                      <th className="w-[10%] whitespace-nowrap px-2.5 py-3 text-right font-bold">
                        Price
                      </th>
                      <th className="w-[10%] whitespace-nowrap px-2.5 py-3 text-right font-bold">
                        Cost
                      </th>
                      <th className="w-[10%] whitespace-nowrap px-2.5 py-3 text-right font-bold">
                        Fees
                      </th>
                      <th className="w-[9%] whitespace-nowrap px-2.5 py-3 text-right font-bold">
                        RTO
                      </th>
                      <th className="w-[12%] whitespace-nowrap px-2.5 py-3 text-right font-bold">
                        Net profit
                      </th>
                      <th className="w-[15%] whitespace-nowrap px-2.5 py-3 text-right font-bold">
                        Margin
                      </th>
                      <th className="w-[10%] whitespace-nowrap px-2.5 py-3 text-center font-bold">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((calc) => {
                      const isOpen = expanded.has(calc.id);
                      const fees =
                        calc.commissionAmount +
                        calc.fixedFee +
                        calc.gstOnFees +
                        calc.tcsTds +
                        calc.adsSpend;
                      return (
                        <Fragment key={calc.id}>
                          <tr
                            onClick={() => toggleRow(calc.id)}
                            className={`group cursor-pointer border-b border-zinc-100 transition-colors last:border-0 dark:border-zinc-800/70 ${
                              isOpen
                                ? 'bg-emerald-50/60 dark:bg-emerald-500/10'
                                : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                            }`}
                          >
                            <td className="px-1 py-3 text-center">
                              <ChevronRight
                                size={15}
                                className={`text-zinc-400 transition-transform duration-200 group-hover:text-emerald-500 ${
                                  isOpen ? 'rotate-90 text-emerald-500' : ''
                                }`}
                              />
                            </td>
                            <td className="min-w-0 px-2.5 py-3">
                              <div className="truncate font-semibold text-zinc-800 dark:text-zinc-100">
                                {calc.skuName}
                              </div>
                              <div className="truncate text-[11px] text-zinc-400 dark:text-zinc-500">
                                {calc.category}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-2.5 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-200">
                              {formatINR(calc.sellingPrice)}
                            </td>
                            <td className="whitespace-nowrap px-2.5 py-3 text-right tabular-nums text-zinc-500 dark:text-zinc-400">
                              {formatINR(calc.costOfGoods)}
                            </td>
                            <td className="whitespace-nowrap px-2.5 py-3 text-right tabular-nums text-zinc-500 dark:text-zinc-400">
                              {formatINR(fees)}
                            </td>
                            <td className="whitespace-nowrap px-2.5 py-3 text-right tabular-nums text-zinc-500 dark:text-zinc-400">
                              {formatINR(calc.rtoLoss)}
                            </td>
                            <td
                              className={`whitespace-nowrap px-2.5 py-3 text-right font-bold tabular-nums ${
                                calc.isProfitable
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-rose-500 dark:text-rose-400'
                              }`}
                            >
                              {formatINR(calc.netProfit)}
                            </td>
                            <td className="whitespace-nowrap px-2.5 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <span
                                  className={`text-xs font-bold tabular-nums ${
                                    calc.isProfitable
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-rose-500 dark:text-rose-400'
                                  }`}
                                >
                                  {formatPct(calc.marginPercent)}
                                </span>
                                <span className="hidden h-1.5 w-10 shrink-0 overflow-hidden rounded-full bg-zinc-100 lg:block dark:bg-zinc-800">
                                  <span
                                    className={`block h-full rounded-full ${
                                      calc.isProfitable
                                        ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                                        : 'bg-gradient-to-r from-rose-400 to-rose-600'
                                    }`}
                                    style={{
                                      width: `${Math.min(Math.abs(calc.marginPercent), 100)}%`,
                                    }}
                                  />
                                </span>
                              </div>
                            </td>
                            <td className="px-2.5 py-3 text-center">
                              <StatusBadge isProfitable={calc.isProfitable} />
                            </td>
                          </tr>
                          {isOpen && (
                            <tr className="border-b border-zinc-100 bg-zinc-50/70 dark:border-zinc-800/70 dark:bg-zinc-950/40">
                              <td colSpan={9} className="px-3 py-4">
                                <FeeBreakdown
                                  calc={calc}
                                  targetMargin={settings.targetMargin}
                                />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards (<md) */}
              <div className="md:hidden">
                {pageRows.map((calc) => {
                  const isOpen = expanded.has(calc.id);
                  const fees =
                    calc.commissionAmount +
                    calc.fixedFee +
                    calc.gstOnFees +
                    calc.tcsTds +
                    calc.adsSpend;
                  return (
                    <div
                      key={calc.id}
                      onClick={() => toggleRow(calc.id)}
                      className={`cursor-pointer border-b border-zinc-100 p-3 transition-colors last:border-0 dark:border-zinc-800/70 ${
                        isOpen
                          ? 'bg-emerald-50/60 dark:bg-emerald-500/10'
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                      }`}
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="flex min-w-0 flex-1 items-start gap-1.5">
                          <ChevronRight
                            size={14}
                            className={`mt-0.5 shrink-0 text-zinc-400 transition-transform ${
                              isOpen ? 'rotate-90 text-emerald-500' : ''
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                              {calc.skuName}
                            </div>
                            <div className="truncate text-[11px] text-zinc-400 dark:text-zinc-500">
                              {calc.category}
                            </div>
                          </div>
                        </div>
                        <StatusBadge isProfitable={calc.isProfitable} />
                      </div>
                      <div className="grid grid-cols-3 gap-2 pl-5 text-xs">
                        <div className="min-w-0">
                          <div className="select-none text-[10px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                            Price
                          </div>
                          <div className="truncate font-semibold tabular-nums text-zinc-700 dark:text-zinc-200">
                            {formatINR(calc.sellingPrice)}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="select-none text-[10px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                            Fees
                          </div>
                          <div className="truncate font-semibold tabular-nums text-zinc-500 dark:text-zinc-400">
                            {formatINR(fees)}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="select-none text-[10px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                            Net profit
                          </div>
                          <div
                            className={`truncate font-bold tabular-nums ${
                              calc.isProfitable
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-500 dark:text-rose-400'
                            }`}
                          >
                            {formatINR(calc.netProfit)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between pl-5 text-[11px]">
                        <span className="text-zinc-500 dark:text-zinc-400">
                          RTO loss: {formatINR(calc.rtoLoss)}
                        </span>
                        <span
                          className={`font-bold tabular-nums ${
                            calc.isProfitable
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-500 dark:text-rose-400'
                          }`}
                        >
                          Margin: {formatPct(calc.marginPercent)}
                        </span>
                      </div>
                      {isOpen && (
                        <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
                          <FeeBreakdown
                            calc={calc}
                            targetMargin={settings.targetMargin}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Empty results */}
              {pageRows.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <Search size={28} className="text-zinc-300 dark:text-zinc-600" />
                  <p className="select-none text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                    No SKUs match your filters
                  </p>
                  <button
                    onClick={() => {
                      setQuery('');
                      setStatusFilter('all');
                    }}
                    className="select-none text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    Reset filters
                  </button>
                </div>
              )}

              {/* Pagination + export */}
              <div className="flex flex-col gap-3 border-t border-zinc-200 bg-zinc-50/60 px-3 py-3 sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-950/40">
                <p className="select-none text-xs text-zinc-500 dark:text-zinc-400">
                  Showing{' '}
                  <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                    {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–
                    {Math.min(safePage * PAGE_SIZE, filtered.length)}
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                    {filtered.length}
                  </span>{' '}
                  SKUs
                </p>

                <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
                  <button
                    onClick={() => setPage(Math.max(1, safePage - 1))}
                    disabled={safePage === 1}
                    className="select-none rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-600 transition-all hover:border-emerald-400 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
                  >
                    Prev
                  </button>
                  <span className="select-none px-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    {safePage} / {pageCount}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(pageCount, safePage + 1))}
                    disabled={safePage === pageCount}
                    className="select-none rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-600 transition-all hover:border-emerald-400 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
                  >
                    Next
                  </button>

                  <button
                    onClick={copyReport}
                    className="flex select-none items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-600 transition-all hover:-translate-y-0.5 hover:border-emerald-400 hover:text-emerald-600 hover:shadow-sm active:translate-y-0 active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
                  >
                    {copied ? (
                      <Check size={13} className="text-emerald-500" />
                    ) : (
                      <Copy size={13} />
                    )}
                    {copied ? 'Copied' : 'Copy'}
                  </button>

                  <button
                    onClick={downloadReport}
                    className={`flex select-none items-center gap-1.5 rounded-lg bg-gradient-to-r ${currentMarketplace.gradient} px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-zinc-900/20 active:translate-y-0 active:scale-95`}
                  >
                    <Download size={13} />
                    Export report
                  </button>
                </div>
              </div>
            </section>

            {/* --- Footnote --- */}
            <div className="flex items-start gap-2 rounded-xl border border-zinc-200 bg-white/60 p-3 text-[11px] leading-relaxed text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
              <Info size={14} className="mt-0.5 shrink-0 text-emerald-500" />
              <p>
                <strong className="text-zinc-700 dark:text-zinc-200">
                  How this is calculated:
                </strong>{' '}
                Net profit = Selling price − COGS − forward shipping − commission − fixed fee −
                GST on fees − TCS/TDS − RTO loss − packaging − ad spend. RTO loss uses COGS +
                shipping + return shipping × RTO%. Rates are indicative — override them with your
                real contract values before making pricing decisions.
              </p>
            </div>
          </>
        )}

        {/* ============ Empty state (no data yet) ============ */}
        {calculations.length === 0 && errors.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-white/50 px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
              <FileSpreadsheet size={26} />
            </div>
            <p className="select-none text-sm font-semibold text-zinc-600 dark:text-zinc-300">
              No catalogue loaded yet
            </p>
            <p className="max-w-sm text-xs text-zinc-400 dark:text-zinc-500">
              Download the template, fill in your SKUs, and drop the CSV above — or hit “Load
              Sample Catalogue” to see the calculator in action.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}