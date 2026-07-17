export async function generateRecommendation(productData: any): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const { productName, cost, tentativeSellingPrice, fetchedData, calculations, logistics, rtoPercentage, adsCount, upsellPotential, lowerCac } = productData;

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
    Upsell & Bundle Potential (AOV & LTV Growth): ${upsellPotential || 'MEDIUM'}
    Lower CAC: ${lowerCac || 'MEDIUM'}
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

// ─── Gemini: simplify product name for optimal search results ─────────────────
async function getSimplifiedProductName(productName: string, images: string[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const runLocalCleanup = (name: string): string => {
    const clean = name.split(/[|—–:]| \- /)[0].trim();
    const words = clean.split(/\s+/);
    const fillerWords = new Set([
      'perfect', 'made', 'easy', 'best', 'premium', 'hot', 'new', 'free', 'fast', 'discount', 'sale',
      'clearance', 'original', 'professional', 'high', 'quality', 'elegance', 'luxury', 'cute', 'beautiful',
      'fashion', 'trending', 'cool', 'special', 'great', 'use', 'quick', 'simple', 'awesome', 'amazing',
      'ultimate', 'exclusive', 'top', 'rated', 'guaranteed', 'deluxe', 'classic', 'modern', 'style', 'stylish',
      'expert', 'smart', 'super', 'ultra', 'mega', 'extreme', 'advanced', 'innovative', 'revolutionary',
      'genuine', 'pure', 'natural', 'organic', 'healthy', 'safe', 'effective', 'powerful', 'miracle', 'magic',
      'magical', 'essential', 'must', 'have', 'nice', 'wonderful', 'excellent', 'fabulous', 'outstanding',
      'superior', 'optimum', 'perfectly', 'easily', 'quickly', 'simply'
    ]);
    const filtered = words.filter(w => !fillerWords.has(w.toLowerCase().replace(/[^a-z0-9]/gi, '')));
    if (filtered.length > 0) {
      return filtered.join(' ');
    }
    return clean.split(/\s+/).slice(0, 4).join(' ');
  };

  if (!apiKey) {
    return runLocalCleanup(productName);
  }

  try {
    const prompt = `Analyze this product name: "${productName}".
Identify the visual and core product concept, keeping only the highly distinct keywords (ideally 2 to 4 words).
This query will be used for Google Image Search and Facebook Ads Library searches, so avoid spam words like "for drinks", "wearable", "3D", etc.
Example:
Input: "Godzilla Ice Cube Mold – 3D Silicone Freezer Tray for Drinks & Parties" -> Output: "Godzilla Ice Cube Mold"
Input: "Stainless Steel Double-Ended Extendable Back Scratcher" -> Output: "Extendable Back Scratcher"
Input: "Almond-Shaped Press-On Nails – Short Brown Wearable Nail Art Set" -> Output: "Press-On Nails"

Respond ONLY with the clean simplified product query. Do not include markdown, explanations, or quotes.`;

    const parts: any[] = [{ text: prompt }];

    if (images && images.length > 0) {
      try {
        const filename = path.basename(images[0]);
        const p1 = path.join(process.cwd(), 'uploads', filename);
        const p2 = path.resolve(__dirname, '..', '..', 'uploads', filename);
        const uploadPath = fs.existsSync(p1) ? p1 : fs.existsSync(p2) ? p2 : '';
        if (uploadPath) {
          const data = fs.readFileSync(uploadPath);
          const ext = path.extname(filename).toLowerCase();
          const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.gif' ? 'image/gif' : 'image/jpeg';
          parts.push({ inlineData: { mimeType, data: data.toString('base64') } });
        }
      } catch {}
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }] })
      }
    );

    if (response.ok) {
      const json = await response.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.trim()) {
        return text.trim().replace(/^["']|["']$/g, '');
      }
    } else {
      console.warn(`[Gemini API] Quota or API limit exceeded: Status ${response.status}. Using local cleanup fallback.`);
    }
  } catch (err: any) {
    console.error('[Gemini] Error simplifying product name:', err.message);
  }

  return runLocalCleanup(productName);
}

