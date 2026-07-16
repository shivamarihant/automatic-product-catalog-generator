import React, { useState, useRef, useEffect } from 'react';
import { type ProductInput, uploadImages, fetchAiCompetitorAnalysis } from '../utils/api';
import { Upload, X, Plus, Package, Globe, ShieldAlert, BadgeInfo, FileText, ArrowRight, Loader2, Sparkles } from 'lucide-react';

interface ProductFormProps {
  onSave: (product: ProductInput) => void;
  isSaving: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({ onSave, isSaving }) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'competition' | 'logistics'>('basic');
  const [productName, setProductName] = useState('');
  const [simplifiedName, setSimplifiedName] = useState('');
  const [cost, setCost] = useState<number>(0);
  const [moq, setMoq] = useState<number>(100);
  const [tentativeSellingPrice, setTentativeSellingPrice] = useState<number>(0);
  const [rtoPercentage, setRtoPercentage] = useState<number>(15);
  const [upsellPotential, setUpsellPotential] = useState<'YES' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [lowerCac, setLowerCac] = useState<'YES' | 'MEDIUM' | 'LOW'>('MEDIUM');
  
  // Market Sellers
  const [amazonSellers, setAmazonSellers] = useState<number | undefined>(undefined);
  const [flipkartSellers, setFlipkartSellers] = useState<number | undefined>(undefined);
  const [meeshoSellers, setMeeshoSellers] = useState<number | undefined>(undefined);
  const [jiomartSellers, setJiomartSellers] = useState<number | undefined>(undefined);

  // Shopify Stores
  const [shopifyStores, setShopifyStores] = useState<string[]>(['']);
  const [adsCount, setAdsCount] = useState<number | undefined>(undefined);

  // Logistics
  const [weight, setWeight] = useState('500g');
  const [length, setLength] = useState<number>(10);
  const [width, setWidth] = useState<number>(10);
  const [height, setHeight] = useState<number>(10);
  const [shippingCost, setShippingCost] = useState<number>(50);
  const [shippingType, setShippingType] = useState<'cosmetics' | 'non-cosmetics'>('non-cosmetics');

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

  // Images state
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation errors
  const [validationError, setValidationError] = useState('');
  const [isResearchingAi, setIsResearchingAi] = useState(false);

