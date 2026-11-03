import { useState, useEffect } from 'react';
import { Truck, Package, Weight, AlertTriangle, CheckCircle2, ArrowRight, Calculator } from 'lucide-react';

type ZoneId = 'local' | 'zonal' | 'national';
type PaymentMode = 'prepaid' | 'cod';

interface CourierRate {
  name: string;
  local: { base: number; addl: number; rto: number; cod: number };
  zonal: { base: number; addl: number; rto: number; cod: number };
  national: { base: number; addl: number; rto: number; cod: number };
}

const COURIER_RATES: CourierRate[] = [
  {
    name: 'Shiprocket',
    local: { base: 35, addl: 28, rto: 45, cod: 15 },
    zonal: { base: 42, addl: 30, rto: 52, cod: 18 },
    national: { base: 48, addl: 32, rto: 58, cod: 20 },
  },
  {
    name: 'Delhivery',
    local: { base: 38, addl: 30, rto: 48, cod: 16 },
    zonal: { base: 45, addl: 32, rto: 55, cod: 19 },
    national: { base: 52, addl: 35, rto: 62, cod: 22 },
  },
  {
    name: 'BlueDart',
    local: { base: 45, addl: 35, rto: 55, cod: 20 },
    zonal: { base: 52, addl: 38, rto: 62, cod: 23 },
    national: { base: 60, addl: 42, rto: 70, cod: 25 },
  },
  {
    name: 'Xpressbees',
    local: { base: 36, addl: 29, rto: 46, cod: 15 },
    zonal: { base: 43, addl: 31, rto: 53, cod: 18 },
    national: { base: 49, addl: 34, rto: 59, cod: 21 },
  },
  {
    name: 'Ecom Express',
    local: { base: 37, addl: 28, rto: 47, cod: 16 },
    zonal: { base: 44, addl: 30, rto: 54, cod: 19 },
    national: { base: 50, addl: 33, rto: 60, cod: 22 },
  },
];

