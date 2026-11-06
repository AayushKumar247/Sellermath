import 'dotenv/config';
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
  
  // Validate directShippingFee: must be null, undefined, or a valid non-negative finite number
  let directShippingFee = null;
  if (body.directShippingFee !== null && body.directShippingFee !== undefined) {
    const feeValue = toNumber(body.directShippingFee);
    if (!Number.isFinite(feeValue)) {
      throw new Error('Direct shipping fee must be a valid number (not NaN or Infinity)');
    }
    if (feeValue < 0) {
      throw new Error('Direct shipping fee cannot be negative');
    }
    directShippingFee = feeValue;
  }
  
  const returnRate = toNumber(body.returnRate);
  const zone = typeof body.zone === 'string' ? body.zone : 'national';

  const taxableValue = sellingPrice / (1 + productGstRate / 100);
  const productGst = sellingPrice - taxableValue;
  const commissionAmount = (taxableValue * commissionRate) / 100;

  const zoneMult = ZONE_MULTIPLIERS[zone] ?? 1;
  const shippingFee = directShippingFee !== null ? directShippingFee : calcShippingFee(shippingWeight, zoneMult);

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

// Unified AI helper: Groq Cloud (primary) with Google Gemini (automatic fallback)
async function generateAIResponse(prompt, expectJson = false) {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  // --- Primary: Groq Cloud (multi-model fallback) ---
  if (groqKey) {
    const GROQ_MODELS = [
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'qwen/qwen3.8-27b',
    ];

    for (const model of GROQ_MODELS) {
      try {
        const groqBody = {
          model,
          temperature: 0.5,
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        };
        if (expectJson) {
          groqBody.response_format = { type: 'json_object' };
        }

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(groqBody),
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const text = groqData?.choices?.[0]?.message?.content ?? '';
          if (text) return text;
          console.warn(`Groq (${model}) returned empty content, trying next model.`);
          continue;
        } else if (groqRes.status === 429 || groqRes.status === 500) {
          const errData = await groqRes.json().catch(() => null);
          console.warn(`Groq ${groqRes.status} on ${model} (${errData?.error?.message || ''}), trying next model.`);
          continue;
        } else if (groqRes.status === 400 || groqRes.status === 404) {
          const errData = await groqRes.json().catch(() => null);
          const msg = errData?.error?.message || `Groq API returned status ${groqRes.status}`;
          console.warn(`Groq ${groqRes.status} on ${model} (${msg}), trying next model.`);
          continue;
        } else {
          const errData = await groqRes.json().catch(() => null);
          console.error(`Groq API Error on ${model}:`, errData?.error?.message || `status ${groqRes.status}`);
          continue;
        }
      } catch (err) {
        console.error(`Groq request failed for ${model}:`, err.message || err);
        continue;
      }
    }

    // All Groq models exhausted, fall through to Gemini
    console.warn('All Groq models exhausted, falling back to Gemini.');
  }

  // --- Fallback: Google Gemini ---
  if (geminiKey) {
    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024,
            },
          }),
        }
      );

      if (!geminiRes.ok) {
        const errData = await geminiRes.json().catch(() => null);
        const msg = errData?.error?.message || `Gemini API returned status ${geminiRes.status}`;
        throw new Error(msg);
      }

      const geminiData = await geminiRes.json();
      const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      if (!text) {
        throw new Error('The AI returned an empty response. Please try again.');
      }
      return text;
    } catch (err) {
      console.error('Gemini fallback failed:', err.message || err);
      throw err;
    }
  }

  throw new Error('No AI API keys configured. Please add GROQ_API_KEY or GEMINI_API_KEY.');
}

// AI Analysis endpoint
app.post('/api/ai-analyze', async (req, res) => {
  console.log('AI Route Hit');
  console.log('GROQ_API_KEY Exists:', !!process.env.GROQ_API_KEY);
  console.log('GEMINI_API_KEY Exists:', !!process.env.GEMINI_API_KEY);

  try {
    const { marketplaceName, sellingPrice, commissionRate, shippingFee, gstAmount, returnRate, cogs, netProfit, breakEvenPrice } = req.body;

    const metrics = [
      `Marketplace: ${marketplaceName}`,
      `Selling Price (incl. GST): ₹${sellingPrice}`,
      `Commission Rate: ${commissionRate}%`,
      `Shipping / Pick & Pack Fee: ₹${shippingFee}`,
      `GST + TCS/TDS Deductions: ₹${gstAmount}`,
      `RTO / Return Rate: ${returnRate}%`,
      `Cost of Goods (COGS): ₹${cogs}`,
      `Current Net Profit: ₹${netProfit}`,
      `Calculated Break-Even Price: ₹${breakEvenPrice}`,
    ].join('\n');

    const prompt = `You are an expert Indian e-commerce financial strategist. Analyze these metrics:\n${metrics}\n\nReturn a concise, 3-part strategic report formatted nicely.\nPart 1: Break-Even Pricing (Calculate exact minimum selling price to avoid a net loss).\nPart 2: RTO Strategy (Analyze the impact of the current RTO % and suggest one specific mitigation tactic).\nPart 3: Inventory Viability (Final verdict on whether this margin is healthy enough to scale with paid ads).\n\nFormat each part with a clear heading and keep the response under 300 words total.`;

    const text = await generateAIResponse(prompt, false);

    res.json({ text });
  } catch (err) {
    console.error('AI Request Failed:', err.message || err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Something went wrong while contacting the AI service.'
    });
  }
});

