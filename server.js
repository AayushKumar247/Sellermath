import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const PORT = Number(process.env.PORT) || 3001;

const ZONE_MULTIPLIERS = {
  local: 0.7,
  regional: 1.0,
  national: 1.4,
};

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function calcShippingFee(weight, zoneMult) {
  const baseFee = 35;
  const perKg = 20;
  const weightKg = toNumber(weight) / 1000;
  return Math.round((baseFee + perKg * weightKg) * zoneMult);
}

function calculateUniversal(body) {
  const sellingPrice = toNumber(body.sellingPrice);
  const cogs = toNumber(body.cogs);
  const productGstRate = toNumber(body.productGstRate);
  const commissionRate = toNumber(body.commissionRate);
  const closingFee = toNumber(body.closingFee);
  const shippingWeight = toNumber(body.shippingWeight);
  const returnRate = toNumber(body.returnRate);
  const zone = typeof body.zone === 'string' ? body.zone : 'national';

  const taxableValue = sellingPrice / (1 + productGstRate / 100);
  const productGst = sellingPrice - taxableValue;
  const commissionAmount = (taxableValue * commissionRate) / 100;

  const zoneMult = ZONE_MULTIPLIERS[zone] ?? 1;
  const shippingFee = calcShippingFee(shippingWeight, zoneMult);

  const totalMarketplaceFees = commissionAmount + closingFee + shippingFee;
  const gstOnMarketplaceFees = totalMarketplaceFees * 0.18;
  const tcsTds = (sellingPrice * 1) / 100;
  const totalDeductions = totalMarketplaceFees + gstOnMarketplaceFees + tcsTds + productGst;

  const effectiveReturnCost = (shippingFee * returnRate) / 100;
  const netSettlement = sellingPrice - totalDeductions - effectiveReturnCost;
  const netProfit = netSettlement - cogs;
  const netProfitMargin = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;
  const breakEvenPrice = cogs + totalDeductions + effectiveReturnCost;

  return {
    taxableValue,
    productGst,
    commissionAmount,
    closingFee,
    shippingFee,
    totalMarketplaceFees,
    gstOnMarketplaceFees,
    tcsTds,
    totalDeductions,
    netSettlement,
    netProfit,
    netProfitMargin,
    breakEvenPrice,
    effectiveReturnCost,
  };
}

function calculateAmazonFba(body) {
  const sellingPrice = toNumber(body.sellingPrice);
  const productCost = toNumber(body.productCost);
  const referralFee = toNumber(body.referralFee);
  const closingFee = toNumber(body.closingFee);
  const pickPackFee = toNumber(body.pickPackFee);
  const storageFee = toNumber(body.storageFee);

  const referralAmount = (sellingPrice * referralFee) / 100;
  const totalAmazonFees = referralAmount + closingFee + pickPackFee + storageFee;
  const gstOnFees = totalAmazonFees * 0.18;
  const netProfit = sellingPrice - productCost - totalAmazonFees - gstOnFees;
  const breakEvenPrice = productCost + totalAmazonFees + gstOnFees;
  const currentPriceVsBreakEven = sellingPrice - breakEvenPrice;

  return {
    referralAmount,
    totalAmazonFees,
    gstOnFees,
    netProfit,
    breakEvenPrice,
    currentPriceVsBreakEven,
  };
}

function calculateFlipkart(body) {
  const productCost = toNumber(body.productCost);
  const sellingPrice = toNumber(body.sellingPrice);
  const commissionRate = toNumber(body.commissionRate);
  const fixedFee = toNumber(body.fixedFee);
  const forwardShipping = toNumber(body.forwardShipping);
  const reverseShipping = toNumber(body.reverseShipping);
  const returnRate = toNumber(body.returnRate);

  const commission = (sellingPrice * commissionRate) / 100;
  const shippingGst = forwardShipping * 0.18;
  const deliveredProfit =
    sellingPrice - productCost - commission - fixedFee - forwardShipping - shippingGst;

  const returnShippingGst = (forwardShipping + reverseShipping) * 0.18;
  const returnedLoss = forwardShipping + reverseShipping + returnShippingGst + fixedFee;

  const blendedProfit =
    deliveredProfit * ((100 - returnRate) / 100) - returnedLoss * (returnRate / 100);

  return { commission, deliveredProfit, returnedLoss, blendedProfit };
}

function calculateMeesho(body) {
  const productCost = toNumber(body.productCost);
  const sellingPrice = toNumber(body.sellingPrice);
  const forwardShipping = toNumber(body.forwardShipping);
  const reverseShipping = toNumber(body.reverseShipping);
  const returnRate = toNumber(body.returnRate);

  const deliveredProfit =
    sellingPrice - productCost - forwardShipping - forwardShipping * 0.18;
  const returnedLoss = (forwardShipping + reverseShipping) * 1.18;
  const blendedProfit =
    deliveredProfit * ((100 - returnRate) / 100) - returnedLoss * (returnRate / 100);

  return { deliveredProfit, returnedLoss, blendedProfit };
}

