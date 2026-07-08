import React, { useRef, useState } from 'react';
import { type ProductInput, type Catalog } from '../utils/api';
import { OpportunityMeter } from './OpportunityMeter';
import { Sparkles, Globe, MapPin, Truck, Box } from 'lucide-react';

interface CatalogPreviewProps {
  product: ProductInput;
  catalog: Catalog;
}

export const CatalogPreview: React.FC<CatalogPreviewProps> = ({ product: rawProduct, catalog }) => {
  const product = {
    ...rawProduct,
    calculations: catalog.calculations || rawProduct.calculations,
    fetchedData: catalog.fetchedData || rawProduct.fetchedData,
    aiRecommendation: catalog.aiRecommendation || rawProduct.aiRecommendation
  };

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const printableAreaRef = useRef<HTMLDivElement>(null);

  const formattedDate = new Date(catalog.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });



  return (

    <div className="space-y-6">
      
      {/* Screen Interactive Catalog Preview */}
      <div 
        ref={printableAreaRef} 
        id="printable-catalog" 
        className="flex flex-col gap-8 bg-transparent border-0 p-0 rounded-3xl items-center shadow-none overflow-x-auto print:p-0 print:bg-white print:border-none print:shadow-none"
      >
        
        {/* PAGE 1 */}
        <div className="w-[200mm] min-h-[297mm] bg-white border border-slate-200/60 p-6 rounded-2xl shadow-xl flex flex-col justify-between shrink-0 print:border-none print:shadow-none print:rounded-none print:m-0 print:w-full">
          <div>
            {/* Header */}
            <div className="flex justify-between items-start mb-4 pb-2 border-b-2 border-slate-800">
              <div className="flex flex-col gap-1.5">
                <img src="/assets/importerr-logo.png" alt="importerr.com" className="h-5 object-contain opacity-80" />
              </div>
              <div className="text-xxs font-bold text-slate-400 uppercase tracking-widest">Sourcing Report Sheet</div>
            </div>

            {/* Product Title */}
            <div className="mb-6 w-full">
              <h1 className="text-[1.5rem] font-black text-slate-900 leading-tight tracking-tight">{product.productName}</h1>
            </div>

            {/* Image Carousel */}
            {product.images.length > 0 && (
              <div className="mb-6">
                {/* Main Image with Arrows */}
                <div className="relative rounded-xl overflow-hidden border border-slate-100 bg-slate-50 aspect-[14/7] mb-2 group">
                  <img
                    src={product.images[activeImageIndex]}
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
                      {/* Dot indicators */}
                      <div className="print:hidden absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {product.images.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveImageIndex(idx)}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${
                              idx === activeImageIndex ? 'bg-white w-4' : 'bg-white/60'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {/* Image counter badge */}
                  {product.images.length > 1 && (
                    <div className="print:hidden absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {activeImageIndex + 1} / {product.images.length}
                    </div>
                  )}
                </div>

                {/* Thumbnails strip */}
                {product.images.length > 1 && (
                  <div className="print:hidden flex gap-2 overflow-x-auto pb-1">
                    {product.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`shrink-0 w-14 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                          idx === activeImageIndex
                            ? 'border-slate-800 scale-105 shadow-md'
                            : 'border-transparent opacity-60 hover:opacity-100 hover:border-slate-300'
                        }`}
                      >
                        <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Print layout: show all images in a grid */}
                <div className="hidden print:grid print:grid-cols-3 print:gap-2 print:mt-2">
                  {product.images.slice(1).map((img, idx) => (
                    <div key={idx} className="aspect-[4/3] rounded-lg overflow-hidden border border-slate-100 bg-slate-50">
                      <img src={img} alt={`Product ${idx + 2}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sourcing Overview grid */}
            <div className="border-b border-slate-100 pb-3 mb-6">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Sourcing Metrics & Margin Analysis</h3>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-10">
              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl flex flex-col items-start justify-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Product Cost</span>
                <span className="text-2xl font-black text-slate-800">₹{product.cost}</span>
              </div>
              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl flex flex-col items-start justify-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Sourcing MOQ</span>
                <span className="text-2xl font-black text-slate-800">{product.moq}</span>
                <span className="text-xs text-slate-400 font-medium absolute right-4 bottom-4">Pcs</span>
              </div>
              <div className="bg-brand-50 border border-brand-100 p-4 rounded-xl flex flex-col items-start justify-center">
                <span className="text-[9px] font-bold text-brand-600 uppercase tracking-widest mb-1.5">Est. Selling Price</span>
                <span className="text-2xl font-black text-brand-700">₹{product.tentativeSellingPrice}</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex flex-col items-start justify-center">
                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-1.5">Net Unit Profit</span>
                <span className="text-2xl font-black text-emerald-700">₹{product.calculations?.netProfit}</span>
              </div>
            </div>

            {/* Main breakdown Table */}
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-800">
                  <th className="py-3 px-2 font-bold text-slate-800 uppercase tracking-wider text-[10px]">Metric Name</th>
                  <th className="py-3 px-2 font-bold text-slate-800 uppercase tracking-wider text-[10px]">Benchmark</th>
                  <th className="py-3 px-2 font-bold text-slate-800 uppercase tracking-wider text-[10px] text-right">Value</th>
                  <th className="py-3 px-2 font-bold text-slate-800 uppercase tracking-wider text-[10px] text-right">Evaluation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3.5 px-2 font-semibold text-slate-700">Product Cost Price (INR)</td>
                  <td className="py-3.5 px-2 text-slate-500">Standard landed value</td>
                  <td className="py-3.5 px-2 font-bold text-slate-900 text-right">₹{product.cost}</td>
                  <td className="py-3.5 px-2 text-slate-500 text-right">Landed Sourcing cost</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-2 font-semibold text-slate-700">Estimated Selling Price</td>
                  <td className="py-3.5 px-2 text-slate-500">Target Indian retail price</td>
                  <td className="py-3.5 px-2 font-bold text-slate-900 text-right">₹{product.tentativeSellingPrice}</td>
                  <td className="py-3.5 px-2 text-slate-500 text-right">Retail price target</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-2 font-semibold text-slate-700">Gross Margin per Unit</td>
                  <td className="py-3.5 px-2 text-slate-500">Calculated Profit Delta</td>
                  <td className="py-3.5 px-2 font-bold text-slate-900 text-right">₹{product.calculations?.margin}</td>
                  <td className="py-3.5 px-2 font-extrabold text-brand-600 text-right">Margin: {product.calculations?.marginPercentage}%</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-2 font-semibold text-slate-700">Logistics Shipping Cost</td>
                  <td className="py-3.5 px-2 text-slate-500">Landed courier rate</td>
                  <td className="py-3.5 px-2 font-bold text-slate-900 text-right">₹{product.logistics.shippingCost}</td>
                  <td className="py-3.5 px-2 text-slate-500 text-right">Courier delivery fee</td>
                </tr>
                <tr className="bg-emerald-50/30">
                  <td className="py-3.5 px-2 font-bold text-emerald-800">Net Sourcing Profit</td>
                  <td className="py-3.5 px-2 text-emerald-600/80">Final pocket margin</td>
                  <td className="py-3.5 px-2 font-black text-emerald-600 text-right text-sm">₹{product.calculations?.netProfit}</td>
                  <td className="py-3.5 px-2 font-semibold text-emerald-700 text-right">Profit after sourcing & logistics</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-2 font-semibold text-slate-700">RTO Return Risk</td>
                  <td className="py-3.5 px-2 text-slate-500">Industry benchmark &lt; 20%</td>
                  <td className={`py-3.5 px-2 font-bold text-right ${product.rtoPercentage > 20 ? 'text-red-600' : 'text-slate-900'}`}>{product.rtoPercentage}%</td>
                  <td className="py-3.5 px-2 text-right">
                    {product.rtoPercentage > 20 ? (
                      <span className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-100 rounded-md">High Risk</span>
                    ) : (
                      <span className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md">Healthy</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer page 1 */}
          <div className="flex justify-between items-center border-t border-slate-100 pt-3 text-[10px] text-slate-400">
            <div>Prepared By: {catalog.preparedBy}</div>
            <div>Generated On: {formattedDate}</div>
            <div>Page 1 of 2</div>
          </div>
        </div>

        {/* PAGE 2 */}
        <div className="w-[200mm] min-h-[297mm] bg-white border border-slate-200/60 p-6 rounded-2xl shadow-xl flex flex-col justify-between shrink-0 print:border-none print:shadow-none print:rounded-none print:m-0 print:w-full">
          <div>
            {/* Header page 2 */}
            <div className="flex justify-between items-center mb-8 pb-4 border-b-2 border-slate-800">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.productName.substring(0, 40)}...</div>
              <img src="/assets/importerr-logo.png" alt="importerr.com" className="h-4 object-contain opacity-80" />
            </div>

            {/* Analysis Grid */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              
              {/* Left Column: Marketplace Analysis */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b-2 border-slate-800 pb-2 mb-4">Market Saturation Metrics</h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-xl flex justify-between items-center">
                      <span className="text-slate-600 font-semibold tracking-wide">Amazon</span>
                      <span className="font-black text-slate-900 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-100">{product.marketplaceSellers.amazon}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-xl flex justify-between items-center">
                      <span className="text-slate-600 font-semibold tracking-wide">Flipkart</span>
                      <span className="font-black text-slate-900 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-100">{product.marketplaceSellers.flipkart}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-xl flex justify-between items-center">
                      <span className="text-slate-600 font-semibold tracking-wide">Meesho</span>
                      <span className="font-black text-slate-900 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-100">{product.marketplaceSellers.meesho}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-xl flex justify-between items-center">
                      <span className="text-slate-600 font-semibold tracking-wide">JioMart</span>
                      <span className="font-black text-slate-900 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-100">{product.marketplaceSellers.jiomart}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b-2 border-slate-800 pb-2 mb-4">Competitor Product Links</h3>
                  {product.shopifyStores.length > 0 ? (
                    <div className="space-y-2">
                      {product.shopifyStores.map((store, idx) => {
                        const isNotFound = store.includes('No live competitor URLs found');
                        return (
                          <div key={idx} className="bg-blue-50/30 border border-blue-100/50 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
                            <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            {isNotFound ? (
                              <span className="text-slate-500 font-medium">{store}</span>
                            ) : (
                              <a href={store.startsWith('http') ? store : `https://${store}`} target="_blank" rel="noopener noreferrer" className="truncate font-semibold text-blue-700 hover:text-blue-800 hover:underline transition-all">
                                {store}
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No competitor URLs manually logged.</p>
                  )}
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b-2 border-slate-800 pb-2 mb-4">Meta Ads Density</h3>
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100/60 p-2 rounded-xl flex items-center justify-between text-xs gap-4 shadow-sm">
                    <span className="text-purple-900 font-bold tracking-wide">Active Creatives in Meta Ads Library</span>
                    <a
                      href={`https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=IN&q=${encodeURIComponent('"' + (product.simplifiedName || product.productName) + '"')}&search_type=keyword_unordered`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-black text-purple-700 text-[0.7rem] bg-white px-3 py-1 rounded-md shadow-sm border border-purple-100 hover:border-purple-300 hover:text-purple-900 transition-all shrink-0 whitespace-nowrap"
                    >
                      {product.adsCount} Ads ↗
                    </a>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b-2 border-slate-800 pb-2 mb-4">Amazon Best Seller Countries</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.fetchedData?.amazonBestSellerCountries.map((country, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xxs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        {country}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Opportunity Score & Search Results */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b-2 border-slate-800 pb-2 mb-4">Sourcing Suitability Index</h3>
                  <OpportunityMeter score={product.calculations?.opportunityScore || 0} />
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b-2 border-slate-800 pb-2 mb-4">First Mover Analysis</h3>
                  <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-3 text-xs">
                    <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
                      <span className="text-slate-600 font-bold">First Mover Advantage:</span>
                      {product.fetchedData?.firstMoverAdvantage === 'YES' ? (
                        <span className="px-2.5 py-1 text-[10px] tracking-wider font-black bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200 shadow-sm">HIGH</span>
                      ) : product.fetchedData?.firstMoverAdvantage === 'MEDIUM' ? (
                        <span className="px-2.5 py-1 text-[10px] tracking-wider font-black bg-amber-100 text-amber-800 rounded-md border border-amber-200 shadow-sm">MEDIUM</span>
                      ) : (
                        <span className="px-2.5 py-1 text-[10px] tracking-wider font-black bg-red-100 text-red-800 rounded-md border border-red-200 shadow-sm">LOW</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-slate-600 font-bold">Marketplace Sellers Found:</span>
                      <span className="font-black text-slate-900 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-100">{product.fetchedData?.approxSellers} sellers</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Logistics Table */}
            <div className="mb-8">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b-2 border-slate-800 pb-2 mb-4">Logistics & Packaging Specifications</h3>
              <div className="grid grid-cols-3 gap-0 border border-slate-200/80 rounded-xl overflow-hidden divide-x divide-slate-200/80 shadow-sm">
                <div className="p-4 bg-slate-50 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Truck className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Unit Weight</span>
                  </div>
                  <span className="font-black text-slate-800 text-lg">{product.logistics.weight}</span>
                </div>
                <div className="p-4 bg-slate-50 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Box className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Package Dimensions</span>
                  </div>
                  <span className="font-black text-slate-800 text-lg">{product.logistics.dimensions.length}x{product.logistics.dimensions.width}x{product.logistics.dimensions.height} <span className="text-sm text-slate-400">cm</span></span>
                </div>
                <div className="p-4 bg-brand-50/50 flex flex-col justify-center">
                  <span className="text-[9px] font-bold text-brand-600 uppercase tracking-widest mb-1.5">Required Landed Shipping Fee</span>
                  <span className="font-black text-brand-700 text-lg">₹{product.logistics.shippingCost} <span className="text-sm font-bold text-brand-500/80">Courier / Unit</span></span>
                </div>
              </div>
            </div>

            {/* Recommendation Box */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl relative overflow-hidden shadow-lg border border-slate-800">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-300">AI Market Intelligence Advisory</h3>
                </div>
                <p className="text-sm font-medium leading-relaxed opacity-95 text-slate-100">{product.aiRecommendation}</p>
              </div>
            </div>
          </div>

          {/* Footer page 2 */}
          <div className="flex justify-between items-center border-t border-slate-100 pt-3 text-[10px] text-slate-400">
            <div>Report ID: {catalog._id}</div>
            <div>Product ID: {product._id}</div>
            <div>Page 2 of 2</div>
          </div>
        </div>

      </div>
    </div>
  );
};
