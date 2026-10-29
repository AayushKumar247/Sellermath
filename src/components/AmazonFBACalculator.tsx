import { useState } from 'react';
import { useRemoteCalc } from '@/lib/calculateApi';
import {
  ShoppingBag,
  Package,
  IndianRupee,
  Percent,
  Receipt,
  Boxes,
  Warehouse,
  TrendingUp,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { InputCard, MetricCard, InfoBanner } from './ui';

interface AmazonFBAState {
  sellingPrice: number;
  productCost: number;
  referralFee: number;
  closingFee: number;
  pickPackFee: number;
  storageFee: number;
}

function formatCurrency(val: number): string {
  const sign = val < 0 ? '-' : '';
  return `${sign}₹${Math.abs(val).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function AmazonFBACalculator() {
  const [inputs, setInputs] = useState<AmazonFBAState>({
    sellingPrice: 999,
    productCost: 400,
    referralFee: 10,
    closingFee: 15,
    pickPackFee: 45,
    storageFee: 10,
  });

  const updateInput = (key: keyof AmazonFBAState, raw: string) => {
    const val = raw === '' ? 0 : parseFloat(raw);
    setInputs((prev) => ({ ...prev, [key]: isNaN(val) ? 0 : val }));
  };

  const { result: results, error } = useRemoteCalc(
    '/api/calculate/amazon-fba',
    { ...inputs },
    {
      referralAmount: 0,
      totalAmazonFees: 0,
      gstOnFees: 0,
      netProfit: 0,
      breakEvenPrice: 0,
      currentPriceVsBreakEven: 0,
    },
  );

  const isAboveBreakEven = results.currentPriceVsBreakEven >= 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
          <ShoppingBag className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Amazon FBA Calculator</h2>
          <p className="text-sm text-slate-500">
            Referral fees, closing fees, FBA pick & pack, storage & GST — full profit breakdown
          </p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
          {error} Start the API with `npm run server`.
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InputCard
          label="Selling Price"
          hint="Price shown to the customer on Amazon"
          icon={IndianRupee}
          prefix="₹"
          value={inputs.sellingPrice}
          onChange={(v) => updateInput('sellingPrice', v)}
        />
        <InputCard
          label="Product Cost"
          hint="Cost to source the product"
          icon={Package}
          prefix="₹"
          value={inputs.productCost}
          onChange={(v) => updateInput('productCost', v)}
        />
        <InputCard
          label="Amazon Referral Fee"
          hint="Category-based referral commission"
          icon={Percent}
          suffix="%"
          value={inputs.referralFee}
          onChange={(v) => updateInput('referralFee', v)}
        />
        <InputCard
          label="Fixed Closing Fee"
          hint="Per-order fixed closing fee"
          icon={Receipt}
          prefix="₹"
          value={inputs.closingFee}
          onChange={(v) => updateInput('closingFee', v)}
        />
        <InputCard
          label="FBA Pick & Pack Fee"
          hint="Weight-based pick & pack charge"
          icon={Boxes}
          prefix="₹"
          value={inputs.pickPackFee}
          onChange={(v) => updateInput('pickPackFee', v)}
        />
        <InputCard
          label="Monthly FBA Storage Fee"
          hint="Per-unit monthly storage cost"
          icon={Warehouse}
          prefix="₹"
          value={inputs.storageFee}
          onChange={(v) => updateInput('storageFee', v)}
        />
      </div>

      <InfoBanner>
        Amazon charges a <span className="font-semibold text-slate-700">referral fee</span> (% of
        selling price), a <span className="font-semibold text-slate-700">fixed closing fee</span>,
        FBA <span className="font-semibold text-slate-700">pick & pack</span> and{' '}
        <span className="font-semibold text-slate-700">storage fees</span>. GST at 18% applies on
        total Amazon fees. Break-even price is the minimum selling price to avoid losses.
      </InfoBanner>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <MetricCard
          label="Referral Fee Amount"
          value={results.referralAmount}
          subtitle={`${inputs.referralFee}% of selling price`}
          icon={Receipt}
          variant="neutral"
        />
        <MetricCard
          label="Total Amazon Fees"
          value={results.totalAmazonFees}
          subtitle="Referral + closing + FBA + storage"
          icon={ShoppingBag}
          variant="neutral"
        />
        <MetricCard
          label="GST on Amazon Fees"
          value={results.gstOnFees}
          subtitle="18% of total Amazon fees"
          icon={Percent}
          variant="neutral"
        />
      </div>

      <div className="grid grid-cols-1 gap-5">
        <div
          className={`relative overflow-hidden rounded-2xl p-6 border-2 transition-all duration-300 ${
            results.netProfit >= 0
              ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200'
              : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                  results.netProfit >= 0 ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              >
                <TrendingUp className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-semibold text-slate-600">
                Net Profit if Sold via FBA
              </span>
            </div>
          </div>
          <p
            className={`text-4xl font-bold tracking-tight ${
              results.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {formatCurrency(results.netProfit)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Selling Price − Product Cost − Amazon Fees − GST
          </p>
        </div>
      </div>

      <BreakEvenCard
        breakEvenPrice={results.breakEvenPrice}
        currentPrice={inputs.sellingPrice}
        isAboveBreakEven={isAboveBreakEven}
        difference={results.currentPriceVsBreakEven}
      />
    </div>
  );
}

interface BreakEvenCardProps {
  breakEvenPrice: number;
  currentPrice: number;
  isAboveBreakEven: boolean;
  difference: number;
}

function BreakEvenCard({
  breakEvenPrice,
  currentPrice,
  isAboveBreakEven,
  difference,
}: BreakEvenCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-8 border-2 transition-all duration-300 ${
        isAboveBreakEven
          ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700'
          : 'bg-gradient-to-br from-amber-950 to-slate-900 border-amber-800'
      }`}
    >
      <div
        className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 ${
          isAboveBreakEven ? 'bg-emerald-500' : 'bg-amber-500'
        }`}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-xl ${
                isAboveBreakEven ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            >
              <ShieldAlert className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Break-Even Selling Price</h3>
              <p className="text-sm text-slate-400">
                The minimum price you must charge to avoid losing money
              </p>
            </div>
          </div>
          <div
            className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg border ${
              isAboveBreakEven
                ? 'bg-slate-800/80 border-slate-700'
                : 'bg-amber-900/40 border-amber-800'
            }`}
          >
            <Info className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-bold text-slate-200">Safety Threshold</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div>
            <p className="text-xs text-slate-500 mb-1 font-medium">Minimum Price to Break Even</p>
            <p
              className={`text-5xl font-bold tracking-tight ${
                isAboveBreakEven ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {formatCurrency(breakEvenPrice)}
            </p>
          </div>
          <div className="sm:ml-auto">
            <p className="text-xs text-slate-500 mb-1 font-medium">Your Current Price</p>
            <p className="text-2xl font-bold text-slate-300">
              {formatCurrency(currentPrice)}
            </p>
          </div>
        </div>

        <div
          className={`mt-6 pt-6 border-t ${
            isAboveBreakEven ? 'border-slate-700/50' : 'border-amber-800/50'
          }`}
        >
          <div
            className={`flex items-center gap-3 p-4 rounded-xl ${
              isAboveBreakEven
                ? 'bg-emerald-500/10 text-emerald-300'
                : 'bg-amber-500/10 text-amber-300'
            }`}
          >
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold">
                {isAboveBreakEven
                  ? `You're safe — selling ₹${Math.abs(difference).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} above break-even`
                  : `WARNING — selling ₹${Math.abs(difference).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BELOW break-even!`}
              </p>
              <p className="text-xs mt-0.5 opacity-80">
                {isAboveBreakEven
                  ? 'Your current price covers all costs. Maintain this or higher to stay profitable.'
                  : 'You are losing money on every sale. Increase your selling price or reduce costs immediately.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Formula</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Product Cost + Total Amazon Fees + GST on Fees
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">What This Means</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                If you sell below this price, you lose money regardless of volume.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
