import { useEffect, useMemo, useRef, useState } from 'react';
import type { ElementType, ReactNode } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  ImagePlus,
  IndianRupee,
  Landmark,
  Package,
  Pencil,
  Plus,
  Printer,
  Receipt,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  User,
  Wallet,
  X,
} from 'lucide-react';

/* ────────────────────────────────────────────────────────────────────────────
   Constants
──────────────────────────────────────────────────────────────────────────── */

const INDIAN_STATES: { name: string; code: string }[] = [
  { name: 'Andaman and Nicobar Islands', code: '35' },
  { name: 'Andhra Pradesh', code: '37' },
  { name: 'Arunachal Pradesh', code: '12' },
  { name: 'Assam', code: '18' },
  { name: 'Bihar', code: '10' },
  { name: 'Chandigarh', code: '04' },
  { name: 'Chhattisgarh', code: '22' },
  { name: 'Dadra and Nagar Haveli and Daman and Diu', code: '26' },
  { name: 'Delhi', code: '07' },
  { name: 'Goa', code: '30' },
  { name: 'Gujarat', code: '24' },
  { name: 'Haryana', code: '06' },
  { name: 'Himachal Pradesh', code: '02' },
  { name: 'Jammu and Kashmir', code: '01' },
  { name: 'Jharkhand', code: '20' },
  { name: 'Karnataka', code: '29' },
  { name: 'Kerala', code: '32' },
  { name: 'Ladakh', code: '38' },
  { name: 'Lakshadweep', code: '31' },
  { name: 'Madhya Pradesh', code: '23' },
  { name: 'Maharashtra', code: '27' },
  { name: 'Manipur', code: '14' },
  { name: 'Meghalaya', code: '17' },
  { name: 'Mizoram', code: '15' },
  { name: 'Nagaland', code: '13' },
  { name: 'Odisha', code: '21' },
  { name: 'Puducherry', code: '34' },
  { name: 'Punjab', code: '03' },
  { name: 'Rajasthan', code: '08' },
  { name: 'Sikkim', code: '11' },
  { name: 'Tamil Nadu', code: '33' },
  { name: 'Telangana', code: '36' },
  { name: 'Tripura', code: '16' },
  { name: 'Uttar Pradesh', code: '09' },
  { name: 'Uttarakhand', code: '05' },
  { name: 'West Bengal', code: '19' },
];

// Union Territories without a legislature charge UTGST instead of SGST
const UT_NO_LEGISLATURE = new Set(['35', '04', '26', '31', '38']);

const GST_RATES = [0, 0.25, 3, 5, 12, 18, 28];
const UNITS = ['Pcs', 'Nos', 'Set', 'Pair', 'Box', 'Kg', 'g', 'L', 'ml', 'Mtr', 'Hrs', 'Svc'];
const CHANNELS = ['Direct / Website', 'Amazon', 'Flipkart', 'Meesho', 'Myntra', 'Blinkit', 'Zepto', 'Other'];
const PAYMENT_MODES = ['UPI', 'Bank Transfer', 'Cash', 'Card', 'COD', 'Cheque', 'Marketplace Settlement'];

type DocType = 'tax' | 'bill_of_supply' | 'credit_note' | 'proforma';
type PriceMode = 'exclusive' | 'inclusive';
type DiscType = 'percent' | 'amount';

const DOC_LABELS: Record<DocType, string> = {
  tax: 'Tax Invoice',
  bill_of_supply: 'Bill of Supply',
  credit_note: 'Credit Note',
  proforma: 'Proforma Invoice',
};

const DEFAULT_TERMS =
  'Payment due as per the due date above.\nGoods once sold will not be taken back except as per return policy.\nSubject to local jurisdiction.\nThis is a computer-generated invoice.';

/* ────────────────────────────────────────────────────────────────────────────
   Types
──────────────────────────────────────────────────────────────────────────── */

interface Seller {
  name: string;
  gstin: string;
  address: string;
  state: string;
  phone: string;
  email: string;
  logo: string;
  signature: string;
  bankName: string;
  bankAcc: string;
  bankIfsc: string;
  bankBranch: string;
  upi: string;
}

interface Buyer {
  name: string;
  gstin: string;
  billing: string;
  shipping: string;
  sameAsBilling: boolean;
  state: string; // place of supply
  phone: string;
  email: string;
}

interface LineItem {
  id: string;
  description: string;
  hsn: string;
  unit: string;
  qty: number;
  rate: number;
  discount: number;
  discType: DiscType;
  gstRate: number;
}

interface InvoiceState {
  docType: DocType;
  number: string;
  date: string;
  dueDate: string;
  refInvoice: string;
  channel: string;
  orderId: string;
  reverseCharge: boolean;
  priceMode: PriceMode;
  roundOff: boolean;
  shippingAmount: number;
  shippingGst: number;
  amountPaid: number;
  paymentMode: string;
  notes: string;
  terms: string;
  buyer: Buyer;
  items: LineItem[];
}

interface Settings {
  prefix: string;
  next: number;
}

interface CalcLine {
  id: string;
  description: string;
  hsn: string;
  unit: string;
  qty: number;
  rate: number;
  gross: number;
  discount: number;
  taxable: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  tax: number;
  total: number;
}

interface HsnRow {
  hsn: string;
  gstRate: number;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  tax: number;
}

interface Computed {
  lines: CalcLine[];
  hsnSummary: HsnRow[];
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  tax: number;
  preRound: number;
  roundOff: number;
  grand: number;
  balance: number;
  inter: boolean;
  utgst: boolean;
  taxed: boolean;
}

interface Check {
  level: 'error' | 'warn';
  text: string;
}

/* ────────────────────────────────────────────────────────────────────────────
   Helpers
──────────────────────────────────────────────────────────────────────────── */

const uid = () => Math.random().toString(36).slice(2, 10);
const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const todayISO = () => new Date().toISOString().slice(0, 10);
const addDaysISO = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};
const inr = (v: number) =>
  v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (iso: string) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

const stateCode = (name: string) => INDIAN_STATES.find((s) => s.name === name)?.code ?? '';
const stateByCode = (code: string) => INDIAN_STATES.find((s) => s.code === code)?.name ?? '';

function fyLabel(iso: string): string {
  const d = new Date(iso || todayISO());
  const start = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return `${String(start).slice(2)}-${String(start + 1).slice(2)}`;
}

function buildNumber(settings: Settings, dateISO: string): string {
  return `${settings.prefix}/${fyLabel(dateISO)}/${String(settings.next).padStart(4, '0')}`;
}

const GSTIN_RE = /^[0-3][0-9][A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

function gstinChecksumOk(g: string): boolean {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const idx = chars.indexOf(g[i]);
    const p = idx * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(p / 36) + (p % 36);
  }
  return chars[(36 - (sum % 36)) % 36] === g[14];
}

function gstinStatus(g: string): 'empty' | 'format' | 'checksum' | 'ok' {
  if (!g) return 'empty';
  if (!GSTIN_RE.test(g)) return 'format';
  return gstinChecksumOk(g) ? 'ok' : 'checksum';
}

