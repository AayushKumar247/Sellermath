import { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  Trash2,
  AlertCircle,
} from 'lucide-react';

type MarketplaceId =
  | 'amazon'
  | 'flipkart'
  | 'meesho'
  | 'myntra'
  | 'blinkit'
  | 'zepto'
  | 'instamart'
  | 'snapdeal';

interface MarketplaceConfig {
  name: string;
  commissionRate: number;
  fixedFee: number;
  color: string;
  iconColor: string;
}

const MARKETPLACES: Record<MarketplaceId, MarketplaceConfig> = {
  amazon: {
    name: 'Amazon',
    commissionRate: 12,
    fixedFee: 20,
    color: 'from-amber-400 to-orange-500',
    iconColor: 'text-orange-500',
  },
  flipkart: {
    name: 'Flipkart',
    commissionRate: 12,
    fixedFee: 15,
    color: 'from-blue-500 to-blue-600',
    iconColor: 'text-blue-500',
  },
  meesho: {
    name: 'Meesho',
    commissionRate: 3,
    fixedFee: 0,
    color: 'from-fuchsia-600 to-fuchsia-700',
    iconColor: 'text-pink-500',
  },
  myntra: {
    name: 'Myntra',
    commissionRate: 18,
    fixedFee: 25,
    color: 'from-pink-400 to-rose-500',
    iconColor: 'text-purple-500',
  },
  blinkit: {
    name: 'Blinkit',
    commissionRate: 20,
    fixedFee: 10,
    color: 'from-yellow-400 to-amber-500',
    iconColor: 'text-cyan-400',
  },
  zepto: {
    name: 'Zepto',
    commissionRate: 18,
    fixedFee: 10,
    color: 'from-violet-600 to-indigo-600',
    iconColor: 'text-red-500',
  },
  instamart: {
    name: 'Instamart',
    commissionRate: 18,
    fixedFee: 10,
    color: 'from-orange-500 to-red-500',
    iconColor: 'text-green-500',
  },
  snapdeal: {
    name: 'Snapdeal',
    commissionRate: 12,
    fixedFee: 15,
    color: 'from-red-500 to-red-600',
    iconColor: 'text-violet-500',
  },
};

const GST_RATE = 0.18;
const TCS_TDS_RATE = 0.01;

interface CSVRow {
  SKU_Name: string;
  Category: string;
  Cost_of_Goods: number;
  Selling_Price: number;
  Shipping_Fee: number;
  RTO_Percent: number;
}

interface CalculationResult {
  skuName: string;
  category: string;
  costOfGoods: number;
  sellingPrice: number;
  shippingFee: number;
  rtoPercent: number;
  marketplace: string;
  commissionAmount: number;
  fixedFee: number;
  gstOnFees: number;
  tcsTds: number;
  rtoLoss: number;
  totalDeductions: number;
  netProfit: number;
  marginPercent: number;
  isProfitable: boolean;
}