// ─── Gemini: extract a precise visual search query from image analysis ────────
async function getVisualSearchQueryFromImage(productName: string, images: string[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !images || images.length === 0) {
    return productName;
  }

  try {
    const filename = path.basename(images[0]);
    const p1 = path.join(process.cwd(), 'uploads', filename);
    const p2 = path.resolve(__dirname, '..', '..', 'uploads', filename);
    const uploadPath = fs.existsSync(p1) ? p1 : fs.existsSync(p2) ? p2 : '';
    if (!uploadPath) return productName;

    const data = fs.readFileSync(uploadPath);
    const ext = path.extname(filename).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.gif' ? 'image/gif' : 'image/jpeg';

    const prompt = `Look at this product image and the title "${productName}".
Identify the exact visual item shown, including its core object type, cartoon character/theme if any (e.g., Tom & Jerry, Godzilla, Astronaut), color, style, or specific shape.
Generate a short 3-6 word Google search query that describes this visual product precisely to find identical matches online.
Examples:
- Tom & Jerry sleeping on orange cushion dashboard ornament
- Cloud tulip night light flower mirror lamp
- 3D silicone ice cube mold bucket blue
Respond ONLY with the search query. Do not include markdown, explanations, or quotes.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: data.toString('base64') } }
            ]
          }]
        })
      }
    );

    if (response.ok) {
      const json = await response.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.trim()) {
        return text.trim().replace(/^["']|["']$/g, '');
      }
    }
  } catch (err: any) {
    console.error('[Gemini] Visual query extraction failed:', err.message);
  }
  return productName;
}

// ─── Serper.dev: find real competitor product URLs via Google Image Search ────
// ─── Serper.dev: find real competitor product URLs via standard Google Search ────
async function fetchCompetitorUrlsViaSerper(productName: string, originalName?: string): Promise<string[]> {
  const serperKey = process.env.SERPER_API_KEY;
  if (!serperKey) {
    console.warn('[Serper] SERPER_API_KEY not set. Skipping real URL fetch.');
    return [];
  }

  const MARKETPLACE_BLACKLIST = [
    'amazon.', 'flipkart.', 'meesho.', 'snapdeal.', 'jiomart.',
    'myntra.', 'ajio.', 'nykaa.', 'indiamart.', 'wikipedia.',
    'youtube.', 'instagram.', 'facebook.', 'twitter.', 'pinterest.',
    'linkedin.', 'reddit.', 'quora.', 'ebay.', 'aliexpress.', 'etsy.',
    'walmart.', 'target.', 'indiamart.', 'justdial.', 'alibaba.',
    'tradeindia.', 'glassdoor.', 'ambitionbox.', 'dhgate.', 'banggood.',
    'temu.', 'shein.', 'indiamart.', 'desertcart.', 'ubuy.', 'u-buy.',
    'fruugo.', 'grandado.', 'forbes.', 'nytimes.', 'healthline.', 'webmd.',
    'medicalnewstoday.', 'cosmopolitan.', 'rehabmart.', 'tiktok.',
    'goodhousekeeping.', 'businessinsider.', 'cnn.', 'bbc.', 'theguardian.',
    'wsj.', 'bloomberg.', 'reuters.', 'gq.', 'vogue.', 'allure.'
  ];

  const found: string[] = [];

  // Helper to check if a domain is a Shopify store
  const checkShopify = async (url: string): Promise<boolean> => {
    const lowerUrl = url.toLowerCase();
    
    // If it explicitly has myshopify.com in the link, it is 100% a Shopify store!
    if (lowerUrl.includes('myshopify.com')) {
      return true;
    }

    try {
      const origin = new URL(url).origin;
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 4000); // 4s timeout
      const res = await fetch(origin, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        signal: controller.signal
      });
      clearTimeout(id);
      if (res.ok) {
        const html = await res.text();
        const lower = html.toLowerCase();
        if (
          lower.includes('cdn.shopify.com') ||
          lower.includes('shopify.theme') ||
          lower.includes('myshopify.com') ||
          lower.includes('shopify-payment')
        ) {
          return true;
        }
      }
    } catch (err: any) {
      console.warn(`[Shopify Verification] Fetch error for ${url}:`, err.message);
    }

    // Fallback: If verification failed or was blocked by Cloudflare (non-200 or fetch error),
    // but the URL contains standard shopify product path /products/ and passed our blacklist,
    // we accept it as a high-confidence fallback.
    if (lowerUrl.includes('/products/') && !lowerUrl.includes('desertcart.') && !lowerUrl.includes('ubuy.')) {
      console.log(`[Shopify Verification] Fallback accepted for blocked URL: ${url}`);
      return true;
    }

    return false;
  };

  // Helper to fetch from a specific Serper endpoint
  const runQuery = async (query: string, endpoint: 'search' | 'images') => {
    try {
      console.log(`[Serper] Querying ${endpoint} with: "${query}"`);
      const res = await fetch(`https://google.serper.dev/${endpoint}`, {
        method: 'POST',
        headers: {
          'X-API-KEY': serperKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ q: query, gl: 'in', hl: 'en', num: 15 })
      });
      if (!res.ok) {
        const text = await res.text();
        console.warn(`[Serper] Query failed (${res.status}): ${text.slice(0, 200)}`);
        return;
      }

      const data = await res.json();
      const results = endpoint === 'search' ? (data.organic || []) : (data.images || []);

      const candidates: string[] = [];
      for (const r of results) {
        const url: string = r.link || '';
        const cleanUrl = url.split('?')[0];
        const isBlocked = MARKETPLACE_BLACKLIST.some(m => cleanUrl.toLowerCase().includes(m));
        if (!isBlocked && cleanUrl.startsWith('http') && !found.includes(cleanUrl) && !candidates.includes(cleanUrl)) {
          candidates.push(cleanUrl);
        }
      }

      // Verify candidates in parallel
      const checkResults = await Promise.all(candidates.map(async (url) => {
        const isShopify = await checkShopify(url);
        return { url, isShopify };
      }));

      // Add verified ones to found list
      for (const item of checkResults) {
        const cleanUrl = item.url.split('?')[0];
        if (item.isShopify && found.length < 3 && !found.includes(cleanUrl)) {
          console.log(`[Serper ${endpoint}] ✓ Verified Shopify competitor URL: ${cleanUrl}`);
          found.push(cleanUrl);
        }
      }
    } catch (err: any) {
      console.warn(`[Serper ${endpoint}] error:`, err.message);
    }
  };

  // Generate standard queries for a term (NO advanced search operators to avoid 400 Query Pattern limits)
  const getQueriesForTerm = (term: string) => [
    `${term} shopify`,
    `${term} myshopify`,
    `buy ${term} shopify`
  ];

  // Phase 1: Try with simplified name (productName)
  const term1 = productName.trim();
  if (term1) {
    const qs = getQueriesForTerm(term1);
    for (const q of qs) {
      if (found.length >= 3) break;
      await runQuery(q, 'search');
    }
  }

  // Phase 2 Fallback: Try with cleaned original name
  if (found.length < 3 && originalName) {
    const cleanOriginal = originalName.split(/[|—–:]| \- /)[0].trim().split(/\s+/).slice(0, 6).join(' ');
    if (cleanOriginal && cleanOriginal.toLowerCase() !== term1.toLowerCase()) {
      console.log(`[Serper Fallback] Sourcing empty, trying clean original name: "${cleanOriginal}"`);
      const qs = getQueriesForTerm(cleanOriginal);
      for (const q of qs) {
        if (found.length >= 3) break;
        await runQuery(q, 'search');
      }
    }
  }

  // Phase 3 Fallback: Try images if search returned nothing
  if (found.length < 3 && term1) {
    console.log(`[Serper Fallback] Search empty, trying standard image search for: "${term1}"`);
    const q = `${term1} shopify`;
    await runQuery(q, 'images');
  }

  console.log(`[Serper] Competitor URL search found ${found.length} links`);
  return found;
}

