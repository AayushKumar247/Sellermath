import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ShieldCheck, UploadCloud, FileSpreadsheet, Download, RotateCcw, Plus, Trash2,
  AlertTriangle, CheckCircle2, Scale, Banknote, Receipt, Sparkles, X, Copy, Check,
  Zap, ChevronDown, ChevronRight, ClipboardList, ArrowRight, Calculator,
  Search, ArrowUpDown, ClipboardPaste, BadgeCheck,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════════════════
   TYPES  (unchanged)
   ══════════════════════════════════════════════════════════════════════════ */

type Marketplace = 'Amazon' | 'Flipkart' | 'Meesho' | 'Myntra';

interface RawOrder {
  orderId: string;
  sku: string;
  status: string;
  sellingPrice: number;
  expectedCommission: number;
  chargedCommission: number;
  declaredWeightG: number;
  billedWeightG: number;
  expectedShipping: number;
  chargedShipping: number;
  bankUtrSettled: number;
  warehouseReturnReceived: string;
  utr?: string;
  settlementDate?: string;
}

interface OrderRow extends RawOrder {
  uid: string;
}

type FlagKey = 'weight' | 'commission' | 'missingReturn' | 'pending';

interface ComputedRow extends OrderRow {
  expectedFees: number;
  chargedFees: number;
  gstOnExpectedFees: number;
  gstOnChargedFees: number;
  tcs: number;
  expectedSettlement: number;
  leak: number;
  matched: boolean;
  actionable: boolean;
  flags: FlagKey[];
  primary: FlagKey | 'matched';
  split: { weight: number; commission: number; missingReturn: number; pending: number };
}

type FilterKey = 'all' | 'actionable' | 'weight' | 'commission' | 'missingReturn' | 'matched';
type SortKey = 'leak' | 'value' | 'weight' | 'orderId';
type ClaimTarget = { mode: 'single'; row: ComputedRow } | { mode: 'bulk' } | null;

/* ══════════════════════════════════════════════════════════════════════════
   CONSTANTS  (unchanged)
   ══════════════════════════════════════════════════════════════════════════ */

const GST_RATE = 0.18;
const TCS_RATE = 0.01;
const MATCH_TOLERANCE = 2;

const MARKETPLACES: { id: Marketplace; label: string; claim: string; note: string; ring: string }[] = [
  { id: 'Amazon',   label: 'Amazon India', claim: 'SAFE-T Claim',   note: 'Weight handling + closing fee + 1% TCS', ring: 'ring-amber-400/60' },
  { id: 'Flipkart', label: 'Flipkart',     claim: 'SPF Claim',      note: 'Fixed fee + commission slab + 1% TCS',  ring: 'ring-sky-400/60' },
  { id: 'Meesho',   label: 'Meesho',       claim: 'Ticket Dispute', note: '0% commission, freight-heavy model',    ring: 'ring-pink-400/60' },
  { id: 'Myntra',   label: 'Myntra',       claim: 'Ticket Dispute', note: 'PPMP fee + brand commission',           ring: 'ring-rose-400/60' },
];

const TEMPLATE_HEADERS = [
  'Order_ID', 'SKU', 'Status', 'Selling_Price', 'Expected_Commission', 'Charged_Commission',
  'Declared_Weight_g', 'Billed_Weight_g', 'Expected_Shipping', 'Charged_Shipping',
  'Bank_UTR_Settled', 'Warehouse_Return_Received', 'UTR', 'Settlement_Date',
];

const HEADER_MAP: Record<string, keyof RawOrder> = {
  order_id: 'orderId', orderid: 'orderId', sku: 'sku', status: 'status', order_status: 'status',
  selling_price: 'sellingPrice', expected_commission: 'expectedCommission',
  charged_commission: 'chargedCommission', declared_weight_g: 'declaredWeightG',
  billed_weight_g: 'billedWeightG', expected_shipping: 'expectedShipping',
  charged_shipping: 'chargedShipping', bank_utr_settled: 'bankUtrSettled',
  warehouse_return_received: 'warehouseReturnReceived', utr: 'utr', settlement_date: 'settlementDate',
};

