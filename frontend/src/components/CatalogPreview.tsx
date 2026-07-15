import React, { useState } from 'react';
import { type ProductInput, type Catalog } from '../utils/api';
import { OpportunityMeter } from './OpportunityMeter';
import { 
  Sparkles, 
  Globe, 
  MapPin, 
  Truck, 
  Box, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  DollarSign, 
  ExternalLink, 
  Ruler, 
  Gauge, 
  Check,
  Copy
} from 'lucide-react';

interface CatalogPreviewProps {
  product: ProductInput;
  catalog: Catalog;
}

const getCleanAdsQuery = (name: string): string => {
  if (!name) return '';
  let clean = name.replace(/()[[\]{}]/g, ' ').replace(/\s+/g, ' ').trim();
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
  const [copied, setCopied] = useState(false);

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

  // Calculate pricing distribution metrics
  const unitCost = product.cost || 0;
  const unitShipping = product.logistics.shippingCost || 0;
  const unitProfit = product.calculations?.netProfit || 0;
  const sellingPrice = product.tentativeSellingPrice || (unitCost + unitShipping + unitProfit) || 1;

  const costPercent = Math.min(100, Math.round((unitCost / sellingPrice) * 100));
  const shippingPercent = Math.min(100, Math.round((unitShipping / sellingPrice) * 100));
  const profitPercent = Math.max(0, 100 - costPercent - shippingPercent);

  // Volumetric weight calculation
  const lengthCm = product.logistics.dimensions?.length || 0;
  const widthCm = product.logistics.dimensions?.width || 0;
  const heightCm = product.logistics.dimensions?.height || 0;
  const volumetricWeightKg = ((lengthCm * widthCm * heightCm) / 5000).toFixed(2);

  const handleCopyAdvisory = () => {
    if (product.aiRecommendation) {
      navigator.clipboard.writeText(product.aiRecommendation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const opportunityScore = product.calculations?.opportunityScore || 0;
  let suitabilityText = 'Moderate Sourcing Risk';
  let suitabilityBadgeColor = 'bg-amber-550/10 text-amber-600 border-amber-500/20 dark:text-amber-455';
  if (opportunityScore >= 80) {
    suitabilityText = 'Excellent Sourcing Node';
    suitabilityBadgeColor = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400';
  } else if (opportunityScore >= 60) {
    suitabilityText = 'Strong Launch Potential';
    suitabilityBadgeColor = 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400';
  } else if (opportunityScore < 45) {
    suitabilityText = 'High Sourcing Resistance';
    suitabilityBadgeColor = 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400';
  }

  // Fallback image placeholder SVG (Safari-compatible inline)
  const fallbackImage = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500&auto=format&fit=crop&q=80';

  return (
    <div className="w-full space-y-4">
      
      {/* Sub-Header: Product Name */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-200/60 dark:border-zinc-800/65 px-3 py-2.5 rounded-2xl shadow-sm flex items-center transition-colors">
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest">Sourcing Report Console</span>
          <h2 className="text-xs font-extrabold text-slate-800 dark:text-zinc-100 uppercase tracking-wide mt-0.5 truncate w-full">
            {product.productName}
          </h2>
        </div>
      </div>

      {/* -------------------- INTERACTIVE DASHBOARD VIEW -------------------- */}
      <div className="space-y-4">
        
        {/* KPI Cards Strip - compact */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Score */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 p-4 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between group hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Suitability</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black text-slate-850 dark:text-zinc-100">{opportunityScore}</span>
                  <span className="text-[10px] text-slate-400 font-bold">/100</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-zinc-950 flex items-center justify-center border border-indigo-100/50 dark:border-zinc-850">
                <Gauge className="w-4 h-4 text-indigo-550 dark:text-indigo-405" />
              </div>
            </div>
            <div className={`mt-2 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider rounded-lg border w-max ${suitabilityBadgeColor}`}>
              {suitabilityText}
            </div>
          </div>

          {/* Card 2: Landed Cost */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 p-4 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between group hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Landed Cost</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black text-slate-850 dark:text-zinc-100">₹{product.cost}</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-zinc-955 flex items-center justify-center border border-slate-250/30 dark:border-zinc-850">
                <Truck className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
              </div>
            </div>
            <div className="mt-2 text-[9px] text-slate-400 dark:text-zinc-500 font-semibold">
              MOQ: <span className="text-slate-700 dark:text-zinc-300 font-black">{product.moq} Units</span>
            </div>
          </div>

          {/* Card 3: Est. Selling Price */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 p-4 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between group hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Selling Price</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black text-slate-855 dark:text-zinc-100">₹{product.tentativeSellingPrice}</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-zinc-955 flex items-center justify-center border border-brand-100/50 dark:border-zinc-850">
                <TrendingUp className="w-4 h-4 text-brand-500 dark:text-brand-400" />
              </div>
            </div>
            <div className="mt-2 text-[9px] text-slate-400 dark:text-zinc-500 font-semibold flex flex-wrap items-center gap-1">
              Gross profit: <span className="text-brand-600 dark:text-brand-450 font-black">₹{product.calculations?.margin} ({product.calculations?.marginPercentage}%)</span>
            </div>
          </div>

          {/* Card 4: Net Unit Profit */}
          <div className="bg-emerald-500/5 dark:bg-emerald-500/[0.02] border border-emerald-200/60 dark:border-emerald-900/50 p-4 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between group hover:shadow-md transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl -mr-4 -mt-4"></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">Net Profit</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">₹{product.calculations?.netProfit}</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-emerald-100/60 dark:bg-zinc-950 flex items-center justify-center border border-emerald-250/20 dark:border-zinc-850">
                <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
              </div>
            </div>
            <div className="mt-2 text-[9px] text-emerald-650 dark:text-emerald-500/80 font-bold flex items-center gap-1 relative z-10">
              Net margin: <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black">{((unitProfit / sellingPrice) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Main Dashboard Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* LEFT SIDEBAR: GALLERY & LOGISTICS (4 Columns) */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Gallery Card */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-4 shadow-sm space-y-3">
              <h3 className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest">
                Product Images
              </h3>
              
              {product.images && product.images.length > 0 ? (
                <div className="space-y-2">
                  <div className="relative w-full pt-[75%] bg-slate-50 dark:bg-zinc-955 border border-slate-100 dark:border-zinc-850 rounded-xl overflow-hidden group">
                    <img
                      src={getSecureUrl(product.images[activeImageIndex])}
                      alt="Active Product"
                      className="absolute inset-0 w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                      crossOrigin="anonymous"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = fallbackImage;
                      }}
                    />
                    
                    {product.images.length > 1 && (
                      <div className="absolute inset-0 z-10 pointer-events-none">
                        <button
                          onClick={() => setActiveImageIndex(i => (i - 1 + product.images.length) % product.images.length)}
                          className="pointer-events-auto absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-slate-200/50 dark:border-zinc-805 shadow flex items-center justify-center text-slate-700 dark:text-zinc-300 hover:scale-105 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setActiveImageIndex(i => (i + 1) % product.images.length)}
                          className="pointer-events-auto absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-slate-200/50 dark:border-zinc-805 shadow flex items-center justify-center text-slate-700 dark:text-zinc-300 hover:scale-105 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Thumbnails strip */}
                  {product.images.length > 1 && (
                    <div className="flex gap-1.5 overflow-x-auto py-1 custom-scrollbar">
                      {product.images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveImageIndex(idx)}
                          className={`shrink-0 w-10 h-9 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                            idx === activeImageIndex
                              ? 'border-brand-500 shadow-sm'
                              : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img 
                            src={getSecureUrl(img)} 
                            alt={`Thumb ${idx + 1}`} 
                            className="w-full h-full object-cover" 
                            crossOrigin="anonymous"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = fallbackImage;
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-[4/3] bg-slate-50 dark:bg-zinc-955 border border-dashed border-slate-250 dark:border-zinc-805 rounded-xl flex items-center justify-center text-xs text-slate-400 dark:text-zinc-650">
                  No images uploaded
                </div>
              )}
            </div>

            {/* Logistics Card */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-4 shadow-sm space-y-3">
              <h3 className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest">
                Logistics & Dimensions
              </h3>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 dark:bg-zinc-955 p-2.5 rounded-xl border border-slate-100/60 dark:border-zinc-900 flex flex-col justify-between min-h-[65px]">
                  <div className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500">
                    <Truck className="w-3 h-3" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Unit Weight</span>
                  </div>
                  <span className="font-extrabold text-slate-800 dark:text-zinc-200 text-sm mt-1">{product.logistics.weight || 'N/A'}</span>
                </div>
                
                <div className="bg-slate-50 dark:bg-zinc-955 p-2.5 rounded-xl border border-slate-100/60 dark:border-zinc-900 flex flex-col justify-between min-h-[65px]">
                  <div className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500">
                    <Box className="w-3 h-3" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Package</span>
                  </div>
                  <span className="font-extrabold text-slate-800 dark:text-zinc-200 text-xs mt-1">
                    {lengthCm}×{widthCm}×{heightCm} <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-semibold">cm</span>
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-zinc-955 p-2.5 rounded-xl border border-slate-100/60 dark:border-zinc-900 flex flex-col justify-between min-h-[65px]">
                  <div className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500">
                    <Ruler className="w-3 h-3" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Vol. Wt.</span>
                  </div>
                  <span className="font-extrabold text-slate-800 dark:text-zinc-200 text-sm mt-1">
                    {volumetricWeightKg} <span className="text-[9px] text-slate-400 dark:text-zinc-550 font-semibold">kg</span>
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-zinc-955 p-2.5 rounded-xl border border-slate-100/60 dark:border-zinc-900 flex flex-col justify-between min-h-[65px]">
                  <div className="flex items-center gap-1.5 text-slate-450 dark:text-zinc-500">
                    <DollarSign className="w-3 h-3 text-brand-500" />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">Shipping</span>
                  </div>
                  <span className="font-black text-brand-700 dark:text-brand-400 text-sm mt-1">
                    ₹{unitShipping}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* MAIN PANELS: METRICS & ANALYSIS (8 Columns) */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Sourcing Cost & Margin Share Card */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-5">
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest mb-1">
                  Retail Value Stream Breakdown
                </h3>
                <p className="text-[11px] font-semibold text-slate-450 dark:text-zinc-500">
                  Share analysis of the ₹{sellingPrice} selling price
                </p>
              </div>

              {/* Stacked Share Bar Chart */}
              <div className="space-y-2">
                <div className="h-6 w-full rounded-full overflow-hidden flex border border-slate-100 dark:border-zinc-800/50 shadow-inner">
                  {costPercent > 0 && (
                    <div 
                      className="bg-slate-405 dark:bg-zinc-500 flex items-center justify-center text-[9px] font-black text-white transition-all cursor-help"
                      style={{ width: `${costPercent}%` }}
                      title={`Landed Cost: ₹${unitCost} (${costPercent}%)`}
                    >
                      {costPercent > 12 && `${costPercent}%`}
                    </div>
                  )}
                  {shippingPercent > 0 && (
                    <div 
                      className="bg-amber-450 dark:bg-amber-500 flex items-center justify-center text-[9px] font-black text-white transition-all cursor-help"
                      style={{ width: `${shippingPercent}%` }}
                      title={`Shipping Fee: ₹${unitShipping} (${shippingPercent}%)`}
                    >
                      {shippingPercent > 12 && `${shippingPercent}%`}
                    </div>
                  )}
                  {profitPercent > 0 && (
                    <div 
                      className="bg-emerald-500 flex items-center justify-center text-[9px] font-black text-white transition-all cursor-help"
                      style={{ width: `${profitPercent}%` }}
                      title={`Net Unit Profit: ₹${unitProfit} (${profitPercent}%)`}
                    >
                      {profitPercent > 12 && `${profitPercent}%`}
                    </div>
                  )}
                </div>

                {/* Legends grid — font-size 15px as requested */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1" style={{ fontSize: '15px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'inherit' }}>
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
                    <span className="w-2.5 h-2.5 rounded bg-slate-405 dark:bg-zinc-550 shrink-0"></span>
                    <span>Cost: ₹{unitCost} ({costPercent}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400 sm:justify-center">
                    <span className="w-2.5 h-2.5 rounded bg-amber-450 dark:bg-amber-500 shrink-0"></span>
                    <span>Ship: ₹{unitShipping} ({shippingPercent}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500 sm:justify-end">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500 shrink-0"></span>
                    <span>Profit: ₹{unitProfit} ({profitPercent}%)</span>
                  </div>
                </div>
              </div>

              {/* Metrics Table — horizontal scroll on small screens */}
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-left text-xs border-collapse min-w-[480px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 uppercase tracking-widest text-[9px]">
                      <th className="py-2 px-2 font-black">Metric</th>
                      <th className="py-2 px-2 font-black hidden md:table-cell">Context</th>
                      <th className="py-2 px-2 font-black text-right">Value</th>
                      <th className="py-2 px-2 font-black text-right">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-850 text-slate-750 dark:text-zinc-300">
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-zinc-950/20 transition-all">
                      <td className="py-2.5 px-2 font-semibold">Landed Cost (INR)</td>
                      <td className="py-2.5 px-2 text-slate-400 dark:text-zinc-500 hidden md:table-cell">Ex-factory + customs estimate</td>
                      <td className="py-2.5 px-2 font-bold text-slate-900 dark:text-zinc-100 text-right">₹{unitCost}</td>
                      <td className="py-2.5 px-2 text-right">
                        <span className="px-2 py-0.5 bg-slate-105 dark:bg-zinc-800 text-[8px] font-extrabold uppercase tracking-wider rounded-md text-slate-500 dark:text-zinc-400">MOQ Met</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-zinc-955/20 transition-all">
                      <td className="py-2.5 px-2 font-semibold">Est. Selling Price</td>
                      <td className="py-2.5 px-2 text-slate-400 dark:text-zinc-500 hidden md:table-cell">Retail price vs competitor index</td>
                      <td className="py-2.5 px-2 font-bold text-slate-900 dark:text-zinc-100 text-right">₹{product.tentativeSellingPrice}</td>
                      <td className="py-2.5 px-2 text-right">
                        <span className="px-2 py-0.5 bg-brand-500/10 text-brand-650 dark:text-brand-450 text-[8px] font-extrabold uppercase tracking-wider rounded-md">Selling Index</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-zinc-955/20 transition-all">
                      <td className="py-2.5 px-2 font-semibold">Gross Margin / Unit</td>
                      <td className="py-2.5 px-2 text-slate-400 dark:text-zinc-500 hidden md:table-cell">Total markup before logistics</td>
                      <td className="py-2.5 px-2 font-bold text-slate-900 dark:text-zinc-100 text-right">₹{product.calculations?.margin}</td>
                      <td className="py-2.5 px-2 text-right font-black text-brand-500">
                        {product.calculations?.marginPercentage}%
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-zinc-955/20 transition-all">
                      <td className="py-2.5 px-2 font-semibold">Courier Costs</td>
                      <td className="py-2.5 px-2 text-slate-400 dark:text-zinc-550 hidden md:table-cell">Landed domestic shipping fee</td>
                      <td className="py-2.5 px-2 font-bold text-slate-900 dark:text-zinc-100 text-right">₹{unitShipping}</td>
                      <td className="py-2.5 px-2 text-right">
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-500 text-[8px] font-extrabold uppercase tracking-wider rounded-md">Courier</span>
                      </td>
                    </tr>
                    <tr className="bg-emerald-500/[0.03] dark:bg-emerald-500/[0.01] hover:bg-emerald-500/5 transition-all">
                      <td className="py-2.5 px-2 font-black text-emerald-700 dark:text-emerald-500">Net Sourcing Profit</td>
                      <td className="py-2.5 px-2 text-emerald-600/70 dark:text-emerald-550 hidden md:table-cell">Final pocket earnings per unit</td>
                      <td className="py-2.5 px-2 font-black text-emerald-650 dark:text-emerald-450 text-sm text-right">₹{unitProfit}</td>
                      <td className="py-2.5 px-2 font-black text-emerald-700 dark:text-emerald-400 text-right text-[10px]">
                        {((unitProfit / sellingPrice) * 100).toFixed(0)}% Yield
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-zinc-955/20 transition-all">
                      <td className="py-2.5 px-2 font-semibold">RTO Return Risk</td>
                      <td className="py-2.5 px-2 text-slate-400 dark:text-zinc-500 hidden md:table-cell">Benchmark &lt; 20%</td>
                      <td className={`py-2.5 px-2 font-bold text-right ${product.rtoPercentage > 20 ? 'text-red-655' : 'text-slate-900 dark:text-zinc-200'}`}>{product.rtoPercentage}%</td>
                      <td className="py-2.5 px-2 text-right">
                        {product.rtoPercentage > 20 ? (
                          <span className="px-2 py-0.5 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-[8px] font-extrabold uppercase tracking-wider rounded-md border border-red-200/50 dark:border-red-900/50">High Risk</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[8px] font-extrabold uppercase tracking-wider rounded-md border border-emerald-200/50 dark:border-emerald-900/50">Healthy</span>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-zinc-955/20 transition-all">
                      <td className="py-2.5 px-2 font-semibold">Upsell Potential</td>
                      <td className="py-2.5 px-2 text-slate-400 dark:text-zinc-500 hidden md:table-cell">Multi-unit & higher LTV</td>
                      <td className="py-2.5 px-2 font-bold text-slate-900 dark:text-zinc-100 text-right">{product.upsellPotential || 'MEDIUM'}</td>
                      <td className="py-2.5 px-2 text-right">
                        {product.upsellPotential === 'YES' ? (
                          <span className="px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-250/20 dark:border-emerald-900/50 rounded-md">High</span>
                        ) : product.upsellPotential === 'MEDIUM' ? (
                          <span className="px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-405 border border-yellow-250/20 dark:border-yellow-900/50 rounded-md">Medium</span>
                        ) : (
                          <span className="px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-250/20 dark:border-red-900/50 rounded-md">Low</span>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-zinc-955/20 transition-all">
                      <td className="py-2.5 px-2 font-semibold">Lower CAC</td>
                      <td className="py-2.5 px-2 text-slate-400 dark:text-zinc-500 hidden md:table-cell">Organic keyword strength</td>
                      <td className="py-2.5 px-2 font-bold text-slate-900 dark:text-zinc-100 text-right">{product.lowerCac || 'MEDIUM'}</td>
                      <td className="py-2.5 px-2 text-right">
                        {product.lowerCac === 'YES' ? (
                          <span className="px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-250/20 dark:border-emerald-900/50 rounded-md">High</span>
                        ) : product.lowerCac === 'MEDIUM' ? (
                          <span className="px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-405 border border-yellow-250/20 dark:border-yellow-900/50 rounded-md">Medium</span>
                        ) : (
                          <span className="px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-250/20 dark:border-red-900/50 rounded-md">Low</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Competitive Intelligence Dashboard Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Marketplace Saturation progress cards */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-3">
                <div>
                  <h3 className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest">
                    Marketplace Distribution
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-450 dark:text-zinc-500 mt-0.5">
                    Live seller count across networks
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'Amazon.in', count: product.marketplaceSellers.amazon, max: 20 },
                    { label: 'Flipkart', count: product.marketplaceSellers.flipkart, max: 20 },
                    { label: 'Meesho', count: product.marketplaceSellers.meesho, max: 20 },
                    { label: 'JioMart', count: product.marketplaceSellers.jiomart, max: 20 }
                  ].map((chan, idx) => {
                    const ratio = Math.min(100, Math.round((chan.count / chan.max) * 100));
                    let barColor = 'bg-emerald-500';
                    if (chan.count > 10) {
                      barColor = 'bg-red-500';
                    } else if (chan.count > 5) {
                      barColor = 'bg-amber-450';
                    }
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-650 dark:text-zinc-350">{chan.label}</span>
                          <span className="text-slate-800 dark:text-zinc-200">
                            {chan.count} {chan.count === 1 ? 'Seller' : 'Sellers'}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-955 rounded-full overflow-hidden">
                          <div className={`h-full ${barColor} rounded-full`} style={{ width: `${ratio}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Traffic & Ads Density Panel */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-4">
                <div>
                  <h3 className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest">
                    Traffic & Ads Density
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-455 dark:text-zinc-500 mt-0.5">
                    Meta Ad creatives & organic benchmarks
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Meta ads box */}
                  <div className="bg-gradient-to-br from-purple-50/50 to-indigo-50/50 dark:from-zinc-955 dark:to-zinc-955 border border-purple-100/50 dark:border-zinc-850 p-3 rounded-xl flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-extrabold text-purple-650 dark:text-purple-400 uppercase tracking-widest block">Active Meta Creatives</span>
                      <span className="text-base font-black text-slate-800 dark:text-zinc-200">{product.adsCount} Ads</span>
                    </div>
                    <a
                      href={`https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=IN&q=${encodeURIComponent(getCleanAdsQuery(product.simplifiedName || product.productName))}&search_type=keyword_unordered`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[9px] font-black uppercase tracking-wider rounded-lg shadow-sm cursor-pointer whitespace-nowrap"
                    >
                      Ads Library
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 dark:bg-zinc-955 p-2.5 rounded-lg border border-slate-100/60 dark:border-zinc-900/50 flex flex-col gap-1">
                      <span className="text-[8px] text-slate-400 font-bold uppercase">First Mover</span>
                      <span className={`text-[11px] font-extrabold ${
                        product.fetchedData?.firstMoverAdvantage === 'YES' ? 'text-emerald-600 dark:text-emerald-500' : 'text-amber-600 dark:text-amber-500'
                      }`}>
                        {product.fetchedData?.firstMoverAdvantage || 'MEDIUM'}
                      </span>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-zinc-955 p-2.5 rounded-lg border border-slate-100/60 dark:border-zinc-900/50 flex flex-col gap-1">
                      <span className="text-[8px] text-slate-400 font-bold uppercase">Competition</span>
                      <span className="text-[11px] font-extrabold text-slate-800 dark:text-zinc-300">
                        {product.fetchedData?.estimatedCompetition || 'MODERATE'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Shopify Competitors & Amazon Best Seller Countries + AI Advisory */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Shopify stores list */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-3">
                <h3 className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 uppercase tracking-widest">
                  Shopify Live Competitors
                </h3>

                {product.shopifyStores.length > 0 ? (
                  <div className="space-y-1.5 max-h-[150px] overflow-y-auto custom-scrollbar">
                    {product.shopifyStores.map((store, idx) => {
                      const isNotFound = store.includes('No live competitor URLs found');
                      return (
                        <div key={idx} className="bg-slate-50 dark:bg-zinc-955/70 border border-slate-100/60 dark:border-zinc-900 px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 truncate">
                            <Globe className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                            <span className="font-semibold text-slate-700 dark:text-zinc-300 truncate">
                              {store}
                            </span>
                          </div>
                          {!isNotFound && (
                            <a
                              href={store.startsWith('http') ? store : `https://${store}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-500 hover:text-brand-600 hover:underline p-1 cursor-pointer shrink-0"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No live competitor Shopify URLs logged.</p>
                )}
              </div>

              {/* Best Seller Countries */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-3">
                <h3 className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 uppercase tracking-widest">
                  Amazon Best Seller Countries
                </h3>
                
                {product.fetchedData?.amazonBestSellerCountries && product.fetchedData.amazonBestSellerCountries.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {product.fetchedData.amazonBestSellerCountries.map((country, idx) => (
                      <span key={idx} className="px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-955 border border-slate-150 dark:border-zinc-850 text-slate-700 dark:text-zinc-300 rounded-xl flex items-center gap-1.5 shadow-sm" style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <MapPin className="w-3 h-3 text-brand-500 shrink-0" />
                        {country}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No best seller countries listed.</p>
                )}
              </div>

            </div>

            {/* AI Advisory - Full Width at bottom of right column */}
            {product.aiRecommendation && (
              <div className="bg-zinc-950 text-white rounded-2xl p-5 relative overflow-hidden shadow-lg border border-zinc-800/85 group">
                <div className="absolute top-0 right-0 w-36 h-36 bg-brand-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-brand-500/15 transition-all"></div>
                <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl"></div>
                
                <div className="relative z-10 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-yellow-405/10 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-450 animate-pulse" />
                      </div>
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">AI Advisory</span>
                    </div>

                    <button
                      onClick={handleCopyAdvisory}
                      className="text-slate-405 hover:text-white transition-colors p-1 hover:bg-zinc-900 rounded-lg cursor-pointer"
                      title="Copy recommendation"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-450" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  
                  <p className="text-xs font-medium leading-relaxed text-zinc-300 select-all max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                    {product.aiRecommendation}
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );

};
