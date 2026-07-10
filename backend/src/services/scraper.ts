import dns from 'dns';

export interface ScrapedIntelligence {
  amazonBestSellerCountries: string[];
  firstMoverAdvantage: 'YES' | 'MEDIUM' | 'LOW';
  estimatedCompetition: string;
  approxSellers: number;
  metaAdsCount: number;
}

// Check internet connection
function checkInternet(): Promise<boolean> {
  return new Promise((resolve) => {
    dns.lookup('google.com', (err) => {
      resolve(err === null);
    });
  });
}

// Lightweight HTTP fetcher helper using native fetch
async function fetchWithTimeout(url: string, options: any = {}, timeout = 5000): Promise<string> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        ...(options.headers || {})
      }
    });
    clearTimeout(id);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// Fallback heuristics based on keywords if scraping fails
function getHeuristicData(productName: string): ScrapedIntelligence {
  const nameLower = productName.toLowerCase();
  
  // 1. Determine best seller countries
  const countries = ['India']; // India is default since the user's focus is India
  
  // Tech/Gaming products are popular globally
  if (nameLower.includes('game') || nameLower.includes('gaming') || nameLower.includes('wireless') || nameLower.includes('mouse') || nameLower.includes('keyboard') || nameLower.includes('tech') || nameLower.includes('charger')) {
    countries.push('USA', 'UK', 'Germany', 'Canada');
  }
  // Home/Kitchen/Garden
  else if (nameLower.includes('kitchen') || nameLower.includes('organizer') || nameLower.includes('cup') || nameLower.includes('bottle') || nameLower.includes('cutter')) {
    countries.push('USA', 'UK', 'Australia');
  }
  // Fashion/Apparel
  else if (nameLower.includes('saree') || nameLower.includes('kurta') || nameLower.includes('lehenga')) {
    // Specifically South Asian interest
    countries.push('UAE', 'UK');
  } else {
    countries.push('USA');
  }

  // 2. Estimate First Mover Advantage & Competition & Meta Ads
  let firstMover: 'YES' | 'MEDIUM' | 'LOW' = 'MEDIUM';
  let estimatedComp = 'Medium';
  let approxSellers = 12;
  let metaAdsCount = 15;

  // Very common/saturated keywords
  const saturatedKeywords = ['tshirt', 'shirt', 'shoe', 'mouse', 'bottle', 'charger', 'cable', 'cover', 'case'];
  const nicheKeywords = ['ergonomic back', 'automatic self', 'smart auto', 'magnetic anti', 'custom 3d', 'biodegradable'];

  const hasSaturated = saturatedKeywords.some(kw => nameLower.includes(kw));
  const hasNiche = nicheKeywords.some(kw => nameLower.includes(kw));

  if (hasSaturated) {
    firstMover = 'LOW';
    estimatedComp = 'High';
    approxSellers = 45;
    metaAdsCount = 58;
  } else if (hasNiche) {
    firstMover = 'YES';
    estimatedComp = 'Low';
    approxSellers = 4;
    metaAdsCount = 2;
  } else {
    // Semi-randomized realistic values based on length of name (longer/more specific names usually have lower competition)
    if (productName.split(' ').length > 4) {
      firstMover = 'YES';
      estimatedComp = 'Low';
      approxSellers = 7;
      metaAdsCount = 4;
    } else {
      firstMover = 'MEDIUM';
      estimatedComp = 'Medium';
      approxSellers = 18;
      metaAdsCount = 22;
    }
  }

  return {
    amazonBestSellerCountries: Array.from(new Set(countries)),
    firstMoverAdvantage: firstMover,
    estimatedCompetition: estimatedComp,
    approxSellers,
    metaAdsCount
  };
}

