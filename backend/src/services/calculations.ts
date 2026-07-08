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
  amazonBestSellerCountries: string[]
): SourcingCalculations {
  // 1. Margin
  const margin = Math.max(0, sellingPrice - cost);

  // 2. Margin Percentage
  const marginPercentage = sellingPrice > 0 ? parseFloat(((margin / sellingPrice) * 100).toFixed(2)) : 0;

  // 3. Profit After Logistics (Net Profit)
  const netProfit = parseFloat((sellingPrice - cost - shippingCost).toFixed(2));

  // 4. Calculate Opportunity Score (0-100)
  let score = 0;

  // A. Margin Component (Max 35 points)
  if (marginPercentage >= 60) {
    score += 35;
  } else if (marginPercentage >= 50) {
    score += 30;
  } else if (marginPercentage >= 40) {
    score += 25;
  } else if (marginPercentage >= 30) {
    score += 20;
  } else if (marginPercentage >= 20) {
    score += 10;
  }

  // B. Competition / First Mover Advantage Component (Max 25 points)
  if (firstMoverAdvantage === 'YES') {
    score += 25;
  } else if (firstMoverAdvantage === 'MEDIUM') {
    score += 15;
  } else if (firstMoverAdvantage === 'LOW') {
    score += 5;
  }

  // C. RTO Risk Component (Max 20 points)
  // Low RTO percentage means lower risk and higher opportunity
  if (rtoPercentage <= 10) {
    score += 20;
  } else if (rtoPercentage <= 15) {
    score += 15;
  } else if (rtoPercentage <= 20) {
    score += 10;
  } else if (rtoPercentage <= 25) {
    score += 5;
  }

  // D. Best Seller Countries / Global Market Size Component (Max 20 points)
  const countriesCount = amazonBestSellerCountries.length;
  if (countriesCount >= 4) {
    score += 20;
  } else if (countriesCount === 3) {
    score += 15;
  } else if (countriesCount === 2) {
    score += 10;
  } else if (countriesCount === 1) {
    score += 5;
  }

  return {
    margin: parseFloat(margin.toFixed(2)),
    marginPercentage,
    netProfit,
    opportunityScore: Math.min(100, Math.max(0, score))
  };
}