function calculateRoas(body) {
  const aov = toNumber(body.aov);
  const totalCost = toNumber(body.totalCost);
  const targetRevenue = toNumber(body.targetRevenue);

  const grossProfit = aov - totalCost;
  const profitMargin = aov > 0 ? grossProfit / aov : 0;
  const profitMarginPercent = profitMargin * 100;
  const breakEvenROAS = profitMargin > 0 ? 1 / profitMargin : 0;
  const maxCPA = grossProfit;
  const ordersNeeded = aov > 0 ? targetRevenue / aov : 0;
  const maxAdBudget = maxCPA * ordersNeeded;
  const isProfitable = grossProfit > 0;

  return {
    grossProfit,
    profitMargin,
    profitMarginPercent,
    breakEvenROAS,
    maxCPA,
    ordersNeeded,
    maxAdBudget,
    isProfitable,
  };
}

function calculateBlinkit(body) {
  const productCost = toNumber(body.productCost);
  const sellingPrice = toNumber(body.sellingPrice);
  const commissionRate = toNumber(body.commissionRate);
  const deliveryFee = toNumber(body.deliveryFee);
  const packagingFee = toNumber(body.packagingFee);
  const returnRate = toNumber(body.returnRate);

  const commission = (sellingPrice * commissionRate) / 100;
  const deliveryGst = deliveryFee * 0.18;
  const totalFees = commission + deliveryFee + deliveryGst + packagingFee;
  const margin = sellingPrice - productCost;
  const netProfit = margin - totalFees;
  const marginPercent = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;

  const returnLoss = deliveryFee + deliveryGst + packagingFee;
  const blendedProfit =
    netProfit * ((100 - returnRate) / 100) - returnLoss * (returnRate / 100);

  return {
    commission,
    totalFees,
    margin,
    netProfit,
    marginPercent,
    returnLoss,
    blendedProfit,
  };
}

function calculateTargetPrice(body) {
  const cogs = toNumber(body.cogs);
  const commissionRate = toNumber(body.commissionRate);
  const closingFee = toNumber(body.closingFee);
  const productGstRate = toNumber(body.productGstRate);
  const shippingWeight = toNumber(body.shippingWeight);
  const returnRate = toNumber(body.returnRate);
  const zone = typeof body.zone === 'string' ? body.zone : 'national';
  const desiredProfit = toNumber(body.desiredProfit);

  const zoneMult = ZONE_MULTIPLIERS[zone] ?? 1;
  const baseFee = 35;
  const perKg = 20;
  const weightKg = shippingWeight / 1000;
  const shippingFee = Math.round((baseFee + perKg * weightKg) * zoneMult);

  const totalFixedCosts = closingFee + shippingFee;
  const effectiveReturnCost = (shippingFee * returnRate) / 100;
  const tcsRate = 0.01;

  const commissionMultiplier = 1 + (commissionRate / 100) * (1 + 0.18);
  const tcsMultiplier = 1 + tcsRate;
  const gstMultiplier = 1 + (productGstRate / 100);

  const requiredBeforeGst = (desiredProfit + cogs + totalFixedCosts + effectiveReturnCost) / (1 - commissionRate / 100) / (1 - tcsRate);
  const requiredSellingPrice = requiredBeforeGst * gstMultiplier;

  return {
    recommendedPrice: Math.ceil(requiredSellingPrice),
  };
}

const MARKETPLACES_CONFIG = [
  { id: 'amazon', categories: { fashion: { commission: 15, closingFee: 20 }, electronics: { commission: 5, closingFee: 15 }, home: { commission: 10, closingFee: 15 }, grocery: { commission: 8, closingFee: 10 }, beauty: { commission: 12, closingFee: 15 }, custom: { commission: 10, closingFee: 15 } }, defaultCategory: 'electronics' },
  { id: 'flipkart', categories: { fashion: { commission: 16, closingFee: 18 }, electronics: { commission: 4, closingFee: 15 }, home: { commission: 10, closingFee: 15 }, grocery: { commission: 7, closingFee: 10 }, beauty: { commission: 13, closingFee: 15 }, custom: { commission: 10, closingFee: 15 } }, defaultCategory: 'electronics' },
  { id: 'meesho', categories: { fashion: { commission: 0, closingFee: 0 }, electronics: { commission: 0, closingFee: 0 }, home: { commission: 0, closingFee: 0 }, grocery: { commission: 0, closingFee: 0 }, beauty: { commission: 0, closingFee: 0 }, custom: { commission: 0, closingFee: 0 } }, defaultCategory: 'fashion' },
  { id: 'myntra', categories: { fashion: { commission: 18, closingFee: 25 }, electronics: { commission: 12, closingFee: 20 }, home: { commission: 14, closingFee: 20 }, grocery: { commission: 10, closingFee: 15 }, beauty: { commission: 15, closingFee: 20 }, custom: { commission: 14, closingFee: 20 } }, defaultCategory: 'fashion' },
  { id: 'blinkit', categories: { fashion: { commission: 22, closingFee: 10 }, electronics: { commission: 18, closingFee: 10 }, home: { commission: 20, closingFee: 10 }, grocery: { commission: 15, closingFee: 8 }, beauty: { commission: 20, closingFee: 10 }, custom: { commission: 18, closingFee: 10 } }, defaultCategory: 'grocery' },
  { id: 'zepto', categories: { fashion: { commission: 25, closingFee: 10 }, electronics: { commission: 20, closingFee: 10 }, home: { commission: 22, closingFee: 10 }, grocery: { commission: 18, closingFee: 8 }, beauty: { commission: 22, closingFee: 10 }, custom: { commission: 22, closingFee: 10 } }, defaultCategory: 'grocery' },
  { id: 'instamart', categories: { fashion: { commission: 23, closingFee: 10 }, electronics: { commission: 18, closingFee: 10 }, home: { commission: 20, closingFee: 10 }, grocery: { commission: 16, closingFee: 8 }, beauty: { commission: 20, closingFee: 10 }, custom: { commission: 20, closingFee: 10 } }, defaultCategory: 'grocery' },
  { id: 'snapdeal', categories: { fashion: { commission: 12, closingFee: 15 }, electronics: { commission: 6, closingFee: 12 }, home: { commission: 8, closingFee: 12 }, grocery: { commission: 5, closingFee: 10 }, beauty: { commission: 10, closingFee: 12 }, custom: { commission: 8, closingFee: 12 } }, defaultCategory: 'fashion' },
];