function formatINR(val: number): string {
  return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ShippingRtoCalculator() {
  const [deadWeight, setDeadWeight] = useState<string>('1');
  const [length, setLength] = useState<string>('30');
  const [width, setWidth] = useState<string>('20');
  const [height, setHeight] = useState<string>('10');
  const [zone, setZone] = useState<ZoneId>('national');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('prepaid');
  const [rtoPercent, setRtoPercent] = useState<string>('15');
  const [syncSuccess, setSyncSuccess] = useState(false);

  const deadWeightNum = deadWeight === '' ? 0 : parseFloat(deadWeight) || 0;
  const lengthNum = length === '' ? 0 : parseFloat(length) || 0;
  const widthNum = width === '' ? 0 : parseFloat(width) || 0;
  const heightNum = height === '' ? 0 : parseFloat(height) || 0;
  const rtoPercentNum = rtoPercent === '' ? 0 : parseFloat(rtoPercent) || 0;

  const volumetricWeight = (lengthNum * widthNum * heightNum) / 5000;
  const billableWeight = Math.max(deadWeightNum, volumetricWeight);
  const isVolumetricTrap = volumetricWeight > deadWeightNum;

  const calculateCourierCost = (courier: CourierRate) => {
    const zoneRates = courier[zone];
    const additionalWeight = Math.max(0, Math.ceil(billableWeight) - 0.5);
    const forwardCharge = zoneRates.base + (additionalWeight * zoneRates.addl);
    const rtoCharge = zoneRates.rto + (additionalWeight * zoneRates.addl);
    const codCharge = paymentMode === 'cod' ? zoneRates.cod : 0;
    const rtoLoss = (forwardCharge + rtoCharge) * (rtoPercentNum / 100);
    const effectiveCost = forwardCharge + codCharge + rtoLoss;

    return {
      forward: forwardCharge,
      rto: rtoCharge,
      cod: codCharge,
      rtoLoss,
      effective: effectiveCost,
    };
  };

  const courierCosts = COURIER_RATES.map(courier => ({
    ...courier,
    costs: calculateCourierCost(courier),
  }));

  const handleSyncToCalculator = () => {
    const cheapest = courierCosts.reduce((min, curr) =>
      curr.costs.effective < min.costs.effective ? curr : min
    );

    const savedState = localStorage.getItem('sellermath_universal_calc');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        parsed.directShippingFee = cheapest.costs.forward;
        localStorage.setItem('sellermath_universal_calc', JSON.stringify(parsed));
        setSyncSuccess(true);
        setTimeout(() => setSyncSuccess(false), 3000);
      } catch (e) {
        console.error('Failed to sync shipping fee', e);
      }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Shipping & RTO Calculator
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Compare courier rates, calculate volumetric weight, and estimate blended shipping costs
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-500" />
              Package Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Dead Weight (kg)
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={deadWeight}
                  onChange={(e) => setDeadWeight(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="e.g., 1.5"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Length (cm)
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="w-full px-2 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    placeholder="30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Width (cm)
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    className="w-full px-2 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    placeholder="20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full px-2 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    placeholder="10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Delivery Zone
                </label>
                <select
                  value={zone}
                  onChange={(e) => setZone(e.target.value as ZoneId)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                >
                  <option value="local">Local (Same City)</option>
                  <option value="zonal">Zonal (Nearby States)</option>
                  <option value="national">National (Pan India)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Payment Mode
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPaymentMode('prepaid')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      paymentMode === 'prepaid'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    Prepaid
                  </button>
                  <button
                    onClick={() => setPaymentMode('cod')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      paymentMode === 'cod'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    COD
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Expected RTO %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={rtoPercent}
                  onChange={(e) => setRtoPercent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="e.g., 15"
                />
              </div>
            </div>
          </div>

          {/* Volumetric Weight Card */}
          <div className={`rounded-2xl border-2 p-6 ${
            isVolumetricTrap
              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700'
              : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
          }`}>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Weight className="w-5 h-5" />
              Volumetric Weight
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-3 border border-slate-200 dark:border-zinc-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Dead Weight</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {deadWeight === '' ? '-' : deadWeightNum.toFixed(2)} kg
                </p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-3 border border-slate-200 dark:border-zinc-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Volumetric</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {length === '' || width === '' || height === '' ? '-' : volumetricWeight.toFixed(2)} kg
                </p>
              </div>
            </div>

            <div className={`rounded-lg p-3 border-2 ${
              isVolumetricTrap
                ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-400 dark:border-amber-600'
                : 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-400 dark:border-emerald-600'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold mb-1">Billable Weight</p>
                  <p className="text-xl font-bold">
                    {billableWeight.toFixed(2)} kg
                  </p>
                </div>
                {isVolumetricTrap ? (
                  <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                ) : (
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
              {isVolumetricTrap && (
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                  ⚠️ Volumetric weight exceeds dead weight! Optimize packaging to reduce costs.
                </p>
              )}
            </div>
          </div>

          {/* Sync Button */}
          <button
            onClick={handleSyncToCalculator}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-semibold transition-all shadow-lg"
          >
            <Calculator className="w-5 h-5" />
            Apply This Shipping Fee to Profit Calculator
          </button>

          {syncSuccess && (
            <div className="fixed bottom-6 right-6 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-bounce">
              <CheckCircle2 className="w-5 h-5" />
              <div>
                <p className="font-semibold">Shipping Fee Synced!</p>
                <p className="text-sm opacity-90">Switch to Profit Calculator to apply</p>
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-500" />
              Multi-Courier Rate & RTO Loss Matrix
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Courier</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Forward Fee</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">RTO Fee</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">COD Fee</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">RTO Loss</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Effective Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {courierCosts.map((courier, idx) => {
                    const isCheapest = courier.costs.effective === Math.min(...courierCosts.map(c => c.costs.effective));
                    return (
                      <tr
                        key={idx}
                        className={`border-b border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors ${
                          isCheapest ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">{courier.name}</span>
                            {isCheapest && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                                BEST
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 text-gray-900 dark:text-white font-medium">
                          {formatINR(courier.costs.forward)}
                        </td>
                        <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">
                          {formatINR(courier.costs.rto)}
                        </td>
                        <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">
                          {formatINR(courier.costs.cod)}
                        </td>
                        <td className="text-right py-3 px-4 text-red-600 dark:text-red-400 font-medium">
                          {formatINR(courier.costs.rtoLoss)}
                        </td>
                        <td className="text-right py-3 px-4">
                          <span className={`font-bold ${isCheapest ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                            {formatINR(courier.costs.effective)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-200 dark:border-zinc-700">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p className="font-semibold mb-1">Important Notes:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Rates are indicative estimates based on typical e-commerce partnerships</li>
                    <li>Actual rates may vary based on your account volume, pickup location, and negotiated terms</li>
                    <li>RTO Loss is calculated as: (Forward + RTO) × RTO%</li>
                    <li>Effective Cost includes Forward Fee + COD Fee + Expected RTO Loss per delivered order</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