function getCoreNoun(name: string): string {
  // Remove special characters, brackets, parenthesis
  let clean = name.replace(/[()[\]{}]/g, ' ').replace(/\s+/g, ' ').trim();
  // Split by prepositions or common separators
  const parts = clean.split(/\b(with|for|and|in|of|at|on|all|one|by|—|-|\||:)\b/i);
  const subject = parts[0].trim();
  const words = subject.split(/\s+/).filter(w => w.length > 1);
  if (words.length >= 2) {
    let lastWords = words.slice(-2);
    if (lastWords[1].toLowerCase().match(/^(1pcs|2pcs|new|2026|pro|max|mini|lite)$/)) {
      return words.slice(-3, -1).join(' ');
    }
    return lastWords.join(' '); // Take the last 2 words
  }
  return subject;
}

// ─── Serper.dev: count real sellers per marketplace via Google site: search ──
async function countMarketplaceSellersViaSerper(
  productName: string, 
  adsQueryName?: string,
  competitorBrands?: string[]
): Promise<{
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

  // serperSearch: num=15 for ads (speed), num=30 for marketplaces (more organic hits)
  const serperSearch = async (query: string, domainPattern: string, num = 15): Promise<{ organic: number; total: number }> => {
    try {
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query, gl: 'in', hl: 'en', num })
      });
      if (!res.ok) {
        const err = await res.text();
        console.error(`[Serper] Search failed (${res.status}):`, err.slice(0, 200));
        return { organic: 0, total: 0 };
      }
      const data = await res.json();
      const organicList = data.organic || [];
      const matchingOrganic = organicList.filter((item: any) => {
        const link = item.link || '';
        const lower = link.toLowerCase();
        if (domainPattern.includes('facebook.com/ads/library')) {
          return lower.includes('facebook.com/ads/library') && (lower.includes('q=') || lower.includes('id=') || lower.includes('page_id='));
        }
        return lower.includes(domainPattern.toLowerCase());
      });

      const rawTotal = data.searchInformation?.totalResults || '0';
      const total = parseInt(rawTotal.replace(/,/g, '').replace(/\./g, ''), 10) || 0;

      return {
        organic: matchingOrganic.length,
        total: total > 0 ? Math.round(total * (matchingOrganic.length / Math.max(1, organicList.length))) : 0
      };
    } catch (err: any) {
      console.error('[Serper] Network error:', err.message);
      return { organic: 0, total: 0 };
    }
  };

  console.log(`[Serper] Counting real marketplace sellers for: "${productName}" (Ads query: "${adsQueryName || productName}")`);
  const adsQuery = (adsQueryName || productName).replace(/\s+/g, ' ').trim();
  const coreNoun = getCoreNoun(adsQuery);
  // Normalize web-search fallback (each organic hit = 1 listing; scale totalResults if present)
  const normalize = (data: { organic: number; total: number }, divisor: number, cap: number): number => {
    const fromTotal = data.total > 0 ? Math.round(data.total / divisor) : 0;
    return Math.min(cap, Math.max(data.organic, fromTotal));
  };

  // Dedicated helper to query Google Shopping SPECIFICALLY for a marketplace to bypass Amazon dominance in general queries
  const fetchMarketplaceShoppingCount = async (
    marketplaceQueryName: string,
    domainPattern: string,
    fallbackSearch: () => Promise<{ organic: number; total: number }>,
    divisor = 3
  ): Promise<number> => {
    try {
      const res = await fetch('https://google.serper.dev/shopping', {
        method: 'POST',
        headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: `${marketplaceQueryName} ${adsQuery}`, gl: 'in', hl: 'en', num: 100 })
      });
      if (!res.ok) {
        console.error(`[Serper Shopping] ${marketplaceQueryName} HTTP error: ${res.status}`);
        const fb = await fallbackSearch();
        return normalize(fb, divisor, 9999);
      }
      const d = await res.json();
      const items: any[] = d.shopping || [];
      
      const matchingItems = items.filter((item: any) => {
        const src = (item.source || '').toLowerCase();
        const lnk = (item.link || item.productLink || '').toLowerCase();
        return src.includes(domainPattern) || lnk.includes(domainPattern);
      });

      if (matchingItems.length === 0) {
        console.log(`[Serper Shopping] No matching Shopping items for ${marketplaceQueryName}. Using web fallback.`);
        const fb = await fallbackSearch();
        return normalize(fb, divisor, 9999);
      }

      const rawTotalStr = d.searchInformation?.totalResults || '0';
      const totalAll = parseInt(rawTotalStr.replace(/,/g, '').replace(/\./g, ''), 10) || 0;
      
      // Extrapolate matched items over the total results for this store-specific query
      let count = matchingItems.length;
      if (totalAll > items.length && items.length > 0) {
        const scale = totalAll / items.length;
        count = Math.round(matchingItems.length * scale);
      }
      
      console.log(`[Serper Shopping] ${marketplaceQueryName} -> Matches=${matchingItems.length}, TotalAll=${totalAll} -> Count=${count}`);
      return Math.max(matchingItems.length, count);
    } catch (e: any) {
      console.error(`[Serper Shopping] ${marketplaceQueryName} Error:`, e.message);
      const fb = await fallbackSearch();
      return normalize(fb, divisor, 9999);
    }
  };

  // Perform parallel queries for both individual Google Shopping metrics and Ads details
  const [amazon, flipkart, meesho, jiomart, specificAdsData] = await Promise.all([
    // Amazon
    fetchMarketplaceShoppingCount('amazon', 'amazon.', async () => {
      // Dual-query fallback for Amazon web search
      const [p1, p2] = await Promise.all([
        serperSearch(`amazon.in ${adsQuery}`, `amazon.`, 30),
        serperSearch(`amazon india ${adsQuery}`, `amazon.`, 30)
      ]);
      return {
        organic: Math.max(p1.organic, p2.organic),
        total: Math.max(p1.total, p2.total)
      };
    }, 3),

    // Flipkart
    fetchMarketplaceShoppingCount('flipkart', 'flipkart.com', () => serperSearch(`flipkart.com ${adsQuery}`, `flipkart.com`, 30), 3),

    // Meesho
    fetchMarketplaceShoppingCount('meesho', 'meesho.com', () => serperSearch(`meesho.com ${adsQuery}`, `meesho.com`, 30), 2),

    // JioMart
    fetchMarketplaceShoppingCount('jiomart', 'jiomart.com', () => serperSearch(`jiomart.com ${adsQuery}`, `jiomart.com`, 30), 2),

    // Ads base search
    serperSearch(`facebook.com/ads/library ${adsQuery}`, `facebook.com/ads/library`)
  ]);

  // Ads density calculation
  const normalizedSpecific = normalize(specificAdsData, 1, 9999);

  let normalizedBroad = 0;
  if (normalizedSpecific < 2 && coreNoun && coreNoun.toLowerCase() !== adsQuery.toLowerCase()) {
    console.log(`[Serper] Low ads count for specific query (${normalizedSpecific}). Fetching broad core noun: "${coreNoun}"`);
    const broadAdsData = await serperSearch(`facebook.com/ads/library ${coreNoun}`, `facebook.com/ads/library`);
    normalizedBroad = normalize(broadAdsData, 1, 9999);
  }

  let brandAdsCount = 0;
  if (competitorBrands && competitorBrands.length > 0) {
    const brandPromises = competitorBrands.map(async (brand) => {
      const data = await serperSearch(`facebook.com/ads/library ${brand}`, `facebook.com/ads/library`);
      return normalize(data, 1, 9999);
    });
    const brandResults = await Promise.all(brandPromises);
    brandAdsCount = brandResults.reduce((sum, val) => sum + val, 0);
  }

  const totalCampaigns = Math.max(normalizedSpecific + brandAdsCount, normalizedBroad);
  const adsCount = Math.max(1, totalCampaigns) * 4;

  const result = { amazon, flipkart, meesho, jiomart, adsCount };

  console.log(`[Serper] Final counts — Amazon: ${result.amazon}, Flipkart: ${result.flipkart}, Meesho: ${result.meesho}, JioMart: ${result.jiomart}, Ads: ${result.adsCount}`);
  return result;
}