function calculateCrossPlatformComparison(body) {
  const sellingPrice = toNumber(body.sellingPrice);
  const cogs = toNumber(body.cogs);
  const shippingWeight = toNumber(body.shippingWeight);
  const zone = typeof body.zone === 'string' ? body.zone : 'national';
  const productGstRate = toNumber(body.productGstRate);
  const returnRate = toNumber(body.returnRate);
  const category = typeof body.category === 'string' ? body.category : 'electronics';

  const zoneMult = ZONE_MULTIPLIERS[zone] ?? 1;

  const calcShippingFee = (weight) => {
    const baseFee = 35;
    const perKg = 20;
    const weightKg = weight / 1000;
    return Math.round((baseFee + perKg * weightKg) * zoneMult);
  };

  const calculateProfitForMarketplace = (mp) => {
    const categoryPreset = mp.categories[category] || mp.categories[mp.defaultCategory];
    const commissionRate = categoryPreset.commission;
    const closingFee = categoryPreset.closingFee;

    const taxableValue = sellingPrice / (1 + productGstRate / 100);
    const productGst = sellingPrice - taxableValue;
    const commissionAmount = (taxableValue * commissionRate) / 100;
    const shippingFee = calcShippingFee(shippingWeight);

    const totalMarketplaceFees = commissionAmount + closingFee + shippingFee;
    const gstOnMarketplaceFees = totalMarketplaceFees * 0.18;
    const tcsTds = (sellingPrice * 1) / 100;
    const totalDeductions = totalMarketplaceFees + gstOnMarketplaceFees + tcsTds + productGst;

    const effectiveReturnCost = (shippingFee * returnRate) / 100;
    const netSettlement = sellingPrice - totalDeductions - effectiveReturnCost;
    const netProfit = netSettlement - cogs;
    const netProfitMargin = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;

    return {
      marketplaceId: mp.id,
      netProfit,
      netProfitMargin,
    };
  };

  const comparisons = MARKETPLACES_CONFIG.map((mp) => calculateProfitForMarketplace(mp));
  const sortedComparisons = [...comparisons].sort((a, b) => b.netProfit - a.netProfit);

  return {
    comparisons: sortedComparisons,
  };
}

const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '32kb' }));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Try again in a minute.' },
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === '/api/health';
  },
});

app.use('/api', apiLimiter);

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    endpoints: [
      '/api/calculate/universal',
      '/api/calculate/amazon-fba',
      '/api/calculate/flipkart',
      '/api/calculate/meesho',
      '/api/calculate/roas',
      '/api/calculate/blinkit',
      '/api/calculate/target-price',
      '/api/calculate/cross-platform',
    ],
  });
});

function handleCalc(calculator) {
  return (req, res) => {
    try {
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'Invalid request body. Expected JSON object.' });
      }
      const result = calculator(req.body);
      res.json(result);
    } catch (err) {
      console.error('Calculation error:', err);
      res.status(400).json({ error: 'Invalid calculation request. Please check your inputs.' });
    }
  };
}

app.post('/api/calculate/universal', handleCalc(calculateUniversal));
app.post('/api/calculate/amazon-fba', handleCalc(calculateAmazonFba));
app.post('/api/calculate/flipkart', handleCalc(calculateFlipkart));
app.post('/api/calculate/meesho', handleCalc(calculateMeesho));
app.post('/api/calculate/roas', handleCalc(calculateRoas));
app.post('/api/calculate/blinkit', handleCalc(calculateBlinkit));
app.post('/api/calculate/target-price', handleCalc(calculateTargetPrice));
app.post('/api/calculate/cross-platform', handleCalc(calculateCrossPlatformComparison));

// For Vercel serverless deployment
export default app;

// For local development
app.listen(PORT, () => {
  console.log(`SellerMath API listening on http://localhost:${PORT}`);
});
