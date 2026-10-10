import { useState, useMemo } from 'react';
import {
  Store,
  Package,
  IndianRupee,
  Truck,
  RotateCcw,
  Percent,
  TrendingUp,
  TrendingDown,
  Scale,
  Receipt,
} from 'lucide-react';
import { InputCard, MetricCard, HeroCard, InfoBanner } from './ui';

interface FlipkartState {
  productCost: number;
  sellingPrice: number;
  commissionRate: number;
  fixedFee: number;
  forwardShipping: number;
  reverseShipping: number;
  returnRate: number;
}

export default function FlipkartCalculator() {
  const [inputs, setInputs] = useState<FlipkartState>({
    productCost: 350,
    sellingPrice: 899,
    commissionRate: 12,
    fixedFee: 15,
    forwardShipping: 45,
    reverseShipping: 30,
    returnRate: 15,
  });

  const updateInput = (key: keyof FlipkartState, raw: string) => {
    const val = raw === '' ? 0 : parseFloat(raw);
    setInputs((prev) => ({ ...prev, [key]: isNaN(val) ? 0 : val }));
  };

  const results = useMemo(() => {
    const {
      productCost,
      sellingPrice,
      commissionRate,
      fixedFee,
      forwardShipping,
      reverseShipping,
      returnRate,
    } = inputs;

    const commission = (sellingPrice * commissionRate) / 100;
    const shippingGst = forwardShipping * 0.18;
    const deliveredProfit =
      sellingPrice - productCost - commission - fixedFee - forwardShipping - shippingGst;

    const returnShippingGst = (forwardShipping + reverseShipping) * 0.18;
    const returnedLoss = forwardShipping + reverseShipping + returnShippingGst + fixedFee;

    const blendedProfit =
      deliveredProfit * ((100 - returnRate) / 100) - returnedLoss * (returnRate / 100);

    return { commission, deliveredProfit, returnedLoss, blendedProfit };
  }, [inputs]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Store className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Flipkart Profit Calculator</h2>
          <p className="text-sm text-slate-500">
            Commission, fixed fee, shipping, GST & return-adjusted blended profit
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
          hint="Price shown to customer on Flipkart"
          icon={IndianRupee}
          prefix="₹"
          value={inputs.sellingPrice}
          onChange={(v) => updateInput('sellingPrice', v)}
        />
        <InputCard
          label="Commission Rate"
          hint="Category-based seller commission"
          icon={Percent}
          suffix="%"
          value={inputs.commissionRate}
          onChange={(v) => updateInput('commissionRate', v)}
        />
        <InputCard
          label="Fixed Fee"
          hint="Flipkart fixed fee per order"
          icon={Receipt}
          prefix="₹"
          value={inputs.fixedFee}
          onChange={(v) => updateInput('fixedFee', v)}
        />
        <InputCard
          label="Forward Shipping Fee"
          hint="Shipping cost to deliver the order"
          icon={Truck}
          prefix="₹"
          value={inputs.forwardShipping}
          onChange={(v) => updateInput('forwardShipping', v)}
        />
        <InputCard
          label="Reverse Shipping Fee"
          hint="Shipping cost on customer returns"
          icon={RotateCcw}
          prefix="₹"
          value={inputs.reverseShipping}
          onChange={(v) => updateInput('reverseShipping', v)}
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
        Flipkart charges a <span className="font-semibold text-slate-700">commission</span> on the
        selling price plus a <span className="font-semibold text-slate-700">fixed fee</span> per
        order. GST at 18% applies on shipping fees. On returns, the fixed fee and shipping costs
        (forward + reverse + GST) are lost. Product cost is assumed recovered.
      </InfoBanner>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <MetricCard
          label="Commission Charged"
          value={results.commission}
          subtitle={`${inputs.commissionRate}% of selling price`}
          icon={Receipt}
          variant="neutral"
        />
        <MetricCard
          label="Profit if Delivered"
          value={results.deliveredProfit}
          subtitle="Per successful delivery"
          icon={TrendingUp}
          variant="positive"
        />
        <MetricCard
          label="Loss if Returned"
          value={results.returnedLoss}
          subtitle="Per returned order"
          icon={TrendingDown}
          variant="negative"
          isLoss
        />
      </div>

      <HeroCard
        title="Blended Net Profit per Order"
        subtitle="Weighted by your expected return rate"
        value={results.blendedProfit}
        badge={`${inputs.returnRate}% return rate`}
        icon={Scale}
      >
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
              {results.blendedProfit >= 0
                ? 'At this return rate, each order earns you profit on average.'
                : 'At this return rate, you lose money on average per order.'}
            </p>
          </div>
        </div>
      </HeroCard>
    </div>
  );
}
