import { useState, useMemo } from 'react';
import {
  FileText,
  Building2,
  User,
  Plus,
  Trash2,
  Printer,
  Eye,
  Pencil,
  IndianRupee,
  Receipt,
} from 'lucide-react';

const INDIAN_STATES: { name: string; code: string }[] = [
  { name: 'Andhra Pradesh', code: '37' },
  { name: 'Arunachal Pradesh', code: '12' },
  { name: 'Assam', code: '18' },
  { name: 'Bihar', code: '10' },
  { name: 'Chhattisgarh', code: '22' },
  { name: 'Goa', code: '30' },
  { name: 'Gujarat', code: '24' },
  { name: 'Haryana', code: '06' },
  { name: 'Himachal Pradesh', code: '02' },
  { name: 'Jharkhand', code: '20' },
  { name: 'Karnataka', code: '29' },
  { name: 'Kerala', code: '32' },
  { name: 'Madhya Pradesh', code: '23' },
  { name: 'Maharashtra', code: '27' },
  { name: 'Manipur', code: '14' },
  { name: 'Meghalaya', code: '17' },
  { name: 'Mizoram', code: '15' },
  { name: 'Nagaland', code: '13' },
  { name: 'Odisha', code: '21' },
  { name: 'Punjab', code: '03' },
  { name: 'Rajasthan', code: '08' },
  { name: 'Sikkim', code: '11' },
  { name: 'Tamil Nadu', code: '33' },
  { name: 'Telangana', code: '36' },
  { name: 'Tripura', code: '16' },
  { name: 'Uttar Pradesh', code: '09' },
  { name: 'Uttarakhand', code: '05' },
  { name: 'West Bengal', code: '19' },
  { name: 'Andaman and Nicobar Islands', code: '35' },
  { name: 'Chandigarh', code: '04' },
  { name: 'Dadra and Nagar Haveli and Daman and Diu', code: '26' },
  { name: 'Delhi', code: '07' },
  { name: 'Jammu and Kashmir', code: '01' },
  { name: 'Ladakh', code: '38' },
  { name: 'Lakshadweep', code: '31' },
  { name: 'Puducherry', code: '34' },
];

const GST_RATES = [0, 5, 12, 18, 28];

interface LineItem {
  id: string;
  description: string;
  hsn: string;
  qty: number;
  unitPrice: number;
  gstRate: number;
}

interface InvoiceData {
  sellerName: string;
  sellerGSTIN: string;
  sellerAddress: string;
  sellerState: string;
  sellerStateCode: string;
  buyerName: string;
  buyerAddress: string;
  buyerGSTIN: string;
  placeOfSupply: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
}

