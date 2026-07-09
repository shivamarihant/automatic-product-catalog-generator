export interface SourcingCalculations {
  margin: number;
  marginPercentage: number;
  netProfit: number;
  opportunityScore: number;
}

export function performCalculations(
  cost: number,
  sellingPrice: number,
  shippingCost: number,
  rtoPercentage: number,
  firstMoverAdvantage: 'YES' | 'MEDIUM' | 'LOW',
  shopifyStores: string[],
  marketplaceSellers: { amazon: number; flipkart: number; meesho: number; jiomart: number },
  upsellPotential: 'YES' | 'MEDIUM' | 'LOW',
  lowerCac: 'YES' | 'MEDIUM' | 'LOW'
): SourcingCalculations {
  // 1. Margin
  const margin = Math.max(0, sellingPrice - cost);

  // 2. Margin Percentage
  const marginPercentage = sellingPrice > 0 ? parseFloat(((margin / sellingPrice) * 100).toFixed(2)) : 0;

  // 3. Profit After Logistics (Net Profit)
  const netProfit = parseFloat((sellingPrice - cost - shippingCost).toFixed(2));

  // 4. Calculate Opportunity Score (0-100)
  let score = 0;

  // A. Competitor Analysis & Traction (Shopify stores) - 10 points
  const shopifyCount = shopifyStores.filter(
    (store) => store && store.trim() !== '' && !store.includes('No live competitor URLs found')
  ).length;

  if (shopifyCount > 0) {
    if (shopifyCount <= 2) {
      score += 10;
    } else if (shopifyCount <= 5) {
      score += 6;
    } else {
      score += 3;
    }
  } else {
    // 0 Shopify stores
    score += 8; // Good potential but unproven traction
  }

  // B. Gross Margin - 15 points
  if (marginPercentage >= 60) {
    score += 15;
  } else if (marginPercentage >= 50) {
    score += 12;
  } else if (marginPercentage >= 40) {
    score += 9;
  } else if (marginPercentage >= 30) {
    score += 6;
  } else if (marginPercentage >= 20) {
    score += 3;
  }

  // C. First-Mover Advantage - 25 points
  if (firstMoverAdvantage === 'YES') {
    score += 25;
  } else if (firstMoverAdvantage === 'MEDIUM') {
    score += 15;
  } else if (firstMoverAdvantage === 'LOW') {
    score += 5;
  }

  // D. Fewer Listings on Amazon, Flipkart, and Meesho - 15 points
  const amazonCount = marketplaceSellers.amazon || 0;
  const flipkartCount = marketplaceSellers.flipkart || 0;
  const meeshoCount = marketplaceSellers.meesho || 0;
  const totalListings = amazonCount + flipkartCount + meeshoCount;

  if (totalListings <= 5) {
    score += 15;
  } else if (totalListings <= 15) {
    score += 10;
  } else if (totalListings <= 30) {
    score += 5;
  } else {
    score += 1;
  }

  // E. RTO Risk - 15 points
  if (rtoPercentage <= 10) {
    score += 15;
  } else if (rtoPercentage <= 15) {
    score += 11;
  } else if (rtoPercentage <= 20) {
    score += 7;
  } else if (rtoPercentage <= 25) {
    score += 3;
  }

  // F. Upsell & Bundle Potential (AOV & LTV Growth) - 10 points
  if (upsellPotential === 'YES') {
    score += 10;
  } else if (upsellPotential === 'MEDIUM') {
    score += 5;
  }

  // G. Lower CAC - 10 points
  if (lowerCac === 'YES') {
    score += 10;
  } else if (lowerCac === 'MEDIUM') {
    score += 5;
  }

  return {
    margin: parseFloat(margin.toFixed(2)),
    marginPercentage,
    netProfit,
    opportunityScore: Math.min(100, Math.max(0, score))
  };
}