const FLAG_META: Record<FlagKey, { label: string; short: string; chip: string; dot: string }> = {
  weight:       { label: '⚖️ Weight Slab Overcharge', short: 'Weight',         chip: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30', dot: 'bg-amber-500' },
  commission:   { label: '💸 Commission Overcharge',  short: 'Commission',     chip: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30',       dot: 'bg-rose-500' },
  missingReturn:{ label: '📦 Unreimbursed Missing Return / RTO', short: 'Missing Return', chip: 'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30', dot: 'bg-violet-500' },
  pending:      { label: '⏳ Pending / Hold Settlement', short: 'Pending',      chip: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30',           dot: 'bg-sky-500' },
};

/* ══════════════════════════════════════════════════════════════════════════
   HELPERS  (unchanged)
   ══════════════════════════════════════════════════════════════════════════ */

let uidCounter = 0;
const uid = () => `row_${Date.now()}_${uidCounter++}`;

function fmtShort(n: number): string {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(2)}L`;
  if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(1)}K`;
  return `${sign}₹${abs.toFixed(0)}`;
}

function fmtFull(n: number): string {
  const sign = n < 0 ? '-' : '';
  return `${sign}₹${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function fmtMoney(n: number): string {
  const sign = n < 0 ? '-' : '';
  return `${sign}₹${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function num(v: unknown): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const cleaned = String(v ?? '').replace(/[₹,\s]/g, '').trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normKey(s: string): string {
  return s.trim().toLowerCase().replace(/[\s\-.]+/g, '_').replace(/_+/g, '_');
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      cur.push(field); field = '';
    } else if (ch === '\n') {
      cur.push(field); rows.push(cur); cur = []; field = '';
    } else if (ch !== '\r') {
      field += ch;
    }
  }
  if (field.length > 0 || cur.length > 0) { cur.push(field); rows.push(cur); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

function mapGridToOrders(grid: string[][]): { orders: RawOrder[]; error: string | null } {
  if (grid.length < 2) return { orders: [], error: 'The data appears to be empty or missing a header row.' };
  const headers = grid[0].map(normKey);
  const mapped = headers.map((h) => HEADER_MAP[h]);
  if (!mapped.includes('orderId')) {
    return { orders: [], error: 'Missing required column "Order_ID". Download the template to see the expected format.' };
  }
  const orders = grid.slice(1).map((cells) => {
    const rec: Record<string, string | number> = {};
    headers.forEach((h, i) => {
      const field = HEADER_MAP[h];
      if (!field) return;
      const raw = cells[i] ?? '';
      const isStringField = ['orderId', 'sku', 'status', 'warehouseReturnReceived', 'utr', 'settlementDate'].includes(field);
      rec[field] = isStringField ? String(raw).trim() : num(raw);
    });
    const result: RawOrder = {
      orderId: String(rec.orderId ?? ''),
      sku: String(rec.sku ?? ''),
      status: String(rec.status ?? 'Delivered') || 'Delivered',
      sellingPrice: Number(rec.sellingPrice ?? 0),
      expectedCommission: Number(rec.expectedCommission ?? 0),
      chargedCommission: Number(rec.chargedCommission ?? 0),
      declaredWeightG: Number(rec.declaredWeightG ?? 0),
      billedWeightG: Number(rec.billedWeightG ?? 0),
      expectedShipping: Number(rec.expectedShipping ?? 0),
      chargedShipping: Number(rec.chargedShipping ?? 0),
      bankUtrSettled: Number(rec.bankUtrSettled ?? 0),
      warehouseReturnReceived: String(rec.warehouseReturnReceived ?? 'Yes') || 'Yes',
      utr: rec.utr ? String(rec.utr) : undefined,
      settlementDate: rec.settlementDate ? String(rec.settlementDate) : undefined,
    };
    return result;
  }).filter((r) => r.orderId.length > 0);
  if (!orders.length) return { orders: [], error: 'No valid order rows found. Please check the column headers.' };
  return { orders, error: null };
}

/* ══════════════════════════════════════════════════════════════════════════
   RECONCILIATION MATH ENGINE  (UNCHANGED)
   ══════════════════════════════════════════════════════════════════════════ */

function computeRow(row: OrderRow): ComputedRow {
  const status = (row.status || '').toLowerCase();
  const isReturn = status.includes('rto') || status.includes('return');
  const isCancelled = status.includes('cancel');
  const returned = (row.warehouseReturnReceived || '').toLowerCase().startsWith('y');

  const expectedFees = row.expectedCommission + row.expectedShipping;
  const chargedFees = row.chargedCommission + row.chargedShipping;
  const gstOnExpectedFees = expectedFees * GST_RATE;
  const gstOnChargedFees = chargedFees * GST_RATE;

  const taxableValue = Math.max(0, row.sellingPrice - row.expectedCommission);
  const tcs = taxableValue * TCS_RATE;

  let expectedSettlement = 0;
  if (!isCancelled) {
    if (isReturn) {
      expectedSettlement = returned
        ? 0
        : Math.max(0, row.sellingPrice - expectedFees - gstOnExpectedFees - tcs);
    } else {
      expectedSettlement = row.sellingPrice - expectedFees - gstOnExpectedFees - tcs;
    }
  }

  const leak = expectedSettlement - row.bankUtrSettled;
  const matched = Math.abs(leak) <= MATCH_TOLERANCE;

  const flags: FlagKey[] = [];
  if (!matched) {
    if (row.billedWeightG > row.declaredWeightG || row.chargedShipping > row.expectedShipping + 0.5) flags.push('weight');
    if (row.chargedCommission > row.expectedCommission + 0.5) flags.push('commission');
    if (isReturn && !returned && row.bankUtrSettled < expectedSettlement - MATCH_TOLERANCE) flags.push('missingReturn');
    if (!isReturn && !isCancelled && row.bankUtrSettled === 0 && expectedSettlement > MATCH_TOLERANCE) flags.push('pending');
    if (flags.length === 0 && leak > MATCH_TOLERANCE) flags.push('commission');
  }

  const split = { weight: 0, commission: 0, missingReturn: 0, pending: 0 };
  if (!matched && leak > 0) {
    let rem = leak;
    if (flags.includes('pending')) { split.pending = rem; rem = 0; }
    else {
      const weightComp = Math.max(0, row.chargedShipping - row.expectedShipping) * (1 + GST_RATE);
      const commComp = Math.max(0, row.chargedCommission - row.expectedCommission) * (1 + GST_RATE);
      const w = Math.min(rem, weightComp); split.weight = w; rem -= w;
      const c = Math.min(rem, commComp); split.commission = c; rem -= c;
      if (rem > 0.5) {
        if (flags.includes('missingReturn')) split.missingReturn += rem;
        else if (flags.includes('commission')) split.commission += rem;
        else split.weight += rem;
      }
    }
  }

  const primary: FlagKey | 'matched' = matched ? 'matched'
    : flags.includes('missingReturn') ? 'missingReturn'
      : flags.includes('pending') ? 'pending'
        : flags.includes('weight') ? 'weight'
          : 'commission';

  return {
    ...row, expectedFees, chargedFees, gstOnExpectedFees, gstOnChargedFees, tcs,
    expectedSettlement, leak, matched, actionable: !matched, flags, primary, split,
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   SAMPLE PRESETS  (UNCHANGED)
   ══════════════════════════════════════════════════════════════════════════ */

type SampleKey = 'apparel' | 'electronics' | 'beauty';

interface SampleDef {
  key: SampleKey; label: string; emoji: string; descriptor: string;
  marketplace: Marketplace; batchName: string; utr: string; date: string; rows: RawOrder[];
}

const SAMPLE_DEFS: SampleDef[] = [
  {
    key: 'apparel', label: 'Apparel Brand Audit', emoji: '📦',
    descriptor: '12 Orders • Weight & RTO Leaks', marketplace: 'Amazon',
    batchName: 'apparel_payout_settlement_feb.csv', utr: 'UTR Batch NEFT-2418', date: '12 Feb 2025',
    rows: [
      { orderId: 'AMZ-5501', sku: 'KRT-BLK-M',   status: 'Delivered',       sellingPrice: 1299, expectedCommission: 130, chargedCommission: 130, declaredWeightG: 400, billedWeightG: 1000, expectedShipping: 65, chargedShipping: 110, bankUtrSettled: 950,  warehouseReturnReceived: 'Yes' },
      { orderId: 'AMZ-5502', sku: 'KRT-BLK-L',   status: 'Delivered',       sellingPrice: 1299, expectedCommission: 130, chargedCommission: 130, declaredWeightG: 400, billedWeightG: 400,  expectedShipping: 65, chargedShipping: 65,  bankUtrSettled: 1057, warehouseReturnReceived: 'Yes' },
      { orderId: 'AMZ-5503', sku: 'TSH-WHT-XL',  status: 'RTO',             sellingPrice: 799,  expectedCommission: 80,  chargedCommission: 80,  declaredWeightG: 300, billedWeightG: 900,  expectedShipping: 55, chargedShipping: 95,  bankUtrSettled: 0,    warehouseReturnReceived: 'No'  },
      { orderId: 'AMZ-5504', sku: 'JNS-BLU-32',  status: 'Delivered',       sellingPrice: 1899, expectedCommission: 190, chargedCommission: 265, declaredWeightG: 600, billedWeightG: 1500, expectedShipping: 75, chargedShipping: 130, bankUtrSettled: 1290, warehouseReturnReceived: 'Yes' },
      { orderId: 'AMZ-5505', sku: 'KRT-BLK-M',   status: 'Delivered',       sellingPrice: 1299, expectedCommission: 130, chargedCommission: 130, declaredWeightG: 400, billedWeightG: 400,  expectedShipping: 65, chargedShipping: 65,  bankUtrSettled: 1057, warehouseReturnReceived: 'Yes' },
      { orderId: 'AMZ-5506', sku: 'HOD-GRY-L',   status: 'Customer Return', sellingPrice: 1499, expectedCommission: 150, chargedCommission: 150, declaredWeightG: 500, billedWeightG: 500,  expectedShipping: 70, chargedShipping: 70,  bankUtrSettled: 0,    warehouseReturnReceived: 'Yes' },
      { orderId: 'AMZ-5507', sku: 'TSH-BLK-M',   status: 'Delivered',       sellingPrice: 799,  expectedCommission: 80,  chargedCommission: 80,  declaredWeightG: 300, billedWeightG: 300,  expectedShipping: 55, chargedShipping: 55,  bankUtrSettled: 0,    warehouseReturnReceived: 'Yes' },
      { orderId: 'AMZ-5508', sku: 'JNS-BLK-34',  status: 'Delivered',       sellingPrice: 1899, expectedCommission: 190, chargedCommission: 190, declaredWeightG: 600, billedWeightG: 1200, expectedShipping: 75, chargedShipping: 120, bankUtrSettled: 1450, warehouseReturnReceived: 'Yes' },
      { orderId: 'AMZ-5509', sku: 'KRT-WHT-S',   status: 'RTO',             sellingPrice: 1299, expectedCommission: 130, chargedCommission: 130, declaredWeightG: 400, billedWeightG: 400,  expectedShipping: 65, chargedShipping: 65,  bankUtrSettled: 0,    warehouseReturnReceived: 'No'  },
      { orderId: 'AMZ-5510', sku: 'TSH-GRN-L',   status: 'Delivered',       sellingPrice: 799,  expectedCommission: 80,  chargedCommission: 80,  declaredWeightG: 300, billedWeightG: 750,  expectedShipping: 55, chargedShipping: 90,  bankUtrSettled: 600,  warehouseReturnReceived: 'Yes' },
      { orderId: 'AMZ-5511', sku: 'HOD-BLK-XL',  status: 'Delivered',       sellingPrice: 1499, expectedCommission: 150, chargedCommission: 150, declaredWeightG: 500, billedWeightG: 500,  expectedShipping: 70, chargedShipping: 70,  bankUtrSettled: 1226, warehouseReturnReceived: 'Yes' },
      { orderId: 'AMZ-5512', sku: 'JNS-GRY-30',  status: 'Delivered',       sellingPrice: 1899, expectedCommission: 190, chargedCommission: 190, declaredWeightG: 600, billedWeightG: 600,  expectedShipping: 75, chargedShipping: 75,  bankUtrSettled: 1569, warehouseReturnReceived: 'Yes' },
    ],
  },
  {
    key: 'electronics', label: 'Electronics Settlement', emoji: '🎧',
    descriptor: '10 Orders • Commission & Missing Return Leaks', marketplace: 'Flipkart',
    batchName: 'electronics_spf_settlement_feb.csv', utr: 'UTR Batch IMPS-7720', date: '14 Feb 2025',
    rows: [
      { orderId: 'FK-8801', sku: 'BOAT-AIRD-141', status: 'Delivered',       sellingPrice: 1499, expectedCommission: 120, chargedCommission: 210, declaredWeightG: 200, billedWeightG: 200, expectedShipping: 65, chargedShipping: 65, bankUtrSettled: 1161, warehouseReturnReceived: 'Yes' },
      { orderId: 'FK-8802', sku: 'NOISE-CLR-2',   status: 'Delivered',       sellingPrice: 2499, expectedCommission: 200, chargedCommission: 200, declaredWeightG: 250, billedWeightG: 250, expectedShipping: 75, chargedShipping: 75, bankUtrSettled: 2151, warehouseReturnReceived: 'Yes' },
      { orderId: 'FK-8803', sku: 'BOAT-ROCK-3',   status: 'RTO',             sellingPrice: 1799, expectedCommission: 150, chargedCommission: 150, declaredWeightG: 220, billedWeightG: 950, expectedShipping: 70, chargedShipping: 130, bankUtrSettled: 0,   warehouseReturnReceived: 'No'  },
      { orderId: 'FK-8804', sku: 'MI-BAND-7',     status: 'Delivered',       sellingPrice: 2999, expectedCommission: 240, chargedCommission: 300, declaredWeightG: 180, billedWeightG: 180, expectedShipping: 65, chargedShipping: 65, bankUtrSettled: 2541, warehouseReturnReceived: 'Yes' },
      { orderId: 'FK-8805', sku: 'BOAT-AIRD-141', status: 'Delivered',       sellingPrice: 1499, expectedCommission: 120, chargedCommission: 120, declaredWeightG: 200, billedWeightG: 200, expectedShipping: 65, chargedShipping: 65, bankUtrSettled: 1266, warehouseReturnReceived: 'Yes' },
      { orderId: 'FK-8806', sku: 'REALME-BUDS',   status: 'Customer Return', sellingPrice: 1299, expectedCommission: 110, chargedCommission: 110, declaredWeightG: 200, billedWeightG: 200, expectedShipping: 60, chargedShipping: 60, bankUtrSettled: 0,    warehouseReturnReceived: 'No'  },
      { orderId: 'FK-8807', sku: 'NOISE-CLR-2',   status: 'Delivered',       sellingPrice: 2499, expectedCommission: 200, chargedCommission: 200, declaredWeightG: 250, billedWeightG: 250, expectedShipping: 75, chargedShipping: 75, bankUtrSettled: 0,    warehouseReturnReceived: 'Yes' },
      { orderId: 'FK-8808', sku: 'MI-BAND-7',     status: 'Delivered',       sellingPrice: 2999, expectedCommission: 240, chargedCommission: 240, declaredWeightG: 180, billedWeightG: 180, expectedShipping: 65, chargedShipping: 65, bankUtrSettled: 2611, warehouseReturnReceived: 'Yes' },
      { orderId: 'FK-8809', sku: 'BOAT-ROCK-3',   status: 'Delivered',       sellingPrice: 1799, expectedCommission: 150, chargedCommission: 235, declaredWeightG: 220, billedWeightG: 220, expectedShipping: 70, chargedShipping: 70, bankUtrSettled: 1423, warehouseReturnReceived: 'Yes' },
      { orderId: 'FK-8810', sku: 'REALME-BUDS',   status: 'Delivered',       sellingPrice: 1299, expectedCommission: 110, chargedCommission: 110, declaredWeightG: 200, billedWeightG: 200, expectedShipping: 60, chargedShipping: 60, bankUtrSettled: 1086, warehouseReturnReceived: 'Yes' },
    ],
  },
  {
    key: 'beauty', label: 'Beauty D2C Batch', emoji: '🧴',
    descriptor: '10 Orders • Clean vs Overcharged Mix', marketplace: 'Meesho',
    batchName: 'beauty_d2c_payout_feb.csv', utr: 'UTR Batch NEFT-9931', date: '16 Feb 2025',
    rows: [
      { orderId: 'MS-4401', sku: 'FACE-SERUM-30',  status: 'Delivered',       sellingPrice: 599, expectedCommission: 60, chargedCommission: 60, declaredWeightG: 150, billedWeightG: 150,  expectedShipping: 45, chargedShipping: 45,  bankUtrSettled: 470, warehouseReturnReceived: 'Yes' },
      { orderId: 'MS-4402', sku: 'LIP-TINT-RED',   status: 'Delivered',       sellingPrice: 349, expectedCommission: 35, chargedCommission: 35, declaredWeightG: 100, billedWeightG: 600,  expectedShipping: 40, chargedShipping: 75,  bankUtrSettled: 216, warehouseReturnReceived: 'Yes' },
      { orderId: 'MS-4403', sku: 'HAIR-OIL-100',   status: 'RTO',             sellingPrice: 449, expectedCommission: 45, chargedCommission: 45, declaredWeightG: 200, billedWeightG: 200,  expectedShipping: 50, chargedShipping: 50,  bankUtrSettled: 0,   warehouseReturnReceived: 'Yes' },
      { orderId: 'MS-4404', sku: 'FACE-WASH-100',  status: 'Delivered',       sellingPrice: 299, expectedCommission: 30, chargedCommission: 30, declaredWeightG: 150, billedWeightG: 150,  expectedShipping: 40, chargedShipping: 40,  bankUtrSettled: 213, warehouseReturnReceived: 'Yes' },
      { orderId: 'MS-4405', sku: 'BODY-LOT-400',   status: 'Delivered',       sellingPrice: 699, expectedCommission: 70, chargedCommission: 70, declaredWeightG: 400, billedWeightG: 1100, expectedShipping: 60, chargedShipping: 105, bankUtrSettled: 486, warehouseReturnReceived: 'Yes' },
      { orderId: 'MS-4406', sku: 'LIP-TINT-PINK',  status: 'Delivered',       sellingPrice: 349, expectedCommission: 35, chargedCommission: 35, declaredWeightG: 100, billedWeightG: 100,  expectedShipping: 40, chargedShipping: 40,  bankUtrSettled: 257, warehouseReturnReceived: 'Yes' },
      { orderId: 'MS-4407', sku: 'SERUM-VITC',     status: 'Customer Return', sellingPrice: 899, expectedCommission: 90, chargedCommission: 90, declaredWeightG: 200, billedWeightG: 700,  expectedShipping: 55, chargedShipping: 95,  bankUtrSettled: 0,   warehouseReturnReceived: 'No'  },
      { orderId: 'MS-4408', sku: 'FACE-SERUM-30',  status: 'Delivered',       sellingPrice: 599, expectedCommission: 60, chargedCommission: 60, declaredWeightG: 150, billedWeightG: 150,  expectedShipping: 45, chargedShipping: 45,  bankUtrSettled: 470, warehouseReturnReceived: 'Yes' },
      { orderId: 'MS-4409', sku: 'HAIR-OIL-100',   status: 'Delivered',       sellingPrice: 449, expectedCommission: 45, chargedCommission: 95, declaredWeightG: 200, billedWeightG: 200,  expectedShipping: 50, chargedShipping: 50,  bankUtrSettled: 274, warehouseReturnReceived: 'Yes' },
      { orderId: 'MS-4410', sku: 'BODY-LOT-400',   status: 'Delivered',       sellingPrice: 699, expectedCommission: 70, chargedCommission: 70, declaredWeightG: 400, billedWeightG: 400,  expectedShipping: 60, chargedShipping: 60,  bankUtrSettled: 539, warehouseReturnReceived: 'Yes' },
    ],
  },
];

/* ══════════════════════════════════════════════════════════════════════════
   CLAIM TEXT BUILDER  (UNCHANGED)
   ══════════════════════════════════════════════════════════════════════════ */

function buildClaimText(row: ComputedRow, mkt: Marketplace, claimLabel: string): string {
  const excessWeight = Math.max(0, row.billedWeightG - row.declaredWeightG);
  const feeDiff = row.chargedFees - row.expectedFees;
  const gstDiff = feeDiff * GST_RATE;

  const causes: string[] = [];
  if (row.flags.includes('weight')) {
    causes.push(`Weight slab overcharge — billed for ${row.billedWeightG.toLocaleString('en-IN')}g against a declared weight of ${row.declaredWeightG.toLocaleString('en-IN')}g (excess ${excessWeight.toLocaleString('en-IN')}g). Forward shipping was charged at ${fmtMoney(row.chargedShipping)} instead of ${fmtMoney(row.expectedShipping)}.`);
  }
  if (row.flags.includes('commission')) {
    causes.push(`Commission overcharge — ${fmtMoney(row.chargedCommission)} deducted against a contracted commission of ${fmtMoney(row.expectedCommission)} for this category.`);
  }
  if (row.flags.includes('missingReturn')) {
    causes.push(`Returned unit not received back in my warehouse (Warehouse_Return_Received = No) and no reimbursement has been credited against this order. As per the ${claimLabel} policy, the marketplace is liable to reimburse the net realisable value of the unit.`);
  }
  if (row.flags.includes('pending')) {
    causes.push(`Payment on hold — the order is marked Delivered but ₹0 has been credited against this order in the current settlement cycle.`);
  }
  if (causes.length === 0) causes.push('Settlement shortfall against contracted fee schedule.');

  return [
    `SUBJECT: ${claimLabel} — Order ${row.orderId} | SKU ${row.sku} | Refund Claim ${fmtMoney(Math.max(row.leak, 0))}`,
    '',
    `Dear ${mkt} Seller Support,`,
    '',
    `I am filing a ${claimLabel} for the order referenced below. The bank settlement credited against this order is lower than the payout computed on my contracted seller fee schedule.`,
    '',
    '── ORDER DETAILS ──────────────────────────────',
    `Order ID             : ${row.orderId}`,
    `SKU                  : ${row.sku}`,
    `Order Status         : ${row.status}`,
    `Settlement UTR       : ${row.utr || 'Not provided in settlement file'}`,
    `Settlement Date      : ${row.settlementDate || 'As per attached statement'}`,
    `Invoice Value (GMV)  : ${fmtMoney(row.sellingPrice)}`,
    '',
    '── PAYOUT RECONCILIATION ──────────────────────',
    `Expected Net Settlement : ${fmtMoney(row.expectedSettlement)}`,
    `Actual Bank Credit      : ${fmtMoney(row.bankUtrSettled)}`,
    `Net Shortfall Claimed   : ${fmtMoney(Math.max(row.leak, 0))}`,
    '',
    '── FEE DISCREPANCY ────────────────────────────',
    `Commission      : Expected ${fmtMoney(row.expectedCommission)} | Charged ${fmtMoney(row.chargedCommission)} | Diff ${fmtMoney(row.chargedCommission - row.expectedCommission)}`,
    `Shipping        : Expected ${fmtMoney(row.expectedShipping)} | Charged ${fmtMoney(row.chargedShipping)} | Diff ${fmtMoney(row.chargedShipping - row.expectedShipping)}`,
    `Weight          : Declared ${row.declaredWeightG.toLocaleString('en-IN')}g | Billed ${row.billedWeightG.toLocaleString('en-IN')}g | Excess ${excessWeight.toLocaleString('en-IN')}g`,
    `GST @18% on fee difference : ${fmtMoney(gstDiff)}`,
    `Total Refund Requested     : ${fmtMoney(Math.max(row.leak, 0))}`,
    '',
    '── ROOT CAUSE ─────────────────────────────────',
    ...causes.map((c) => `• ${c}`),
    '',
    '── EVIDENCE CHECKLIST (attached) ──────────────',
    '✓ Packing slip photo with weight scale',
    '✓ Brand box L×W×H dimensions image',
    '✓ Tax Invoice copy',
    '',
    `Request you to review and credit ${fmtMoney(Math.max(row.leak, 0))} to my next settlement cycle within 7 working days.`,
    '',
    'Regards,',
    'Seller — Settlement Audit (SellerMath CSV Intelligence)',
  ].join('\n');
}

/* ══════════════════════════════════════════════════════════════════════════
   PRESENTATIONAL PRIMITIVES  (restyled)
   ══════════════════════════════════════════════════════════════════════════ */

type KpiTone = 'blue' | 'teal' | 'emerald' | 'rose' | 'amber';

const KPI_TONES: Record<KpiTone, { card: string; accent: string; icon: string; value: string }> = {
  blue: {
    card: 'border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900/80',
    accent: 'before:bg-gradient-to-r before:from-blue-500 before:to-sky-400',
    icon: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
    value: 'text-zinc-900 dark:text-zinc-50',
  },
  teal: {
    card: 'border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900/80',
    accent: 'before:bg-gradient-to-r before:from-teal-500 before:to-cyan-400',
    icon: 'bg-teal-500/10 text-teal-500 dark:text-teal-400 border border-teal-500/20',
    value: 'text-zinc-900 dark:text-zinc-50',
  },
  emerald: {
    card: 'border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900/80',
    accent: 'before:bg-gradient-to-r before:from-emerald-500 before:to-teal-400',
    icon: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    value: 'text-zinc-900 dark:text-zinc-50',
  },
  rose: {
    card: 'border-rose-500/40 bg-gradient-to-br from-rose-50 via-rose-100/50 to-white shadow-lg shadow-rose-500/10 dark:from-rose-500/[0.12] dark:via-rose-950/20 dark:to-zinc-900/90 dark:shadow-rose-500/5',
    accent: 'before:bg-gradient-to-r before:from-rose-500 before:to-orange-400',
    icon: 'bg-rose-500/15 text-rose-500 dark:text-rose-400 border border-rose-500/30',
    value: 'text-rose-600 dark:text-rose-400',
  },
  amber: {
    card: 'border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900/80',
    accent: 'before:bg-gradient-to-r before:from-amber-500 before:to-yellow-400',
    icon: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    value: 'text-zinc-900 dark:text-zinc-50',
  },
};

function KpiCard({ label, value, raw, sub, highlight, icon, tone = 'blue', className = '' }: {
  label: string; value: string; raw: number; sub: string;
  highlight?: boolean; icon: React.ReactNode; tone?: KpiTone; className?: string;
}) {
  const t = KPI_TONES[tone];
  return (
    <div
      title={fmtFull(raw)}
      className={[
        'relative min-w-0 overflow-hidden rounded-2xl border p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 sm:p-5',
        'before:absolute before:inset-x-0 before:top-0 before:h-1 before:content-[""]',
        t.card, t.accent, className,
      ].join(' ')}
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            {highlight && (
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
              </span>
            )}
            <span className="select-none truncate text-[9px] font-bold uppercase leading-tight tracking-[0.12em] text-zinc-500 dark:text-zinc-400 sm:text-[10px]">
              {label}
            </span>
          </div>
        </div>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${t.icon}`}>
          {icon}
        </span>
      </div>
      <div className={[
        'mt-3 select-none truncate text-2xl font-extrabold tracking-tight tabular-nums sm:mt-4 sm:text-3xl',
        t.value,
      ].join(' ')}>
        {value}
      </div>
      <div className="mt-1 select-none truncate text-[10px] font-medium text-zinc-500 dark:text-zinc-500 sm:text-[11px]">{sub}</div>
    </div>
  );
}

function Badge({ flag }: { flag: FlagKey }) {
  const meta = FLAG_META[flag];
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${meta.chip}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.short}
    </span>
  );
}

function StatusChip({ status }: { status: string }) {
  const cls = /rto|return/i.test(status)
    ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300'
    : /cancel/i.test(status)
      ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300';
  return <span className={`select-none whitespace-nowrap rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${cls}`}>{status}</span>;
}

function WeightPill({ declared, billed }: { declared: number; billed: number }) {
  const over = billed > declared;
  if (!over) {
    return (
      <span className="tabular-nums text-zinc-600 dark:text-zinc-400">
        {declared.toLocaleString('en-IN')}g
        <span className="mx-1 text-zinc-300 dark:text-zinc-700">→</span>
        {billed.toLocaleString('en-IN')}g
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-amber-500/40 bg-amber-100 px-2 py-0.5 font-semibold tabular-nums text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-400">
      {declared.toLocaleString('en-IN')}g
      <ArrowRight className="h-2.5 w-2.5 shrink-0" />
      {billed.toLocaleString('en-IN')}g
    </span>
  );
}

function AuditTile({ label, value, sub, tone = 'zinc' }: {
  label: string; value: string; sub?: string; tone?: 'zinc' | 'rose' | 'amber' | 'emerald' | 'violet';
}) {
  const toneCls = {
    zinc: 'text-zinc-900 dark:text-zinc-100',
    rose: 'text-rose-600 dark:text-rose-400',
    amber: 'text-amber-600 dark:text-amber-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    violet: 'text-violet-600 dark:text-violet-400',
  }[tone];
  return (
    <div className="min-w-0 rounded-xl border border-zinc-200/80 bg-white px-2.5 py-2 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/70">
      <div className="select-none truncate text-[9px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500">{label}</div>
      <div className={`mt-0.5 select-none truncate text-[11px] font-bold tabular-nums ${toneCls}`}>{value}</div>
      {sub && <div className="select-none truncate text-[9px] text-zinc-500 dark:text-zinc-500">{sub}</div>}
    </div>
  );
}

function RowBreakdown({ row }: { row: ComputedRow }) {
  const expCommPct = row.sellingPrice > 0 ? (row.expectedCommission / row.sellingPrice) * 100 : 0;
  const chgCommPct = row.sellingPrice > 0 ? (row.chargedCommission / row.sellingPrice) * 100 : 0;
  const weightOver = Math.max(0, row.billedWeightG - row.declaredWeightG);
  const shipOver = Math.max(0, row.chargedShipping - row.expectedShipping);
  const returned = (row.warehouseReturnReceived || '').toLowerCase().startsWith('y');

  return (
    <div className="border-t border-zinc-200/80 bg-gradient-to-b from-zinc-50/90 to-white p-3 sm:p-4 dark:border-zinc-800/80 dark:from-zinc-950/60 dark:to-zinc-900/30">
      <div className="mb-2 flex items-center gap-1.5">
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-500">
          <Receipt className="h-3 w-3" />
        </span>
        <span className="select-none text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
          CA Audit Breakdown — {row.orderId}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <AuditTile label="Selling Price (GMV)" value={fmtMoney(row.sellingPrice)} />
        <AuditTile
          label="Commission (Exp → Chg)"
          value={`${fmtMoney(row.expectedCommission)} → ${fmtMoney(row.chargedCommission)}`}
          sub={`${expCommPct.toFixed(1)}% → ${chgCommPct.toFixed(1)}% of GMV`}
          tone={row.chargedCommission > row.expectedCommission + 0.5 ? 'rose' : 'zinc'}
        />
        <AuditTile
          label="Weight (Declared → Billed)"
          value={`${row.declaredWeightG.toLocaleString('en-IN')}g → ${row.billedWeightG.toLocaleString('en-IN')}g`}
          sub={weightOver > 0 ? `+${weightOver.toLocaleString('en-IN')}g excess` : 'Within slab'}
          tone={weightOver > 0 ? 'amber' : 'zinc'}
        />
        <AuditTile
          label="Shipping (Exp → Chg)"
          value={`${fmtMoney(row.expectedShipping)} → ${fmtMoney(row.chargedShipping)}`}
          sub={shipOver > 0 ? `Overcharge ${fmtMoney(shipOver)}` : 'No overcharge'}
          tone={shipOver > 0 ? 'amber' : 'zinc'}
        />
        <AuditTile
          label="GST @18% on Fees"
          value={`${fmtMoney(row.gstOnExpectedFees)} → ${fmtMoney(row.gstOnChargedFees)}`}
          sub="Expected → Charged"
        />
        <AuditTile label="TCS/TDS 1% u/s 194-O" value={fmtMoney(row.tcs)} sub="Claimable on portal" />
        <AuditTile
          label="Warehouse Return"
          value={returned ? 'Yes — Received' : 'No — Not Received'}
          tone={returned ? 'emerald' : 'violet'}
        />
        <AuditTile
          label="Net Leak / Discrepancy"
          value={row.matched ? '✓ Clean' : fmtMoney(row.leak)}
          sub={row.matched ? 'Within ±₹2 tolerance' : 'Recoverable via claim'}
          tone={row.matched ? 'emerald' : 'rose'}
        />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 rounded-xl border border-zinc-200/80 bg-white px-2.5 py-2 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/70">
        <span className="select-none text-[9px] font-semibold uppercase tracking-wide text-zinc-500">Reconciliation</span>
        <span className="select-none rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          Expected {fmtMoney(row.expectedSettlement)}
        </span>
        <span className="select-none text-zinc-400">−</span>
        <span className="select-none rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          UTR {fmtMoney(row.bankUtrSettled)}
        </span>
        <span className="select-none text-zinc-400">=</span>
        <span className={[
          'select-none rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
          row.matched ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
            : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
        ].join(' ')}>
          {row.matched ? 'Matched' : fmtMoney(row.leak)}
        </span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════════ */

export default function SettlementReconciliation() {
  const [marketplace, setMarketplace] = useState<Marketplace>('Amazon');
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [batchName, setBatchName] = useState('');
  const [batchUtr, setBatchUtr] = useState('');
  const [batchDate, setBatchDate] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [claimTarget, setClaimTarget] = useState<ClaimTarget>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('leak');
  const [expandedUid, setExpandedUid] = useState<string | null>(null);
  const [claimedUids, setClaimedUids] = useState<Set<string>>(() => new Set());
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');

  const activeMarket = MARKETPLACES.find((m) => m.id === marketplace) ?? MARKETPLACES[0];

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  const computed = useMemo<ComputedRow[]>(() => rows.map(computeRow), [rows]);

  const portfolio = useMemo(() => {
    let grossOrderValue = 0, expectedPayout = 0, actualPayout = 0, totalLeak = 0, taxCredit = 0, actionableCount = 0;
    const buckets = { weight: 0, commission: 0, missingReturn: 0, pending: 0 };
    for (const r of computed) {
      grossOrderValue += r.sellingPrice;
      expectedPayout += r.expectedSettlement;
      actualPayout += r.bankUtrSettled;
      taxCredit += r.gstOnChargedFees + r.tcs;
      if (r.actionable) {
        actionableCount += 1;
        totalLeak += Math.max(0, r.leak);
        buckets.weight += r.split.weight;
        buckets.commission += r.split.commission;
        buckets.missingReturn += r.split.missingReturn;
        buckets.pending += r.split.pending;
      }
    }
    const leakPct = grossOrderValue > 0 ? (totalLeak / grossOrderValue) * 100 : 0;
    return { grossOrderValue, expectedPayout, actualPayout, totalLeak, taxCredit, actionableCount, buckets, leakPct };
  }, [computed]);

  const visible = useMemo(() => {
    switch (filter) {
      case 'actionable':    return computed.filter((r) => r.actionable);
      case 'weight':        return computed.filter((r) => r.flags.includes('weight'));
      case 'commission':    return computed.filter((r) => r.flags.includes('commission'));
      case 'missingReturn': return computed.filter((r) => r.flags.includes('missingReturn'));
      case 'matched':       return computed.filter((r) => r.matched);
      default:              return computed;
    }
  }, [computed, filter]);

  const displayed = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const searched = q
      ? visible.filter((r) => r.orderId.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q))
      : visible;
    const sorted = [...searched];
    switch (sortBy) {
      case 'leak':    sorted.sort((a, b) => b.leak - a.leak); break;
      case 'value':   sorted.sort((a, b) => b.sellingPrice - a.sellingPrice); break;
      case 'weight':  sorted.sort((a, b) => (b.billedWeightG - b.declaredWeightG) - (a.billedWeightG - a.declaredWeightG)); break;
      case 'orderId': sorted.sort((a, b) => a.orderId.localeCompare(b.orderId)); break;
    }
    return sorted;
  }, [visible, searchQuery, sortBy]);

  const leakCounts = useMemo(() => ({
    all: computed.length,
    actionable: computed.filter((r) => r.actionable).length,
    weight: computed.filter((r) => r.flags.includes('weight')).length,
    commission: computed.filter((r) => r.flags.includes('commission')).length,
    missingReturn: computed.filter((r) => r.flags.includes('missingReturn')).length,
    matched: computed.filter((r) => r.matched).length,
  }), [computed]);

  const claimedAmount = useMemo(
    () => computed.reduce((s, r) => (claimedUids.has(r.uid) && r.leak > 0 ? s + r.leak : s), 0),
    [computed, claimedUids],
  );
  const claimedCount = useMemo(
    () => computed.filter((r) => claimedUids.has(r.uid) && r.actionable).length,
    [computed, claimedUids],
  );
  const claimedPct = portfolio.totalLeak > 0 ? (claimedAmount / portfolio.totalLeak) * 100 : 0;

  const toggleClaimed = useCallback((uids: string[], mark: boolean) => {
    setClaimedUids((prev) => {
      const next = new Set(prev);
      uids.forEach((u) => (mark ? next.add(u) : next.delete(u)));
      return next;
    });
  }, []);

  const toggleExpanded = useCallback((rowUid: string) => {
    setExpandedUid((cur) => (cur === rowUid ? null : rowUid));
  }, []);

  const ingestRows = useCallback((incoming: RawOrder[], name: string, utr: string, date: string) => {
    if (!incoming.length) {
      setParseError('No valid order rows found. Please check the column headers against the template.');
      return;
    }
    setRows(incoming.map((r) => ({ ...r, uid: uid() })));
    setBatchName(name);
    setBatchUtr(utr);
    setBatchDate(date);
    setParseError(null);
    setFilter('all');
    setSearchQuery('');
    setExpandedUid(null);
    setClaimedUids(new Set());
    setToast(`Parsed ${incoming.length} settlement orders`);
  }, []);

  const ingestCsvText = useCallback((text: string, name: string, utr: string, date: string) => {
    const { orders, error } = mapGridToOrders(parseCsv(text));
    if (error) { setParseError(error); return; }
    ingestRows(orders, name, utr, date);
  }, [ingestRows]);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      ingestCsvText(
        String(reader.result ?? ''),
        file.name,
        'Custom Batch',
        new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      );
    };
    reader.readAsText(file);
  }, [ingestCsvText]);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const loadSample = useCallback((def: SampleDef) => {
    setMarketplace(def.marketplace);
    ingestRows(def.rows, def.batchName, def.utr, def.date);
  }, [ingestRows]);

  const resetAll = useCallback(() => {
    setRows([]);
    setBatchName('');
    setBatchUtr('');
    setBatchDate('');
    setFilter('all');
    setParseError(null);
    setClaimTarget(null);
    setShowManual(false);
    setSearchQuery('');
    setExpandedUid(null);
    setClaimedUids(new Set());
    setPasteText('');
    setShowPaste(false);
    setToast('Batch cleared');
  }, []);

  const downloadTemplate = useCallback(() => {
    const example = ['AMZ-1001', 'TSH-BLK-M', 'Delivered', '799', '80', '80', '300', '300', '55', '55', '632', 'Yes', 'NEFT123456789', '2025-02-12'];
    const blob = new Blob([[TEMPLATE_HEADERS.join(','), example.join(',')].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'settlement_reconciliation_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    setToast('Template downloaded');
  }, []);

  const handlePasteParse = useCallback(() => {
    if (!pasteText.trim()) { setParseError('Paste some settlement rows first.'); return; }
    ingestCsvText(
      pasteText,
      'pasted_settlement_batch.csv',
      'Pasted Batch',
      new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    );
    setShowPaste(false);
    setPasteText('');
  }, [pasteText, ingestCsvText]);

  const claimText = useMemo(() => {
    if (!claimTarget) return '';
    if (claimTarget.mode === 'single') return buildClaimText(claimTarget.row, marketplace, activeMarket.claim);
    const leaked = computed.filter((r) => r.actionable && r.leak > 0);
    if (!leaked.length) return 'No actionable leaks in this batch — nothing to dispute.';
    const header = [
      '═══════════════════════════════════════════════',
      `  ${activeMarket.claim.toUpperCase()} — BULK DISPUTE PACKET`,
      `  Marketplace: ${activeMarket.label}`,
      `  Batch: ${batchName}`,
      `  Orders in packet: ${leaked.length}`,
      `  Total refund requested: ${fmtMoney(leaked.reduce((s, r) => s + Math.max(0, r.leak), 0))}`,
      '═══════════════════════════════════════════════',
      '',
    ].join('\n');
    return header + leaked.map((r, i) =>
      `\n─────────── CLAIM ${i + 1} of ${leaked.length} ───────────\n` + buildClaimText(r, marketplace, activeMarket.claim),
    ).join('\n\n');
  }, [claimTarget, computed, marketplace, activeMarket, batchName]);

  const copyClaim = useCallback(async () => {
    if (!claimText) return;
    try { await navigator.clipboard.writeText(claimText); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = claimText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setToast('Claim text copied to clipboard');
    window.setTimeout(() => setCopied(false), 2000);
  }, [claimText]);

  const exportLeaksCsv = useCallback(() => {
    const leaked = computed.filter((r) => r.actionable && r.leak > 0);
    if (!leaked.length) { setToast('No leaked orders to export'); return; }
    const header = ['Order_ID', 'SKU', 'Status', 'Discrepancy_Type', 'Declared_Weight_g', 'Billed_Weight_g', 'Expected_Commission', 'Charged_Commission', 'Expected_Shipping', 'Charged_Shipping', 'Expected_Settlement', 'Bank_UTR_Settled', 'Leak_Amount', 'Claim_Type'];
    const escape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    const lines = leaked.map((r) => [
      r.orderId, r.sku, r.status, r.flags.map((f) => FLAG_META[f].short).join(' + '),
      String(r.declaredWeightG), String(r.billedWeightG),
      r.expectedCommission.toFixed(2), r.chargedCommission.toFixed(2),
      r.expectedShipping.toFixed(2), r.chargedShipping.toFixed(2),
      r.expectedSettlement.toFixed(2), r.bankUtrSettled.toFixed(2),
      Math.max(0, r.leak).toFixed(2), activeMarket.claim,
    ].map((c) => escape(String(c))).join(','));
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leaked_orders_${marketplace.toLowerCase()}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setToast(`Exported ${leaked.length} leaked orders`);
  }, [computed, activeMarket, marketplace]);

  const exportAuditCsv = useCallback(() => {
    if (!displayed.length) { setToast('Nothing to export for the current view'); return; }
    const header = [
      'Order_ID', 'SKU', 'Status', 'Selling_Price',
      'Expected_Commission', 'Charged_Commission', 'Declared_Weight_g', 'Billed_Weight_g',
      'Expected_Shipping', 'Charged_Shipping',
      'Expected_Payout', 'Actual_UTR_Settled', 'Leak_Amount', 'Discrepancy_Reason', 'Claim_Status',
    ];
    const escape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    const lines = displayed.map((r) => [
      r.orderId, r.sku, r.status, r.sellingPrice.toFixed(2),
      r.expectedCommission.toFixed(2), r.chargedCommission.toFixed(2),
      String(r.declaredWeightG), String(r.billedWeightG),
      r.expectedShipping.toFixed(2), r.chargedShipping.toFixed(2),
      r.expectedSettlement.toFixed(2), r.bankUtrSettled.toFixed(2),
      (r.matched ? 0 : Math.max(0, r.leak)).toFixed(2),
      r.matched ? 'Matched (Clean)' : r.flags.map((f) => FLAG_META[f].short).join(' + '),
      claimedUids.has(r.uid) ? 'Claim Filed' : r.actionable ? 'Pending Claim' : 'N/A',
    ].map((c) => escape(String(c))).join(','));
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_${marketplace.toLowerCase()}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setToast(`Audit CSV exported — ${displayed.length} orders`);
  }, [displayed, claimedUids, marketplace]);

  const isClaimTargetFiled = useMemo(() => {
    if (!claimTarget) return false;
    if (claimTarget.mode === 'single') return claimedUids.has(claimTarget.row.uid);
    const leaked = computed.filter((r) => r.actionable && r.leak > 0);
    return leaked.length > 0 && leaked.every((r) => claimedUids.has(r.uid));
  }, [claimTarget, claimedUids, computed]);

  const handleMarkFiled = useCallback(() => {
    if (!claimTarget) return;
    if (claimTarget.mode === 'single') {
      toggleClaimed([claimTarget.row.uid], !claimedUids.has(claimTarget.row.uid));
    } else {
      const leaked = computed.filter((r) => r.actionable && r.leak > 0);
      const allClaimed = leaked.length > 0 && leaked.every((r) => claimedUids.has(r.uid));
      toggleClaimed(leaked.map((r) => r.uid), !allClaimed);
    }
    setToast(isClaimTargetFiled ? 'Claim marked as pending' : 'Claim marked as filed');
  }, [claimTarget, claimedUids, computed, toggleClaimed, isClaimTargetFiled]);

  const [manual, setManual] = useState({
    orderId: '', sku: '', status: 'Delivered',
    sellingPrice: '', expectedCommission: '', chargedCommission: '',
    declaredWeightG: '', billedWeightG: '',
    expectedShipping: '', chargedShipping: '',
    bankUtrSettled: '', warehouseReturnReceived: 'Yes',
  });

  const manualPreview = useMemo<ComputedRow | null>(() => {
    if (!manual.orderId.trim() && !manual.sellingPrice.trim()) return null;
    return computeRow({
      uid: 'manual-preview',
      orderId: manual.orderId || 'MANUAL-ORDER',
      sku: manual.sku || '—',
      status: manual.status,
      sellingPrice: num(manual.sellingPrice),
      expectedCommission: num(manual.expectedCommission),
      chargedCommission: num(manual.chargedCommission),
      declaredWeightG: num(manual.declaredWeightG),
      billedWeightG: num(manual.billedWeightG),
      expectedShipping: num(manual.expectedShipping),
      chargedShipping: num(manual.chargedShipping),
      bankUtrSettled: num(manual.bankUtrSettled),
      warehouseReturnReceived: manual.warehouseReturnReceived,
    });
  }, [manual]);

  const addManualRow = useCallback(() => {
    if (!manualPreview) { setToast('Enter at least an Order ID or Selling Price'); return; }
    setRows((prev) => [...prev, { ...manualPreview, uid: uid() }]);
    if (!batchName) {
      setBatchName('manual_audit_batch.csv');
      setBatchUtr('Manual Entry');
      setBatchDate(new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }));
    }
    setManual({
      orderId: '', sku: '', status: 'Delivered',
      sellingPrice: '', expectedCommission: '', chargedCommission: '',
      declaredWeightG: '', billedWeightG: '',
      expectedShipping: '', chargedShipping: '',
      bankUtrSettled: '', warehouseReturnReceived: 'Yes',
    });
    setToast('Order added to audit batch');
  }, [manualPreview, batchName]);

  const hasBatch = rows.length > 0;

  const breakdown = [
    { key: 'weight',        label: 'Weight Overcharges',     value: portfolio.buckets.weight,        bar: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.45)]',   accent: 'border-l-amber-500',  text: 'text-amber-600 dark:text-amber-400',   pill: 'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-300' },
    { key: 'commission',    label: 'Commission Errors',      value: portfolio.buckets.commission,    bar: 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.45)]',     accent: 'border-l-rose-500',   text: 'text-rose-600 dark:text-rose-400',     pill: 'bg-rose-500/10 text-rose-700 border-rose-500/30 dark:text-rose-300' },
    { key: 'missingReturn', label: 'Missing Returns / RTOs', value: portfolio.buckets.missingReturn, bar: 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.45)]',  accent: 'border-l-purple-500', text: 'text-purple-600 dark:text-purple-400', pill: 'bg-purple-500/10 text-purple-700 border-purple-500/30 dark:text-purple-300' },
    { key: 'pending',       label: 'Pending Payouts',        value: portfolio.buckets.pending,       bar: 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.45)]',     accent: 'border-l-cyan-500',   text: 'text-cyan-600 dark:text-cyan-400',     pill: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/30 dark:text-cyan-300' },
  ];
  const breakdownTotal = breakdown.reduce((s, b) => s + b.value, 0);

  const filterTabs: { key: FilterKey; label: string; count: number }[] = [
    { key: 'all',           label: 'All Orders',              count: leakCounts.all },
    { key: 'actionable',    label: '🔴 Actionable Leaks Only', count: leakCounts.actionable },
    { key: 'weight',        label: '⚖️ Weight Disputes',       count: leakCounts.weight },
    { key: 'commission',    label: '💸 Commission Errors',     count: leakCounts.commission },
    { key: 'missingReturn', label: '📦 Missing Returns',       count: leakCounts.missingReturn },
    { key: 'matched',       label: '✅ Matched',               count: leakCounts.matched },
  ];

  const WORKFLOW_STEPS = [
    '① Upload Amazon / Flipkart / Meesho CSV',
    '② Auto-Flag Weight, Fee & RTO Leaks',
    '③ Generate Ready-to-File SAFE-T / SPF Claims',
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto box-border w-full max-w-[1360px] overflow-x-hidden px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">

        {/* ─────────────── 1. UNIFIED STUDIO BANNER (HERO + SAMPLE BAR) ─────────────── */}
        <header className="relative mb-4 overflow-hidden rounded-3xl border border-zinc-200/80 bg-gradient-to-br from-white via-zinc-50/90 to-emerald-50/30 p-4 shadow-xl sm:mb-5 sm:p-7 dark:border-zinc-800/80 dark:from-zinc-900/95 dark:via-zinc-900/90 dark:to-emerald-950/25">
          <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-20 h-56 w-56 rounded-full bg-teal-500/5 blur-3xl" />

          <div className="relative">
            <div className="inline-flex select-none items-center gap-1.5 rounded-full border border-emerald-300/80 bg-emerald-50/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-700 shadow-sm sm:text-[11px] dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
              <ShieldCheck className="h-3 w-3 shrink-0" />
              <span className="truncate">CA-Grade Payout Audit • SPF / SAFE-T Claim Generator</span>
            </div>

            <h1 className="mt-3 select-none text-xl font-extrabold tracking-tight text-zinc-900 sm:mt-4 sm:text-3xl lg:text-4xl dark:text-zinc-50">
              Payment Settlement &amp;{' '}
              <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">Leak Reconciliation</span>
            </h1>
            <p className="mt-1.5 max-w-3xl select-none text-[11px] leading-relaxed text-zinc-600 sm:mt-2 sm:text-sm dark:text-zinc-400">
              Audit UTR bank payouts against expected unit economics — catch courier weight overcharges,
              commission discrepancies, unpaid RTOs &amp; missing reimbursements.
            </p>

            {/* Marketplace segmented pill track */}
            <div className="mt-4 inline-flex max-w-full flex-wrap gap-1.5 rounded-2xl border border-zinc-200/70 bg-zinc-100 p-1.5 sm:mt-5 dark:border-zinc-800/80 dark:bg-zinc-950/80">
              {MARKETPLACES.map((m) => {
                const active = m.id === marketplace;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMarketplace(m.id)}
                    className={[
                      'select-none whitespace-nowrap rounded-xl px-3 py-1.5 text-[10px] transition-all sm:px-4 sm:text-xs',
                      active
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 font-semibold text-white shadow-md shadow-emerald-500/20'
                        : 'font-medium text-zinc-600 hover:bg-white hover:text-emerald-700 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-emerald-300',
                    ].join(' ')}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            <p className="mt-2.5 select-none text-[10px] text-zinc-500 sm:text-[11px] dark:text-zinc-500">
              Claim terminology for <span className="font-semibold text-emerald-600 dark:text-emerald-400">{activeMarket.label}</span>{' '}
              → <span className="font-semibold text-zinc-700 dark:text-zinc-300">{activeMarket.claim}</span> · {activeMarket.note}
            </p>

            {/* Divider */}
            <div className="my-4 h-px w-full bg-gradient-to-r from-transparent via-zinc-200 to-transparent sm:my-5 dark:via-zinc-800" />

            {/* Sample bar */}
            <div className="mb-2.5 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
              <span className="select-none text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 sm:text-[11px] dark:text-zinc-400">
                Try Sample Audit
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {SAMPLE_DEFS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => loadSample(s)}
                  className="group relative flex min-w-0 select-none items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white/80 p-3.5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/50 hover:bg-emerald-500/[0.04] dark:border-zinc-800/80 dark:bg-zinc-900/70"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-lg shadow-[0_0_18px_rgba(16,185,129,0.18)]">
                    {s.emoji}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col leading-tight">
                    <span className="truncate text-[12px] font-bold text-zinc-900 dark:text-zinc-100">{s.label}</span>
                    <span className="mt-0.5 truncate text-[10px] text-zinc-500 dark:text-zinc-400">{s.descriptor}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-zinc-400 transition-transform group-hover:translate-x-1 group-hover:text-emerald-500" />
                </button>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={downloadTemplate}
                className="flex select-none items-center gap-1.5 whitespace-nowrap rounded-xl border border-zinc-200/80 bg-white/80 px-3 py-1.5 text-[10px] font-semibold text-zinc-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-400 hover:text-teal-700 sm:text-[11px] dark:border-zinc-800/80 dark:bg-zinc-900/70 dark:text-zinc-300 dark:hover:border-teal-500/50 dark:hover:text-teal-300"
              >
                <Download className="h-3.5 w-3.5 shrink-0" /> Download CSV Template
              </button>

              <button
                type="button"
                onClick={() => setShowPaste((v) => !v)}
                className={[
                  'flex select-none items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-1.5 text-[10px] font-semibold shadow-sm transition-all hover:-translate-y-0.5 sm:text-[11px]',
                  showPaste
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-300'
                    : 'border-zinc-200/80 bg-white/80 text-zinc-700 hover:border-emerald-400 hover:text-emerald-700 dark:border-zinc-800/80 dark:bg-zinc-900/70 dark:text-zinc-300 dark:hover:border-emerald-500/50 dark:hover:text-emerald-300',
                ].join(' ')}
              >
                <ClipboardPaste className="h-3.5 w-3.5 shrink-0" /> Paste Raw Settlement Rows
              </button>

              <button
                type="button"
                onClick={resetAll}
                disabled={!hasBatch}
                className="flex select-none items-center gap-1.5 whitespace-nowrap rounded-xl border border-zinc-200/80 bg-white/80 px-3 py-1.5 text-[10px] font-semibold text-zinc-700 shadow-sm transition-all hover:border-rose-400 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 sm:text-[11px] dark:border-zinc-800/80 dark:bg-zinc-900/70 dark:text-zinc-300 dark:hover:border-rose-500/50 dark:hover:text-rose-400"
              >
                <RotateCcw className="h-3.5 w-3.5 shrink-0" /> Reset / Clear
              </button>
            </div>

            {showPaste && (
              <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-500/25 dark:bg-emerald-500/[0.06]">
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1.5">
                  <span className="select-none text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    Paste rows from Excel / Google Sheets
                  </span>
                  <span className="select-none text-[9px] text-zinc-500 dark:text-zinc-400">
                    Include the header row · comma or tab separated
                  </span>
                </div>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  rows={5}
                  spellCheck={false}
                  placeholder={'Order_ID,SKU,Status,Selling_Price,Expected_Commission,Charged_Commission,Declared_Weight_g,Billed_Weight_g,Expected_Shipping,Charged_Shipping,Bank_UTR_Settled,Warehouse_Return_Received\nAMZ-1001,TSH-BLK-M,Delivered,799,80,80,300,300,55,55,632,Yes'}
                  className="w-full resize-y rounded-xl border border-zinc-200 bg-white p-2.5 font-mono text-[10px] leading-relaxed text-zinc-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={handlePasteParse}
                    className="select-none rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3.5 py-1.5 text-[10px] font-bold text-white shadow-md shadow-emerald-500/20 transition-all hover:opacity-90"
                  >
                    Parse {pasteText.trim() ? `${Math.max(parseCsv(pasteText).length - 1, 0)} Rows` : 'Rows'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPasteText(''); setShowPaste(false); }}
                    className="select-none rounded-xl border border-zinc-200 bg-white px-3.5 py-1.5 text-[10px] font-semibold text-zinc-600 hover:text-rose-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* ─────────────── 3. DUAL INPUT ENGINE ─────────────── */}
        <section className="mb-4 sm:mb-5">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = '';
            }}
          />

          {!hasBatch ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={[
                'flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-3 py-7 text-center transition-all sm:px-4 sm:py-12',
                dragOver
                  ? 'scale-[1.005] border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-500/10'
                  : 'border-emerald-300 bg-emerald-50/40 hover:border-emerald-400 hover:bg-emerald-50/70 dark:border-emerald-500/30 dark:bg-emerald-500/[0.04] dark:hover:border-emerald-500/60 dark:hover:bg-emerald-500/10',
              ].join(' ')}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 sm:h-14 sm:w-14">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="mt-3 select-none text-[13px] font-bold text-zinc-800 sm:mt-4 sm:text-base dark:text-zinc-100">
                Drag &amp; drop your Settlement CSV here
              </p>
              <p className="mt-0.5 select-none text-[10px] text-zinc-500 sm:mt-1 sm:text-[11px] dark:text-zinc-400">
                or <span className="font-semibold text-emerald-600 dark:text-emerald-400">click to browse</span> — CSV only
              </p>

              {/* 3-pill workflow strip */}
              <div
                className="mt-4 flex w-full max-w-2xl flex-col items-stretch gap-1.5 sm:mt-5 sm:flex-row sm:items-center sm:justify-center sm:gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                {WORKFLOW_STEPS.map((step, i) => (
                  <div key={step} className="flex min-w-0 items-center gap-1.5">
                    <span className="flex-1 select-none rounded-full border border-emerald-300 bg-white/90 px-3 py-1 text-[9px] font-semibold leading-tight text-emerald-800 shadow-sm sm:flex-none sm:text-[10px] dark:border-emerald-500/30 dark:bg-zinc-950/60 dark:text-emerald-300">
                      {step}
                    </span>
                    {i < WORKFLOW_STEPS.length - 1 && (
                      <ArrowRight className="hidden h-3 w-3 shrink-0 text-emerald-400 sm:block" />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-3 max-w-2xl select-none rounded-xl border border-emerald-200 bg-white/70 px-3 py-2 text-[9px] leading-relaxed text-zinc-600 sm:mt-4 sm:text-[10px] dark:border-emerald-500/20 dark:bg-zinc-950/40 dark:text-zinc-400">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">Supported columns: </span>
                <code className="break-words font-mono text-emerald-700 dark:text-emerald-300">
                  Order_ID, SKU, Status, Selling_Price, Expected_Commission, Charged_Commission,
                  Declared_Weight_g, Billed_Weight_g, Expected_Shipping, Charged_Shipping,
                  Bank_UTR_Settled, Warehouse_Return_Received
                </code>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 p-3 shadow-sm sm:p-4 dark:border-emerald-500/30 dark:from-emerald-500/10 dark:to-teal-500/10">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20 sm:h-10 sm:w-10">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate select-none text-[11px] font-bold text-zinc-900 sm:text-sm dark:text-zinc-100">
                    {batchName}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="select-none whitespace-nowrap rounded-md bg-white/80 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 sm:text-[10px] dark:bg-zinc-950/50 dark:text-emerald-300">
                      {rows.length} orders parsed
                    </span>
                    {batchUtr && (
                      <span className="select-none whitespace-nowrap rounded-md bg-white/80 px-1.5 py-0.5 text-[9px] font-semibold text-teal-700 sm:text-[10px] dark:bg-zinc-950/50 dark:text-teal-300">
                        {batchUtr}
                      </span>
                    )}
                    {batchDate && (
                      <span className="select-none whitespace-nowrap rounded-md bg-white/80 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-600 sm:text-[10px] dark:bg-zinc-950/50 dark:text-zinc-400">
                        {batchDate}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex w-full flex-wrap gap-1.5 sm:w-auto">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-1 select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-white px-2.5 py-1.5 text-[10px] font-semibold text-zinc-700 shadow-sm transition-all hover:-translate-y-0.5 hover:text-emerald-600 sm:flex-none sm:text-[11px] dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-emerald-400"
                  >
                    <UploadCloud className="h-3.5 w-3.5 shrink-0" /> Upload Another CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowManual(true)}
                    className="flex flex-1 select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-white px-2.5 py-1.5 text-[10px] font-semibold text-zinc-700 shadow-sm transition-all hover:-translate-y-0.5 hover:text-emerald-600 sm:flex-none sm:text-[11px] dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-emerald-400"
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0" /> Add Order Row
                  </button>
                  <button
                    type="button"
                    onClick={resetAll}
                    className="flex flex-1 select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-white px-2.5 py-1.5 text-[10px] font-semibold text-rose-600 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-rose-50 sm:flex-none sm:text-[11px] dark:bg-zinc-900 dark:text-rose-400 dark:hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5 shrink-0" /> Clear Batch
                  </button>
                </div>
              </div>
            </div>
          )}

          {parseError && (
            <div className="mt-2 flex items-start gap-2 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-[10px] text-rose-700 sm:text-[11px] dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="select-none">{parseError}</span>
            </div>
          )}

          <div className="mt-2.5 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/80">
            <button
              type="button"
              onClick={() => setShowManual((v) => !v)}
              className="flex w-full select-none items-center justify-between gap-2 px-3 py-3 text-left transition-colors hover:bg-zinc-50 sm:px-4 dark:hover:bg-zinc-800/50"
            >
              <span className="flex min-w-0 items-center gap-2 text-[10px] font-semibold text-zinc-700 sm:text-[11px] dark:text-zinc-300">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Calculator className="h-3.5 w-3.5" />
                </span>
                <span className="truncate">Manual Single-Order Discrepancy Checker</span>
              </span>
              <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform ${showManual ? 'rotate-180' : ''}`} />
            </button>

            {showManual && (
              <div className="border-t border-zinc-200/80 p-3 sm:p-4 dark:border-zinc-800/80">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {([
                    ['orderId', 'Order ID', 'text'],
                    ['sku', 'SKU', 'text'],
                    ['status', 'Status', 'select'],
                    ['sellingPrice', 'Selling Price (₹)', 'number'],
                    ['expectedCommission', 'Expected Commission (₹)', 'number'],
                    ['chargedCommission', 'Charged Commission (₹)', 'number'],
                    ['declaredWeightG', 'Declared Weight (g)', 'number'],
                    ['billedWeightG', 'Billed Weight (g)', 'number'],
                    ['expectedShipping', 'Expected Shipping (₹)', 'number'],
                    ['chargedShipping', 'Charged Shipping (₹)', 'number'],
                    ['bankUtrSettled', 'Bank UTR Settled (₹)', 'number'],
                    ['warehouseReturnReceived', 'Return Received?', 'yn'],
                  ] as const).map(([key, label, type]) => (
                    <label key={key} className="block min-w-0">
                      <span className="mb-0.5 block select-none truncate text-[9px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
                        {label}
                      </span>
                      {type === 'select' ? (
                        <select
                          value={manual[key]}
                          onChange={(e) => setManual((m) => ({ ...m, [key]: e.target.value }))}
                          className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-[11px] text-zinc-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                        >
                          <option>Delivered</option><option>RTO</option><option>Customer Return</option><option>Cancelled</option>
                        </select>
                      ) : type === 'yn' ? (
                        <select
                          value={manual[key]}
                          onChange={(e) => setManual((m) => ({ ...m, [key]: e.target.value }))}
                          className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-[11px] text-zinc-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                        >
                          <option>Yes</option><option>No</option>
                        </select>
                      ) : (
                        <input
                          type={type}
                          value={manual[key]}
                          onChange={(e) => setManual((m) => ({ ...m, [key]: e.target.value }))}
                          placeholder={type === 'number' ? '0' : ''}
                          className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-[11px] text-zinc-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                        />
                      )}
                    </label>
                  ))}
                </div>

                {manualPreview && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 rounded-xl border border-zinc-200/80 bg-zinc-50 px-3 py-2 sm:gap-2 dark:border-zinc-800/80 dark:bg-zinc-950/50">
                    <span className="select-none text-[9px] font-semibold uppercase tracking-wide text-zinc-500">Live Result</span>
                    <span className="select-none whitespace-nowrap rounded-md bg-white px-1.5 py-0.5 text-[9px] font-semibold tabular-nums text-zinc-700 sm:text-[10px] dark:bg-zinc-900 dark:text-zinc-300">
                      Expected {fmtFull(manualPreview.expectedSettlement)}
                    </span>
                    <span className="select-none whitespace-nowrap rounded-md bg-white px-1.5 py-0.5 text-[9px] font-semibold tabular-nums text-zinc-700 sm:text-[10px] dark:bg-zinc-900 dark:text-zinc-300">
                      Settled {fmtFull(manualPreview.bankUtrSettled)}
                    </span>
                    <span className={[
                      'select-none whitespace-nowrap rounded-md px-1.5 py-0.5 text-[9px] font-bold tabular-nums sm:text-[10px]',
                      manualPreview.actionable
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
                    ].join(' ')}>
                      {manualPreview.actionable ? `Leak ${fmtFull(manualPreview.leak)}` : 'Matched'}
                    </span>
                    {manualPreview.flags.map((f) => <Badge key={f} flag={f} />)}
                    <button
                      type="button"
                      onClick={addManualRow}
                      className="ml-auto select-none whitespace-nowrap rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1 text-[10px] font-semibold text-white shadow-md shadow-emerald-500/20 hover:opacity-90"
                    >
                      + Add to Batch
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ─────────────── 4. KPIs + BREAKDOWN ─────────────── */}
        {hasBatch && (
          <section className="mb-4 space-y-3 sm:mb-5 sm:space-y-4">
            <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
              <KpiCard tone="blue" label="Gross Order Value" value={fmtShort(portfolio.grossOrderValue)} raw={portfolio.grossOrderValue}
                sub={`${computed.length} orders`} icon={<Receipt className="h-4 w-4" />} />
              <KpiCard tone="teal" label="Expected Bank Payout" value={fmtShort(portfolio.expectedPayout)} raw={portfolio.expectedPayout}
                sub="Net of fees, GST & TCS" icon={<Scale className="h-4 w-4" />} />
              <KpiCard tone="emerald" label="Actual UTR Credited" value={fmtShort(portfolio.actualPayout)} raw={portfolio.actualPayout}
                sub="Bank settled" icon={<Banknote className="h-4 w-4" />} />
              <KpiCard tone="rose" label="Total Recoverable Leaks" value={fmtShort(portfolio.totalLeak)} raw={portfolio.totalLeak}
                sub={`${portfolio.leakPct.toFixed(2)}% of revenue · ${portfolio.actionableCount} orders`}
                highlight icon={<AlertTriangle className="h-4 w-4" />} />
              <KpiCard tone="amber" label="Tax Credit Locked" value={fmtShort(portfolio.taxCredit)} raw={portfolio.taxCredit}
                sub="1% TCS u/s 194-O + 18% Input GST" icon={<ShieldCheck className="h-4 w-4" />}
                className="col-span-2 sm:col-span-1" />
            </div>

            <div className="rounded-3xl border border-zinc-200/80 bg-white p-3.5 shadow-sm sm:p-5 dark:border-zinc-800/80 dark:bg-zinc-900/80">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="select-none truncate text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 sm:text-[11px] dark:text-zinc-400">
                  Where Your Money Leaked
                </h2>
                <span className="select-none whitespace-nowrap rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-extrabold tabular-nums text-rose-600 dark:text-rose-400" title={fmtFull(breakdownTotal)}>
                  {fmtFull(breakdownTotal)}
                </span>
              </div>

              <div className="flex h-3.5 w-full gap-1 overflow-hidden rounded-full bg-zinc-200 p-0.5 shadow-inner dark:bg-zinc-800">
                {breakdownTotal > 0
                  ? breakdown.filter((b) => b.value > 0).map((b) => (
                    <div key={b.key} className={`${b.bar} rounded-full transition-all`} style={{ width: `${(b.value / breakdownTotal) * 100}%` }} title={`${b.label}: ${fmtFull(b.value)}`} />
                  ))
                  : <div className="w-full rounded-full bg-emerald-500/60" />}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-3">
                {breakdown.map((b) => (
                  <div key={b.key} className={`min-w-0 rounded-xl border border-l-4 border-zinc-200/80 ${b.accent} bg-zinc-50/70 px-3 py-2.5 transition-all hover:-translate-y-0.5 dark:border-zinc-800/80 dark:bg-zinc-950/40`}>
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className="select-none truncate text-[9px] font-bold uppercase tracking-wide text-zinc-600 sm:text-[10px] dark:text-zinc-400">{b.label}</span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <div className={`select-none truncate text-lg font-bold tabular-nums sm:text-xl ${b.text}`} title={fmtFull(b.value)}>
                        {fmtShort(b.value)}
                      </div>
                      <span className={`select-none shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-bold tabular-nums ${b.pill}`}>
                        {breakdownTotal > 0 ? `${((b.value / breakdownTotal) * 100).toFixed(0)}%` : '0%'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─────────────── 5. AUDIT TABLE ─────────────── */}
        {hasBatch && (
          <section className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/80">

            {portfolio.totalLeak > 0 && (
              <div className="border-b border-zinc-200 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent px-3 py-3 sm:px-5 sm:py-3.5 dark:border-zinc-800/80">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="select-none whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
                    Recovery Tracker
                  </span>
                  <span className="select-none whitespace-nowrap rounded-full border border-emerald-500/30 bg-emerald-100 px-2 py-0.5 text-[10px] font-bold tabular-nums text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                    {fmtFull(claimedAmount)} claimed
                  </span>
                  <span className="select-none whitespace-nowrap text-[10px] text-zinc-500 dark:text-zinc-500">
                    of {fmtFull(portfolio.totalLeak)} recoverable · {claimedCount} orders
                  </span>
                  <div className="ml-auto flex min-w-[120px] flex-1 items-center gap-2 sm:max-w-[260px]">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 shadow-inner dark:bg-zinc-800">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.6)] transition-all duration-500 ${claimedPct > 0 && claimedPct < 100 ? 'animate-pulse' : ''}`}
                        style={{ width: `${Math.min(claimedPct, 100)}%` }}
                      />
                    </div>
                    <span className="select-none whitespace-nowrap text-[10px] font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {claimedPct.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-1.5 border-b border-zinc-200 p-3 sm:p-4 dark:border-zinc-800/80">
              {filterTabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setFilter(t.key)}
                  className={[
                    'select-none whitespace-nowrap rounded-lg px-2.5 py-1 text-[9px] transition-all sm:px-3 sm:py-1.5 sm:text-[11px]',
                    filter === t.key
                      ? 'bg-emerald-500 font-semibold text-white shadow-sm shadow-emerald-500/25'
                      : 'bg-zinc-100 font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800/70 dark:text-zinc-300 dark:hover:bg-zinc-800',
                  ].join(' ')}
                >
                  {t.label}
                  <span className={`ml-1 tabular-nums ${filter === t.key ? 'text-white/75' : 'text-zinc-400'}`}>{t.count}</span>
                </button>
              ))}

              <button
                type="button"
                onClick={() => setClaimTarget({ mode: 'bulk' })}
                disabled={portfolio.actionableCount === 0}
                className="ml-auto flex select-none items-center gap-1.5 whitespace-nowrap rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 px-4 py-2 text-[10px] font-semibold text-white shadow-md shadow-rose-500/20 transition-all hover:scale-[1.01] hover:from-rose-600 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 sm:text-[11px]"
              >
                <ClipboardList className="h-3.5 w-3.5 shrink-0" />
                Generate Bulk Dispute Packet
              </button>
            </div>

            <div className="flex flex-col gap-2 border-b border-zinc-200 p-3 sm:flex-row sm:items-center sm:p-4 dark:border-zinc-800/80">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Order ID or SKU..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pl-8 pr-2.5 text-[11px] text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600"
                />
              </div>

              <div className="relative flex items-center gap-1.5">
                <ArrowUpDown className="pointer-events-none absolute left-2.5 h-3 w-3 text-zinc-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  className="w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 py-2 pl-7 pr-7 text-[11px] font-semibold text-zinc-700 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:w-auto dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                >
                  <option value="leak">Sort by: Highest Leak (₹)</option>
                  <option value="value">Sort by: Order Value (High → Low)</option>
                  <option value="weight">Sort by: Weight Discrepancy (g)</option>
                  <option value="orderId">Sort by: Order ID</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 h-3 w-3 text-zinc-400" />
              </div>

              <button
                type="button"
                onClick={exportAuditCsv}
                className="flex select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[10px] font-bold text-zinc-700 shadow-sm transition-all hover:border-emerald-400 hover:text-emerald-700 sm:text-[11px] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-emerald-500/50 dark:hover:text-emerald-300"
              >
                <Download className="h-3.5 w-3.5 shrink-0" /> Export Audit CSV
              </button>
            </div>

            {/* Mobile cards (< md) */}
            <div className="space-y-2.5 p-3 md:hidden">
              {displayed.map((r) => {
                const isOpen = expandedUid === r.uid;
                const filed = claimedUids.has(r.uid);
                return (
                  <div
                    key={r.uid}
                    className={[
                      'overflow-hidden rounded-2xl border border-l-2 bg-white shadow-sm dark:bg-zinc-900/60',
                      r.leak > 0 && !r.matched
                        ? 'border-zinc-200 border-l-rose-500/70 dark:border-zinc-800 dark:border-l-rose-500/70'
                        : 'border-zinc-200 border-l-transparent dark:border-zinc-800 dark:border-l-transparent',
                    ].join(' ')}
                  >
                    <button
                      type="button"
                      onClick={() => toggleExpanded(r.uid)}
                      className="w-full px-3 py-2.5 text-left"
                    >
                      <div className="flex items-start gap-1.5">
                        <div className="min-w-0 flex-1">
                          <div className="truncate select-none text-[11px] font-bold text-zinc-900 dark:text-zinc-100">{r.orderId}</div>
                          <div className="truncate select-none text-[9px] text-zinc-500 dark:text-zinc-500">{r.sku}</div>
                        </div>
                        <StatusChip status={r.status} />
                        <ChevronRight className={`mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                      </div>

                      {!r.matched && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {r.flags.map((f) => <Badge key={f} flag={f} />)}
                        </div>
                      )}
                      {r.matched && (
                        <span className="mt-1.5 inline-flex select-none items-center gap-1 rounded-md border border-emerald-300 bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300">
                          ✅ Matched
                        </span>
                      )}

                      <div className="mt-2 grid grid-cols-2 gap-1.5">
                        <div className="min-w-0 rounded-lg bg-zinc-50 px-2 py-1.5 dark:bg-zinc-950/60">
                          <div className="select-none text-[8px] font-semibold uppercase tracking-wide text-zinc-500">Weight (g)</div>
                          <div className="mt-0.5 select-none truncate text-[10px] font-bold">
                            <WeightPill declared={r.declaredWeightG} billed={r.billedWeightG} />
                          </div>
                        </div>
                        <div className="min-w-0 rounded-lg bg-zinc-50 px-2 py-1.5 dark:bg-zinc-950/60">
                          <div className="select-none text-[8px] font-semibold uppercase tracking-wide text-zinc-500">Exp → Settled</div>
                          <div className="mt-0.5 select-none truncate text-[10px] font-bold tabular-nums text-zinc-700 dark:text-zinc-300">
                            {fmtFull(r.expectedSettlement)}
                            <span className="mx-0.5 text-zinc-400">→</span>
                            {fmtFull(r.bankUtrSettled)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="select-none text-[9px] font-semibold uppercase tracking-wide text-zinc-500">Leak</span>
                        <span className={[
                          'select-none text-[13px] font-extrabold tabular-nums',
                          r.matched ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
                        ].join(' ')}>
                          {r.matched ? '✓ Clean' : fmtFull(r.leak)}
                        </span>
                      </div>
                    </button>

                    {isOpen && <RowBreakdown row={r} />}

                    {r.actionable && (
                      <div className="border-t border-zinc-200 p-2 dark:border-zinc-800">
                        {filed ? (
                          <div className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 py-1.5 text-[10px] font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                            <BadgeCheck className="h-3.5 w-3.5" /> Claim Filed
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setClaimTarget({ mode: 'single', row: r })}
                            className="w-full select-none rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-2 text-[10px] font-bold text-zinc-950 shadow-sm shadow-emerald-500/20 transition-all hover:from-emerald-400 hover:to-teal-400"
                          >
                            ⚡ Draft Claim
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {displayed.length === 0 && (
                <div className="py-8 text-center">
                  <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-500" />
                  <p className="mt-2 select-none text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">No orders match this view.</p>
                </div>
              )}
            </div>

            {/* Desktop / tablet table (≥ md) */}
            <div className="hidden w-full min-w-0 md:block">
              <table className="w-full min-w-0 border-collapse text-left">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/90 dark:border-zinc-800/80 dark:bg-zinc-950/50">
                    {[
                      { label: 'Order ID / SKU', cls: '' },
                      { label: 'Status', cls: 'hidden lg:table-cell' },
                      { label: 'Weight (Declared vs Billed)', cls: 'hidden lg:table-cell' },
                      { label: 'Expected vs Settled', cls: '' },
                      { label: 'Leak', cls: '' },
                      { label: 'Discrepancy', cls: '' },
                      { label: 'Action', cls: 'text-right' },
                    ].map((h) => (
                      <th key={h.label} className={`select-none whitespace-nowrap px-2 py-2.5 text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-500 sm:px-3 dark:text-zinc-500 ${h.cls}`}>
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((r) => {
                    const isOpen = expandedUid === r.uid;
                    const filed = claimedUids.has(r.uid);
                    const hasLeak = r.leak > 0 && !r.matched;
                    return (
                      <Fragment key={r.uid}>
                        <tr
                          onClick={() => toggleExpanded(r.uid)}
                          className="cursor-pointer border-b border-zinc-100 transition-colors last:border-0 hover:bg-zinc-50/80 dark:border-zinc-800/60 dark:hover:bg-zinc-800/40"
                        >
                          <td className={`max-w-[160px] border-l-2 px-2 py-2.5 sm:px-3 ${hasLeak ? 'border-l-rose-500/70' : 'border-l-transparent'}`}>
                            <div className="flex items-center gap-1">
                              <ChevronRight className={`h-3 w-3 shrink-0 text-zinc-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                              <div className="min-w-0">
                                <div className="truncate select-none text-[11px] font-semibold text-zinc-900 dark:text-zinc-100">{r.orderId}</div>
                                <div className="truncate select-none text-[10px] text-zinc-500 dark:text-zinc-500">{r.sku}</div>
                              </div>
                            </div>
                          </td>

                          <td className="hidden whitespace-nowrap px-2 py-2.5 lg:table-cell sm:px-3">
                            <StatusChip status={r.status} />
                          </td>

                          <td className="hidden whitespace-nowrap px-2 py-2.5 text-[10px] lg:table-cell sm:px-3">
                            <WeightPill declared={r.declaredWeightG} billed={r.billedWeightG} />
                          </td>

                          <td className="whitespace-nowrap px-2 py-2.5 text-[10px] tabular-nums sm:px-3">
                            <div className="select-none font-bold tabular-nums text-zinc-900 dark:text-zinc-100" title={fmtFull(r.expectedSettlement)}>{fmtFull(r.expectedSettlement)}</div>
                            <div className="select-none font-bold tabular-nums text-zinc-500 dark:text-zinc-500" title={fmtFull(r.bankUtrSettled)}>{fmtFull(r.bankUtrSettled)}</div>
                          </td>

                          <td className="whitespace-nowrap px-2 py-2.5 text-[11px] font-bold tabular-nums sm:px-3">
                            <span
                              className={r.matched ? 'font-bold tabular-nums text-emerald-600 dark:text-emerald-400' : r.leak > 0 ? 'font-bold tabular-nums text-rose-600 dark:text-rose-400' : 'font-bold tabular-nums text-amber-600 dark:text-amber-400'}
                              title={fmtFull(r.leak)}
                            >
                              {r.matched ? '✓ Clean' : fmtFull(r.leak)}
                            </span>
                          </td>

                          <td className="px-2 py-2.5 sm:px-3">
                            <div className="flex flex-wrap gap-1">
                              {r.matched ? (
                                <span className="select-none whitespace-nowrap rounded-md border border-emerald-300 bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300">
                                  ✅ Matched
                                </span>
                              ) : r.flags.map((f) => <Badge key={f} flag={f} />)}
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-2 py-2.5 text-right sm:px-3">
                            {r.actionable ? (
                              filed ? (
                                <span className="inline-flex select-none items-center gap-1 rounded-xl border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                                  <BadgeCheck className="h-3 w-3" /> Filed
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setClaimTarget({ mode: 'single', row: r }); }}
                                  className="select-none whitespace-nowrap rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3.5 py-1.5 text-[10px] font-bold text-zinc-950 shadow-sm shadow-emerald-500/20 transition-all hover:scale-[1.02] hover:from-emerald-400 hover:to-teal-400"
                                >
                                  ⚡ Draft Claim
                                </button>
                              )
                            ) : (
                              <span className="select-none text-[10px] text-zinc-400 dark:text-zinc-600">No action</span>
                            )}
                          </td>
                        </tr>

                        {isOpen && (
                          <tr className="border-b border-zinc-100 dark:border-zinc-800/60">
                            <td colSpan={7} className="p-0">
                              <RowBreakdown row={r} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}

                  {displayed.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-10 text-center">
                        <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-500" />
                        <p className="mt-2 select-none text-xs font-semibold text-zinc-600 dark:text-zinc-400">No orders match this view.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {!hasBatch && (
          <p className="mt-4 select-none text-center text-[10px] text-zinc-400 sm:text-[11px] dark:text-zinc-600">
            Upload a settlement CSV or try a sample audit above to begin reconciliation.
          </p>
        )}
      </div>

      {/* ─────────────── CLAIM MODAL ─────────────── */}
      {claimTarget && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/60 p-2 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setClaimTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-2xl dark:border-zinc-800/80 dark:bg-zinc-900"
          >
            <div className="flex items-start gap-2.5 border-b border-zinc-200 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent p-3 sm:p-4 dark:border-zinc-800/80">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20">
                <Zap className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="select-none truncate text-[12px] font-bold text-zinc-900 sm:text-sm dark:text-zinc-100">
                  {claimTarget.mode === 'bulk'
                    ? `${activeMarket.claim} — Bulk Dispute Packet`
                    : `${activeMarket.claim} — ${claimTarget.row.orderId}`}
                </h3>
                <p className="select-none truncate text-[9px] text-zinc-500 sm:text-[10px] dark:text-zinc-400">
                  {claimTarget.mode === 'bulk'
                    ? `${portfolio.actionableCount} leaked orders · ${fmtFull(portfolio.totalLeak)} recoverable`
                    : `${claimTarget.row.sku} · Refund request ${fmtFull(Math.max(0, claimTarget.row.leak))}`}
                </p>
              </div>
              {isClaimTargetFiled && (
                <span className="hidden shrink-0 items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 sm:inline-flex dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <BadgeCheck className="h-3 w-3" /> Filed
                </span>
              )}
              <button
                type="button"
                onClick={() => setClaimTarget(null)}
                className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
              <pre className="select-text whitespace-pre-wrap break-words rounded-xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-[9px] leading-relaxed text-zinc-800 sm:p-4 sm:text-[11px] dark:border-zinc-800 dark:bg-zinc-950 dark:text-emerald-200/90">
{claimText}
              </pre>

              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 sm:p-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                <p className="select-none text-[9px] font-bold uppercase tracking-wider text-emerald-700 sm:text-[10px] dark:text-emerald-300">
                  Required Evidence Checklist
                </p>
                <ul className="mt-1.5 space-y-0.5">
                  {['Packing slip photo with weight scale', 'Brand box L×W×H dimensions image', 'Tax Invoice copy'].map((item) => (
                    <li key={item} className="flex items-center gap-1.5 select-none text-[9px] text-emerald-800 sm:text-[10px] dark:text-emerald-200">
                      <Check className="h-3 w-3 shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-zinc-200 p-3 sm:p-4 dark:border-zinc-800/80">
              <button
                type="button"
                onClick={copyClaim}
                className="flex flex-1 select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-2.5 text-[10px] font-bold text-white shadow-md shadow-emerald-500/20 transition-all hover:opacity-90 sm:text-[11px]"
              >
                {copied ? <Check className="h-3.5 w-3.5 shrink-0" /> : <Copy className="h-3.5 w-3.5 shrink-0" />}
                {copied ? 'Copied!' : 'Copy Claim Text'}
              </button>

              <button
                type="button"
                onClick={handleMarkFiled}
                className={[
                  'flex flex-1 select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-2.5 text-[10px] font-bold transition-colors sm:text-[11px]',
                  isClaimTargetFiled
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:border-emerald-400 hover:text-emerald-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-emerald-500/50 dark:hover:text-emerald-300',
                ].join(' ')}
              >
                {isClaimTargetFiled
                  ? <><BadgeCheck className="h-3.5 w-3.5 shrink-0" /> Claim Filed — Undo</>
                  : <><Check className="h-3.5 w-3.5 shrink-0" /> Mark as Claim Filed</>}
              </button>

              <button
                type="button"
                onClick={exportLeaksCsv}
                className="flex flex-1 select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-[10px] font-bold text-zinc-700 transition-colors hover:border-emerald-400 hover:text-emerald-700 sm:text-[11px] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-emerald-500/50 dark:hover:text-emerald-300"
              >
                <Download className="h-3.5 w-3.5 shrink-0" />
                Export All Leaked Orders (CSV)
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-4 left-1/2 z-[60] w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2">
          <div className="flex select-none items-center gap-2 rounded-full border border-emerald-300 bg-white px-3.5 py-2 text-[10px] font-semibold text-emerald-700 shadow-lg shadow-emerald-500/10 sm:text-[11px] dark:border-emerald-500/40 dark:bg-zinc-900 dark:text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}