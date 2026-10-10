import { useState, useMemo } from 'react';
import {
  Truck,
  Package,
  IndianRupee,
  Percent,
  TrendingUp,
  Scale,
  Clock,
  MapPin,
  Wallet,
} from 'lucide-react';
import { InputCard, MetricCard, HeroCard, InfoBanner } from './ui';

interface BlinkitState {
  productCost: number;
  sellingPrice: number;
  commissionRate: number;
  deliveryFee: number;
  packagingFee: number;
  returnRate: number;
}

export default function BlinkitCalculator() {
  const [inputs, setInputs] = useState<BlinkitState>({
    productCost: 120,
    sellingPrice: 199,
    commissionRate: 8,
    deliveryFee: 10,
    packagingFee: 5,
    returnRate: 5,
  });

  const updateInput = (key: keyof BlinkitState, raw: string) => {
    const val = raw === '' ? 0 : parseFloat(raw);
    setInputs((prev) => ({ ...prev, [key]: isNaN(val) ? 0 : val }));
  };

  const results = useMemo(() => {
    const { productCost, sellingPrice, commissionRate, deliveryFee, packagingFee, returnRate } =
      inputs;

    const commission = (sellingPrice * commissionRate) / 100;
    const deliveryGst = deliveryFee * 0.18;
    const totalFees = commission + deliveryFee + deliveryGst + packagingFee;
    const margin = sellingPrice - productCost;
    const netProfit = margin - totalFees;
    const marginPercent = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;

    const returnLoss = deliveryFee + deliveryGst + packagingFee;
    const blendedProfit =
      netProfit * ((100 - returnRate) / 100) - returnLoss * (returnRate / 100);

    return { commission, totalFees, margin, netProfit, marginPercent, returnLoss, blendedProfit };
  }, [inputs]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Truck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Blinkit Margin Calculator</h2>
          <p className="text-sm text-slate-500">
            Quick-commerce profit margin with commission, delivery & packaging fees
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InputCard
          label="Product Cost"
          hint="Cost to source the product"
          icon={Package}
          prefix="₹"
          value={inputs.productCost}
          onChange={(v) => updateInput('productCost', v)}
        />
        <InputCard
          label="Selling Price"
          hint="Price shown to the customer on Blinkit"
          icon={IndianRupee}
          prefix="₹"
          value={inputs.sellingPrice}
          onChange={(v) => updateInput('sellingPrice', v)}
        />
        <InputCard
          label="Commission Rate"
          hint="Blinkit platform commission"
          icon={Percent}
          suffix="%"
          value={inputs.commissionRate}
          onChange={(v) => updateInput('commissionRate', v)}
        />
        <InputCard
          label="Delivery Fee"
          hint="Per-order delivery charge"
          icon={MapPin}
          prefix="₹"
          value={inputs.deliveryFee}
          onChange={(v) => updateInput('deliveryFee', v)}
        />
        <InputCard
          label="Packaging Fee"
          hint="Per-order packaging cost"
          icon={Package}
          prefix="₹"
          value={inputs.packagingFee}
          onChange={(v) => updateInput('packagingFee', v)}
        />
        <InputCard
          label="Expected Return Rate"
          hint="Percentage of orders expected to be returned"
          icon={Percent}
          suffix="%"
          value={inputs.returnRate}
          onChange={(v) => updateInput('returnRate', v)}
        />
      </div>

      <InfoBanner>
        Blinkit charges a <span className="font-semibold text-slate-700">commission</span> on the
        selling price, plus <span className="font-semibold text-slate-700">delivery</span> and{' '}
        <span className="font-semibold text-slate-700">packaging fees</span> per order. GST at 18%
        applies on the delivery fee. On returns, delivery (with GST) and packaging fees are lost.
        Quick-commerce typically has lower return rates than e-commerce.
      </InfoBanner>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <MetricCard
          label="Gross Margin"
          value={results.margin}
          subtitle="Selling price minus product cost"
          icon={Wallet}
          variant="positive"
        />
        <MetricCard
          label="Total Platform Fees"
          value={results.totalFees}
          subtitle="Commission + delivery + packaging + GST"
          icon={Clock}
          variant="neutral"
        />
        <MetricCard
          label="Net Profit per Order"
          value={results.netProfit}
          subtitle={`${results.marginPercent.toFixed(2)}% margin`}
          icon={TrendingUp}
          variant={results.netProfit >= 0 ? 'positive' : 'negative'}
        />
      </div>

      <HeroCard
        title="Blended Profit per Order"
        subtitle="Adjusted for expected return rate"
        value={results.blendedProfit}
        badge={`${inputs.returnRate}% return rate`}
        icon={Scale}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">Breakdown</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Net Profit: ₹{results.netProfit.toFixed(2)} | Return Loss: ₹{results.returnLoss.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Margin %</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              {results.marginPercent >= 0
                ? `You earn ${results.marginPercent.toFixed(2)}% on each delivered order.`
                : `You lose ${Math.abs(results.marginPercent).toFixed(2)}% on each delivered order.`}
            </p>
          </div>
        </div>
      </HeroCard>
    </div>
  );
}
