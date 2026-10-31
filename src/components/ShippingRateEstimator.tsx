import { useState, useEffect } from 'react';
import { X, Package, Truck, Weight, Info, AlertCircle, ExternalLink, CheckCircle2, Settings, Calculator } from 'lucide-react';

type ZoneId = 'local' | 'regional' | 'national';

interface CourierRateCard {
  id: string;
  name: string;
  local: { baseWeight: number; baseCharge: number; additionalWeightCharge: number; rtoCharge: number };
  regional: { baseWeight: number; baseCharge: number; additionalWeightCharge: number; rtoCharge: number };
  national: { baseWeight: number; baseCharge: number; additionalWeightCharge: number; rtoCharge: number };
  volumetricDivisor: number;
  includesGST: boolean;
  roundingRule: 'ceil' | 'round' | 'floor';
}

interface ShippingRateEstimatorProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyShippingFee: (fee: number, courierName: string) => void;
}

const DEFAULT_RATE_CARDS: CourierRateCard[] = [
  {
    id: 'delhivery',
    name: 'Delhivery',
    local: { baseWeight: 0.5, baseCharge: 42, additionalWeightCharge: 28, rtoCharge: 45 },
    regional: { baseWeight: 0.5, baseCharge: 55, additionalWeightCharge: 32, rtoCharge: 58 },
    national: { baseWeight: 0.5, baseCharge: 68, additionalWeightCharge: 38, rtoCharge: 72 },
    volumetricDivisor: 5000,
    includesGST: false,
    roundingRule: 'ceil',
  },
  {
    id: 'bluedart',
    name: 'Blue Dart',
    local: { baseWeight: 0.5, baseCharge: 48, additionalWeightCharge: 35, rtoCharge: 52 },
    regional: { baseWeight: 0.5, baseCharge: 62, additionalWeightCharge: 40, rtoCharge: 68 },
    national: { baseWeight: 0.5, baseCharge: 85, additionalWeightCharge: 48, rtoCharge: 92 },
    volumetricDivisor: 5000,
    includesGST: false,
    roundingRule: 'ceil',
  },
  {
    id: 'xpressbees',
    name: 'Xpressbees',
    local: { baseWeight: 0.5, baseCharge: 40, additionalWeightCharge: 26, rtoCharge: 42 },
    regional: { baseWeight: 0.5, baseCharge: 52, additionalWeightCharge: 30, rtoCharge: 55 },
    national: { baseWeight: 0.5, baseCharge: 65, additionalWeightCharge: 36, rtoCharge: 70 },
    volumetricDivisor: 5000,
    includesGST: false,
    roundingRule: 'ceil',
  },
  {
    id: 'ecomexpress',
    name: 'Ecom Express',
    local: { baseWeight: 0.5, baseCharge: 38, additionalWeightCharge: 25, rtoCharge: 40 },
    regional: { baseWeight: 0.5, baseCharge: 50, additionalWeightCharge: 29, rtoCharge: 53 },
    national: { baseWeight: 0.5, baseCharge: 62, additionalWeightCharge: 34, rtoCharge: 67 },
    volumetricDivisor: 5000,
    includesGST: false,
    roundingRule: 'ceil',
  },
  {
    id: 'shiprocket',
    name: 'Shiprocket Discounted Rates',
    local: { baseWeight: 0.5, baseCharge: 35, additionalWeightCharge: 22, rtoCharge: 38 },
    regional: { baseWeight: 0.5, baseCharge: 45, additionalWeightCharge: 26, rtoCharge: 48 },
    national: { baseWeight: 0.5, baseCharge: 55, additionalWeightCharge: 30, rtoCharge: 58 },
    volumetricDivisor: 5000,
    includesGST: false,
    roundingRule: 'ceil',
  },
];

const RATE_CARDS_STORAGE_KEY = 'sellermath_shipping_rate_cards';