export async function fetchMarketIntelligence(productName: string, simplifiedName?: string): Promise<ScrapedIntelligence> {
  const isOnline = await checkInternet();
  if (!isOnline) {
    console.warn('No internet connection. Using keyword-based heuristics.');
    return getHeuristicData(productName);
  }

  try {
    console.log(`Fetching market intelligence for: "${productName}"`);
    const searchTerms = simplifiedName || productName;
    const countriesFound = new Set<string>();

    // 1. Try Serper (Google) search for each Amazon country domain individually
    const serperKey = process.env.SERPER_API_KEY;
    if (serperKey) {
      const countryDomains: { domain: string; country: string }[] = [
        { domain: 'amazon.in', country: 'India' },
        { domain: 'amazon.com', country: 'USA' },
        { domain: 'amazon.co.uk', country: 'UK' },
        { domain: 'amazon.ca', country: 'Canada' },
        { domain: 'amazon.de', country: 'Germany' },
        { domain: 'amazon.com.au', country: 'Australia' },
        { domain: 'amazon.ae', country: 'UAE' },
      ];

      // Search each domain in parallel (no quoted operators — free-tier compatible)
      const domainResults = await Promise.all(
        countryDomains.map(async ({ domain, country }) => {
          try {
            const res = await fetch('https://google.serper.dev/search', {
              method: 'POST',
              headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
              body: JSON.stringify({ q: `${domain} ${searchTerms}`, gl: 'in', hl: 'en', num: 5 })
            });
            if (!res.ok) return null;
            const data = await res.json();
            const organic = data.organic || [];
            const hasMatch = organic.some((item: any) => (item.link || '').toLowerCase().includes(domain));
            return hasMatch ? country : null;
          } catch {
            return null;
          }
        })
      );

      domainResults.forEach(country => { if (country) countriesFound.add(country); });
      console.log(`[Serper] Amazon Best Seller Countries found: ${Array.from(countriesFound).join(', ')}`);
    }

    // If no amazon indexed pages found, check fallback search to estimate competition
    const ddgGeneralUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(productName)}`;
    const generalHtml = await fetchWithTimeout(ddgGeneralUrl, {}, 6000);

    // Count result links to approximate sellers and competition
    // result__snippet or result__url count on the first page
    const resultCount = (generalHtml.match(/class="result__snippet"/g) || []).length;
    
    let approxSellers = Math.max(2, resultCount * 2); // heuristic multiplication
    let firstMoverAdvantage: 'YES' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    let estimatedCompetition = 'Medium';

    if (approxSellers < 10) {
      firstMoverAdvantage = 'YES';
      estimatedCompetition = 'Low';
    } else if (approxSellers > 30) {
      firstMoverAdvantage = 'LOW';
      estimatedCompetition = 'High';
    }

    // Always ensure at least India is present if list is empty
    if (countriesFound.size === 0) {
      countriesFound.add('India');
      if (approxSellers > 20) {
        countriesFound.add('USA');
      }
    }

    // Fetch Meta Ads indexed library references
    let metaAdsCount = 0;
    let serperSuccess = false;

    if (serperKey) {
      try {
        const query = `facebook.com/ads/library ${searchTerms}`;
        const res = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: query, gl: 'in', hl: 'en', num: 15 })
        });
        if (res.ok) {
          const data = await res.json();
          const organic = data.organic || [];
          const matchingOrganic = organic.filter((item: any) => {
            const link = item.link || '';
            return link.toLowerCase().includes('facebook.com/ads/library');
          });
          if (matchingOrganic.length > 0) {
            metaAdsCount = Math.max(2, matchingOrganic.length * 4);
          } else {
            const fbMatching = organic.filter((item: any) => (item.link || '').toLowerCase().includes('facebook.com'));
            metaAdsCount = fbMatching.length > 0 ? fbMatching.length * 2 : 0;
          }
          serperSuccess = true;
          console.log(`[Serper Meta Ads] Successfully fetched ad count from Serper: ${metaAdsCount}`);
        }
      } catch (err) {
        console.error('Error fetching Meta Ads count from Serper:', err);
      }
    }

    if (!serperSuccess) {
      try {
        const fbSearchUrl = `https://html.duckduckgo.com/html/?q=site:facebook.com/ads/library+%22${encodeURIComponent(productName)}%22`;
        const fbHtml = await fetchWithTimeout(fbSearchUrl, {}, 5000);
        const fbResultsCount = (fbHtml.match(/class="result__snippet"/g) || []).length;
        if (fbResultsCount > 0) {
          metaAdsCount = Math.max(2, fbResultsCount * 6 + Math.floor(Math.random() * 5));
        } else {
          // Fallback: estimate based on competition
          metaAdsCount = firstMoverAdvantage === 'YES' 
            ? Math.floor(Math.random() * 4) 
            : firstMoverAdvantage === 'MEDIUM' 
            ? 8 + Math.floor(Math.random() * 15) 
            : 25 + Math.floor(Math.random() * 25);
        }
      } catch (err) {
        console.warn('Meta Ads search scrape failed. Using fallback estimate.');
        metaAdsCount = firstMoverAdvantage === 'YES' ? 3 : (firstMoverAdvantage === 'MEDIUM' ? 15 : 42);
      }
    }

    return {
      amazonBestSellerCountries: Array.from(countriesFound),
      firstMoverAdvantage,
      estimatedCompetition,
      approxSellers,
      metaAdsCount
    };
  } catch (error) {
    console.error('Error fetching market intelligence from internet:', error);
    console.log('Falling back to keyword heuristics.');
    return getHeuristicData(productName);
  }
}
