export async function generateRecommendation(productData: any): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const { productName, cost, tentativeSellingPrice, fetchedData, calculations, logistics, rtoPercentage, adsCount } = productData;

  const marginPct = calculations?.marginPercentage || 0;
  const netProfit = calculations?.netProfit || 0;
  const oppScore = calculations?.opportunityScore || 0;
  const competition = fetchedData?.estimatedCompetition || 'Medium';
  const firstMover = fetchedData?.firstMoverAdvantage || 'MEDIUM';
  const approxSellers = fetchedData?.approxSellers || 0;
  const countries = fetchedData?.amazonBestSellerCountries || ['India'];

  const prompt = `
    You are a professional product sourcing and e-commerce market intelligence advisor.
    Provide a detailed product sourcing recommendation summary for:
    Product: "${productName}"
    Product Cost: ₹${cost}
    Tentative Selling Price: ₹${tentativeSellingPrice}
    Calculated Margin: ${marginPct}% (Net Profit per unit: ₹${netProfit})
    Shipping Cost: ₹${logistics?.shippingCost || 0}
    RTO Percentage: ${rtoPercentage}%
    First Mover Advantage: ${firstMover} (Estimated Competition: ${competition}, Approx Sellers: ${approxSellers})
    Amazon Best Seller Countries: ${countries.join(', ')}
    Meta Ads Running: ${adsCount} Ads
    Opportunity Score: ${oppScore}/100

    Write a concise, professional sourcing recommendation (3-4 sentences, max 100 words).
    Highlight the opportunity score, margins, competitive landscape, international demand, and suggestions for launching in India.
    Do not use formatting like markdown bolding or bullet points; write it as a single cohesive paragraph suitable for a professional catalog.
  `;

  if (apiKey) {
    try {
      console.log('Gemini API Key detected. Requesting AI Recommendation...');
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );
      if (response.ok) {
        const json = await response.json();
        const recommendation = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (recommendation) {
          return recommendation.trim();
        }
      }
      console.warn('Gemini API call failed or returned empty. Using fallback recommender.');
    } catch (error) {
      console.error('Error generating AI recommendation with Gemini API:', error);
    }
  }

  // Fallback Rule-based Sourcing Recommender
  console.log('Using rule-based fallback recommendation engine.');
  
  // Sourcing Potential Evaluation
  let potentialText = '';
  if (oppScore >= 80) {
    potentialText = `This product shows exceptional potential for launching in the Indian market, backed by an impressive Opportunity Score of ${oppScore}/100.`;
  } else if (oppScore >= 60) {
    potentialText = `This product has strong launch viability in India with a solid Opportunity Score of ${oppScore}/100, though it requires strategic entry planning.`;
  } else {
    potentialText = `Sourcing this product presents moderate potential (Opportunity Score: ${oppScore}/100) due to competitive friction or tighter margins.`;
  }

  // Margin Analysis
  let marginText = `With a healthy unit margin of ${marginPct}% yielding ₹${netProfit} net profit after shipping (₹${logistics?.shippingCost || 0}), the financial structure is highly attractive.`;
  if (marginPct < 35) {
    marginText = `The profit margin stands at ${marginPct}% (net unit profit ₹${netProfit} after shipping), which is viable but leaves slim tolerances for ad spend spikes.`;
  }

  // Competitive Landscape
  let compText = '';
  if (firstMover === 'YES') {
    compText = `Competition is currently low with only around ${approxSellers} sellers spotted online, giving you a distinct First Mover Advantage in this segment.`;
  } else if (firstMover === 'MEDIUM') {
    compText = `Market saturation is moderate with approximately ${approxSellers} active sellers identified, representing a healthy balance of demand and competitive space.`;
  } else {
    compText = `The category is highly saturated with over ${approxSellers} active competitors online, meaning launch success will depend heavily on branding and packaging differentiation.`;
  }

  // Recommendation & Action items
  let adviceText = '';
  if (rtoPercentage > 20) {
    adviceText = `Given the high RTO rate of ${rtoPercentage}%, we recommend strict phone-number verification on checkout and standardizing cash-on-delivery constraints.`;
  } else {
    adviceText = `The low RTO profile of ${rtoPercentage}% and existing global validation as a best seller in countries like ${countries.slice(0, 3).join(', ')} makes it a high-conviction addition to your sourcing catalog.`;
  }

  // Combine into single paragraph
  return `${potentialText} ${marginText} ${compText} ${adviceText}`;
}

import fs from 'fs';
import path from 'path';

