import React, { useRef, useState } from 'react';
import { type ProductInput, type Catalog } from '../utils/api';
import { OpportunityMeter } from './OpportunityMeter';
import { Sparkles, Globe, MapPin, Truck, Box, TrendingUp, ShoppingBag, Zap, Award, BarChart2, ExternalLink } from 'lucide-react';

const BadgeGreen = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">{children}</span>
);
const BadgeYellow = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">{children}</span>
);
const BadgeRed = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">{children}</span>
);

const SectionTitle = ({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) => (
  <div className="flex items-center gap-2 mb-3">
    {icon && <span className="text-slate-400">{icon}</span>}
    <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] whitespace-nowrap">{children}</h3>
    <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
  </div>
);

interface CatalogPreviewProps {
  product: ProductInput;
  catalog: Catalog;
}

const getCleanAdsQuery = (name: string): string => {
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
};

export const CatalogPreview: React.FC<CatalogPreviewProps> = ({ product: rawProduct, catalog }) => {
  const product = {
    ...rawProduct,
    calculations: catalog.calculations || rawProduct.calculations,
    fetchedData: catalog.fetchedData || rawProduct.fetchedData,
    aiRecommendation: catalog.aiRecommendation || rawProduct.aiRecommendation
  };

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const printableAreaRef = useRef<HTMLDivElement>(null);

  const getSecureUrl = (url: string) => {
    if (!url) return '';
    if (window.location.protocol === 'https:' && url.startsWith('http://')) {
      if (!url.includes('localhost') && !url.includes('127.0.0.1')) {
        return url.replace('http://', 'https://');
      }
    }
    return url;
  };

  const formattedDate = new Date(catalog.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });



  const marginPct = product.calculations?.marginPercentage ?? 0;
  const score = product.calculations?.opportunityScore ?? 0;

  return (
    <div className="space-y-6">
      
      {/* Screen Interactive Catalog Preview */}
      <div
        ref={printableAreaRef}
        id="printable-catalog"
        className="flex flex-col gap-8 bg-transparent border-0 p-0 rounded-3xl items-center shadow-none overflow-x-auto print:p-0 print:bg-white print:border-none print:shadow-none"
      >

        {/* PAGE 1 */}
        <div className="w-[200mm] min-h-[297mm] bg-white border border-slate-200/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden shrink-0 print:border-none print:shadow-none print:rounded-none print:m-0 print:w-full">

          {/* Dark header bar */}
          <div className="bg-slate-900 px-6 py-3 flex justify-between items-center shrink-0">
            <img src="/assets/importerr-logo.png" alt="importerr.com" className="h-5 object-contain brightness-0 invert opacity-90" />
            <div className="flex items-center gap-2.5">
              <span className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.2em]">Sourcing Report Sheet</span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            </div>
          </div>
          <div className="flex flex-col flex-1 p-6 gap-5">

            {/* Product Title */}
            <div>
              <div className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-1.5">{catalog.catalogTitle}</div>
              <h1 className="text-[1.4rem] font-black text-slate-900 leading-snug tracking-tight">{product.productName}</h1>
            </div>

            {/* Image Carousel */}
            {product.images.length > 0 && (
              <div>
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-100 aspect-[16/7] mb-2 group shadow-inner">
                  <img
                    src={getSecureUrl(product.images[activeImageIndex])}
                    alt={`Product ${activeImageIndex + 1}`}
                    className="w-full h-full object-contain transition-all duration-300"
                  />

                  {/* Arrow Buttons — only show if more than 1 image */}
                  {product.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveImageIndex(i => (i - 1 + product.images.length) % product.images.length)}
                        className="print:hidden absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 shadow-md flex items-center justify-center text-slate-700 hover:bg-white hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setActiveImageIndex(i => (i + 1) % product.images.length)}
                        className="print:hidden absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 shadow-md flex items-center justify-center text-slate-700 hover:bg-white hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <div className="print:hidden absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {product.images.map((_, idx) => (
                          <button key={idx} onClick={() => setActiveImageIndex(idx)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeImageIndex ? 'bg-indigo-500 w-5' : 'bg-white/70 w-1.5 hover:bg-white'}`}
                          />
                        ))}
                      </div>
                      <div className="print:hidden absolute top-2 right-2 bg-slate-900/60 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                        {activeImageIndex + 1} / {product.images.length}
                      </div>
                    </>
                  )}
                </div>

                {product.images.length > 1 && (
                  <div className="print:hidden flex gap-2 overflow-x-auto pb-1">
                    {product.images.map((img, idx) => (
                      <button key={idx} onClick={() => setActiveImageIndex(idx)}
                        className={`shrink-0 w-12 h-9 rounded-lg overflow-hidden border-2 transition-all duration-200 ${idx === activeImageIndex ? 'border-indigo-400 scale-105 shadow-md' : 'border-transparent opacity-50 hover:opacity-90 hover:border-slate-300'}`}
                      >
                        <img src={getSecureUrl(img)} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Print layout: show all images in a grid */}
                <div className="hidden print:grid print:grid-cols-3 print:gap-2 print:mt-2">
                  {product.images.slice(1).map((img, idx) => (
                    <div key={idx} className="aspect-[4/3] rounded-lg overflow-hidden border border-slate-100 bg-slate-50">
                      <img src={getSecureUrl(img)} alt={`Product ${idx + 2}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* KPI Cards */}
            <div>
              <SectionTitle icon={<TrendingUp className="w-3.5 h-3.5" />}>Sourcing Metrics & Margin Analysis</SectionTitle>
              <div className="grid grid-cols-4 gap-3">
                <div className="relative overflow-hidden bg-slate-800 text-white p-3.5 rounded-xl flex flex-col gap-1 shadow-lg">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full -mr-4 -mt-4" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Cost Price</span>
                  <span className="text-xl font-black leading-none">₹{product.cost}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl flex flex-col gap-1">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Sourcing MOQ</span>
                  <span className="text-xl font-black text-slate-800 leading-none">{product.moq} <span className="text-xs font-semibold text-slate-400">Pcs</span></span>
                </div>
                <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 text-white p-3.5 rounded-xl flex flex-col gap-1 shadow-lg">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-4 -mt-4" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-indigo-200">Est. Selling Price</span>
                  <span className="text-xl font-black leading-none">₹{product.tentativeSellingPrice}</span>
                </div>
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-400 to-teal-500 text-white p-3.5 rounded-xl flex flex-col gap-1 shadow-lg">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-4 -mt-4" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-emerald-100">Net Unit Profit</span>
                  <span className="text-xl font-black leading-none">₹{product.calculations?.netProfit}</span>
                </div>
              </div>
            </div>

            {/* Breakdown Table */}
            <div className="flex-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="py-2.5 px-3 font-black uppercase tracking-wider text-[9px] rounded-tl-lg">Metric</th>
                  <th className="py-2.5 px-3 font-black uppercase tracking-wider text-[9px] text-slate-400">Benchmark</th>
                  <th className="py-2.5 px-3 font-black uppercase tracking-wider text-[9px] text-right">Value</th>
                  <th className="py-2.5 px-3 font-black uppercase tracking-wider text-[9px] text-right rounded-tr-lg">Evaluation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-700">Product Cost Price (INR)</td>
                  <td className="py-3 px-3 text-slate-400">Standard landed value</td>
                  <td className="py-3 px-3 font-bold text-slate-900 text-right">₹{product.cost}</td>
                  <td className="py-3 px-3 text-slate-500 text-right text-[10px]">Landed Sourcing cost</td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-700">Estimated Selling Price</td>
                  <td className="py-3 px-3 text-slate-400">Target Indian retail price</td>
                  <td className="py-3 px-3 font-bold text-slate-900 text-right">₹{product.tentativeSellingPrice}</td>
                  <td className="py-3 px-3 text-slate-500 text-right text-[10px]">Retail price target</td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-700">Gross Margin per Unit</td>
                  <td className="py-3 px-3 text-slate-400">Calculated Profit Delta</td>
                  <td className="py-3 px-3 font-bold text-slate-900 text-right">₹{product.calculations?.margin}</td>
                  <td className="py-3 px-3 text-right"><span className="font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full text-[9px]">{marginPct}% Margin</span></td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-700">Logistics Shipping Cost</td>
                  <td className="py-3 px-3 text-slate-400">Landed courier rate</td>
                  <td className="py-3 px-3 font-bold text-slate-900 text-right">₹{product.logistics.shippingCost}</td>
                  <td className="py-3 px-3 text-slate-500 text-right text-[10px]">Courier delivery fee</td>
                </tr>
                <tr className="bg-emerald-50/60">
                  <td className="py-3 px-3 font-black text-emerald-900">Net Sourcing Profit</td>
                  <td className="py-3 px-3 text-emerald-600/70 text-[10px]">Final pocket margin</td>
                  <td className="py-3 px-3 text-right"><span className="font-black text-emerald-700 text-sm">₹{product.calculations?.netProfit}</span></td>
                  <td className="py-3 px-3 text-emerald-700 text-right text-[10px] font-semibold">After sourcing & logistics</td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-700">RTO Return Risk</td>
                  <td className="py-3 px-3 text-slate-400">Benchmark &lt; 20%</td>
                  <td className={`py-3 px-3 font-black text-right ${product.rtoPercentage > 20 ? 'text-red-600' : 'text-slate-900'}`}>{product.rtoPercentage}%</td>
                  <td className="py-3 px-3 text-right">{product.rtoPercentage > 20 ? <BadgeRed>High Risk</BadgeRed> : <BadgeGreen>Healthy</BadgeGreen>}</td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-700">Upsell & Bundle Potential</td>
                  <td className="py-3 px-3 text-slate-400">AOV & LTV growth</td>
                  <td className="py-3 px-3 font-bold text-slate-900 text-right">{product.upsellPotential || 'MEDIUM'}</td>
                  <td className="py-3 px-3 text-right">{product.upsellPotential === 'YES' ? <BadgeGreen>High Potential</BadgeGreen> : product.upsellPotential === 'MEDIUM' ? <BadgeYellow>Medium</BadgeYellow> : <BadgeRed>Low</BadgeRed>}</td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-700">Lower CAC</td>
                  <td className="py-3 px-3 text-slate-400">Customer Acquisition Cost</td>
                  <td className="py-3 px-3 font-bold text-slate-900 text-right">{product.lowerCac || 'MEDIUM'}</td>
                  <td className="py-3 px-3 text-right">{product.lowerCac === 'YES' ? <BadgeGreen>High Advantage</BadgeGreen> : product.lowerCac === 'MEDIUM' ? <BadgeYellow>Medium</BadgeYellow> : <BadgeRed>Low</BadgeRed>}</td>
                </tr>
              </tbody>
            </table>
            </div>
          </div>

          {/* Footer page 1 */}
          <div className="border-t border-slate-100 px-6 py-2.5 flex justify-between items-center text-[9px] text-slate-400 bg-slate-50/50 shrink-0">
            <span>Prepared By: <strong className="text-slate-600">{catalog.preparedBy}</strong></span>
            <span>Generated On: <strong className="text-slate-600">{formattedDate}</strong></span>
            <span className="font-bold text-slate-500">Page 1 of 2</span>
          </div>
        </div>

        {/* PAGE 2 */}
        <div className="w-[200mm] min-h-[297mm] bg-white border border-slate-200/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden shrink-0 print:border-none print:shadow-none print:rounded-none print:m-0 print:w-full">

          {/* Dark header bar */}
          <div className="bg-slate-900 px-6 py-3 flex justify-between items-center shrink-0">
            <span className="text-slate-300 text-[9px] font-bold uppercase tracking-[0.15em] truncate max-w-[55%]">
              {product.productName.substring(0, 48)}{product.productName.length > 48 ? '…' : ''}
            </span>
            <div className="flex items-center gap-2.5">
              <span className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.15em]">Competitor & Intelligence Analysis</span>
              <img src="/assets/importerr-logo.png" alt="importerr.com" className="h-4 object-contain brightness-0 invert opacity-70" />
            </div>
          </div>

          <div className="flex flex-col flex-1 p-6 gap-5">

            <div className="grid grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-5">
                <div>
                  <SectionTitle icon={<BarChart2 className="w-3.5 h-3.5" />}>Market Saturation Metrics</SectionTitle>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: 'Amazon', emoji: '🛒', val: product.marketplaceSellers.amazon, color: 'from-orange-50 to-amber-50 border-orange-100' },
                      { name: 'Flipkart', emoji: '⚡', val: product.marketplaceSellers.flipkart, color: 'from-blue-50 to-indigo-50 border-blue-100' },
                      { name: 'Meesho', emoji: '🛍️', val: product.marketplaceSellers.meesho, color: 'from-pink-50 to-rose-50 border-pink-100' },
                      { name: 'JioMart', emoji: '🟦', val: product.marketplaceSellers.jiomart, color: 'from-slate-50 to-gray-50 border-slate-200' },
                    ].map(({ name, emoji, val, color }) => (
                      <div key={name} className={`bg-gradient-to-br ${color} border p-2.5 rounded-xl flex items-center justify-between gap-2`}>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm leading-none">{emoji}</span>
                          <span className="text-[10px] font-bold text-slate-600">{name}</span>
                        </div>
                        <span className="font-black text-slate-900 text-sm bg-white/80 px-2 py-0.5 rounded-lg shadow-sm border border-white/60">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <SectionTitle icon={<ShoppingBag className="w-3.5 h-3.5" />}>Competitor Shopify Stores</SectionTitle>
                  {product.shopifyStores.length > 0 ? (
                    <div className="space-y-1.5">
                      {product.shopifyStores.map((store, idx) => {
                        const isNotFound = store.includes('No live competitor URLs found');
                        return (
                          <div key={idx} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs border transition-all ${isNotFound ? 'bg-slate-50 border-slate-200/60' : 'bg-blue-50/40 border-blue-100/60 hover:bg-blue-50 hover:border-blue-200 group'}`}>
                            <Globe className={`w-3 h-3 shrink-0 ${isNotFound ? 'text-slate-300' : 'text-blue-400'}`} />
                            {isNotFound ? (
                              <span className="text-slate-400 italic text-[10px]">No live competitor URLs found</span>
                            ) : (
                              <a href={store.startsWith('http') ? store : `https://${store}`} target="_blank" rel="noopener noreferrer"
                                className="truncate font-semibold text-blue-700 hover:text-blue-900 transition-colors text-[10px] flex items-center gap-1">
                                {store}
                                <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No competitor URLs found.</p>
                  )}
                </div>

                <div>
                  <SectionTitle icon={<Zap className="w-3.5 h-3.5" />}>Meta Ads Density</SectionTitle>
                  <a
                    href={`https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=IN&q=${encodeURIComponent(getCleanAdsQuery(product.simplifiedName || product.productName))}&search_type=keyword_unordered`}
                    target="_blank" rel="noopener noreferrer"
                    className="group flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100 hover:border-violet-300 hover:from-violet-100 hover:to-purple-100 transition-all shadow-sm"
                  >
                    <div>
                      <div className="text-[8px] font-black text-violet-400 uppercase tracking-widest mb-0.5">Active Creatives in Meta Ads Library</div>
                      <div className="text-xl font-black text-violet-900 leading-none">{product.adsCount} <span className="text-xs font-semibold text-violet-400">ads running</span></div>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform shrink-0">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </a>
                </div>

                <div>
                  <SectionTitle icon={<MapPin className="w-3.5 h-3.5" />}>Amazon Best Seller Countries</SectionTitle>
                  <div className="flex flex-wrap gap-2">
                    {product.fetchedData?.amazonBestSellerCountries.map((country, idx) => (
                      <span key={idx} className="px-2.5 py-1.5 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm hover:border-slate-300 transition-colors">
                        <MapPin className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                        {country}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-5">
                <div>
                  <SectionTitle icon={<Award className="w-3.5 h-3.5" />}>Sourcing Suitability Index</SectionTitle>
                  <OpportunityMeter score={score} />
                </div>
                <div>
                  <SectionTitle>First Mover Analysis</SectionTitle>
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200/80 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-200/80">
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">First Mover Advantage</span>
                      {product.fetchedData?.firstMoverAdvantage === 'YES' ? <BadgeGreen>HIGH</BadgeGreen>
                        : product.fetchedData?.firstMoverAdvantage === 'MEDIUM' ? <BadgeYellow>MEDIUM</BadgeYellow>
                        : <BadgeRed>LOW</BadgeRed>}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Marketplace Sellers Found</span>
                      <span className="font-black text-slate-900 bg-white px-2.5 py-1 rounded-lg shadow-sm border border-slate-200 text-xs">{product.fetchedData?.approxSellers} sellers</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Logistics */}
            <div>
              <SectionTitle icon={<Truck className="w-3.5 h-3.5" />}>Logistics & Packaging Specifications</SectionTitle>
              <div className="grid grid-cols-3 gap-0 border border-slate-200/80 rounded-2xl overflow-hidden divide-x divide-slate-200/80 shadow-sm">
                <div className="p-4 bg-slate-50 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-3 h-3 text-slate-400" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Unit Weight</span>
                  </div>
                  <span className="font-black text-slate-800 text-lg leading-none">{product.logistics.weight}</span>
                </div>
                <div className="p-4 bg-slate-50 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <Box className="w-3 h-3 text-slate-400" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Package Dimensions</span>
                  </div>
                  <span className="font-black text-slate-800 text-base leading-none">{product.logistics.dimensions.length}×{product.logistics.dimensions.width}×{product.logistics.dimensions.height}<span className="text-xs font-semibold text-slate-400 ml-1">cm</span></span>
                </div>
                <div className="p-4 bg-gradient-to-br from-indigo-50 to-violet-50 flex flex-col gap-1.5">
                  <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">Landed Shipping Fee</span>
                  <span className="font-black text-indigo-700 text-lg leading-none">₹{product.logistics.shippingCost}<span className="text-xs font-semibold text-indigo-400 ml-1">/ unit</span></span>
                </div>
              </div>
            </div>

            {/* AI Recommendation */}
            <div className="relative overflow-hidden bg-slate-900 text-white p-5 rounded-2xl shadow-xl border border-slate-800 flex-1">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">AI Market Intelligence Advisory</span>
                </div>
                <p className="text-[11px] font-medium leading-relaxed text-slate-200">{product.aiRecommendation}</p>
              </div>
            </div>
          </div>

          {/* Footer page 2 */}
          <div className="border-t border-slate-100 px-6 py-2.5 flex justify-between items-center text-[9px] text-slate-400 bg-slate-50/50 shrink-0">
            <span>Report ID: <strong className="text-slate-500">{catalog._id}</strong></span>
            <span>Product ID: <strong className="text-slate-500">{product._id}</strong></span>
            <span className="font-bold text-slate-500">Page 2 of 2</span>
          </div>
        </div>

      </div>
    </div>
  );
};