function formatINR(val: number): string {
  return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function BulkCsvCalculator() {
  const [selectedMarketplace, setSelectedMarketplace] = useState<MarketplaceId>('amazon');
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [calculations, setCalculations] = useState<CalculationResult[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>('');

  const downloadSampleTemplate = () => {
    const headers = ['SKU_Name,Category,Cost_of_Goods,Selling_Price,Shipping_Fee,RTO_Percent'];
    const sampleRows = [
      'Wireless Earbuds Pro,Electronics,899,1499,40,5',
      'Cotton T-Shirt Pack,Clothing,349,599,50,8',
      'Stainless Steel Water Bottle,Home & Kitchen,199,399,30,4',
    ];
    const csvContent = [...headers, ...sampleRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'bulk_sku_template.csv';
    link.click();
  };

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length === headers.length) {
        data.push({
          SKU_Name: values[0],
          Category: values[1],
          Cost_of_Goods: parseFloat(values[2]) || 0,
          Selling_Price: parseFloat(values[3]) || 0,
          Shipping_Fee: parseFloat(values[4]) || 0,
          RTO_Percent: parseFloat(values[5]) || 0,
        });
      }
    }

    return data;
  };

  const calculateProfits = (rows: CSVRow[]): CalculationResult[] => {
    const marketplace = MARKETPLACES[selectedMarketplace];

    return rows.map(row => {
      const commissionAmount = row.Selling_Price * (marketplace.commissionRate / 100);
      const fixedFee = marketplace.fixedFee;
      const gstOnFees = (commissionAmount + fixedFee) * GST_RATE;
      const tcsTds = row.Selling_Price * TCS_TDS_RATE;
      const rtoLoss = (row.Cost_of_Goods + row.Shipping_Fee) * (row.RTO_Percent / 100);
      const totalDeductions = commissionAmount + fixedFee + gstOnFees + tcsTds + rtoLoss;
      const netProfit = row.Selling_Price - row.Cost_of_Goods - row.Shipping_Fee - totalDeductions;
      const marginPercent = row.Selling_Price > 0 ? (netProfit / row.Selling_Price) * 100 : 0;

      return {
        skuName: row.SKU_Name,
        category: row.Category,
        costOfGoods: row.Cost_of_Goods,
        sellingPrice: row.Selling_Price,
        shippingFee: row.Shipping_Fee,
        rtoPercent: row.RTO_Percent,
        marketplace: marketplace.name,
        commissionAmount,
        fixedFee,
        gstOnFees,
        tcsTds,
        rtoLoss,
        totalDeductions,
        netProfit,
        marginPercent,
        isProfitable: netProfit > 0,
      };
    });
  };

  const handleFileUpload = (file: File) => {
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          setError('No valid data found in CSV');
          return;
        }
        setCsvData(parsed);
        setCalculations(calculateProfits(parsed));
      } catch (err) {
        setError('Failed to parse CSV file');
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      handleFileUpload(file);
    } else {
      setError('Please upload a CSV file');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const downloadReport = () => {
    const headers = [
      'SKU_Name,Category,Cost_of_Goods,Selling_Price,Shipping_Fee,RTO_Percent,Marketplace,Commission,Fixed_Fee,GST_on_Fees,TCS_TDS,RTO_Loss,Total_Deductions,Net_Profit,Margin_Percent,Status',
    ];
    const rows = calculations.map(calc => [
      calc.skuName,
      calc.category,
      calc.costOfGoods,
      calc.sellingPrice,
      calc.shippingFee,
      calc.rtoPercent,
      calc.marketplace,
      calc.commissionAmount.toFixed(2),
      calc.fixedFee.toFixed(2),
      calc.gstOnFees.toFixed(2),
      calc.tcsTds.toFixed(2),
      calc.rtoLoss.toFixed(2),
      calc.totalDeductions.toFixed(2),
      calc.netProfit.toFixed(2),
      calc.marginPercent.toFixed(2),
      calc.isProfitable ? 'Profitable' : 'Loss-Making',
    ].join(','));
    const csvContent = [...headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `profit_report_${selectedMarketplace}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const clearData = () => {
    setCsvData([]);
    setCalculations([]);
    setError('');
  };

  const summary = calculations.length > 0 ? {
    totalProfit: calculations.reduce((sum, c) => sum + c.netProfit, 0),
    avgMargin: calculations.reduce((sum, c) => sum + c.marginPercent, 0) / calculations.length,
    profitableCount: calculations.filter(c => c.isProfitable).length,
    lossCount: calculations.filter(c => !c.isProfitable).length,
  } : null;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 select-none">
          Bulk CSV Profit Calculator
        </h1>
        <p className="text-gray-600 dark:text-gray-400 select-none">
          Upload your SKU catalog to calculate marketplace fees, taxes, and profits instantly
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Marketplace
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(MARKETPLACES).map(([id, config]) => (
            <button
              key={id}
              onClick={() => setSelectedMarketplace(id as MarketplaceId)}
              className={`p-3 rounded-lg border-2 transition-all select-none focus:outline-none focus:ring-0 ${
                selectedMarketplace === id
                  ? `border-blue-500 bg-gradient-to-r ${config.color} text-white`
                  : 'text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              <div className={`font-semibold ${selectedMarketplace === id ? 'text-white font-medium' : 'text-gray-700 dark:text-gray-200'}`}>
                {config.name}
              </div>
              <div className={`text-xs ${selectedMarketplace === id ? 'text-white/90' : 'text-gray-500 dark:text-gray-400'}`}>
                {config.commissionRate}% commission
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 flex gap-3">
        <button
          onClick={downloadSampleTemplate}
          className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${MARKETPLACES[selectedMarketplace].color} hover:opacity-90 text-white rounded-lg transition-all select-none focus:outline-none focus:ring-0`}
        >
          <Download size={20} />
          Download CSV Upload Format
        </button>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`mb-6 p-8 border-2 border-dashed rounded-lg text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
      >
        <Upload size={48} className="mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
          Drag & drop your CSV file here
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          or click to browse
        </p>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          className="hidden"
          id="csv-upload"
        />
        <label
          htmlFor="csv-upload"
          className="inline-block px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg cursor-pointer transition-colors"
        >
          Select CSV File
        </label>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
          <AlertCircle className="text-red-500" size={24} />
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {calculations.length > 0 && (
        <>
          <div className="mb-6 flex justify-end">
            <button
              onClick={clearData}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors select-none focus:outline-none focus:ring-0"
            >
              <Trash2 size={20} />
              Clear Data
            </button>
          </div>

          {summary && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gradient-to-r from-green-400 to-green-600 rounded-lg text-white">
                <div className="text-sm opacity-90">Total Catalog Profit</div>
                <div className="text-2xl font-bold">{formatINR(summary.totalProfit)}</div>
              </div>
              <div className="p-4 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg text-white">
                <div className="text-sm opacity-90">Average Margin</div>
                <div className="text-2xl font-bold">{summary.avgMargin.toFixed(2)}%</div>
              </div>
              <div className="p-4 bg-gradient-to-r from-green-400 to-green-600 rounded-lg text-white">
                <div className="text-sm opacity-90">Profitable SKUs</div>
                <div className="text-2xl font-bold">{summary.profitableCount}</div>
              </div>
              <div className="p-4 bg-gradient-to-r from-red-400 to-red-600 rounded-lg text-white">
                <div className="text-sm opacity-90">Loss-Making SKUs</div>
                <div className="text-2xl font-bold">{summary.lossCount}</div>
              </div>
            </div>
          )}

          <div className="mb-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                    SKU Name
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                    Category
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">
                    Cost
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">
                    Selling Price
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">
                    Commission
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">
                    GST
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">
                    TCS/TDS
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">
                    RTO Loss
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">
                    Net Profit
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">
                    Margin
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {calculations.map((calc, idx) => (
                  <tr
                    key={idx}
                    className={`border-b border-gray-200 dark:border-gray-700 ${
                      !calc.isProfitable ? 'bg-red-50 dark:bg-red-900/10' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                      {calc.skuName}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {calc.category}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                      {formatINR(calc.costOfGoods)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                      {formatINR(calc.sellingPrice)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                      {formatINR(calc.commissionAmount)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                      {formatINR(calc.gstOnFees)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                      {formatINR(calc.tcsTds)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                      {formatINR(calc.rtoLoss)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${
                        calc.isProfitable
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {formatINR(calc.netProfit)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${
                        calc.isProfitable
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {calc.marginPercent.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          calc.isProfitable
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}
                      >
                        {calc.isProfitable ? 'Profitable' : 'Loss-Making'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <button
              onClick={downloadReport}
              className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${MARKETPLACES[selectedMarketplace].color} hover:opacity-90 text-white rounded-lg transition-all font-semibold select-none focus:outline-none focus:ring-0`}
            >
              <FileSpreadsheet size={20} />
              Download Full CA Tax & Profit Report (.CSV)
            </button>
          </div>
        </>
      )}
    </div>
  );
}