function amountInWords(amount: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven',
    'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const two = (n: number) => (n < 20 ? ones[n] : `${tens[Math.floor(n / 10)]} ${ones[n % 10]}`.trim());
  const three = (n: number) => {
    const h = Math.floor(n / 100);
    const r = n % 100;
    return [h ? `${ones[h]} Hundred` : '', r ? two(r) : ''].filter(Boolean).join(' ');
  };
  const words = (n: number): string => {
    if (n === 0) return '';
    const crore = Math.floor(n / 10000000);
    const lakh = Math.floor((n % 10000000) / 100000);
    const thousand = Math.floor((n % 100000) / 1000);
    const rest = n % 1000;
    return [
      crore ? `${words(crore)} Crore` : '',
      lakh ? `${two(lakh)} Lakh` : '',
      thousand ? `${two(thousand)} Thousand` : '',
      rest ? three(rest) : '',
    ].filter(Boolean).join(' ');
  };
  const total = Math.round(Math.abs(amount) * 100);
  const rupees = Math.floor(total / 100);
  const paise = total % 100;
  if (total === 0) return 'Zero Rupees Only';
  let out = rupees ? `${words(rupees)} Rupees` : '';
  if (paise) out += `${out ? ' and ' : ''}${two(paise)} Paise`;
  return `${out} Only`;
}

function blankItem(): LineItem {
  return { id: uid(), description: '', hsn: '', unit: 'Pcs', qty: 1, rate: 0, discount: 0, discType: 'percent', gstRate: 18 };
}

function blankBuyer(): Buyer {
  return { name: '', gstin: '', billing: '', shipping: '', sameAsBilling: true, state: '', phone: '', email: '' };
}

function makeInvoice(settings: Settings): InvoiceState {
  const date = todayISO();
  return {
    docType: 'tax',
    number: buildNumber(settings, date),
    date,
    dueDate: addDaysISO(15),
    refInvoice: '',
    channel: CHANNELS[0],
    orderId: '',
    reverseCharge: false,
    priceMode: 'exclusive',
    roundOff: true,
    shippingAmount: 0,
    shippingGst: 18,
    amountPaid: 0,
    paymentMode: 'UPI',
    notes: '',
    terms: DEFAULT_TERMS,
    buyer: blankBuyer(),
    items: [blankItem()],
  };
}

const SAMPLE_SELLER: Seller = {
  name: 'Sunrise Retail Pvt Ltd',
  gstin: '27AABCS1234F1ZR',
  address: '14, MIDC Industrial Area, Andheri East, Mumbai 400093',
  state: 'Maharashtra',
  phone: '9876543210',
  email: 'billing@sunriseretail.in',
  logo: '',
  signature: '',
  bankName: 'HDFC Bank',
  bankAcc: '50200012345678',
  bankIfsc: 'HDFC0001234',
  bankBranch: 'Andheri East',
  upi: 'sunriseretail@hdfcbank',
};

const BLANK_SELLER: Seller = {
  name: '', gstin: '', address: '', state: '', phone: '', email: '', logo: '', signature: '',
  bankName: '', bankAcc: '', bankIfsc: '', bankBranch: '', upi: '',
};

function usePersistentState<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return initial;
      const parsed = JSON.parse(raw);
      if (Array.isArray(initial)) return (Array.isArray(parsed) ? parsed : initial) as T;
      if (initial && typeof initial === 'object') return { ...initial, ...parsed } as T;
      return parsed as T;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full or blocked — ignore */
    }
  }, [key, value]);
  return [value, setValue];
}