  const handleAiResearch = async () => {
    if (!productName.trim()) {
      setValidationError('Please enter a product name on the Basic Info tab first.');
      return;
    }
    setIsResearchingAi(true);
    setValidationError('');
    try {
      const data = await fetchAiCompetitorAnalysis(productName, images);
      setAmazonSellers(data.amazon);
      setFlipkartSellers(data.flipkart);
      setMeeshoSellers(data.meesho);
      setJiomartSellers(data.jiomart);
      setShopifyStores(data.shopifyStores.length > 0 ? data.shopifyStores : ['']);
      setAdsCount(data.adsCount);
      setSimplifiedName(data.simplifiedName || '');
    } catch (err: any) {
      setValidationError(err.message || 'AI competitor analysis failed. Please verify API key.');
    } finally {
      setIsResearchingAi(false);
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > 10) {
      setValidationError('You can upload a maximum of 10 images.');
      return;
    }

    setUploadingImages(true);
    setValidationError('');
    try {
      const urls = await uploadImages(files);
      setImages(prev => [...prev, ...urls]);
    } catch (err: any) {
      setValidationError(err.message || 'Image upload failed.');
    } finally {
      setUploadingImages(false);
    }
  };

  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            files.push(file);
          }
        }
      }
      
      if (files.length === 0) return;
      
      if (images.length + files.length > 10) {
        setValidationError('You can upload a maximum of 10 images.');
        return;
      }
      
      setUploadingImages(true);
      setValidationError('');
      try {
        const urls = await uploadImages(files);
        setImages(prev => [...prev, ...urls]);
      } catch (err: any) {
        setValidationError(err.message || 'Image upload failed.');
      } finally {
        setUploadingImages(false);
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => {
      window.removeEventListener('paste', handleGlobalPaste);
    };
  }, [images]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!productName.trim()) {
      setValidationError('Product Name is required.');
      setActiveTab('basic');
      return;
    }
    if (images.length === 0) {
      setValidationError('Please upload at least 1 product image.');
      setActiveTab('basic');
      return;
    }
    if (cost <= 0) {
      setValidationError('Product cost must be greater than 0.');
      setActiveTab('basic');
      return;
    }
    if (tentativeSellingPrice <= 0) {
      setValidationError('Tentative Selling Price must be greater than 0.');
      setActiveTab('logistics');
      return;
    }

    const blacklistedDomains = [
      'amazon', 'flipkart', 'meesho', 'snapdeal', 'jiomart',
      'myntra', 'ajio', 'nykaa', 'ebay', 'aliexpress', 'etsy',
      'walmart', 'target', 'indiamart', 'justdial', 'alibaba',
      'tradeindia', 'youtube', 'instagram', 'facebook', 'twitter', 'pinterest',
      'linkedin', 'reddit', 'quora', 'glassdoor', 'ambitionbox',
      'desertcart', 'ubuy', 'u-buy', 'fruugo', 'grandado', 'forbes', 'nytimes',
      'healthline', 'webmd', 'medicalnewstoday', 'cosmopolitan', 'rehabmart', 'tiktok'
    ];
    const nonWebsites = shopifyStores.filter(store => store.trim() !== '');
    const hasMarketplace = nonWebsites.some(store => {
      const lower = store.toLowerCase();
      return blacklistedDomains.some(domain => lower.includes(domain));
    });

    if (hasMarketplace) {
      setValidationError('Competitor URLs must be Shopify website URLs only. Marketplace links (Amazon, Flipkart, Meesho, etc.) or social media links are not allowed.');
      setActiveTab('competition');
      return;
    }

    const parsedActualWeight = parseWeightToKg(weight);
    const dimensionalWeight = (length * width * height) / 5000;
    const courierVolumetricWeight = Math.max(parsedActualWeight, dimensionalWeight);
    const calculatedCourierCost = courierVolumetricWeight * (shippingType === 'cosmetics' ? 1400 : 700);

    const payload: ProductInput = {
      productName,
      simplifiedName,
      images,
      cost,
      moq,
      upsellPotential,
      lowerCac,
      marketplaceSellers: {
        amazon: amazonSellers ?? 0,
        flipkart: flipkartSellers ?? 0,
        meesho: meeshoSellers ?? 0,
        jiomart: jiomartSellers ?? 0
      },
      shopifyStores: shopifyStores.filter(store => store.trim() !== ''),
      adsCount: adsCount ?? 0,
      logistics: {
        weight,
        dimensions: { length, width, height },
        shippingCost: calculatedCourierCost,
        shippingType
      },
      tentativeSellingPrice,
      rtoPercentage
    };

    onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-sm rounded-3xl overflow-hidden transition-all">
      {/* Header Tabs */}
      <div className="flex p-2 bg-slate-50/80 dark:bg-zinc-950/80 border-b border-slate-100 dark:border-zinc-800/80 gap-1.5">
        <button
          type="button"
          onClick={() => setActiveTab('basic')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
            activeTab === 'basic'
              ? 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 shadow-sm border border-slate-200/60 dark:border-zinc-700/50'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          <Package className="w-4 h-4 text-brand-500" />
          Basic & Images
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('competition')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
            activeTab === 'competition'
              ? 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 shadow-sm border border-slate-200/60 dark:border-zinc-700/50'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          <Globe className="w-4 h-4 text-brand-500" />
          Competition
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('logistics')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
            activeTab === 'logistics'
              ? 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 shadow-sm border border-slate-200/60 dark:border-zinc-700/50'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-brand-500" />
          Logistics & Sourcing
        </button>
      </div>

      {/* Error Alert */}
      {validationError && (
        <div className="p-4 mx-6 mt-6 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 text-red-700 dark:text-red-400 rounded-2xl text-xs flex items-center gap-2.5">
          <BadgeInfo className="w-4 h-4 text-red-500 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Form Content */}
      <div className="p-6">
        
        {/* TAB 1: BASIC INFO & IMAGES */}
        {activeTab === 'basic' && (
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Product Name</label>
              <input
                type="text"
                placeholder="e.g. Wireless Gaming Mouse"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-sm font-medium bg-slate-50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all dark:text-zinc-100 placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Product Cost (₹ Landing Price by Air)</label>
                <input
                  type="number"
                  min="0"
                  value={cost || ''}
                  onChange={(e) => setCost(Number(e.target.value))}
                  placeholder="e.g. 420"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-sm font-medium bg-slate-50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all dark:text-zinc-100 placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Minimum Order Qty (MOQ)</label>
                <input
                  type="number"
                  min="1"
                  value={moq || ''}
                  onChange={(e) => setMoq(Number(e.target.value))}
                  placeholder="e.g. 500"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-sm font-medium bg-slate-50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all dark:text-zinc-100 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Upsell & Bundle Potential (AOV & LTV Growth)</label>
                <select
                  value={upsellPotential}
                  onChange={(e) => setUpsellPotential(e.target.value as 'YES' | 'MEDIUM' | 'LOW')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-sm font-medium bg-slate-50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all dark:text-zinc-100"
                >
                  <option value="YES">YES</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Lower CAC</label>
                <select
                  value={lowerCac}
                  onChange={(e) => setLowerCac(e.target.value as 'YES' | 'MEDIUM' | 'LOW')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-sm font-medium bg-slate-50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all dark:text-zinc-100"
                >
                  <option value="YES">YES</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>
            </div>

            {/* Images Upload Zone */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Product Images ({images.length}/10)</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 dark:border-zinc-800 hover:border-brand-400 dark:hover:border-brand-500 hover:bg-brand-50/5 dark:hover:bg-brand-500/5 cursor-pointer rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center"
              >
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageFileChange}
                  className="hidden"
                />
                
                {uploadingImages ? (
                  <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-2" />
                ) : (
                  <Upload className="w-8 h-8 text-slate-400 dark:text-zinc-500 mb-2" />
                )}
                <span className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Click to upload files</span>
                <span className="text-xxs text-slate-400 dark:text-zinc-500 mt-1">Supports PNG, JPG, JPEG, WebP. Min 1, Max 10.</span>
              </div>

              {/* Thumbnails grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-5 gap-3 mt-4">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group aspect-square border border-slate-100 dark:border-zinc-850 rounded-xl overflow-hidden bg-slate-50 dark:bg-zinc-950">
                      <img src={img} alt="preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImages(prev => prev.filter((_, i) => i !== idx));
                        }}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-650 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: COMPETITION INFORMATION */}
        {activeTab === 'competition' && (
          <div className="space-y-5">
            <div>
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800/80 pb-2 mb-3.5">
                <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300">Indian Marketplace Competitors</h4>
                <button
                  type="button"
                  onClick={handleAiResearch}
                  disabled={isResearchingAi || !productName.trim()}
                  className="text-xxs font-extrabold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100/70 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-900/60 rounded-xl px-3 py-1.5 flex items-center gap-1.5 transition-all cursor-pointer disabled:bg-slate-50 dark:disabled:bg-zinc-950 disabled:border-slate-200 dark:disabled:border-zinc-900 disabled:text-slate-400 dark:disabled:text-zinc-600"
                >
                  {isResearchingAi ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      AI Sourcing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
                      AI Sourcing Research
                    </>
                  )}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Amazon India (Sellers)</label>
                  <input
                    type="number"
                    min="0"
                    value={amazonSellers ?? ''}
                    onChange={(e) => setAmazonSellers(e.target.value === '' ? undefined : Number(e.target.value))}
                    placeholder="e.g. 12"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-sm font-medium bg-slate-50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all dark:text-zinc-100 placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Flipkart (Sellers)</label>
                  <input
                    type="number"
                    min="0"
                    value={flipkartSellers ?? ''}
                    onChange={(e) => setFlipkartSellers(e.target.value === '' ? undefined : Number(e.target.value))}
                    placeholder="e.g. 8"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-sm font-medium bg-slate-50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all dark:text-zinc-100 placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Meesho (Sellers)</label>
                  <input
                    type="number"
                    min="0"
                    value={meeshoSellers ?? ''}
                    onChange={(e) => setMeeshoSellers(e.target.value === '' ? undefined : Number(e.target.value))}
                    placeholder="e.g. 6"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-sm font-medium bg-slate-50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all dark:text-zinc-100 placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">JioMart (Sellers)</label>
                  <input
                    type="number"
                    min="0"
                    value={jiomartSellers ?? ''}
                    onChange={(e) => setJiomartSellers(e.target.value === '' ? undefined : Number(e.target.value))}
                    placeholder="e.g. 3"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-sm font-medium bg-slate-50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all dark:text-zinc-100 placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 border-b border-slate-100 dark:border-zinc-800/80 pb-2 mb-3.5">Active Competitor Product URLs</h4>
              <div className="space-y-3">
                {shopifyStores.map((store, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={store}
                      onChange={(e) => {
                        const updated = [...shopifyStores];
                        updated[idx] = e.target.value;
                        setShopifyStores(updated);
                      }}
                      placeholder="e.g. https://peppymart.in/products/item-name"
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-sm font-medium bg-slate-50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all dark:text-zinc-100 placeholder:text-slate-400"
                    />
                    {shopifyStores.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setShopifyStores(prev => prev.filter((_, i) => i !== idx))}
                        className="p-3 text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-950/20 hover:bg-red-100/50 rounded-xl transition-all cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setShopifyStores(prev => [...prev, ''])}
                  className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Competitor Product URL
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 border-b border-slate-100 dark:border-zinc-800/80 pb-2 mb-3.5">Marketing Density</h4>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Meta Ads Library (Active Campaigns)</label>
                <input
                  type="number"
                  min="0"
                  value={adsCount ?? ''}
                  onChange={(e) => setAdsCount(e.target.value === '' ? undefined : Number(e.target.value))}
                  placeholder="e.g. 15"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-sm font-medium bg-slate-50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all dark:text-zinc-100 placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LOGISTICS & SOURCING INFORMATION */}
        {activeTab === 'logistics' && (
          <div className="space-y-5">
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 border-b border-slate-100 dark:border-zinc-800/80 pb-2 mb-3.5">Package Dimensions & Weight</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Actual Package Weight (e.g. 500g or 1.2kg)</label>
                  <input
                    type="text"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="e.g. 350g"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-sm font-medium bg-slate-50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all dark:text-zinc-100 placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest mb-1.5">Courier Volumetric Weight (Calculated Max)</label>
                  <div className="px-4 py-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm font-semibold text-slate-500 dark:text-zinc-400">
                    {Math.max(parseWeightToKg(weight), (length * width * height) / 5000).toFixed(3)} kg
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Box Dimensions (L x W x H in cm)</label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min="1"
                      value={length || ''}
                      onChange={(e) => setLength(Number(e.target.value))}
                      placeholder="L"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-sm text-center font-medium bg-slate-50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all dark:text-zinc-100 placeholder:text-slate-400"
                    />
                    <span className="absolute right-3 text-[10px] font-bold text-slate-400 uppercase">cm</span>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min="1"
                      value={width || ''}
                      onChange={(e) => setWidth(Number(e.target.value))}
                      placeholder="W"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-sm text-center font-medium bg-slate-50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all dark:text-zinc-100 placeholder:text-slate-400"
                    />
                    <span className="absolute right-3 text-[10px] font-bold text-slate-400 uppercase">cm</span>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min="1"
                      value={height || ''}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      placeholder="H"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-sm text-center font-medium bg-slate-50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all dark:text-zinc-100 placeholder:text-slate-400"
                    />
                    <span className="absolute right-3 text-[10px] font-bold text-slate-400 uppercase">cm</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 border-b border-slate-100 dark:border-zinc-800/80 pb-2 mb-3.5">Logistics Freight & Return Projections</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest mb-1.5">Landed Shipping Category</label>
                  <select
                    value={shippingType}
                    onChange={(e) => setShippingType(e.target.value as 'cosmetics' | 'non-cosmetics')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-805 text-sm font-medium bg-slate-50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all dark:text-zinc-100"
                  >
                    <option value="non-cosmetics">Non-Cosmetics (₹700 / kg)</option>
                    <option value="cosmetics">Cosmetics (₹1,400 / kg)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest mb-1.5">Calculated Courier Cost (₹ per Unit)</label>
                  <div className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-805 bg-slate-100 dark:bg-zinc-955 text-sm font-black text-slate-800 dark:text-zinc-200">
                    ₹{(Math.max(parseWeightToKg(weight), (length * width * height) / 5000) * (shippingType === 'cosmetics' ? 1400 : 700)).toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest mb-1.5">Estimated RTO Return (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={rtoPercentage || ''}
                    onChange={(e) => setRtoPercentage(Number(e.target.value))}
                    placeholder="e.g. 18"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-sm font-medium bg-slate-50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all dark:text-zinc-100 placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 border-b border-slate-100 dark:border-zinc-800/80 pb-2 mb-3.5">Selling Target Bracket</h4>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Target Selling Price (₹ India Retail)</label>
                <input
                  type="number"
                  min="0"
                  value={tentativeSellingPrice || ''}
                  onChange={(e) => setTentativeSellingPrice(Number(e.target.value))}
                  placeholder="e.g. 1199"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-sm font-medium bg-slate-50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all dark:text-zinc-100 placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Footer Save Button */}
      <div className="border-t border-slate-150 dark:border-zinc-800/80 p-4 bg-slate-50 dark:bg-zinc-950/30 flex items-center justify-between">
        <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest max-w-[280px]">
          Please review the details in each tab before saving.
        </div>
        
        {activeTab !== 'logistics' ? (
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'basic' ? 'competition' : 'logistics')}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-black hover:bg-zinc-900 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
          >
            Next Section
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-400 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-brand-500/10 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5" />
                Save Product
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
};