interface CalcResult {
  lineCalcs: Array<LineItem & {
    amount: number;
    taxAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
  }>;
  subtotal: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  totalTax: number;
  grandTotal: number;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function formatINR(val: number): string {
  return val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function GSTInvoiceGenerator() {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');

  const [data, setData] = useState<InvoiceData>({
    sellerName: 'Acme Enterprises',
    sellerGSTIN: '27ABCDE1234F1Z5',
    sellerAddress: '123 Industrial Estate, Mumbai',
    sellerState: 'Maharashtra',
    sellerStateCode: '27',
    buyerName: 'TechCorp Solutions',
    buyerAddress: '456 Business Park, Bengaluru',
    buyerGSTIN: '29XYZAB5678C1Z1',
    placeOfSupply: 'Karnataka',
    invoiceNumber: 'INV-2026-001',
    invoiceDate: todayISO(),
    dueDate: addDaysISO(15),
  });

  const [items, setItems] = useState<LineItem[]>([
    {
      id: uid(),
      description: 'Premium Wireless Headphones',
      hsn: '8518',
      qty: 2,
      unitPrice: 2500,
      gstRate: 18,
    },
    {
      id: uid(),
      description: 'USB-C Charging Cable (1m)',
      hsn: '8544',
      qty: 5,
      unitPrice: 300,
      gstRate: 18,
    },
  ]);

  const updateData = (key: keyof InvoiceData, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const updateSellerState = (stateName: string) => {
    const state = INDIAN_STATES.find((s) => s.name === stateName);
    setData((prev) => ({
      ...prev,
      sellerState: stateName,
      sellerStateCode: state ? state.code : '',
    }));
  };

  const updateItem = (id: string, key: keyof LineItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: uid(), description: '', hsn: '', qty: 1, unitPrice: 0, gstRate: 18 },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const isInterState = data.sellerState !== data.placeOfSupply;

  const calculations = useMemo(() => {
    const lineCalcs = items.map((item) => {
      const amount = item.qty * item.unitPrice;
      const taxAmount = (amount * item.gstRate) / 100;
      const cgst = isInterState ? 0 : taxAmount / 2;
      const sgst = isInterState ? 0 : taxAmount / 2;
      const igst = isInterState ? taxAmount : 0;
      const total = amount + taxAmount;
      return { ...item, amount, taxAmount, cgst, sgst, igst, total };
    });

    const subtotal = lineCalcs.reduce((sum, l) => sum + l.amount, 0);
    const totalCGST = lineCalcs.reduce((sum, l) => sum + l.cgst, 0);
    const totalSGST = lineCalcs.reduce((sum, l) => sum + l.sgst, 0);
    const totalIGST = lineCalcs.reduce((sum, l) => sum + l.igst, 0);
    const totalTax = totalCGST + totalSGST + totalIGST;
    const grandTotal = subtotal + totalTax;

    return { lineCalcs, subtotal, totalCGST, totalSGST, totalIGST, totalTax, grandTotal };
  }, [items, isInterState]);

  const handlePrint = () => {
    setMode('preview');
    setTimeout(() => window.print(), 300);
  };

  return (
    <div className="space-y-6">
      <div className="no-print space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">GST Tax Invoice Generator</h2>
              <p className="text-sm text-slate-500">
                Create compliant Indian GST invoices with CGST/SGST/IGST logic
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode('edit')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                mode === 'edit'
                  ? 'bg-slate-900 text-white shadow-lg'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                mode === 'preview'
                  ? 'bg-slate-900 text-white shadow-lg'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
          </div>
        </div>

        {mode === 'edit' && (
          <EditView
            data={data}
            updateData={updateData}
            updateSellerState={updateSellerState}
            items={items}
            updateItem={updateItem}
            addItem={addItem}
            removeItem={removeItem}
            isInterState={isInterState}
            calcs={calculations}
            onPrint={handlePrint}
            onPreview={() => setMode('preview')}
          />
        )}
      </div>

      {mode === 'preview' && (
        <div className="print-area">
          <div className="no-print mb-4 flex justify-end">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all"
            >
              <Printer className="w-5 h-5" />
              Download / Print Invoice (PDF)
            </button>
          </div>
          <InvoicePreview data={data} calcs={calculations} isInterState={isInterState} />
        </div>
      )}
    </div>
  );
}

interface EditViewProps {
  data: InvoiceData;
  updateData: (key: keyof InvoiceData, value: string) => void;
  updateSellerState: (state: string) => void;
  items: LineItem[];
  updateItem: (id: string, key: keyof LineItem, value: string | number) => void;
  addItem: () => void;
  removeItem: (id: string) => void;
  isInterState: boolean;
  calcs: CalcResult;
  onPrint: () => void;
  onPreview: () => void;
}

function EditView({
  data,
  updateData,
  updateSellerState,
  items,
  updateItem,
  addItem,
  removeItem,
  isInterState,
  calcs,
  onPrint,
  onPreview,
}: EditViewProps) {
  return (
    <div className="space-y-6">
      <SectionCard title="Seller Details" icon={Building2}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            label="Company Name"
            value={data.sellerName}
            onChange={(v) => updateData('sellerName', v)}
            placeholder="Your company name"
          />
          <TextField
            label="GSTIN"
            value={data.sellerGSTIN}
            onChange={(v) => updateData('sellerGSTIN', v)}
            placeholder="27ABCDE1234F1Z5"
          />
          <TextField
            label="Address"
            value={data.sellerAddress}
            onChange={(v) => updateData('sellerAddress', v)}
            placeholder="Full business address"
          />
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="State"
              value={data.sellerState}
              onChange={updateSellerState}
              options={INDIAN_STATES.map((s) => s.name)}
            />
            <TextField
              label="State Code"
              value={data.sellerStateCode}
              onChange={(v) => updateData('sellerStateCode', v)}
              placeholder="27"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Buyer Details" icon={User}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            label="Customer / Business Name"
            value={data.buyerName}
            onChange={(v) => updateData('buyerName', v)}
            placeholder="Buyer name"
          />
          <TextField
            label="Buyer GSTIN (optional for B2C)"
            value={data.buyerGSTIN}
            onChange={(v) => updateData('buyerGSTIN', v)}
            placeholder="Leave blank for B2C"
          />
          <TextField
            label="Shipping Address"
            value={data.buyerAddress}
            onChange={(v) => updateData('buyerAddress', v)}
            placeholder="Delivery address"
          />
          <SelectField
            label="Place of Supply (State)"
            value={data.placeOfSupply}
            onChange={(v) => updateData('placeOfSupply', v)}
            options={INDIAN_STATES.map((s) => s.name)}
          />
        </div>
      </SectionCard>

      <SectionCard title="Invoice Metadata" icon={Receipt}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <TextField
            label="Invoice Number"
            value={data.invoiceNumber}
            onChange={(v) => updateData('invoiceNumber', v)}
            placeholder="INV-001"
          />
          <DateField
            label="Invoice Date"
            value={data.invoiceDate}
            onChange={(v) => updateData('invoiceDate', v)}
          />
          <DateField
            label="Due Date"
            value={data.dueDate}
            onChange={(v) => updateData('dueDate', v)}
          />
        </div>
      </SectionCard>

      <SectionCard title="Line Items" icon={FileText}>
        <div className="space-y-3">
          <div className="hidden md:grid grid-cols-12 gap-2 px-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">
            <div className="col-span-4">Description</div>
            <div className="col-span-2">HSN/SAC</div>
            <div className="col-span-1">Qty</div>
            <div className="col-span-2">Unit Price (₹)</div>
            <div className="col-span-2">GST Rate</div>
            <div className="col-span-1"></div>
          </div>

          {items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-1 md:grid-cols-12 gap-2 md:items-center bg-slate-50 rounded-xl p-3"
            >
              <div className="md:col-span-4">
                <label className="md:hidden text-xs font-semibold text-slate-500 block mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                  placeholder="Product / service name"
                  className="w-full text-sm font-medium text-slate-900 bg-white rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="md:hidden text-xs font-semibold text-slate-500 block mb-1">
                  HSN/SAC
                </label>
                <input
                  type="text"
                  value={item.hsn}
                  onChange={(e) => updateItem(item.id, 'hsn', e.target.value)}
                  placeholder="8518"
                  className="w-full text-sm font-medium text-slate-900 bg-white rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-1">
                <label className="md:hidden text-xs font-semibold text-slate-500 block mb-1">
                  Qty
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={item.qty || ''}
                  onChange={(e) => updateItem(item.id, 'qty', parseFloat(e.target.value) || 0)}
                  placeholder="1"
                  className="w-full text-sm font-medium text-slate-900 bg-white rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="md:hidden text-xs font-semibold text-slate-500 block mb-1">
                  Unit Price (₹)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={item.unitPrice || ''}
                  onChange={(e) =>
                    updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)
                  }
                  placeholder="0.00"
                  className="w-full text-sm font-medium text-slate-900 bg-white rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="md:hidden text-xs font-semibold text-slate-500 block mb-1">
                  GST Rate
                </label>
                <select
                  value={item.gstRate}
                  onChange={(e) => updateItem(item.id, 'gstRate', parseInt(e.target.value))}
                  className="w-full text-sm font-medium text-slate-900 bg-white rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500"
                >
                  {GST_RATES.map((r) => (
                    <option key={r} value={r}>
                      {r}%
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-1 flex md:justify-end">
                <button
                  onClick={() => removeItem(item.id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={addItem}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Line Item
          </button>
        </div>
      </SectionCard>

      <GSTSummary calcs={calcs} isInterState={isInterState} />

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onPreview}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold bg-slate-900 text-white shadow-lg hover:bg-slate-800 transition-all"
        >
          <Eye className="w-5 h-5" />
          Preview Invoice
        </button>
        <button
          onClick={onPrint}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all"
        >
          <Printer className="w-5 h-5" />
          Download / Print (PDF)
        </button>
      </div>
    </div>
  );
}

interface SectionCardProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

function SectionCard({ title, icon: Icon, children }: SectionCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
          <Icon className="w-4 h-4 text-slate-600" strokeWidth={2} />
        </div>
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title}</h3>
      </div>
      {children}
    </div>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

function TextField({ label, value, onChange, placeholder }: TextFieldProps) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 block mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm font-medium text-slate-900 bg-slate-50 rounded-lg border-2 border-slate-200 px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
      />
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}

function SelectField({ label, value, onChange, options }: SelectFieldProps) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 block mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm font-medium text-slate-900 bg-slate-50 rounded-lg border-2 border-slate-200 px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
      >
        <option value="">Select state</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

function DateField({ label, value, onChange }: DateFieldProps) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 block mb-1.5">{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm font-medium text-slate-900 bg-slate-50 rounded-lg border-2 border-slate-200 px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
      />
    </div>
  );
}

interface GSTSummaryProps {
  calcs: CalcResult;
  isInterState: boolean;
}

function GSTSummary({ calcs, isInterState }: GSTSummaryProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
          <IndianRupee className="w-4 h-4 text-blue-600" strokeWidth={2} />
        </div>
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Summary</h3>
      </div>

      <div className={`p-3 rounded-xl mb-4 text-sm font-medium ${isInterState ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
        {isInterState
          ? 'Inter-State Sale: IGST applied (full GST rate as IGST)'
          : 'Intra-State Sale: CGST + SGST applied (GST split equally)'}
      </div>

      <div className="space-y-2.5">
        <SummaryRow label="Subtotal (Taxable Value)" value={`₹${formatINR(calcs.subtotal)}`} />
        {isInterState ? (
          <SummaryRow label="IGST" value={`₹${formatINR(calcs.totalIGST)}`} accent="orange" />
        ) : (
          <>
            <SummaryRow label="CGST" value={`₹${formatINR(calcs.totalCGST)}`} accent="emerald" />
            <SummaryRow label="SGST" value={`₹${formatINR(calcs.totalSGST)}`} accent="emerald" />
          </>
        )}
        <SummaryRow label="Total Tax" value={`₹${formatINR(calcs.totalTax)}`} />
        <div className="border-t-2 border-slate-200 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-slate-900">Grand Total</span>
            <span className="text-2xl font-bold text-blue-600">
              ₹{formatINR(calcs.grandTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SummaryRowProps {
  label: string;
  value: string;
  accent?: 'orange' | 'emerald';
}

function SummaryRow({ label, value, accent }: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-500">{label}</span>
      <span
        className={`text-sm font-bold ${
          accent === 'orange'
            ? 'text-orange-600'
            : accent === 'emerald'
            ? 'text-emerald-600'
            : 'text-slate-700'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

interface InvoicePreviewProps {
  data: InvoiceData;
  calcs: CalcResult;
  isInterState: boolean;
}

function InvoicePreview({ data, calcs, isInterState }: InvoicePreviewProps) {
  return (
    <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-slate-200">
      <div className="p-8 sm:p-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b-2 border-slate-800">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{data.sellerName || 'Your Company'}</h1>
            <p className="text-sm text-slate-600 mt-1">{data.sellerAddress}</p>
            <p className="text-sm text-slate-600">
              GSTIN: <span className="font-semibold">{data.sellerGSTIN || '—'}</span>
            </p>
            <p className="text-sm text-slate-600">
              State: {data.sellerState} ({data.sellerStateCode})
            </p>
          </div>
          <div className="sm:text-right">
            <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-wide">Tax Invoice</h2>
            <div className="mt-2 space-y-0.5">
              <p className="text-sm text-slate-600">
                Invoice No: <span className="font-semibold text-slate-900">{data.invoiceNumber}</span>
              </p>
              <p className="text-sm text-slate-600">
                Date: <span className="font-semibold text-slate-900">{formatDate(data.invoiceDate)}</span>
              </p>
              <p className="text-sm text-slate-600">
                Due: <span className="font-semibold text-slate-900">{formatDate(data.dueDate)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Bill To</p>
            <p className="text-base font-bold text-slate-900">{data.buyerName || 'Buyer Name'}</p>
            <p className="text-sm text-slate-600 mt-1">{data.buyerAddress}</p>
            {data.buyerGSTIN && (
              <p className="text-sm text-slate-600 mt-1">
                GSTIN: <span className="font-semibold">{data.buyerGSTIN}</span>
              </p>
            )}
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Place of Supply</p>
            <p className="text-base font-semibold text-slate-900">{data.placeOfSupply}</p>
            <p className="text-xs text-slate-500 mt-2">
              {isInterState ? 'Inter-State Sale (IGST)' : 'Intra-State Sale (CGST + SGST)'}
            </p>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full mt-6 text-sm">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="text-left px-3 py-2.5 font-semibold">#</th>
              <th className="text-left px-3 py-2.5 font-semibold">Description</th>
              <th className="text-center px-3 py-2.5 font-semibold">HSN/SAC</th>
              <th className="text-center px-3 py-2.5 font-semibold">Qty</th>
              <th className="text-right px-3 py-2.5 font-semibold">Rate</th>
              <th className="text-right px-3 py-2.5 font-semibold">Amount</th>
              {isInterState ? (
                <th className="text-right px-3 py-2.5 font-semibold">IGST</th>
              ) : (
                <>
                  <th className="text-right px-3 py-2.5 font-semibold">CGST</th>
                  <th className="text-right px-3 py-2.5 font-semibold">SGST</th>
                </>
              )}
              <th className="text-right px-3 py-2.5 font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {calcs.lineCalcs.map((line, i) => (
              <tr key={line.id} className="border-b border-slate-200">
                <td className="px-3 py-3 text-slate-500">{i + 1}</td>
                <td className="px-3 py-3 font-medium text-slate-900">
                  {line.description || '—'}
                </td>
                <td className="px-3 py-3 text-center text-slate-600">{line.hsn || '—'}</td>
                <td className="px-3 py-3 text-center text-slate-600">{line.qty}</td>
                <td className="px-3 py-3 text-right text-slate-600">₹{formatINR(line.unitPrice)}</td>
                <td className="px-3 py-3 text-right font-medium text-slate-900">
                  ₹{formatINR(line.amount)}
                </td>
                {isInterState ? (
                  <td className="px-3 py-3 text-right text-slate-600">
                    ₹{formatINR(line.igst)}
                    <span className="block text-xs text-slate-400">@{line.gstRate}%</span>
                  </td>
                ) : (
                  <>
                    <td className="px-3 py-3 text-right text-slate-600">
                      ₹{formatINR(line.cgst)}
                      <span className="block text-xs text-slate-400">@{line.gstRate / 2}%</span>
                    </td>
                    <td className="px-3 py-3 text-right text-slate-600">
                      ₹{formatINR(line.sgst)}
                      <span className="block text-xs text-slate-400">@{line.gstRate / 2}%</span>
                    </td>
                  </>
                )}
                <td className="px-3 py-3 text-right font-bold text-slate-900">
                  ₹{formatINR(line.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mt-6">
          <div className="w-full sm:w-80 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-semibold text-slate-900">₹{formatINR(calcs.subtotal)}</span>
            </div>
            {isInterState ? (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">IGST</span>
                <span className="font-semibold text-orange-600">₹{formatINR(calcs.totalIGST)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">CGST</span>
                  <span className="font-semibold text-emerald-600">₹{formatINR(calcs.totalCGST)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">SGST</span>
                  <span className="font-semibold text-emerald-600">₹{formatINR(calcs.totalSGST)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-sm border-t border-slate-200 pt-2">
              <span className="text-slate-500">Total Tax</span>
              <span className="font-semibold text-slate-900">₹{formatINR(calcs.totalTax)}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-900 text-white px-4 py-3 rounded-lg mt-2">
              <span className="text-sm font-semibold">Grand Total</span>
              <span className="text-xl font-bold">₹{formatINR(calcs.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Amount in words */}
        <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Amount in Words</p>
          <p className="text-sm font-medium text-slate-700">
            {amountInWords(calcs.grandTotal)} Only
          </p>
        </div>

        {/* Bank Details & Terms */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8 pt-6 border-t border-slate-200">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
              Bank Details
            </h4>
            <div className="space-y-1 text-sm text-slate-600">
              <p>Bank: <span className="font-medium text-slate-800">Your Bank Name</span></p>
              <p>A/C: <span className="font-medium text-slate-800">XXXXXXXXXXXX</span></p>
              <p>IFSC: <span className="font-medium text-slate-800">XXXX0000000</span></p>
              <p>Branch: <span className="font-medium text-slate-800">Main Branch</span></p>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
              Terms &amp; Conditions
            </h4>
            <ol className="space-y-1 text-xs text-slate-500 list-decimal list-inside">
              <li>Payment due within 15 days of invoice date.</li>
              <li>Goods once sold are not returnable.</li>
              <li>All disputes are subject to local jurisdiction.</li>
              <li>This is a computer-generated invoice.</li>
            </ol>
          </div>
        </div>

        {/* Signature */}
        <div className="flex justify-end mt-10">
          <div className="text-center">
            <div className="w-48 border-t-2 border-slate-300 pt-2">
              <p className="text-sm font-semibold text-slate-700">Authorised Signatory</p>
              <p className="text-xs text-slate-500">{data.sellerName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function amountInWords(amount: number): string {
  if (amount === 0) return 'Zero Rupees';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
  ];

  function twoDigits(n: number): string {
    if (n < 20) return ones[n];
    return `${tens[Math.floor(n / 10)]} ${ones[n % 10]}`.trim();
  }

  function threeDigits(n: number): string {
    const h = Math.floor(n / 100);
    const r = n % 100;
    let result = '';
    if (h > 0) result += `${ones[h]} Hundred`;
    if (r > 0) result += (h > 0 ? ' ' : '') + twoDigits(r);
    return result;
  }

  function indianWords(n: number): string {
    if (n === 0) return 'Zero';
    const crore = Math.floor(n / 10000000);
    n %= 10000000;
    const lakh = Math.floor(n / 100000);
    n %= 100000;
    const thousand = Math.floor(n / 1000);
    n %= 1000;
    const rest = n;

    const parts: string[] = [];
    if (crore > 0) parts.push(`${twoDigits(crore)} Crore`);
    if (lakh > 0) parts.push(`${twoDigits(lakh)} Lakh`);
    if (thousand > 0) parts.push(`${twoDigits(thousand)} Thousand`);
    if (rest > 0) parts.push(threeDigits(rest));
    return parts.join(' ').trim();
  }

  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let result = `${indianWords(rupees)} Rupees`;
  if (paise > 0) {
    result += ` and ${twoDigits(paise)} Paise`;
  }

  return result;
}