function downloadBlob(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ────────────────────────────────────────────────────────────────────────────
   Core GST calculation (pure)
──────────────────────────────────────────────────────────────────────────── */

function compute(inv: InvoiceState, sellerState: string): Computed {
  const taxed = inv.docType !== 'bill_of_supply';
  const inter = !!sellerState && !!inv.buyer.state && sellerState !== inv.buyer.state;
  const utgst = !inter && UT_NO_LEGISLATURE.has(stateCode(sellerState));
  const inclusive = inv.priceMode === 'inclusive';

  const build = (
    id: string, description: string, hsn: string, unit: string, qty: number, rate: number,
    discount: number, discType: DiscType, gstRate: number,
  ): CalcLine => {
    const gross = r2(qty * rate);
    const disc = r2(discType === 'percent' ? Math.min((gross * discount) / 100, gross) : Math.min(discount, gross));
    const net = r2(gross - disc);
    const g = taxed ? gstRate : 0;
    let taxable = net;
    let tax = 0;
    if (g > 0) {
      if (inclusive) {
        taxable = r2(net / (1 + g / 100));
        tax = r2(net - taxable);
      } else {
        tax = r2((net * g) / 100);
      }
    }
    const igst = inter ? tax : 0;
    const cgst = inter ? 0 : r2(tax / 2);
    const sgst = inter ? 0 : r2(tax - cgst);
    return { id, description, hsn, unit, qty, rate, gross, discount: disc, taxable, gstRate: g, cgst, sgst, igst, tax, total: r2(taxable + tax) };
  };

  const lines = inv.items.map((i) =>
    build(i.id, i.description, i.hsn, i.unit, i.qty, i.rate, i.discount, i.discType, i.gstRate),
  );
  if (inv.shippingAmount > 0) {
    lines.push(build('shipping', 'Shipping / Handling Charges', '9965', 'Svc', 1, inv.shippingAmount, 0, 'amount', inv.shippingGst));
  }

  const sum = (k: keyof CalcLine) => r2(lines.reduce((s, l) => s + (l[k] as number), 0));
  const taxable = sum('taxable');
  const cgst = sum('cgst');
  const sgst = sum('sgst');
  const igst = sum('igst');
  const tax = r2(cgst + sgst + igst);
  const preRound = r2(taxable + tax);
  const grand = inv.roundOff ? Math.round(preRound) : preRound;
  const roundOff = r2(grand - preRound);

  const map = new Map<string, HsnRow>();
  lines.forEach((l) => {
    const key = `${l.hsn || '—'}|${l.gstRate}`;
    const row = map.get(key) ?? { hsn: l.hsn || '—', gstRate: l.gstRate, taxable: 0, cgst: 0, sgst: 0, igst: 0, tax: 0 };
    row.taxable = r2(row.taxable + l.taxable);
    row.cgst = r2(row.cgst + l.cgst);
    row.sgst = r2(row.sgst + l.sgst);
    row.igst = r2(row.igst + l.igst);
    row.tax = r2(row.tax + l.tax);
    map.set(key, row);
  });

  return {
    lines, hsnSummary: [...map.values()], taxable, cgst, sgst, igst, tax, preRound, roundOff, grand,
    balance: r2(grand - inv.amountPaid), inter, utgst, taxed,
  };
}

function runChecks(inv: InvoiceState, seller: Seller, c: Computed): Check[] {
  const out: Check[] = [];
  const add = (level: Check['level'], text: string) => out.push({ level, text });
  const sg = gstinStatus(seller.gstin);
  const bg = gstinStatus(inv.buyer.gstin);

  if (!seller.name) add('error', 'Seller business name is missing.');
  if (c.taxed) {
    if (sg === 'empty') add('error', 'Seller GSTIN is required on a tax invoice.');
    if (sg === 'format') add('error', 'Seller GSTIN format is invalid (15 characters).');
    if (sg === 'checksum') add('warn', 'Seller GSTIN failed the checksum — check for a typo.');
    if (sg === 'ok' && seller.state && stateCode(seller.state) !== seller.gstin.slice(0, 2))
      add('warn', `Seller state does not match GSTIN state code (${seller.gstin.slice(0, 2)}).`);
  }
  if (bg === 'format') add('error', 'Buyer GSTIN format is invalid.');
  if (bg === 'checksum') add('warn', 'Buyer GSTIN failed the checksum — check for a typo.');
  if (!seller.state) add('error', 'Select the seller state — needed to decide CGST/SGST vs IGST.');
  if (!inv.buyer.state) add('error', 'Select the place of supply.');
  if (!inv.buyer.name) add('warn', 'Buyer name is empty.');
  if (!inv.number) add('error', 'Invoice number is required.');
  if (inv.number.length > 16) add('error', 'Invoice number must be 16 characters or fewer under GST rules.');
  if (!/^[A-Za-z0-9/-]*$/.test(inv.number)) add('error', 'Invoice number may only contain letters, digits, "/" and "-".');
  if (inv.docType === 'credit_note' && !inv.refInvoice) add('warn', 'Credit note should reference the original invoice number.');
  if (inv.items.length === 0) add('error', 'Add at least one line item.');
  inv.items.forEach((it, i) => {
    const n = i + 1;
    if (!it.description) add('warn', `Item ${n}: description is empty.`);
    if (it.qty <= 0) add('error', `Item ${n}: quantity must be above zero.`);
    if (c.taxed && it.hsn && !/^\d{4}$|^\d{6}$|^\d{8}$/.test(it.hsn)) add('warn', `Item ${n}: HSN/SAC should be 4, 6 or 8 digits.`);
    if (c.taxed && !it.hsn) add('warn', `Item ${n}: HSN/SAC is missing.`);
  });
  if (inv.amountPaid > c.grand) add('warn', 'Amount paid is more than the grand total.');
  return out;
}

/* ────────────────────────────────────────────────────────────────────────────
   Styles
──────────────────────────────────────────────────────────────────────────── */

const inputCls =
  'w-full text-sm font-medium text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800/70 rounded-lg border-2 border-zinc-200 dark:border-zinc-700 px-3 py-2.5 outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/15 transition-all placeholder:text-zinc-400 dark:[color-scheme:dark]';
const cardCls =
  'bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-zinc-200/80 dark:border-white/10 shadow-sm p-5 sm:p-6';
const badgeCls = 'rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center';
const primaryBtn =
  'flex items-center justify-center gap-2 rounded-xl text-sm bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold shadow-lg shadow-emerald-500/20 transition-all select-none focus:outline-none';
const btnGhost =
  'flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all select-none focus:outline-none';

const PRINT_CSS = `@media print{
  @page{size:A4;margin:10mm}
  body *{visibility:hidden}
  .print-area,.print-area *{visibility:visible}
  .print-area{position:absolute;left:0;top:0;width:100%}
  .no-print{display:none!important}
  *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
}`;

/* ────────────────────────────────────────────────────────────────────────────
   Small UI pieces
──────────────────────────────────────────────────────────────────────────── */

function Section({ title, icon: Icon, children, action }: { title: string; icon: ElementType; children: ReactNode; action?: ReactNode }) {
  return (
    <section className={cardCls}>
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 ${badgeCls}`}>
            <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
          </div>
          <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-200 uppercase tracking-wide select-none">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label className="select-none text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">{label}</label>
      {children}
      {error ? (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      ) : hint ? (
        <p className="text-xs text-zinc-400 mt-1">{hint}</p>
      ) : null}
    </div>
  );
}

function Text({ value, onChange, placeholder, upper, multiline }: {
  value: string; onChange: (v: string) => void; placeholder?: string; upper?: boolean; multiline?: boolean;
}) {
  const handle = (v: string) => onChange(upper ? v.toUpperCase() : v);
  return multiline ? (
    <textarea rows={2} value={value} onChange={(e) => handle(e.target.value)} placeholder={placeholder} className={`${inputCls} resize-none`} />
  ) : (
    <input type="text" value={value} onChange={(e) => handle(e.target.value)} placeholder={placeholder} className={inputCls} />
  );
}

function Num({ value, onChange, placeholder, className }: { value: number; onChange: (n: number) => void; placeholder?: string; className?: string }) {
  const [text, setText] = useState(value ? String(value) : '');
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setText(value ? String(value) : '');
  }, [value, focused]);
  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      placeholder={placeholder ?? '0'}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(e) => {
        const v = e.target.value;
        if (!/^\d*\.?\d*$/.test(v)) return;
        setText(v);
        onChange(v === '' || v === '.' ? 0 : parseFloat(v));
      }}
      className={className ?? inputCls}
    />
  );
}

function Select({ value, onChange, options, placeholder, className }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder?: string; className?: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={className ?? inputCls}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 select-none focus:outline-none"
    >
      <span className={`w-9 h-5 rounded-full relative transition-colors ${checked ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
      {label}
    </button>
  );
}

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="inline-flex flex-wrap gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-3.5 py-1.5 rounded-lg text-xs transition-all select-none focus:outline-none border ${
            value === o.value
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-medium shadow-sm'
              : 'border-transparent text-zinc-500 dark:text-zinc-400 font-medium hover:text-zinc-700 dark:hover:text-zinc-200'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ImageUpload({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const pick = (file?: File) => {
    if (!file) return;
    if (file.size > 500 * 1024) {
      alert('Image is too large. Please use a file under 500 KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.readAsDataURL(file);
  };
  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
          {value ? <img src={value} alt={label} className="max-w-full max-h-full object-contain" /> : <ImagePlus className="w-5 h-5 text-zinc-400" />}
        </div>
        <div className="flex flex-col gap-1.5">
          <button type="button" onClick={() => ref.current?.click()} className={btnGhost}>
            <Upload className="w-4 h-4" /> Upload
          </button>
          {value && (
            <button type="button" onClick={() => onChange('')} className="text-xs text-zinc-400 hover:text-red-500 flex items-center gap-1 select-none">
              <X className="w-3 h-3" /> Remove
            </button>
          )}
        </div>
        <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
    </Field>
  );
}

function GstinField({ label, value, onChange, optional }: { label: string; value: string; onChange: (v: string) => void; optional?: boolean }) {
  const status = gstinStatus(value);
  const msg =
    status === 'format' ? 'Invalid format — 15 characters, e.g. 27ABCDE1234F1Z5'
    : status === 'checksum' ? 'Format OK, but checksum failed — possible typo'
    : undefined;
  return (
    <Field label={label} error={msg} hint={status === 'ok' ? `Valid · State: ${stateByCode(value.slice(0, 2)) || value.slice(0, 2)} · PAN: ${value.slice(2, 12)}` : optional ? 'Leave blank for B2C' : undefined}>
      <input
        type="text"
        maxLength={15}
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
        placeholder="27ABCDE1234F1Z5"
        className={`${inputCls} ${status === 'format' || status === 'checksum' ? '!border-red-400' : status === 'ok' ? '!border-emerald-400' : ''}`}
      />
    </Field>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Main component
──────────────────────────────────────────────────────────────────────────── */

export default function GSTInvoiceGenerator() {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [settings, setSettings] = usePersistentState<Settings>('sm_gst_settings', { prefix: 'INV', next: 1 });
  const [seller, setSeller] = usePersistentState<Seller>('sm_gst_seller', BLANK_SELLER);
  const [customers, setCustomers] = usePersistentState<Buyer[]>('sm_gst_customers', []);
  const [catalog, setCatalog] = usePersistentState<LineItem[]>('sm_gst_catalog', []);
  const [inv, setInv] = usePersistentState<InvoiceState>('sm_gst_draft', makeInvoice({ prefix: 'INV', next: 1 }));
  const importRef = useRef<HTMLInputElement>(null);

  const calc = useMemo(() => compute(inv, seller.state), [inv, seller.state]);
  const checks = useMemo(() => runChecks(inv, seller, calc), [inv, seller, calc]);
  const errorCount = checks.filter((c) => c.level === 'error').length;
  const warnCount = checks.length - errorCount;
  const hasErrors = errorCount > 0;

  const patchInv = (p: Partial<InvoiceState>) => setInv((prev) => ({ ...prev, ...p }));
  const patchSeller = (p: Partial<Seller>) => setSeller((prev) => ({ ...prev, ...p }));
  const patchBuyer = (p: Partial<Buyer>) => setInv((prev) => ({ ...prev, buyer: { ...prev.buyer, ...p } }));
  const patchItem = (id: string, p: Partial<LineItem>) =>
    setInv((prev) => ({ ...prev, items: prev.items.map((i) => (i.id === id ? { ...i, ...p } : i)) }));

  const onSellerGstin = (v: string) => {
    const p: Partial<Seller> = { gstin: v };
    if (GSTIN_RE.test(v)) {
      const st = stateByCode(v.slice(0, 2));
      if (st) p.state = st;
    }
    patchSeller(p);
  };

  const onBuyerGstin = (v: string) => {
    const p: Partial<Buyer> = { gstin: v };
    if (GSTIN_RE.test(v)) {
      const st = stateByCode(v.slice(0, 2));
      if (st) p.state = st;
    }
    patchBuyer(p);
  };

  const onDescription = (id: string, description: string) => {
    const saved = catalog.find((c) => c.description.toLowerCase() === description.toLowerCase());
    if (saved) {
      patchItem(id, { description, hsn: saved.hsn, unit: saved.unit, rate: saved.rate, gstRate: saved.gstRate, discount: saved.discount, discType: saved.discType });
    } else {
      patchItem(id, { description });
    }
  };

  const saveItemToCatalog = (item: LineItem) => {
    if (!item.description.trim()) return;
    setCatalog((prev) => [{ ...item, qty: 1, id: uid() }, ...prev.filter((c) => c.description.toLowerCase() !== item.description.toLowerCase())].slice(0, 200));
  };

  const saveCustomer = () => {
    if (!inv.buyer.name.trim()) return;
    setCustomers((prev) => [inv.buyer, ...prev.filter((c) => c.name.toLowerCase() !== inv.buyer.name.toLowerCase())].slice(0, 200));
  };

  const pickCustomer = (name: string) => {
    const c = customers.find((x) => x.name === name);
    if (c) patchBuyer(c);
  };

  const newInvoice = () => {
    if (!confirm('Start a new invoice? The current draft will be cleared.')) return;
    const nextSettings = { ...settings, next: settings.next + 1 };
    setSettings(nextSettings);
    setInv({ ...makeInvoice(nextSettings), terms: inv.terms, notes: inv.notes, shippingGst: inv.shippingGst });
    setMode('edit');
  };

  const loadSample = () => {
    const hasRealSeller = !!seller.name && seller.gstin !== SAMPLE_SELLER.gstin;
    if (!hasRealSeller || confirm('Replace your saved seller details with the sample seller?')) {
      setSeller((prev) => ({ ...SAMPLE_SELLER, logo: prev.logo, signature: prev.signature }));
    }
    patchInv({
      docType: 'tax',
      priceMode: 'exclusive',
      channel: 'Amazon',
      orderId: '404-1234567-8901234',
      buyer: {
        ...blankBuyer(),
        name: 'TechCorp Solutions LLP',
        gstin: '29AAECT5678K1ZK',
        billing: '456 Business Park, Whitefield, Bengaluru 560066',
        sameAsBilling: true,
        state: 'Karnataka',
        phone: '9123456780',
        email: 'accounts@techcorp.in',
      },
      items: [
        { ...blankItem(), description: 'Wireless Earbuds (Black)', hsn: '8518', qty: 2, rate: 1499, gstRate: 18 },
        { ...blankItem(), description: 'Cotton Round-Neck T-Shirt', hsn: '6109', qty: 3, rate: 499, discount: 10, gstRate: 5 },
      ],
    });
  };

  const clearInvoice = () => {
    if (!confirm('Clear the current invoice?')) return;
    setInv(makeInvoice(settings));
    if (seller.gstin === SAMPLE_SELLER.gstin) setSeller(BLANK_SELLER);
  };

  const handlePrint = () => {
    setMode('preview');
    setTimeout(() => window.print(), 300);
  };

  const exportJSON = () =>
    downloadBlob(JSON.stringify({ seller: { ...seller, logo: '', signature: '' }, invoice: inv }, null, 2), `${inv.number.replace(/\//g, '-') || 'invoice'}.json`, 'application/json');

  const importJSON = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (parsed.invoice) setInv({ ...makeInvoice(settings), ...parsed.invoice, buyer: { ...blankBuyer(), ...parsed.invoice.buyer } });
        if (parsed.seller) setSeller((prev) => ({ ...prev, ...parsed.seller, logo: prev.logo, signature: prev.signature }));
      } catch {
        alert('That file is not a valid invoice JSON.');
      }
    };
    reader.readAsText(file);
  };

  const exportCSV = () => {
    const q = (s: string | number) => `"${String(s).replace(/"/g, '""')}"`;
    const head = ['Invoice No', 'Date', 'Buyer', 'Buyer GSTIN', 'Place of Supply', 'Description', 'HSN', 'Qty', 'Rate', 'Taxable', 'GST %', 'CGST', 'SGST', 'IGST', 'Total'];
    const rows = calc.lines.map((l) => [inv.number, inv.date, inv.buyer.name, inv.buyer.gstin, inv.buyer.state, l.description, l.hsn, l.qty, l.rate, l.taxable, l.gstRate, l.cgst, l.sgst, l.igst, l.total]);
    downloadBlob([head, ...rows].map((r) => r.map(q).join(',')).join('\n'), `${inv.number.replace(/\//g, '-') || 'invoice'}.csv`, 'text/csv');
  };

  const sgstLabel = calc.utgst ? 'UTGST' : 'SGST';

  return (
    <div className="w-full max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-6 box-border overflow-x-hidden">
      <style>{PRINT_CSS}</style>

      {/* Glassmorphic studio banner — header */}
      <div className="no-print relative overflow-hidden rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/20 dark:from-zinc-900/95 dark:via-zinc-900/90 dark:to-emerald-950/25 p-5 sm:p-7 shadow-sm mb-6">
        <div className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold tracking-wide text-emerald-600 dark:text-emerald-400 select-none">
              <CheckCircle2 className="w-3.5 h-3.5" /> GSTN Rule 46 Compliant
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white select-none">
              GST Tax Invoice &amp; Bill of Supply Studio
            </h2>
            <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400 select-none">
              Instant CGST / SGST / IGST split, live compliance checks and print-ready PDF invoices for your marketplace and direct sales.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button onClick={loadSample} className={`select-none ${primaryBtn} px-4 py-2.5`}>
              ✨ Fill Sample Invoice
            </button>
            <button onClick={clearInvoice} className={btnGhost}>
              <RotateCcw className="w-4 h-4" /> Clear
            </button>
          </div>
        </div>
      </div>

      <div className="no-print flex justify-end">
        <Segmented<'edit' | 'preview'>
          value={mode}
          onChange={setMode}
          options={[{ value: 'edit', label: 'Edit' }, { value: 'preview', label: 'Preview' }]}
        />
      </div>

      {mode === 'edit' ? (
        <div className="no-print grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            {/* Document */}
            <Section title="Document" icon={Receipt}>
              <div className="space-y-4">
                <Segmented<DocType>
                  value={inv.docType}
                  onChange={(v) => patchInv({ docType: v })}
                  options={[
                    { value: 'tax', label: 'Tax Invoice' },
                    { value: 'bill_of_supply', label: 'Bill of Supply' },
                    { value: 'credit_note', label: 'Credit Note' },
                    { value: 'proforma', label: 'Proforma' },
                  ]}
                />
                {inv.docType === 'bill_of_supply' && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">For composition dealers and exempt supplies — no GST is charged or shown.</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Invoice Number" hint="Max 16 chars">
                    <Text value={inv.number} onChange={(v) => patchInv({ number: v })} />
                  </Field>
                  <Field label="Invoice Date">
                    <input type="date" value={inv.date} onChange={(e) => patchInv({ date: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="Due Date">
                    <input type="date" value={inv.dueDate} onChange={(e) => patchInv({ dueDate: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="Sales Channel">
                    <Select value={inv.channel} onChange={(v) => patchInv({ channel: v })} options={CHANNELS} />
                  </Field>
                  <Field label="Order / Reference ID">
                    <Text value={inv.orderId} onChange={(v) => patchInv({ orderId: v })} placeholder="Marketplace order ID" />
                  </Field>
                  {inv.docType === 'credit_note' && (
                    <Field label="Original Invoice No.">
                      <Text value={inv.refInvoice} onChange={(v) => patchInv({ refInvoice: v })} />
                    </Field>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  <Field label="Price entry">
                    <Segmented<PriceMode>
                      value={inv.priceMode}
                      onChange={(v) => patchInv({ priceMode: v })}
                      options={[{ value: 'exclusive', label: 'Excl. GST' }, { value: 'inclusive', label: 'Incl. GST (MRP)' }]}
                    />
                  </Field>
                  <div className="flex flex-col gap-2.5 pt-1">
                    <Toggle checked={inv.reverseCharge} onChange={(v) => patchInv({ reverseCharge: v })} label="Reverse charge applicable" />
                    <Toggle checked={inv.roundOff} onChange={(v) => patchInv({ roundOff: v })} label="Round off to nearest ₹" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 max-w-xs">
                  <Field label="Invoice Prefix">
                    <Text value={settings.prefix} onChange={(v) => setSettings({ ...settings, prefix: v.replace(/[^A-Za-z0-9-]/g, '').slice(0, 6).toUpperCase() })} />
                  </Field>
                  <Field label="Next Number">
                    <Num value={settings.next} onChange={(n) => setSettings({ ...settings, next: Math.max(1, Math.floor(n)) })} />
                  </Field>
                </div>
              </div>
            </Section>

            {/* Seller */}
            <Section title="Seller (auto-saved)" icon={Building2}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Business Name"><Text value={seller.name} onChange={(v) => patchSeller({ name: v })} placeholder="Your business name" /></Field>
                <GstinField label="GSTIN" value={seller.gstin} onChange={onSellerGstin} />
                <Field label="Address"><Text multiline value={seller.address} onChange={(v) => patchSeller({ address: v })} placeholder="Full business address" /></Field>
                <Field label="State" hint={seller.state ? `State code ${stateCode(seller.state)}` : undefined}>
                  <Select value={seller.state} onChange={(v) => patchSeller({ state: v })} options={INDIAN_STATES.map((s) => s.name)} placeholder="Select state" />
                </Field>
                <Field label="Phone"><Text value={seller.phone} onChange={(v) => patchSeller({ phone: v })} /></Field>
                <Field label="Email"><Text value={seller.email} onChange={(v) => patchSeller({ email: v })} /></Field>
                <ImageUpload label="Logo" value={seller.logo} onChange={(v) => patchSeller({ logo: v })} />
                <ImageUpload label="Signature / Stamp" value={seller.signature} onChange={(v) => patchSeller({ signature: v })} />
              </div>
            </Section>

            {/* Buyer */}
            <Section
              title="Buyer"
              icon={User}
              action={
                <div className="flex items-center gap-2">
                  {customers.length > 0 && (
                    <select
                      value=""
                      onChange={(e) => pickCustomer(e.target.value)}
                      className="text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg px-2.5 py-2 focus:outline-none"
                    >
                      <option value="">Saved customers…</option>
                      {customers.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  )}
                  <button onClick={saveCustomer} className={btnGhost} title="Save this customer">
                    <Save className="w-4 h-4" /> Save
                  </button>
                </div>
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Customer / Business Name"><Text value={inv.buyer.name} onChange={(v) => patchBuyer({ name: v })} /></Field>
                <GstinField label="Buyer GSTIN" value={inv.buyer.gstin} onChange={onBuyerGstin} optional />
                <Field label="Billing Address"><Text multiline value={inv.buyer.billing} onChange={(v) => patchBuyer({ billing: v })} /></Field>
                <Field label="Place of Supply (State)" hint="Auto-filled from buyer GSTIN">
                  <Select value={inv.buyer.state} onChange={(v) => patchBuyer({ state: v })} options={INDIAN_STATES.map((s) => s.name)} placeholder="Select state" />
                </Field>
                <div className="sm:col-span-2 space-y-3">
                  <Toggle checked={inv.buyer.sameAsBilling} onChange={(v) => patchBuyer({ sameAsBilling: v })} label="Shipping address same as billing" />
                  {!inv.buyer.sameAsBilling && (
                    <Field label="Shipping Address"><Text multiline value={inv.buyer.shipping} onChange={(v) => patchBuyer({ shipping: v })} /></Field>
                  )}
                </div>
                <Field label="Phone"><Text value={inv.buyer.phone} onChange={(v) => patchBuyer({ phone: v })} /></Field>
                <Field label="Email"><Text value={inv.buyer.email} onChange={(v) => patchBuyer({ email: v })} /></Field>
              </div>
            </Section>

            {/* Items */}
            <Section
              title="Line Items"
              icon={Package}
            >
              <datalist id="sm-catalog">{catalog.map((c) => <option key={c.id} value={c.description} />)}</datalist>
              <div className="space-y-3">
                {inv.items.map((item, idx) => {
                  const line = calc.lines[idx];
                  return (
                    <div key={item.id} className="rounded-xl bg-zinc-50 dark:bg-zinc-800/60 p-3 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-400 w-5">{idx + 1}</span>
                        <input
                          list="sm-catalog"
                          value={item.description}
                          onChange={(e) => onDescription(item.id, e.target.value)}
                          placeholder="Product / service (pick from saved items)"
                          className={`${inputCls} !bg-white dark:!bg-zinc-900`}
                        />
                        <button onClick={() => saveItemToCatalog(item)} title="Save to item catalog" className="select-none p-2 rounded-lg text-zinc-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors focus:outline-none">
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setInv((p) => ({ ...p, items: p.items.filter((i) => i.id !== item.id) }))}
                          title="Remove item"
                          className="select-none p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-zinc-700 transition-colors focus:outline-none"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                        <Field label="HSN/SAC">
                          <input value={item.hsn} onChange={(e) => patchItem(item.id, { hsn: e.target.value.replace(/\D/g, '').slice(0, 8) })} placeholder="8518" className={`${inputCls} !bg-white dark:!bg-zinc-900`} />
                        </Field>
                        <Field label="Unit">
                          <Select value={item.unit} onChange={(v) => patchItem(item.id, { unit: v })} options={UNITS} className={`${inputCls} !bg-white dark:!bg-zinc-900`} />
                        </Field>
                        <Field label="Qty">
                          <Num value={item.qty} onChange={(n) => patchItem(item.id, { qty: n })} placeholder="1" className={`${inputCls} !bg-white dark:!bg-zinc-900`} />
                        </Field>
                        <Field label={inv.priceMode === 'inclusive' ? 'Rate (incl. GST) ₹' : 'Rate ₹'}>
                          <Num value={item.rate} onChange={(n) => patchItem(item.id, { rate: n })} className={`${inputCls} !bg-white dark:!bg-zinc-900`} />
                        </Field>
                        <Field label="Discount">
                          <div className="flex gap-1">
                            <Num value={item.discount} onChange={(n) => patchItem(item.id, { discount: n })} className={`${inputCls} !bg-white dark:!bg-zinc-900`} />
                            <button
                              type="button"
                              onClick={() => patchItem(item.id, { discType: item.discType === 'percent' ? 'amount' : 'percent' })}
                              className="px-2.5 rounded-lg text-xs font-bold bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-200 select-none focus:outline-none"
                            >
                              {item.discType === 'percent' ? '%' : '₹'}
                            </button>
                          </div>
                        </Field>
                        <Field label="GST Rate" hint={!calc.taxed ? 'Ignored' : undefined}>
                          <select
                            value={item.gstRate}
                            onChange={(e) => patchItem(item.id, { gstRate: parseFloat(e.target.value) })}
                            className={`${inputCls} !bg-white dark:!bg-zinc-900`}
                          >
                            {GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
                          </select>
                        </Field>
                      </div>
                      {line && (
                        <div className="flex flex-wrap justify-end gap-x-5 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                          <span>Taxable ₹{inr(line.taxable)}</span>
                          <span>GST ₹{inr(line.tax)}</span>
                          <span className="font-bold text-zinc-800 dark:text-zinc-100">Line total ₹{inr(line.total)}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
                <button
                  onClick={() => setInv((p) => ({ ...p, items: [...p.items, blankItem()] }))}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 transition-colors select-none focus:outline-none"
                >
                  <Plus className="w-4 h-4" /> Add Line Item
                </button>
              </div>
            </Section>

            {/* Charges & payment */}
            <Section title="Charges & Payment" icon={Wallet}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Shipping / Handling ₹"><Num value={inv.shippingAmount} onChange={(n) => patchInv({ shippingAmount: n })} /></Field>
                <Field label="Shipping GST Rate">
                  <select value={inv.shippingGst} onChange={(e) => patchInv({ shippingGst: parseFloat(e.target.value) })} className={inputCls}>
                    {GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </Field>
                <div />
                <Field label="Amount Paid ₹"><Num value={inv.amountPaid} onChange={(n) => patchInv({ amountPaid: n })} /></Field>
                <Field label="Payment Mode"><Select value={inv.paymentMode} onChange={(v) => patchInv({ paymentMode: v })} options={PAYMENT_MODES} /></Field>
                <div />
              </div>
            </Section>

            {/* Bank */}
            <Section title="Bank & UPI (auto-saved)" icon={Landmark}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Bank Name"><Text value={seller.bankName} onChange={(v) => patchSeller({ bankName: v })} /></Field>
                <Field label="Account Number"><Text value={seller.bankAcc} onChange={(v) => patchSeller({ bankAcc: v.replace(/\D/g, '') })} /></Field>
                <Field label="IFSC"><Text upper value={seller.bankIfsc} onChange={(v) => patchSeller({ bankIfsc: v })} /></Field>
                <Field label="Branch"><Text value={seller.bankBranch} onChange={(v) => patchSeller({ bankBranch: v })} /></Field>
                <Field label="UPI ID"><Text value={seller.upi} onChange={(v) => patchSeller({ upi: v })} placeholder="name@bank" /></Field>
              </div>
            </Section>

            {/* Notes */}
            <Section title="Notes & Terms" icon={FileText}>
              <div className="grid grid-cols-1 gap-4">
                <Field label="Notes (optional)"><Text multiline value={inv.notes} onChange={(v) => patchInv({ notes: v })} placeholder="Thank you for your business!" /></Field>
                <Field label="Terms & Conditions (one per line)">
                  <textarea rows={4} value={inv.terms} onChange={(e) => patchInv({ terms: e.target.value })} className={`${inputCls} resize-none`} />
                </Field>
              </div>
            </Section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 lg:sticky lg:top-24">
            <div className={cardCls}>
              <div className="flex items-center gap-2.5 mb-4">
                <div className={`w-8 h-8 ${badgeCls}`}>
                  <IndianRupee className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                </div>
                <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-200 uppercase tracking-wide select-none">Summary</h3>
              </div>
              {seller.state && inv.buyer.state && (
                <div className={`p-3 rounded-xl mb-4 text-xs font-medium border ${
                  calc.inter
                    ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-500/30'
                    : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                }`}>
                  {calc.inter ? 'Inter-state supply → IGST' : `Intra-state supply → CGST + ${sgstLabel}`}
                </div>
              )}
              <div className="space-y-2.5">
                <Row label="Taxable value" value={`₹${inr(calc.taxable)}`} />
                {calc.taxed && (calc.inter ? (
                  <Row label="IGST" value={`₹${inr(calc.igst)}`} accent="text-orange-600 dark:text-orange-400" />
                ) : (
                  <>
                    <Row label="CGST" value={`₹${inr(calc.cgst)}`} accent="text-emerald-600 dark:text-emerald-400" />
                    <Row label={sgstLabel} value={`₹${inr(calc.sgst)}`} accent="text-emerald-600 dark:text-emerald-400" />
                  </>
                ))}
                {calc.roundOff !== 0 && <Row label="Round off" value={`${calc.roundOff > 0 ? '+' : '−'}₹${inr(Math.abs(calc.roundOff))}`} />}
                <div className="border-t-2 border-zinc-200 dark:border-zinc-700 pt-3 flex items-center justify-between">
                  <span className="font-bold text-zinc-900 dark:text-white">Grand Total</span>
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">₹{inr(calc.grand)}</span>
                </div>
                {inv.amountPaid > 0 && <Row label="Balance due" value={`₹${inr(Math.max(calc.balance, 0))}`} accent="text-red-500" />}
                <div className="pt-1">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-0.5 select-none">Amount in Words</p>
                  <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">{amountInWords(calc.grand)}</p>
                </div>
              </div>
            </div>

            <div className={cardCls}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-200 uppercase tracking-wide select-none">Compliance Checks</h3>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border select-none ${
                  errorCount > 0
                    ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                    : warnCount > 0
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                }`}>
                  {errorCount > 0 ? `${errorCount} ${errorCount === 1 ? 'Issue' : 'Issues'}` : warnCount > 0 ? `${warnCount} ${warnCount === 1 ? 'Warning' : 'Warnings'}` : 'Ready'}
                </span>
              </div>
              {checks.length === 0 ? (
                <p className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 select-none"><CheckCircle2 className="w-4 h-4" /> All checks passed</p>
              ) : (
                <ul className="space-y-2">
                  {checks.map((c, i) => (
                    <li
                      key={i}
                      className={`flex items-start gap-2 text-xs rounded-lg px-3 py-2 border select-none ${
                        c.level === 'error'
                          ? 'bg-red-500/5 border-red-500/15 text-red-600 dark:text-red-400'
                          : 'bg-amber-500/5 border-amber-500/15 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {c.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-2.5">
              <button onClick={() => setMode('preview')} className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg select-none focus:outline-none">
                <Eye className="w-5 h-5" /> Preview Invoice
              </button>
              <button
                onClick={handlePrint}
                disabled={hasErrors}
                title={hasErrors ? 'Fix the errors above first' : undefined}
                className={`select-none ${primaryBtn} w-full px-5 py-3 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Printer className="w-5 h-5" /> Download / Print (PDF)
              </button>
              <div className="grid grid-cols-2 gap-2.5">
                <button onClick={exportJSON} className={btnGhost}><Download className="w-4 h-4" /> JSON</button>
                <button onClick={exportCSV} className={btnGhost}><Download className="w-4 h-4" /> CSV</button>
                <button onClick={() => importRef.current?.click()} className={btnGhost}><Upload className="w-4 h-4" /> Import</button>
                <button onClick={newInvoice} className={btnGhost}><RotateCcw className="w-4 h-4" /> New</button>
              </div>
              <input ref={importRef} type="file" accept="application/json" className="hidden" onChange={(e) => { importJSON(e.target.files?.[0]); e.target.value = ''; }} />
            </div>
          </aside>
        </div>
      ) : (
        <div className="print-area">
          <div className="no-print mb-4 flex flex-wrap justify-end gap-2.5">
            <button onClick={() => setMode('edit')} className={btnGhost}><Pencil className="w-4 h-4" /> Back to edit</button>
            <button
              onClick={handlePrint}
              className={`select-none ${primaryBtn} px-5 py-2.5`}
            >
              <Printer className="w-5 h-5" /> Download / Print (PDF)
            </button>
          </div>
          <InvoicePreview inv={inv} seller={seller} calc={calc} sgstLabel={sgstLabel} />
        </div>
      )}
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className={`text-sm font-bold ${accent ?? 'text-zinc-700 dark:text-zinc-200'}`}>{value}</span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Invoice preview (always light — it is the printable document)
──────────────────────────────────────────────────────────────────────────── */

function InvoicePreview({ inv, seller, calc, sgstLabel }: { inv: InvoiceState; seller: Seller; calc: Computed; sgstLabel: string }) {
  const b = inv.buyer;
  const shipTo = b.sameAsBilling ? b.billing : b.shipping;
  const paid = inv.amountPaid >= calc.grand && calc.grand > 0;
  const partial = inv.amountPaid > 0 && !paid;
  const hasBank = seller.bankName || seller.bankAcc || seller.bankIfsc || seller.upi;
  const termLines = inv.terms.split('\n').map((t) => t.trim()).filter(Boolean);
  const th = 'px-2.5 py-2 font-semibold';

  return (
    <div className="bg-white text-zinc-900 shadow-xl rounded-lg overflow-hidden border border-zinc-200">
      <div className="p-6 sm:p-10 relative">
        {(paid || partial) && (
          <div className={`absolute top-6 right-6 rotate-12 border-2 rounded-md px-3 py-1 text-sm font-extrabold tracking-widest opacity-70 ${paid ? 'border-emerald-600 text-emerald-600' : 'border-amber-500 text-amber-600'}`}>
            {paid ? 'PAID' : 'PART PAID'}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b-2 border-zinc-800">
          <div className="flex items-start gap-4">
            {seller.logo && <img src={seller.logo} alt="Logo" className="w-16 h-16 object-contain" />}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{seller.name || 'Your Business'}</h1>
              {seller.address && <p className="text-sm text-zinc-600 mt-1 whitespace-pre-line">{seller.address}</p>}
              {seller.gstin && <p className="text-sm text-zinc-600">GSTIN: <span className="font-semibold">{seller.gstin}</span></p>}
              {seller.state && <p className="text-sm text-zinc-600">State: {seller.state} ({stateCode(seller.state)})</p>}
              {(seller.phone || seller.email) && <p className="text-sm text-zinc-600">{[seller.phone, seller.email].filter(Boolean).join(' · ')}</p>}
            </div>
          </div>
          <div className="sm:text-right">
            <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wide">{DOC_LABELS[inv.docType]}</h2>
            <div className="mt-2 space-y-0.5 text-sm text-zinc-600">
              <p>No: <span className="font-semibold text-zinc-900">{inv.number}</span></p>
              <p>Date: <span className="font-semibold text-zinc-900">{fmtDate(inv.date)}</span></p>
              {inv.docType !== 'credit_note' && <p>Due: <span className="font-semibold text-zinc-900">{fmtDate(inv.dueDate)}</span></p>}
              {inv.docType === 'credit_note' && inv.refInvoice && <p>Against: <span className="font-semibold text-zinc-900">{inv.refInvoice}</span></p>}
              {inv.orderId && <p>{inv.channel.split(' ')[0]} Order: <span className="font-semibold text-zinc-900">{inv.orderId}</span></p>}
              <p>Reverse charge: <span className="font-semibold text-zinc-900">{inv.reverseCharge ? 'Yes' : 'No'}</span></p>
            </div>
          </div>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-6 border-b border-zinc-200">
          <div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-2">Bill To</p>
            <p className="font-bold">{b.name || 'Buyer'}</p>
            {b.billing && <p className="text-sm text-zinc-600 mt-1 whitespace-pre-line">{b.billing}</p>}
            {b.gstin && <p className="text-sm text-zinc-600 mt-1">GSTIN: <span className="font-semibold">{b.gstin}</span></p>}
            {(b.phone || b.email) && <p className="text-sm text-zinc-600">{[b.phone, b.email].filter(Boolean).join(' · ')}</p>}
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-2">Ship To</p>
            <p className="text-sm text-zinc-600 whitespace-pre-line">{shipTo || '—'}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-2">Place of Supply</p>
            <p className="font-semibold">{b.state ? `${b.state} (${stateCode(b.state)})` : '—'}</p>
            {calc.taxed && (
              <p className="text-xs text-zinc-500 mt-2">{calc.inter ? 'Inter-state supply (IGST)' : `Intra-state supply (CGST + ${sgstLabel})`}</p>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="overflow-x-auto mt-6">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="bg-zinc-800 text-white">
                <th className={`${th} text-left`}>#</th>
                <th className={`${th} text-left`}>Description</th>
                <th className={`${th} text-center`}>HSN/SAC</th>
                <th className={`${th} text-center`}>Qty</th>
                <th className={`${th} text-right`}>Rate</th>
                <th className={`${th} text-right`}>Disc.</th>
                <th className={`${th} text-right`}>Taxable</th>
                {calc.taxed && (calc.inter ? (
                  <th className={`${th} text-right`}>IGST</th>
                ) : (
                  <>
                    <th className={`${th} text-right`}>CGST</th>
                    <th className={`${th} text-right`}>{sgstLabel}</th>
                  </>
                ))}
                <th className={`${th} text-right`}>Total</th>
              </tr>
            </thead>
            <tbody>
              {calc.lines.map((l, i) => (
                <tr key={l.id} className="border-b border-zinc-200 align-top">
                  <td className="px-2.5 py-2.5 text-zinc-500">{i + 1}</td>
                  <td className="px-2.5 py-2.5 font-medium">{l.description || '—'}</td>
                  <td className="px-2.5 py-2.5 text-center text-zinc-600">{l.hsn || '—'}</td>
                  <td className="px-2.5 py-2.5 text-center text-zinc-600">{l.qty} {l.unit}</td>
                  <td className="px-2.5 py-2.5 text-right text-zinc-600">₹{inr(l.rate)}</td>
                  <td className="px-2.5 py-2.5 text-right text-zinc-600">{l.discount > 0 ? `₹${inr(l.discount)}` : '—'}</td>
                  <td className="px-2.5 py-2.5 text-right font-medium">₹{inr(l.taxable)}</td>
                  {calc.taxed && (calc.inter ? (
                    <td className="px-2.5 py-2.5 text-right text-zinc-600">₹{inr(l.igst)}<span className="block text-[10px] text-zinc-400">@{l.gstRate}%</span></td>
                  ) : (
                    <>
                      <td className="px-2.5 py-2.5 text-right text-zinc-600">₹{inr(l.cgst)}<span className="block text-[10px] text-zinc-400">@{l.gstRate / 2}%</span></td>
                      <td className="px-2.5 py-2.5 text-right text-zinc-600">₹{inr(l.sgst)}<span className="block text-[10px] text-zinc-400">@{l.gstRate / 2}%</span></td>
                    </>
                  ))}
                  <td className="px-2.5 py-2.5 text-right font-bold">₹{inr(l.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mt-6">
          <div className="w-full sm:w-80 space-y-1.5 text-sm">
            <PreviewRow label="Taxable value" value={`₹${inr(calc.taxable)}`} />
            {calc.taxed && (calc.inter ? (
              <PreviewRow label="IGST" value={`₹${inr(calc.igst)}`} />
            ) : (
              <>
                <PreviewRow label="CGST" value={`₹${inr(calc.cgst)}`} />
                <PreviewRow label={sgstLabel} value={`₹${inr(calc.sgst)}`} />
              </>
            ))}
            {calc.roundOff !== 0 && <PreviewRow label="Round off" value={`${calc.roundOff > 0 ? '+' : '−'}₹${inr(Math.abs(calc.roundOff))}`} />}
            <div className="flex justify-between items-center bg-zinc-900 text-white px-4 py-3 rounded-lg mt-2">
              <span className="font-semibold">{inv.docType === 'credit_note' ? 'Credit Total' : 'Grand Total'}</span>
              <span className="text-xl font-bold">₹{inr(calc.grand)}</span>
            </div>
            {inv.amountPaid > 0 && (
              <>
                <PreviewRow label={`Paid (${inv.paymentMode})`} value={`₹${inr(inv.amountPaid)}`} />
                <PreviewRow label="Balance due" value={`₹${inr(Math.max(calc.balance, 0))}`} bold />
              </>
            )}
          </div>
        </div>

        <div className="mt-4 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
          <p className="text-xs font-semibold text-zinc-400 uppercase mb-1">Amount in Words</p>
          <p className="text-sm font-medium text-zinc-700">{amountInWords(calc.grand)}</p>
        </div>

        {/* HSN summary */}
        {calc.taxed && calc.hsnSummary.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-2">HSN / SAC Summary</p>
            <table className="w-full text-xs border border-zinc-200">
              <thead>
                <tr className="bg-zinc-100 text-zinc-600">
                  <th className="px-2 py-1.5 text-left">HSN/SAC</th>
                  <th className="px-2 py-1.5 text-right">Taxable</th>
                  <th className="px-2 py-1.5 text-right">Rate</th>
                  {calc.inter ? <th className="px-2 py-1.5 text-right">IGST</th> : (<><th className="px-2 py-1.5 text-right">CGST</th><th className="px-2 py-1.5 text-right">{sgstLabel}</th></>)}
                  <th className="px-2 py-1.5 text-right">Total Tax</th>
                </tr>
              </thead>
              <tbody>
                {calc.hsnSummary.map((h) => (
                  <tr key={`${h.hsn}-${h.gstRate}`} className="border-t border-zinc-200">
                    <td className="px-2 py-1.5">{h.hsn}</td>
                    <td className="px-2 py-1.5 text-right">₹{inr(h.taxable)}</td>
                    <td className="px-2 py-1.5 text-right">{h.gstRate}%</td>
                    {calc.inter ? <td className="px-2 py-1.5 text-right">₹{inr(h.igst)}</td> : (<><td className="px-2 py-1.5 text-right">₹{inr(h.cgst)}</td><td className="px-2 py-1.5 text-right">₹{inr(h.sgst)}</td></>)}
                    <td className="px-2 py-1.5 text-right font-semibold">₹{inr(h.tax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bank & terms */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8 pt-6 border-t border-zinc-200">
          {hasBank && (
            <div>
              <h4 className="select-none text-xs font-bold text-zinc-400 uppercase tracking-wide mb-2">Bank Details</h4>
              <div className="space-y-1 text-sm text-zinc-600">
                {seller.bankName && <p>Bank: <span className="font-medium text-zinc-800">{seller.bankName}</span></p>}
                {seller.bankAcc && <p>A/C: <span className="font-medium text-zinc-800">{seller.bankAcc}</span></p>}
                {seller.bankIfsc && <p>IFSC: <span className="font-medium text-zinc-800">{seller.bankIfsc}</span></p>}
                {seller.bankBranch && <p>Branch: <span className="font-medium text-zinc-800">{seller.bankBranch}</span></p>}
                {seller.upi && <p>UPI: <span className="font-medium text-zinc-800">{seller.upi}</span></p>}
              </div>
            </div>
          )}
          <div>
            {inv.notes && (
              <div className="mb-4">
                <h4 className="select-none text-xs font-bold text-zinc-400 uppercase tracking-wide mb-2">Notes</h4>
                <p className="text-sm text-zinc-600 whitespace-pre-line">{inv.notes}</p>
              </div>
            )}
            {termLines.length > 0 && (
              <>
                <h4 className="select-none text-xs font-bold text-zinc-400 uppercase tracking-wide mb-2">Terms &amp; Conditions</h4>
                <ol className="space-y-1 text-xs text-zinc-500 list-decimal list-inside">
                  {termLines.map((t, i) => <li key={i}>{t}</li>)}
                </ol>
              </>
            )}
          </div>
        </div>

        {/* Signature */}
        <div className="select-none flex justify-end mt-10">
          <div className="text-center">
            <div className="h-14 flex items-end justify-center">
              {seller.signature && <img src={seller.signature} alt="Signature" className="max-h-14 object-contain" />}
            </div>
            <div className="w-48 border-t-2 border-zinc-300 pt-2">
              <p className="text-sm font-semibold text-zinc-700">Authorised Signatory</p>
              <p className="text-xs text-zinc-500">{seller.name}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className={bold ? 'font-bold text-zinc-900' : 'font-semibold text-zinc-900'}>{value}</span>
    </div>
  );
}