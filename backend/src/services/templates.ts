import { Product, Catalog } from '../db';
import fs from 'fs';
import path from 'path';

const LOGO_BASE64 = fs.readFileSync(path.join(process.cwd(), 'src/assets/importerr-logo.png')).toString('base64');
const LOGO_URI = `data:image/png;base64,${LOGO_BASE64}`;

function getCleanAdsQuery(name: string): string {
  if (!name) return '';
  let clean = name.replace(/[()[\]{}]/g, ' ').replace(/\s+/g, ' ').trim();
  const parts = clean.split(/\b(with|for|and|in|of|at|on|all|one|by|—|–|-|\||:)\b/i);
  const subject = parts[0].trim();
  const words = subject.split(/\s+/).filter(w => w.length > 1);
  if (words.length >= 2) {
    let lastWords = words.slice(-2);
    if (lastWords[1].toLowerCase().match(/^(1pcs|2pcs|new|2026|pro|max|mini|lite)$/)) {
      return words.slice(-3, -1).join(' ');
    }
    return lastWords.join(' ');
  }
  return subject;
}

export function getCatalogTemplateHtml(rawProduct: Product, catalog: Catalog): string {
  const product = {
    ...rawProduct,
    calculations: catalog.calculations || rawProduct.calculations,
    fetchedData: catalog.fetchedData || rawProduct.fetchedData,
    aiRecommendation: catalog.aiRecommendation || rawProduct.aiRecommendation
  };

  const parseWeightToKg = (weightStr: string): number => {
    if (!weightStr) return 0;
    const cleaned = weightStr.trim().toLowerCase();
    const num = parseFloat(cleaned);
    if (isNaN(num)) return 0;
    if (cleaned.includes('kg')) {
      return num;
    }
    if (cleaned.includes('g')) {
      return num / 1000;
    }
    return num >= 10 ? num / 1000 : num;
  };

  const parsedActualWeight = parseWeightToKg(product.logistics.weight);
  const dimensionalWeight = (product.logistics.dimensions.length * product.logistics.dimensions.width * product.logistics.dimensions.height) / 5000;
  const courierVolumetricWeight = Math.max(parsedActualWeight, dimensionalWeight).toFixed(2);

  const formattedDate = new Date(catalog.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const heroImage = product.images.length > 0 ? product.images[0] : '';
  const galleryImages = product.images.slice(1, 4);
  const defaultPlaceholders = [
    'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=300&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=300&auto=format&fit=crop&q=60'
  ];
  const displayedGallery = [...galleryImages];
  while (displayedGallery.length < 3) {
    displayedGallery.push(defaultPlaceholders[displayedGallery.length]);
  }

  // Generate HTML for gallery
  const galleryHtml = displayedGallery
    .map(
      (img) => `<div class="gallery-item">
                  <img src="${img}" alt="Product image" onerror="this.src='https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=300&auto=format&fit=crop&q=60'" />
                </div>`
    )
    .join('');

  // Generate countries list
  const countriesHtml = product.fetchedData.amazonBestSellerCountries
    .map(
      (c: string) => `<span class="badge badge-blue">
                <span class="flag-icon">📍</span> ${c}
              </span>`
    )
    .join('');

  // Generate Shopify store list
  const shopifyHtml = product.shopifyStores.length > 0 
    ? `<div class="shopify-container">` + product.shopifyStores.map((store: string) => {
        const isNotFound = store.includes('No live competitor URLs found');
        if (isNotFound) {
          return `<div class="shopify-item"><div class="shopify-dot" style="background-color: #94a3b8;"></div> <span style="font-size: 11px; color: #64748b; font-style: italic;">No live competitor URLs found</span></div>`;
        }
        const url = store.startsWith('http') ? store : `https://${store}`;

        return `
          <div class="shopify-item">
            <div class="shopify-dot"></div> 
            <a href="${url}" target="_blank" style="color: inherit; text-decoration: none; border-bottom: 1px dotted #cbd5e1; font-weight: 500; font-size: 11px; display: inline-block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${store}</a>
          </div>
        `;
      }).join('') + `</div>`
    : '<div style="font-size: 11px; color: #94a3b8; font-style: italic;">No live competitor URLs found</div>';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${catalog.catalogTitle} - ${product.productName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Outfit:wght@300;400;500;600;700&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Outfit', sans-serif;
      color: #0f172a;
      line-height: 1.5;
      background-color: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 20mm 18mm;
      margin: 0 auto;
      background: white;
      position: relative;
      page-break-after: always;
      display: flex;
      flex-direction: column;
    }

    /* Page break adjustments */
    @media print {
      body {
        background: none;
      }
      .page {
        margin: 0;
        border: initial;
        border-radius: initial;
        width: initial;
        min-height: initial;
        box-shadow: initial;
        background: initial;
        page-break-after: always;
      }
    }

    /* Magazine Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-bottom: 1px solid #0f172a;
      padding-bottom: 4mm;
      margin-bottom: 8mm;
    }

    .logo-container img {
      max-height: 40px;
      object-fit: contain;
    }

    .logo-placeholder {
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      font-size: 22px;
      color: #0f172a;
      letter-spacing: -0.5px;
      display: flex;
      align-items: center;
      gap: 6px;
      text-transform: uppercase;
    }

    .logo-dot {
      width: 8px;
      height: 8px;
      background-color: #6366f1;
      border-radius: 50%;
    }

    .meta-tag {
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 1.5px;
    }

    /* Title Block */
    .title-area {
      margin-bottom: 8mm;
    }

    .catalog-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 3px;
      color: #6366f1;
      font-weight: 700;
      margin-bottom: 2.5mm;
    }

    .product-name {
      font-family: 'Lora', serif;
      font-size: 34px;
      font-weight: 600;
      color: #0f172a;
      line-height: 1.15;
      letter-spacing: -0.5px;
    }

    /* Editorial Hero Layout */
    .hero-container {
      display: grid;
      grid-template-columns: 1.4fr 0.6fr;
      gap: 5mm;
      margin-bottom: 10mm;
    }

    .hero-image-wrapper {
      height: 85mm;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.08);
      background-color: #f8fafc;
    }

    .hero-image-wrapper img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .side-gallery {
      display: grid;
      grid-template-rows: repeat(3, 1fr);
      gap: 4mm;
      height: 85mm;
    }

    .gallery-item {
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 10px -2px rgba(15, 23, 42, 0.06);
      background-color: #f8fafc;
    }

    .gallery-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* Section Title */
    .section-title {
      font-family: 'Lora', serif;
      font-size: 16px;
      font-weight: 600;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 2mm;
      margin-bottom: 5mm;
      margin-top: 4mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* Sourcing Metrics Grid */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 4mm;
      margin-bottom: 8mm;
    }

    .summary-card {
      background-color: #f8fafc;
      border: 1px solid #f1f5f9;
      border-radius: 12px;
      padding: 4mm;
      text-align: left;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 20mm;
    }

    .summary-card.cost { border-top: 3px solid #6366f1; }
    .summary-card.moq { border-top: 3px solid #f59e0b; }
    .summary-card.retail { border-top: 3px solid #8b5cf6; }
    .summary-card.profit { border-top: 3px solid #10b981; }

    .summary-card-title {
      font-size: 9px;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .summary-card-value {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.5px;
    }

    .summary-card-value.highlight { color: #8b5cf6; }
    .summary-card-value.success { color: #10b981; }

    /* Editorial Data Table */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8mm;
    }

    .data-table th {
      background-color: #fafafa;
      text-align: left;
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      padding: 3mm 4mm;
      border-bottom: 1px solid #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .data-table td {
      padding: 3.5mm 4mm;
      font-size: 12px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }

    .data-table tr:last-child td {
      border-bottom: none;
    }

    /* Score meter and intelligence grid */
    .market-grid {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 8mm;
      margin-bottom: 8mm;
    }

    /* Opportunity Ring Card */
    .opportunity-card {
      border: 1px solid #f1f5f9;
      border-radius: 16px;
      padding: 6mm;
      background: #fafafa;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }

    .score-circle {
      position: relative;
      width: 34mm;
      height: 34mm;
      border-radius: 50%;
      background: conic-gradient(#6366f1 ${product.calculations.opportunityScore * 3.6}deg, #e2e8f0 0deg);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 4mm;
    }

    .score-inner {
      width: 28mm;
      height: 28mm;
      border-radius: 50%;
      background-color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px -2px rgba(15, 23, 42, 0.05);
    }

    .score-number {
      font-size: 32px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1;
      letter-spacing: -0.5px;
    }

    .score-label {
      font-size: 9px;
      color: #64748b;
      font-weight: 700;
      margin-top: 1mm;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .opportunity-status {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2mm;
    }

    .status-excellent { color: #10b981; }
    .status-good { color: #6366f1; }
    .status-moderate { color: #f59e0b; }
    .status-low { color: #ef4444; }

    .opportunity-comment {
      font-size: 11px;
      color: #64748b;
      line-height: 1.4;
    }

    /* Badges */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 1.5mm 3mm;
      border-radius: 20px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge-blue { background-color: #e0e7ff; color: #4338ca; }
    .badge-green { background-color: #d1fae5; color: #065f46; }
    .badge-yellow { background-color: #fef3c7; color: #92400e; }
    .badge-red { background-color: #fee2e2; color: #991b1b; }

    /* Shopify list items */
    .shopify-container {
      display: flex;
      flex-direction: column;
      gap: 2mm;
    }

    .shopify-item {
      font-size: 12px;
      color: #334155;
      background-color: #f8fafc;
      border: 1px solid #f1f5f9;
      padding: 2.5mm 3.5mm;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 2mm;
    }

    .shopify-dot {
      width: 6px;
      height: 6px;
      background-color: #10b981;
      border-radius: 50%;
    }

    /* Competitor Saturation Card */
    .competitor-list {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 3mm;
      margin-bottom: 4mm;
    }

    .competitor-card {
      background-color: #f8fafc;
      border: 1px solid #f1f5f9;
      padding: 3.5mm 4mm;
      border-radius: 12px;
      font-size: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .competitor-name {
      font-weight: 500;
      color: #475569;
    }

    .competitor-count {
      font-weight: 700;
      color: #0f172a;
    }

    /* Quote Block Recommendation */
    .recommendation-box {
      background-color: #f8fafc;
      border-left: 4px solid #6366f1;
      border-radius: 4px 12px 12px 4px;
      padding: 6mm 7mm;
      margin-top: 5mm;
      margin-bottom: 8mm;
      position: relative;
    }

    .recommendation-header {
      font-size: 10px;
      font-weight: 700;
      color: #6366f1;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 2.5mm;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .recommendation-content {
      font-family: 'Lora', serif;
      font-size: 13px;
      font-style: italic;
      color: #334155;
      line-height: 1.6;
    }

    /* Footer styling */
    .footer {
      margin-top: auto;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #94a3b8;
      border-top: 1px solid #f1f5f9;
      padding-top: 4mm;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .market-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 2mm;
      margin-top: 1mm;
    }
  </style>
</head>
<body>

  <!-- PAGE 1: COVER & OVERVIEW -->
  <div class="page">
    <div class="header">
      <div class="logo-container">
        ${
          catalog.logoUrl
            ? `<img src="${catalog.logoUrl}" alt="Company Logo" />`
            : `<img src="${LOGO_URI}" alt="importerr.com" style="height: 24px; object-fit: contain; filter: grayscale(100%); opacity: 0.8;" />`
        }
      </div>
      <div class="meta-tag">Sourcing Report Sheet</div>
    </div>

    <div class="title-area">
      <div class="catalog-title">${catalog.catalogTitle}</div>
      <div class="product-name">${product.productName}</div>
    </div>

    <div class="hero-container">
      <div class="hero-image-wrapper">
        <img src="${heroImage}" alt="Product Hero Image" onerror="this.src='https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80'" />
      </div>
      <div class="side-gallery">
        ${
          galleryHtml ||
          `
          <div class="gallery-item"><img src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=300&auto=format&fit=crop&q=60" /></div>
          <div class="gallery-item"><img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&auto=format&fit=crop&q=60" /></div>
          <div class="gallery-item"><img src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=300&auto=format&fit=crop&q=60" /></div>
          `
        }
      </div>
    </div>

    <div class="section-title">Sourcing Metrics & Margin Analysis</div>
    <div class="summary-grid">
      <div class="summary-card cost">
        <div class="summary-card-title">Cost Price</div>
        <div class="summary-card-value">₹${product.cost}</div>
      </div>
      <div class="summary-card moq">
        <div class="summary-card-title">Sourcing MOQ</div>
        <div class="summary-card-value">${product.moq} Pcs</div>
      </div>
      <div class="summary-card retail">
        <div class="summary-card-title">Selling Price (Est)</div>
        <div class="summary-card-value highlight">₹${product.tentativeSellingPrice}</div>
      </div>
      <div class="summary-card profit">
        <div class="summary-card-title">Net Unit Profit</div>
        <div class="summary-card-value success">₹${product.calculations.netProfit}</div>
      </div>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>Metric Name</th>
          <th>Sourcing Benchmark</th>
          <th>Sourcing Value</th>
          <th>Evaluation</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Product Cost Price (INR)</td>
          <td>Standard landed value</td>
          <td>₹${product.cost}</td>
          <td>Landed Unit Sourcing Cost</td>
        </tr>
        <tr>
          <td>Estimated Selling Price</td>
          <td>Target Indian retail price</td>
          <td>₹${product.tentativeSellingPrice}</td>
          <td>Target retail price bracket</td>
        </tr>
        <tr>
          <td>Gross Margin per Unit</td>
          <td>Calculated Profit Delta</td>
          <td>₹${product.calculations.margin}</td>
          <td>Margin Ratio: <strong>${product.calculations.marginPercentage}%</strong></td>
        </tr>
        <tr>
          <td>Logistics Shipping Cost (${product.logistics.shippingMode === 'sea' ? 'By Sea' : 'By Air'})</td>
          <td>Landed courier rate (${product.logistics.shippingMode === 'sea' ? '45 days' : '15 days'})</td>
          <td>₹${product.logistics.shippingCost}</td>
          <td>Local delivery charge</td>
        </tr>
        <tr>
          <td>Net Sourcing Profit</td>
          <td>Final pocket margin</td>
          <td style="color:#10b981; font-weight: 600;">₹${product.calculations.netProfit}</td>
          <td>Profit after sourcing & logistics</td>
        </tr>
        <tr>
          <td>RTO Return Risk</td>
          <td>Industry benchmark &lt; 20%</td>
          <td style="${product.rtoPercentage > 20 ? 'color:#ef4444;' : 'color:#0f172a;'}">${product.rtoPercentage}%</td>
          <td>${
            product.rtoPercentage > 20
              ? '<span class="badge badge-red">High Risk</span>'
              : '<span class="badge badge-green">Healthy</span>'
          }</td>
        </tr>
        <tr>
          <td>Upsell & Bundle Potential</td>
          <td>AOV & LTV Growth potential</td>
          <td>${product.upsellPotential || 'MEDIUM'}</td>
          <td>${
            product.upsellPotential === 'YES'
              ? '<span class="badge badge-green">High Potential</span>'
              : product.upsellPotential === 'MEDIUM'
              ? '<span class="badge badge-yellow">Medium</span>'
              : '<span class="badge badge-red">Low</span>'
          }</td>
        </tr>
        <tr>
          <td>Lower CAC</td>
          <td>Customer Acquisition Cost benefit</td>
          <td>${product.lowerCac || 'MEDIUM'}</td>
          <td>${
            product.lowerCac === 'YES'
              ? '<span class="badge badge-green">High Advantage</span>'
              : product.lowerCac === 'MEDIUM'
              ? '<span class="badge badge-yellow">Medium</span>'
              : '<span class="badge badge-red">Low</span>'
          }</td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      <div>Prepared By: ${catalog.preparedBy}</div>
      <div>Generated On: ${formattedDate}</div>
      <div>Page 1 of 2</div>
    </div>
  </div>

  <!-- PAGE 2: MARKET INTELLIGENCE & RECOMMENDATION -->
  <div class="page">
    <div class="header">
      <img src="${LOGO_URI}" alt="importerr.com" style="height: 18px; object-fit: contain; filter: grayscale(100%); opacity: 0.8;" />
      <div class="meta-tag">Competitor & Intelligence Analysis</div>
    </div>

    <div class="market-grid">
      <div>
        <div class="section-title">Market Saturation Metrics</div>
        <div class="competitor-list">
          <div class="competitor-card">
            <span class="competitor-name">Amazon India</span>
            <span class="competitor-count">${product.marketplaceSellers.amazon} Sellers</span>
          </div>
          <div class="competitor-card">
            <span class="competitor-name">Flipkart India</span>
            <span class="competitor-count">${product.marketplaceSellers.flipkart} Sellers</span>
          </div>
          <div class="competitor-card">
            <span class="competitor-name">Meesho India</span>
            <span class="competitor-count">${product.marketplaceSellers.meesho} Sellers</span>
          </div>
          <div class="competitor-card">
            <span class="competitor-name">JioMart</span>
            <span class="competitor-count">${product.marketplaceSellers.jiomart} Sellers</span>
          </div>
        </div>

        <div class="section-title" style="margin-top: 5mm;">Meta Ads Density</div>
        <div class="competitor-card" style="border-left: 4px solid #6366f1; display: flex; justify-content: space-between; align-items: center; gap: 4mm;">
          <span class="competitor-name">Active Product Creatives (Meta Ads Library)</span>
          <a class="competitor-count" style="color: #6366f1; font-size: 13px; white-space: nowrap; flex-shrink: 0; text-decoration: none;" href="https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=IN&q=${encodeURIComponent(getCleanAdsQuery(product.primaryAdsKeywords || product.simplifiedName || product.productName))}&search_type=keyword_unordered" target="_blank">${product.adsCount} Ads Running ↗</a>
        </div>
      </div>

      <div>
        <div class="section-title">Opportunity Sourcing Score</div>
        <div class="opportunity-card">
          <div class="score-circle">
            <div class="score-inner">
              <span class="score-number">${product.calculations.opportunityScore}</span>
              <span class="score-label">out of 100</span>
            </div>
          </div>
          <div class="opportunity-status ${
            product.calculations.opportunityScore >= 70
              ? 'status-excellent'
              : product.calculations.opportunityScore >= 50
              ? 'status-good'
              : 'status-low'
          }">
            ${
              product.calculations.opportunityScore >= 70
                ? 'Excellent Sourcing Node'
                : product.calculations.opportunityScore >= 50
                ? 'Moderate Launch Potential'
                : 'High Sourcing Resistance'
            }
          </div>
          <div class="opportunity-comment">
            Based on Gross Margin, First-Mover Advantage, Shopify stores traction, RTO risk, marketplace listings, Upsell/Bundle potential, and Lower CAC.
          </div>
        </div>

        <div class="section-title" style="margin-top: 5mm;">Competitive Advantage</div>
        <div style="margin-bottom: 3.5mm; display: flex; gap: 3mm; align-items: center;">
          <span class="meta-tag">First Mover Badge:</span>
          ${
            product.fetchedData.firstMoverAdvantage === 'YES'
              ? '<span class="badge badge-green">YES - High Advantage</span>'
              : product.fetchedData.firstMoverAdvantage === 'MEDIUM'
              ? '<span class="badge badge-yellow">MEDIUM - Moderate</span>'
              : '<span class="badge badge-red">LOW - Saturated</span>'
          }
        </div>
        <div class="opportunity-comment" style="margin-bottom: 4mm;">
          Estimated active internet vendors: <strong>${product.fetchedData.approxSellers} stores</strong>
        </div>
      </div>
    </div>

    <div class="section-title">Logistics & Packaging Specifications</div>
    <table class="data-table" style="margin-bottom: 4mm;">
      <thead>
        <tr>
          <th>Pack Weight</th>
          <th>Courier Vol. Wt.</th>
          <th>Dimensions (L x W x H)</th>
          <th>MOQ Requirement</th>
          <th>Shipping Mode</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${product.logistics.weight}</td>
          <td>${courierVolumetricWeight} kg</td>
          <td>${product.logistics.dimensions.length} x ${product.logistics.dimensions.width} x ${product.logistics.dimensions.height} cm</td>
          <td>${product.moq} Units Minimum</td>
          <td>${product.logistics.shippingMode === 'sea' ? 'By Sea (45 days)' : 'By Air (15 days)'}</td>
        </tr>
      </tbody>
    </table>

    <div style="display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 8mm; margin-bottom: 4mm; margin-top: 2mm;">
      <div>
        <div class="section-title" style="margin-top: 0; margin-bottom: 2mm;">Competitor Shopify Store Links</div>
        ${shopifyHtml}
      </div>
      <div>
        <div class="section-title" style="margin-top: 0; margin-bottom: 2mm;">Amazon Global Traction</div>
        <div class="market-tags">
          ${countriesHtml}
        </div>
      </div>
    </div>

    ${product.profitCalculator && product.profitCalculator.totalOrders > 0 ? `
    <div style="margin-top: 6mm; margin-bottom: 6mm;">
      <h3 style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #0f172a; padding-bottom: 1.5mm; margin-bottom: 3.5mm;">Unit Economics & Profit Model</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4mm; margin-bottom: 4mm;">
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 3mm; text-align: center;">
          <span style="font-size: 8px; font-weight: 700; color: #166534; text-transform: uppercase; tracking-wider: 0.05em; display: block;">Net Profit after Delivery</span>
          <span style="font-size: 14px; font-weight: 900; color: #15803d; margin-top: 1mm; display: block;">₹${product.profitCalculator.netProfitAfterDelivery.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        </div>
        <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 3mm; text-align: center;">
          <span style="font-size: 8px; font-weight: 700; color: #1e40af; text-transform: uppercase; tracking-wider: 0.05em; display: block;">Profit % (GMV)</span>
          <span style="font-size: 14px; font-weight: 900; color: #1d4ed8; margin-top: 1mm; display: block;">${product.profitCalculator.profitPercentageGmv.toFixed(2)}%</span>
        </div>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 3mm; text-align: center;">
          <span style="font-size: 8px; font-weight: 700; color: #475569; text-transform: uppercase; tracking-wider: 0.05em; display: block;">Total GMV</span>
          <span style="font-size: 14px; font-weight: 900; color: #334155; margin-top: 1mm; display: block;">₹${product.profitCalculator.gmv.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        </div>
      </div>
      <table class="spec-table" style="margin-top: 0; font-size: 11px;">
        <thead>
          <tr>
            <th>Total Spends & Funnel</th>
            <th>Delivery & RTO Return Risk</th>
            <th>Final Unit Sourcing & Cost</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="vertical-align: top; text-align: left; padding: 3px 6px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 1.5mm;"><span>Total Orders:</span> <strong>${product.profitCalculator.totalOrders}</strong></div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 1.5mm;"><span>CPA/CPP:</span> <strong>₹${product.profitCalculator.cpaCpp}</strong></div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 1.5mm;"><span>Initial FB Cost:</span> <strong>₹${product.profitCalculator.initialFbCost}</strong></div>
              <div style="display: flex; justify-content: space-between;"><span>FB spend/Order:</span> <strong>₹${product.profitCalculator.fbAdSpendPerOrder.toFixed(2)}</strong></div>
            </td>
            <td style="vertical-align: top; text-align: left; padding: 3px 6px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 1.5mm;"><span>Delivery %:</span> <strong>${product.profitCalculator.deliveryPercentage}%</strong></div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 1.5mm;"><span>Actual Delivered:</span> <strong>${product.profitCalculator.actualOrdersDelivered.toFixed(1)}</strong></div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 1.5mm;"><span>RTO %:</span> <strong>${product.profitCalculator.rtoPercentage}%</strong></div>
              <div style="display: flex; justify-content: space-between;"><span>RTO Cost:</span> <strong style="color: #ef4444;">₹${product.profitCalculator.rtoCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong></div>
            </td>
            <td style="vertical-align: top; text-align: left; padding: 3px 6px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 1.5mm;"><span>Final FB Cost:</span> <strong>₹${product.profitCalculator.finalFbCost.toFixed(2)}</strong></div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 1.5mm;"><span>Prod Cost + Ship:</span> <strong>₹${product.profitCalculator.productCostWithShipping}</strong></div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 1.5mm;"><span>Final Prod Cost:</span> <strong>₹${product.profitCalculator.finalProductCost.toFixed(2)}</strong></div>
              <div style="display: flex; justify-content: space-between;"><span>Profit/Delivery:</span> <strong style="color: #22c55e;">₹${product.profitCalculator.profitPerDelivery.toFixed(2)}</strong></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    ` : ''}

    <div class="recommendation-box">
      <div class="recommendation-header">
        <span>💡</span> AI Market Intelligence Recommendation
      </div>
      <div class="recommendation-content">
        ${product.aiRecommendation}
      </div>
    </div>

    <div class="footer">
      <div>Report ID: ${catalog._id}</div>
      <div>Product ID: ${product._id}</div>
      <div>Page 2 of 2</div>
    </div>
  </div>

</body>
</html>
  `;
}