// ─── Serper.dev: find real competitor product URLs via Google Search ───────
async function fetchCompetitorUrlsViaSerper(productName: string): Promise<string[]> {
  const serperKey = process.env.SERPER_API_KEY;
  if (!serperKey) {
    console.warn('[Serper] SERPER_API_KEY not set. Skipping real URL fetch.');
    return [];
  }

  const MARKETPLACE_BLACKLIST = [
    'amazon.', 'flipkart.', 'meesho.', 'snapdeal.', 'jiomart.',
    'myntra.', 'ajio.', 'nykaa.', 'indiamart.', 'wikipedia.',
    'youtube.', 'instagram.', 'facebook.', 'twitter.', 'pinterest.'
  ];

  const queries = [
    `site:.in inurl:/products/ "${productName}"`,
    `site:.co.in inurl:/products/ "${productName}"`,
    `"powered by shopify" site:.in "${productName}"`
  ];

  const found: string[] = [];

  for (const q of queries) {
    try {
      console.log(`[Serper] Searching: ${q}`);
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': serperKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ q, gl: 'in', hl: 'en', num: 8 })
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error(`[Serper] Failed (${res.status}):`, txt);
        continue;
      }

      const data = await res.json();
      const results: any[] = data?.organic || [];

      for (const r of results) {
        const url: string = r.link || '';
        const isBlocked = MARKETPLACE_BLACKLIST.some(m => url.includes(m));
        if (!isBlocked && url.startsWith('http') && !found.includes(url) && found.length < 3) {
          console.log(`[Serper] ✓ Found competitor URL: ${url}`);
          found.push(url);
        }
      }

      if (found.length >= 3) break;
    } catch (err: any) {
      console.error('[Serper] Error:', err.message);
    }
  }

  console.log(`[Serper] Total real competitor URLs found: ${found.length}`);
  return found;
}

// ─── Serper.dev: count real sellers per marketplace via Google site: search ──
async function countMarketplaceSellersViaSerper(productName: string): Promise<{
  amazon: number;
  flipkart: number;
  meesho: number;
  jiomart: number;
  adsCount: number;
}> {
  const serperKey = process.env.SERPER_API_KEY;

  if (!serperKey) {
    console.warn('[Serper] SERPER_API_KEY not set. Cannot fetch real marketplace counts.');
    return { amazon: 0, flipkart: 0, meesho: 0, jiomart: 0, adsCount: 0 };
  }

  // Helper: run a single Serper search and return organic count + Google's totalResults estimate
  const serperSearch = async (query: string): Promise<{ organic: number; total: number }> => {
    try {
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query, gl: 'in', hl: 'en', num: 10 })
      });
      if (!res.ok) {
        const err = await res.text();
        console.error(`[Serper] Search failed (${res.status}):`, err.slice(0, 200));
        return { organic: 0, total: 0 };
      }
      const data = await res.json();
      // totalResults is Google's estimate of indexed pages for this query
      const rawTotal = data.searchInformation?.totalResults || '0';
      const total = parseInt(rawTotal.replace(/,/g, '').replace(/\./g, ''), 10) || 0;
      const organic = (data.organic || []).length;
      return { organic, total };
    } catch (err: any) {
      console.error('[Serper] Network error:', err.message);
      return { organic: 0, total: 0 };
    }
  };

  console.log(`[Serper] Counting real marketplace sellers for: "${productName}"`);

  // Run all 5 searches in parallel to minimise latency
  const [amazonData, flipkartData, meeshoData, jiomartData, adsData] = await Promise.all([
    serperSearch(`site:amazon.in ${productName}`),
    serperSearch(`site:flipkart.com ${productName}`),
    serperSearch(`site:meesho.com ${productName}`),
    serperSearch(`site:jiomart.com ${productName}`),
    serperSearch(`"${productName}" site:facebook.com/ads/library OR "facebook ads" OR "meta ads"`)
  ]);

  // Normalize: each product listing on Amazon/Flipkart generates ~5 indexed pages
  // (product page, reviews, Q&A, seller offers, category pages)
  // Using totalResults / divisor gives a realistic estimate of unique listings
  const normalize = (data: { organic: number; total: number }, divisor: number, cap: number): number => {
    if (data.total > 0) return Math.min(Math.max(1, Math.round(data.total / divisor)), cap);
    return Math.max(0, data.organic); // organic count as floor if totalResults is 0
  };

  const result = {
    amazon:   normalize(amazonData,   5, 9999),
    flipkart: normalize(flipkartData, 4, 9999),
    meesho:   normalize(meeshoData,   3, 9999),
    jiomart:  normalize(jiomartData,  3, 9999),
    adsCount: normalize(adsData,      8, 9999)
  };

  console.log(`[Serper] Real counts — Amazon: ${result.amazon}, Flipkart: ${result.flipkart}, Meesho: ${result.meesho}, JioMart: ${result.jiomart}, Ads: ${result.adsCount}`);
  return result;
}

// ─── Main export: orchestrate both sources ────────────────────────────────
export async function analyzeCompetitorsWithAI(productName: string, images?: string[]): Promise<{
  amazon: number;
  flipkart: number;
  meesho: number;
  jiomart: number;
  shopifyStores: string[];
  adsCount: number;
}> {
  console.log(`[Competitor Analysis] Starting for: "${productName}"...`);

  // Run both fetches in parallel for speed
  const [counts, serperUrls] = await Promise.all([
    countMarketplaceSellersViaSerper(productName),
    fetchCompetitorUrlsViaSerper(productName)
  ]);

  // If Serper returned nothing, fall back to a clear message
  const shopifyStores = serperUrls.length > 0
    ? serperUrls
    : ['No live competitor URLs found — check SERPER_API_KEY in .env'];

  return {
    ...counts,
    shopifyStores
  };
}