function loadRateCards(): CourierRateCard[] {
  try {
    const raw = localStorage.getItem(RATE_CARDS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return DEFAULT_RATE_CARDS;
}

function saveRateCards(cards: CourierRateCard[]) {
  try {
    localStorage.setItem(RATE_CARDS_STORAGE_KEY, JSON.stringify(cards));
  } catch {
    // ignore
  }
}

function formatINR(val: number): string {
  return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function applyRounding(value: number, rule: 'ceil' | 'round' | 'floor'): number {
  switch (rule) {
    case 'ceil':
      return Math.ceil(value);
    case 'round':
      return Math.round(value);
    case 'floor':
      return Math.floor(value);
  }
}

export default function ShippingRateEstimator({ isOpen, onClose, onApplyShippingFee }: ShippingRateEstimatorProps) {
  const [deadWeight, setDeadWeight] = useState<number>(1);
  const [length, setLength] = useState<number>(30);
  const [width, setWidth] = useState<number>(20);
  const [height, setHeight] = useState<number>(10);
  const [zone, setZone] = useState<ZoneId>('national');
  const [showConfig, setShowConfig] = useState(false);
  const [rateCards, setRateCards] = useState<CourierRateCard[]>(() => loadRateCards());
  const [editingCard, setEditingCard] = useState<CourierRateCard | null>(null);
  const [appliedFee, setAppliedFee] = useState<{ fee: number; courier: string } | null>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const volumetricWeight = (length * width * height) / 5000;
  const billableWeight = Math.max(deadWeight, volumetricWeight);

  const calculateCharge = (card: CourierRateCard, zoneId: ZoneId): { forward: number; rto: number; combined: number; status: string } => {
    if (!card) {
      return { forward: 0, rto: 0, combined: 0, status: 'Rate not configured' };
    }

    const zoneRates = card[zoneId];
    const roundedWeight = applyRounding(billableWeight, card.roundingRule);
    const additionalWeight = Math.max(0, roundedWeight - zoneRates.baseWeight);
    const forwardCharge = zoneRates.baseCharge + (additionalWeight * zoneRates.additionalWeightCharge);
    const rtoCharge = zoneRates.rtoCharge + (additionalWeight * zoneRates.additionalWeightCharge);

    return {
      forward: forwardCharge,
      rto: rtoCharge,
      combined: forwardCharge + rtoCharge,
      status: 'Configured',
    };
  };

  const handleApply = (forwardCharge: number, courierName: string) => {
    onApplyShippingFee(forwardCharge, courierName);
    setAppliedFee({ fee: forwardCharge, courier: courierName });
    setTimeout(() => {
      setAppliedFee(null);
      onClose();
    }, 2000);
  };

  const handleSaveRateCard = (updatedCard: CourierRateCard) => {
    const updatedCards = rateCards.map(card => 
      card.id === updatedCard.id ? updatedCard : card
    );
    setRateCards(updatedCards);
    saveRateCards(updatedCards);
    setEditingCard(null);
  };

  const handleResetRateCards = () => {
    if (confirm('Reset all rate cards to default values? This cannot be undone.')) {
      setRateCards(DEFAULT_RATE_CARDS);
      saveRateCards(DEFAULT_RATE_CARDS);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/60 dark:bg-zinc-900/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div
          className="relative w-full max-w-5xl bg-white dark:bg-[#0c0c0f] rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 my-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Truck className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-50">
                  Courier & Volumetric Shipping Rate Estimator
                </h2>
                <p className="text-sm text-slate-500 dark:text-zinc-400">
                  Compare forward and RTO charges across couriers
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowConfig(!showConfig)}
                className="p-2 rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                title="Manage Rate Cards"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {showConfig ? (
              /* Rate Card Configuration */
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50">Manage Rate Cards</h3>
                  <button
                    onClick={handleResetRateCards}
                    className="text-sm text-red-600 dark:text-red-400 hover:underline"
                  >
                    Reset to Defaults
                  </button>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                      <p className="font-semibold mb-1">Important Notes</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>These are indicative estimates based on your configured rates</li>
                        <li>Actual courier charges may vary based on your account, pickup location, and courier policies</li>
                        <li>Rate cards are stored locally in your browser</li>
                        <li>Do not present these as official courier quotes</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  {rateCards.map((card) => (
                    <div
                      key={card.id}
                      className="bg-slate-50 dark:bg-zinc-900/50 rounded-xl p-4 border border-slate-200 dark:border-zinc-800"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-slate-900 dark:text-zinc-50">{card.name}</h4>
                        <button
                          onClick={() => setEditingCard(card)}
                          className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        {(['local', 'regional', 'national'] as ZoneId[]).map((zoneId) => (
                          <div key={zoneId} className="bg-white dark:bg-zinc-900 rounded-lg p-3 border border-slate-200 dark:border-zinc-700">
                            <p className="font-medium text-slate-700 dark:text-zinc-300 capitalize mb-2">{zoneId}</p>
                            <div className="space-y-1 text-slate-600 dark:text-zinc-400">
                              <p>Base: {card[zoneId].baseWeight}kg @ {formatINR(card[zoneId].baseCharge)}</p>
                              <p>Addl: {formatINR(card[zoneId].additionalWeightCharge)}/kg</p>
                              <p>RTO: {formatINR(card[zoneId].rtoCharge)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Main Estimator UI */
              <div className="space-y-6">
                {/* Shipment Details Form */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Shipment Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                        Dead Weight (kg)
                      </label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={deadWeight}
                        onChange={(e) => setDeadWeight(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-50 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        placeholder="e.g., 1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                        Package Length (cm)
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="0.1"
                        value={length}
                        onChange={(e) => setLength(Math.max(1, parseFloat(e.target.value) || 1))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-50 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        placeholder="e.g., 30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                        Package Width (cm)
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="0.1"
                        value={width}
                        onChange={(e) => setWidth(Math.max(1, parseFloat(e.target.value) || 1))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-50 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        placeholder="e.g., 20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                        Package Height (cm)
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="0.1"
                        value={height}
                        onChange={(e) => setHeight(Math.max(1, parseFloat(e.target.value) || 1))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-50 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        placeholder="e.g., 10"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                        Delivery Zone
                      </label>
                      <select
                        value={zone}
                        onChange={(e) => setZone(e.target.value as ZoneId)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-50 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                      >
                        <option value="local">Local</option>
                        <option value="regional">Regional</option>
                        <option value="national">National</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Weight Calculation Card */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-5 border border-emerald-200 dark:border-emerald-800">
                  <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-3 flex items-center gap-2">
                    <Weight className="w-4 h-4" />
                    Weight Calculation
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Dead Weight</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-zinc-50">{deadWeight.toFixed(2)} kg</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Volumetric Weight</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-zinc-50">{volumetricWeight.toFixed(2)} kg</p>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">({length}×{width}×{height})/5000</p>
                    </div>
                    <div className="bg-emerald-500 dark:bg-emerald-600 rounded-lg p-3 border border-emerald-600 dark:border-emerald-500">
                      <p className="text-xs text-emerald-100 mb-1">Billable Weight</p>
                      <p className="text-lg font-bold text-white">{billableWeight.toFixed(2)} kg</p>
                      <p className="text-[10px] text-emerald-100 mt-1">MAX of above</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>
                      Volumetric divisor of 5000 is used by default. Actual courier rules may vary. 
                      Configure custom rates in Manage Rate Cards.
                    </p>
                  </div>
                </div>

                {/* Courier Comparison */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Compare Forward & RTO Shipping Charges
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-zinc-700">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-zinc-300">Courier</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700 dark:text-zinc-300">Forward Charge</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700 dark:text-zinc-300">RTO Charge</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700 dark:text-zinc-300">Combined Cost</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700 dark:text-zinc-300">Status</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700 dark:text-zinc-300">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rateCards.map((card) => {
                          const charges = calculateCharge(card, zone);
                          return (
                            <tr key={card.id} className="border-b border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                              <td className="py-3 px-4">
                                <p className="font-medium text-slate-900 dark:text-zinc-50">{card.name}</p>
                                <p className="text-xs text-slate-500 dark:text-zinc-400">Zone: {zone}</p>
                              </td>
                              <td className="text-right py-3 px-4">
                                <p className="font-semibold text-slate-900 dark:text-zinc-50">{formatINR(charges.forward)}</p>
                                <p className="text-xs text-slate-500 dark:text-zinc-400">@ {billableWeight.toFixed(2)}kg</p>
                              </td>
                              <td className="text-right py-3 px-4">
                                <p className="font-semibold text-slate-900 dark:text-zinc-50">{formatINR(charges.rto)}</p>
                              </td>
                              <td className="text-right py-3 px-4">
                                <p className="font-bold text-emerald-600 dark:text-emerald-400">{formatINR(charges.combined)}</p>
                              </td>
                              <td className="text-center py-3 px-4">
                                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                                  charges.status === 'Configured'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                    : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
                                }`}>
                                  {charges.status === 'Configured' ? (
                                    <><CheckCircle2 className="w-3 h-3" /> Configured</>
                                  ) : (
                                    <><AlertCircle className="w-3 h-3" /> Not Configured</>
                                  )}
                                </span>
                              </td>
                              <td className="text-center py-3 px-4">
                                {charges.status === 'Configured' && (
                                  <button
                                    onClick={() => handleApply(charges.forward, card.name)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                                  >
                                    <Calculator className="w-3 h-3" />
                                    Apply
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 flex items-start gap-2 text-xs text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-900/50 rounded-lg p-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>
                      <strong>Indicative estimate</strong> — actual courier charges may vary based on your account, pickup location, and courier policies. 
                      Rates exclude GST unless configured otherwise.
                    </p>
                  </div>
                </div>

                {/* External Link */}
                <div className="flex items-center justify-center pt-4 border-t border-slate-200 dark:border-zinc-800">
                  <a
                    href="https://www.shiprocket.in/shipping-rate-calculator/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition-colors"
                  >
                    View Live Rates on Shiprocket
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {/* Success Message */}
                {appliedFee && (
                  <div className="fixed bottom-6 right-6 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-bounce">
                    <CheckCircle2 className="w-5 h-5" />
                    <div>
                      <p className="font-semibold">Shipping Fee Applied</p>
                      <p className="text-sm opacity-90">{formatINR(appliedFee.fee)} from {appliedFee.courier}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rate Card Edit Modal */}
      {editingCard && (
        <>
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-zinc-900/60 backdrop-blur-sm z-[60]" />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="relative w-full max-w-2xl bg-white dark:bg-[#0c0c0f] rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-zinc-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50">Edit Rate Card: {editingCard.name}</h3>
                <button
                  onClick={() => setEditingCard(null)}
                  className="p-2 rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Enter your actual negotiated rates. These are not official courier quotes and should be used for estimation purposes only.
                    </p>
                  </div>
                </div>
                {(['local', 'regional', 'national'] as ZoneId[]).map((zoneId) => (
                  <div key={zoneId} className="space-y-3">
                    <h4 className="font-semibold text-slate-900 dark:text-zinc-50 capitalize">{zoneId} Zone</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Base Weight (kg)</label>
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={editingCard[zoneId].baseWeight}
                          onChange={(e) => {
                            const value = Math.max(0.1, parseFloat(e.target.value) || 0.1);
                            setEditingCard({
                              ...editingCard,
                              [zoneId]: { ...editingCard[zoneId], baseWeight: value }
                            });
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-50 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Base Charge (₹)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editingCard[zoneId].baseCharge}
                          onChange={(e) => {
                            const value = Math.max(0, parseFloat(e.target.value) || 0);
                            setEditingCard({
                              ...editingCard,
                              [zoneId]: { ...editingCard[zoneId], baseCharge: value }
                            });
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-50 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Addl Weight Charge (₹/kg)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editingCard[zoneId].additionalWeightCharge}
                          onChange={(e) => {
                            const value = Math.max(0, parseFloat(e.target.value) || 0);
                            setEditingCard({
                              ...editingCard,
                              [zoneId]: { ...editingCard[zoneId], additionalWeightCharge: value }
                            });
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-50 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">RTO Charge (₹)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editingCard[zoneId].rtoCharge}
                          onChange={(e) => {
                            const value = Math.max(0, parseFloat(e.target.value) || 0);
                            setEditingCard({
                              ...editingCard,
                              [zoneId]: { ...editingCard[zoneId], rtoCharge: value }
                            });
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-50 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Volumetric Divisor</label>
                    <input
                      type="number"
                      min="1000"
                      step="100"
                      value={editingCard.volumetricDivisor}
                      onChange={(e) => {
                        const value = Math.max(1000, parseFloat(e.target.value) || 5000);
                        setEditingCard({ ...editingCard, volumetricDivisor: value });
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-50 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Rounding Rule</label>
                    <select
                      value={editingCard.roundingRule}
                      onChange={(e) => setEditingCard({ ...editingCard, roundingRule: e.target.value as 'ceil' | 'round' | 'floor' })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-50 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    >
                      <option value="ceil">Ceil (Round Up)</option>
                      <option value="round">Round (Nearest)</option>
                      <option value="floor">Floor (Round Down)</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="includesGST"
                    checked={editingCard.includesGST}
                    onChange={(e) => setEditingCard({ ...editingCard, includesGST: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 dark:border-zinc-600 text-emerald-500 focus:ring-emerald-500"
                  />
                  <label htmlFor="includesGST" className="text-sm text-slate-700 dark:text-zinc-300">
                    Rates include GST
                  </label>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-zinc-800">
                  <button
                    onClick={() => setEditingCard(null)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveRateCard(editingCard)}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
