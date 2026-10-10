import { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Package,
  IndianRupee,
  Truck,
  RotateCcw,
  Percent,
  Info,
  Calculator,
} from 'lucide-react';

function formatCurrency(val: number): string {
  const sign = val < 0 ? '-' : '';
  return `${sign}₹${Math.abs(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface InputField {
  key: string;
  label: string;
  value: number;
  icon: React.ElementType;
  prefix: string;
  suffix: string;
  placeholder: string;
  hint: string;
}

export default function MeeshoCalculator() {
  const [inputs, setInputs] = useState<Record<string, number>>({
    productCost: 300,
    sellingPrice: 599,
    forwardShipping: 35,
    reverseShipping: 25,
    returnRate: 18,
  });

  const updateInput = (key: string, raw: string) => {
    if (raw === '') {
      setInputs((prev) => ({ ...prev, [key]: 0 }));
      return;
    }
    const val = parseFloat(raw);
    setInputs((prev) => ({ ...prev, [key]: isNaN(val) ? 0 : val }));
  };

  const results = useMemo(() => {
    const { productCost, sellingPrice, forwardShipping, reverseShipping, returnRate } = inputs;

    const deliveredProfit =
      sellingPrice - productCost - forwardShipping - forwardShipping * 0.18;

    const returnedLoss = (forwardShipping + reverseShipping) * 1.18;

    const blendedProfit =
      deliveredProfit * ((100 - returnRate) / 100) - returnedLoss * (returnRate / 100);

    return { deliveredProfit, returnedLoss, blendedProfit };
  }, [inputs]);

  const inputFields: InputField[] = [
    {
      key: 'productCost',
      label: 'Product Cost',
      value: inputs.productCost,
      icon: Package,
      prefix: '₹',
      suffix: '',
      placeholder: '0',
      hint: 'What you paid to source the product',
    },
    {
      key: 'sellingPrice',
      label: 'Selling Price',
      value: inputs.sellingPrice,
      icon: IndianRupee,
      prefix: '₹',
      suffix: '',
      placeholder: '0',
      hint: 'Price shown to the customer on Meesho',
    },
    {
      key: 'forwardShipping',
      label: 'Forward Shipping Fee',
      value: inputs.forwardShipping,
      icon: Truck,
      prefix: '₹',
      suffix: '',
      placeholder: '0',
      hint: 'Shipping cost to deliver the order',
    },
    {
      key: 'reverseShipping',
      label: 'Reverse Shipping Fee',
      value: inputs.reverseShipping,
      icon: RotateCcw,
      prefix: '₹',
      suffix: '',
      placeholder: '0',
      hint: 'Shipping cost when a customer returns',
    },
    {
      key: 'returnRate',
      label: 'Expected Return Rate',
      value: inputs.returnRate,
      icon: Percent,
      prefix: '',
      suffix: '%',
      placeholder: '0',
      hint: 'Percentage of orders you expect to be returned',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Meesho Return Loss Calculator</h2>
            <p className="text-sm text-slate-500">
              Calculate true blended profit after customer returns (0% Meesho commission)
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {inputFields.map((field) => {
          const Icon = field.icon;
          return (
            <div
              key={field.key}
              className="bg-white rounded-2xl border border-slate-200 p-5 transition-all duration-200 hover:shadow-lg hover:border-slate-300"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-slate-600" strokeWidth={2} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 block">
                      {field.label}
                    </label>
                    <p className="text-xs text-slate-400">{field.hint}</p>
                  </div>
                </div>
              </div>
              <div className="relative">
                {field.prefix && (
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-lg pointer-events-none">
                    {field.prefix}
                  </span>
                )}
                <input
                  type="number"
                  inputMode="decimal"
                  value={field.value === 0 ? '' : field.value}
                  onChange={(e) => updateInput(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className={`
                    w-full text-lg font-semibold text-slate-900 bg-slate-50 rounded-xl
                    border-2 border-slate-200 transition-all duration-200
                    focus:outline-none focus:border-emerald-500 focus:bg-white
                    ${field.prefix ? 'pl-9' : 'pl-4'} ${field.suffix ? 'pr-9' : 'pr-4'} py-3
                  `}
                />
                {field.suffix && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-lg pointer-events-none">
                    {field.suffix}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-start gap-2.5 border border-slate-200">
        <Info className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500 leading-relaxed">
          Meesho charges <span className="font-semibold text-slate-700">0% commission</span>.
          GST at 18% is applied on shipping fees. Product cost is assumed recovered on returns,
          so return loss = forward + reverse shipping + GST on both.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <MetricCard
          label="Profit if Delivered"
          value={results.deliveredProfit}
          variant="positive"
          icon={TrendingUp}
          subtitle="Per successful delivery"
        />
        <MetricCard
          label="Loss if Returned"
          value={results.returnedLoss}
          variant="negative"
          icon={TrendingDown}
          subtitle="Per returned order"
          isLoss
        />
      </div>

      <BlendedProfitCard
        value={results.blendedProfit}
        returnRate={inputs.returnRate}
      />
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: number;
  variant: 'positive' | 'negative';
  icon: React.ElementType;
  subtitle: string;
  isLoss?: boolean;
}

function MetricCard({ label, value, variant, icon: Icon, subtitle, isLoss }: MetricCardProps) {
  const isPositive = isLoss ? false : value >= 0;
  const displayValue = isLoss ? value : value;

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl p-6 border-2 transition-all duration-300
        ${
          variant === 'positive'
            ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200'
            : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200'
        }
      `}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              variant === 'positive' ? 'bg-emerald-500' : 'bg-red-500'
            } shadow-lg`}
          >
            <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold text-slate-600">{label}</span>
        </div>
      </div>
      <p
        className={`text-3xl font-bold tracking-tight ${
          isPositive ? 'text-emerald-600' : 'text-red-600'
        }`}
      >
        {formatCurrency(displayValue)}
      </p>
      <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
    </div>
  );
}

interface BlendedProfitCardProps {
  value: number;
  returnRate: number;
}

function BlendedProfitCard({ value, returnRate }: BlendedProfitCardProps) {
  const isProfit = value >= 0;

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl p-8 border-2 transition-all duration-300
        ${
          isProfit
            ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700'
            : 'bg-gradient-to-br from-slate-900 to-red-950 border-red-900'
        }
      `}
    >
      <div
        className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 ${
          isProfit ? 'bg-emerald-500' : 'bg-red-500'
        }`}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-xl ${
                isProfit ? 'bg-emerald-500' : 'bg-red-500'
              }`}
            >
              <Scale className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Blended Net Profit per Order</h3>
              <p className="text-sm text-slate-400">
                Weighted by your expected return rate
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-lg border border-slate-700">
            <Percent className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-bold text-slate-200">
              {returnRate}% return rate
            </span>
          </div>
        </div>

        <div className="flex items-end gap-3">
          <p
            className={`text-5xl sm:text-6xl font-bold tracking-tight ${
              isProfit ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {formatCurrency(value)}
          </p>
          <span
            className={`text-sm font-semibold mb-2 px-3 py-1 rounded-full ${
              isProfit
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-red-500/15 text-red-400'
            }`}
          >
            {isProfit ? 'NET PROFITABLE' : 'NET LOSS'}
          </span>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-700/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Formula</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                (Delivered Profit × delivery%) − (Return Loss × return%)
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Interpretation</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isProfit
                  ? 'At this return rate, each order earns you profit on average.'
                  : 'At this return rate, you lose money on average per order.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
