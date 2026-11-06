import { useState } from 'react';
import { Upload, FileText, Truck, TrendingDown, PieChart, RotateCcw } from 'lucide-react';

export default function ReturnsRTOAnalytics() {
  const [tab, setTab] = useState<'single' | 'bulk'>('single');
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(false);

  const [productCost, setProductCost] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [forwardFee, setForwardFee] = useState('');
  const [reverseFee, setReverseFee] = useState('');

  const cost = parseFloat(productCost) || 0;
  const price = parseFloat(sellingPrice) || 0;
  const forward = parseFloat(forwardFee) || 0;
  const reverse = parseFloat(reverseFee) || 0;

  const totalLoss = cost + forward + reverse;

  const formatINR = (val: number) => `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setUploading(true);
    setResults(false);
    setTimeout(() => {
      setUploading(false);
      setResults(true);
    }, 1000);
  };
  const handleBrowse = () => {
    setUploading(true);
    setResults(false);
    setTimeout(() => {
      setUploading(false);
      setResults(true);
    }, 1000);
  };

  const dummyRows = [
    { id: 'ORD-1024', product: "Men's Cotton T-Shirt (Blue)", reason: 'Size mismatch', status: 'RTO', lost: '₹1,450.00' },
    { id: 'ORD-1031', product: "Women's Kurta (Red)", reason: 'Damaged in transit', status: 'Returned', lost: '₹2,100.00' },
    { id: 'ORD-1045', product: 'Smart Watch (Black)', reason: 'Customer no-show', status: 'RTO', lost: '₹3,200.00' },
  ];

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="dark:bg-zinc-900/60 bg-white/60 backdrop-blur-xl border border-white/30 dark:border-zinc-700/30 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Truck className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
          <h2 className="text-xl font-bold dark:text-zinc-100 text-zinc-900 select-none">Returns &amp; RTO Analytics</h2>
        </div>
        <p className="dark:text-zinc-400 text-zinc-600 text-sm select-none">
          Calculate per-item return loss and analyse bulk return patterns across your orders.
        </p>
      </div>

      {/* Tabs */}
      <div className="dark:bg-zinc-900/60 bg-white/60 backdrop-blur-xl border border-white/30 dark:border-zinc-700/30 rounded-2xl p-1 shadow-sm">
        <div className="flex p-1 bg-zinc-100 dark:bg-zinc-900/80 rounded-xl">
          <button
            onClick={() => setTab('single')}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === 'single'
                ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            } select-none`}
          >
            Single Item Calculator
          </button>
          <button
            onClick={() => setTab('bulk')}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === 'bulk'
                ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            } select-none`}
          >
            Bulk CSV Upload
          </button>
        </div>
      </div>

      {/* ============ TAB 1: Single Item Calculator ============ */}
      {tab === 'single' && (
        <div className="dark:bg-zinc-900/60 bg-white/60 backdrop-blur-xl border border-white/30 dark:border-zinc-700/30 rounded-2xl p-6 shadow-lg">
          <h3 className="text-base font-bold dark:text-zinc-100 text-zinc-900 mb-4 select-none flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            Single Item Calculator
          </h3>
          <form onSubmit={handleSingleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="col-span-1">
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 select-none">
                Product Cost (₹)
              </label>
              <input
                type="number"
                value={productCost}
                onChange={(e) => setProductCost(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500/50 focus:outline-none transition-all"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 select-none">
                Selling Price (₹)
              </label>
              <input
                type="number"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500/50 focus:outline-none transition-all"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 select-none">
                Forward Shipping Fee (₹)
              </label>
              <input
                type="number"
                value={forwardFee}
                onChange={(e) => setForwardFee(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500/50 focus:outline-none transition-all"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 select-none">
                Reverse Shipping Fee (₹)
              </label>
              <input
                type="number"
                value={reverseFee}
                onChange={(e) => setReverseFee(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500/50 focus:outline-none transition-all"
              />
            </div>
          </form>

          <div className="mt-6 p-5 rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-900/10">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5 select-none">
                💸
              </span>
              <div>
                <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm select-none">Total Loss on RTO / Return</h4>
                <p className="text-2xl font-bold dark:text-zinc-100 text-zinc-900 mt-1 select-none">
                  {formatINR(totalLoss)}
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1.5 select-none">
                  = Product Cost {formatINR(cost)} + Forward Shipping {formatINR(forward)} + Reverse Shipping {formatINR(reverse)}
                </p>
              </div>
            </div>
          </div>

          {price > 0 && (
            <div className="mt-4 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400 select-none">Selling Price (foregone)</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{formatINR(price)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-red-600 dark:text-red-400 font-medium select-none">Net Impact on Pocket</span>
                <span className={`font-bold ${totalLoss > price ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                  {formatINR(price - totalLoss)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============ TAB 2: Bulk CSV Upload ============ */}
      {tab === 'bulk' && (
        <div className="space-y-6">
          {!results ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="dark:bg-zinc-900/60 bg-white/60 backdrop-blur-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-10 text-center transition-all hover:border-emerald-500/50 dark:hover:border-emerald-400/50 cursor-pointer"
            >
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                  <Upload className="w-7 h-7" />
                </div>
                <h3 className="font-bold dark:text-zinc-100 text-zinc-900 select-none">Upload Returns CSV</h3>
                <p className="text-sm dark:text-zinc-400 text-zinc-600 select-none">
                  Drag &amp; drop your returns file or click to browse
                </p>
                <button
                  onClick={handleBrowse}
                  className="mt-3 px-5 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 transition-colors select-none focus:outline-none focus:ring-0"
                >
                  Browse Files
                </button>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 select-none">
                  Supports .csv • Simulated 1s processing
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="dark:bg-zinc-900/60 bg-white/60 backdrop-blur-xl border border-white/30 dark:border-zinc-700/30 rounded-xl p-5 shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <PieChart className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                    <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 select-none">Total RTO Rate</h4>
                  </div>
                  <p className="text-2xl font-bold dark:text-zinc-100 text-zinc-900 select-none">12.5%</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 select-none">80 orders processed</p>
                </div>
                <div className="dark:bg-zinc-900/60 bg-white/60 backdrop-blur-xl border border-white/30 dark:border-zinc-700/30 rounded-xl p-5 shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-5 h-5 text-red-500 dark:text-red-400" />
                    <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 select-none">Total Money Lost to Returns</h4>
                  </div>
                  <p className="text-2xl font-bold dark:text-zinc-100 text-zinc-900 select-none">₹6,750.00</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 select-none">Across 3 returned orders</p>
                </div>
                <div className="dark:bg-zinc-900/60 bg-white/60 backdrop-blur-xl border border-white/30 dark:border-zinc-700/30 rounded-xl p-5 shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                    <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 select-none">Most Returned Product</h4>
                  </div>
                  <p className="text-base font-bold dark:text-zinc-100 text-zinc-900 select-none truncate">Men's Cotton T-Shirt (Blue)</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 select-none">1 return</p>
                </div>
              </div>

              <div className="dark:bg-zinc-900/60 bg-white/60 backdrop-blur-xl border border-white/30 dark:border-zinc-700/30 rounded-xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold dark:text-zinc-100 text-zinc-900 select-none flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                    Returned Orders
                  </h4>
                  <button
                    onClick={() => {
                      setResults(false);
                      setUploading(false);
                    }}
                    className="text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline select-none focus:outline-none focus:ring-0"
                  >
                    Re-upload
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800">
                        {['Order ID', 'Product', 'Reason', 'Status', 'Money Lost'].map((col) => (
                          <th key={col} className="py-3 px-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider select-none">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dummyRows.map((row) => (
                        <tr key={row.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                          <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">{row.id}</td>
                          <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100">{row.product}</td>
                          <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">{row.reason}</td>
                          <td className="py-3 px-4 text-sm">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              row.status === 'RTO' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">{row.lost}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