// AI Insights endpoint
app.post('/api/insights', async (req, res) => {
  try {
    const { marketplaceName, sellingPrice, commissionRate, shippingFee, gstAmount, returnRate, cogs, netProfit, breakEvenPrice } = req.body;

    const metrics = [
      `Marketplace: ${marketplaceName}`,
      `Selling Price (incl. GST): ₹${sellingPrice}`,
      `Commission Rate: ${commissionRate}%`,
      `Shipping / Pick & Pack Fee: ₹${shippingFee}`,
      `GST + TCS/TDS Deductions: ₹${gstAmount}`,
      `RTO / Return Rate: ${returnRate}%`,
      `Cost of Goods (COGS): ₹${cogs}`,
      `Current Net Profit: ₹${netProfit}`,
      `Calculated Break-Even Price: ₹${breakEvenPrice}`,
    ].join('\n');

    const prompt = `You are an expert Indian e-commerce financial strategist. Analyze these metrics:\n${metrics}\n\nReturn a concise, 3-part strategic report formatted nicely.\nPart 1: Break-Even Pricing (Calculate exact minimum selling price to avoid a net loss).\nPart 2: RTO Strategy (Analyze the impact of the current RTO % and suggest one specific mitigation tactic).\nPart 3: Inventory Viability (Final verdict on whether this margin is healthy enough to scale with paid ads).\n\nFormat each part with a clear heading and keep the response under 300 words total.`;

    const text = await generateAIResponse(prompt, false);

    res.json({ text });
  } catch (err) {
    console.error('AI Insights Request Failed:', err.message || err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Something went wrong while generating AI insights.'
    });
  }
});

// AI Listing Writer endpoint
app.post('/api/ai-listing', async (req, res) => {
  try {
    const { productName, category, keyFeatures, targetKeywords } = req.body;

    const marketplaceGuidance = {
      'Amazon India':
        'Amazon India: SEO-rich, keyword-dense title; longer, detailed benefit-led bullets (exactly 5); comprehensive description covering features, usage, and warranty.',
      Flipkart:
        'Flipkart: concise, scannable title and exactly 5 bullets; lead with key specifications, dimensions, and material; plain Indian-English phrasing.',
      Meesho:
        'Meesho: simple, plain-language exactly 5 bullets; value and affordability focused; short sentences, minimal jargon.',
      Myntra:
        'Myntra: fashion-focused title; exactly 5 bullets covering fabric, fit, style, care, and occasion; trendy aspirational description.',
    };
    const guidance = marketplaceGuidance[category] || marketplaceGuidance['Amazon India'];

    const prompt = `You are an expert e-commerce copywriter for Indian marketplaces. Generate a highly optimized product listing in JSON format only, tailored specifically to ${category}.

Product Name: ${productName || ''}
Marketplace: ${category || 'Generic'}
Key Features / Specs: ${keyFeatures || ''}
Target Keywords: ${targetKeywords || ''}

Marketplace Rules:
${guidance}

Return ONLY valid JSON with these keys:
- title: SEO-friendly product title
- description: compelling product description
- highlights: array of exactly 5 bullet-point highlights
- keywords: array of search keywords

No markdown code fences, no extra text outside the JSON.`;

    const text = await generateAIResponse(prompt, true);

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (parseErr) {
      parsed = {
        title: productName || 'Your Product',
        description: text,
        highlights: [],
        keywords: [],
        category: category || 'Generic',
      };
    }

    res.json(parsed);
  } catch (err) {
    console.error('AI Listing Writer Request Failed:', err.message || err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Something went wrong while generating the listing.'
    });
  }
});

// SEO Keywords Generator endpoint
app.post('/api/seo-keywords', async (req, res) => {
  try {
    const { productName, keyFeatures } = req.body;

    if (!productName || typeof productName !== 'string') {
      return res.status(400).json({ error: 'Product name is required' });
    }

    const prompt = `You are an expert e-commerce SEO specialist for Amazon India and Flipkart. Generate search terms for the following product:

Product Name: ${productName}
${keyFeatures ? `Key Features/Target Audience: ${keyFeatures}` : ''}

Please provide the response in this exact JSON format:
{
  "topSearchTerms": ["term1", "term2", ...],
  "platinumKeywords": ["keyword1", "keyword2", ...],
  "misspellings": ["variation1", "variation2", ...]
}

Where:
- topSearchTerms: Top 20 high-volume backend search terms (comma-separated, focused on what customers actually search for)
- platinumKeywords: 5 premium, high-conversion keywords that competitors might be missing
- misspellings: Common misspellings and long-tail variations that have lower competition but high intent

Focus on Indian e-commerce context (Amazon India, Flipkart). Keep terms specific and actionable for product titles and bullet points.

IMPORTANT: Return ONLY raw JSON without any markdown code blocks, formatting, or extra text. Do not wrap the response in \`\`\`json or \`\`\` markers.`;

    const aiResponse = await generateAIResponse(prompt, true);

    try {
      // Strip markdown code blocks if present
      const cleanText = aiResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanText);
      if (Array.isArray(parsed.topSearchTerms) && Array.isArray(parsed.platinumKeywords) && Array.isArray(parsed.misspellings)) {
        res.json(parsed);
      } else {
        throw new Error('Invalid AI response format');
      }
    } catch (parseErr) {
      console.error('Failed to parse AI response:', parseErr);
      const fallbackResponse = {
        topSearchTerms: productName.split(' ').slice(0, 20),
        platinumKeywords: [productName, 'premium', 'quality'],
        misspellings: [productName.toLowerCase(), productName.replace(/\s/g, '')],
      };
      res.json(fallbackResponse);
    }
  } catch (err) {
    console.error('SEO Keywords error:', err);
    res.status(500).json({ error: 'Failed to generate keywords. Please try again.' });
  }
});

// For Vercel serverless deployment
export default app;

// For local development
if (!process.env.VERCEL) {
  app.listen(PORT, '127.0.0.1', () => console.log(`API running on http://127.0.0.1:${PORT}`));
}