// Extract primary keywords from title for Meta Ads Library search
async function getPrimaryKeywordsFromTitle(productName: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const runLocalCleanup = (name: string): string => {
    // Basic cleanup: remove everything after special chars, then remove stop words
    const clean = name.split(/[|—–:]| \- /)[0].trim();
    const words = clean.split(/\s+/);
    const stopWords = new Set([
      'perfect', 'made', 'easy', 'best', 'premium', 'hot', 'new', 'free', 'fast', 'discount', 'sale',
      'clearance', 'original', 'professional', 'high', 'quality', 'elegance', 'luxury', 'cute', 'beautiful',
      'fashion', 'trending', 'cool', 'special', 'great', 'use', 'quick', 'simple', 'awesome', 'amazing',
      'ultimate', 'exclusive', 'top', 'rated', 'guaranteed', 'deluxe', 'classic', 'modern', 'style', 'stylish',
      'expert', 'smart', 'super', 'ultra', 'mega', 'extreme', 'advanced', 'innovative', 'revolutionary',
      'genuine', 'pure', 'natural', 'organic', 'healthy', 'safe', 'effective', 'powerful', 'miracle', 'magic',
      'magical', 'essential', 'must', 'have', 'nice', 'wonderful', 'excellent', 'fabulous', 'outstanding',
      'superior', 'optimum', 'perfectly', 'easily', 'quickly', 'simply', 'with', 'and', 'for', 'the', 'a', 'an'
    ]);
    const filtered = words.filter(w => !stopWords.has(w.toLowerCase().replace(/[^a-z0-9]/gi, '')));
    if (filtered.length > 0) {
      return filtered.join(' ');
    }
    return clean;
  };

  if (!apiKey) {
    return runLocalCleanup(productName);
  }

  try {
    const sanitizedName = productName.replace(/[—–-]/g, ' ').replace(/\s+/g, ' ').trim();
    const prompt = `Analyze this product title: "${sanitizedName}".
Extract the primary product keywords that would be most effective for searching related active ads in the Meta Ads Library.
These should be the main descriptive search terms (usually 2-3 words) that describe the product itself, not brands or promotional adjectives.
Example:
Input: "Perfect Winged Liner Made Easy! Double-Ended Eyeliner Stamp" -> Output: "eyeliner stamp"
Input: "Godzilla Ice Cube Mold – 3D Silicone Freezer Tray for Drinks" -> Output: "ice cube mold"
Input: "Premium Wireless Bluetooth Earbuds with Noise Cancellation" -> Output: "wireless earbuds"

Respond ONLY with the keywords, with no other text. Do not include markdown, explanations, or quotes. Ensure all words in the output are separated by proper spaces.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );
    if (!response.ok) {
      return runLocalCleanup(productName);
    }
    const d = await response.json();
    const txt = d.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (txt) {
      return txt.replace(/\s+/g, ' ');
    }
    return runLocalCleanup(productName);
  } catch (err) {
    console.error('[Keywords] Error extracting primary keywords:', err);
    return runLocalCleanup(productName);
  }
}

// ─── Main export: orchestrate both sources ────────────────────────────────
export async function analyzeCompetitorsWithAI(productName: string, images?: string[]): Promise<{
  amazon: number;
  flipkart: number;
  meesho: number;
  jiomart: number;
  shopifyStores: string[];
  adsCount: number;
  simplifiedName: string;
  primaryAdsKeywords: string;
}> {
  console.log(`[Competitor Analysis] Starting for: "${productName}"...`);

  // Simplify the product name first using Gemini/multimodal image support
  const simplifiedName = await getSimplifiedProductName(productName, images || []);
  console.log(`[Competitor Analysis] Simplified product name: "${simplifiedName}"`);

  // Scan image using Gemini to extract core visual search keywords (fallback to simplifiedName)
  let visualQuery = simplifiedName;
  if (images && images.length > 0) {
    visualQuery = await getVisualSearchQueryFromImage(productName, images);
    console.log(`[Competitor Analysis] Visual search query extracted: "${visualQuery}"`);
  }

  // Extract primary keywords from title for Meta Ads Library search
  const primaryAdsKeywords = await getPrimaryKeywordsFromTitle(productName);
  console.log(`[Competitor Analysis] Primary Ads keywords: "${primaryAdsKeywords}"`);

  // 1. Fetch Shopify stores first
  const serperUrls = await fetchCompetitorUrlsViaSerper(visualQuery, productName);

  // 2. Extract competitor brand names
  const competitorBrands = serperUrls.map(url => {
    try {
      const hostname = new URL(url).hostname;
      const parts = hostname.replace('www.', '').split('.');
      return parts.length > 0 ? parts[0] : '';
    } catch {
      return '';
    }
  }).filter(Boolean);

  // 3. Count marketplace sellers and ads count (passing competitor brands and primaryAdsKeywords)
  const counts = await countMarketplaceSellersViaSerper(simplifiedName, primaryAdsKeywords, competitorBrands);

  const shopifyStores = serperUrls.length > 0
    ? serperUrls
    : ['No live competitor URLs found'];

  return {
    ...counts,
    shopifyStores,
    simplifiedName: visualQuery,
    primaryAdsKeywords
  };
}
