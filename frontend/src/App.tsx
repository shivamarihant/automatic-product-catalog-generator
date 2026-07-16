import { useState, useEffect } from 'react';
import { 
  type ProductInput, 
  type Catalog, 
  fetchProducts, 
  createProduct, 
  generateCatalog, 
  fetchProductCatalogs
} from './utils/api';
import { ProductForm } from './components/ProductForm';
import { CatalogPreview } from './components/CatalogPreview';
import { 
  Plus, 
  FolderOpen, 
  Sparkles, 
  Key, 
  FileText, 
  Loader2,
  Sun,
  Moon,
  Search
} from 'lucide-react';

const CHECKPOINTS = [
  'Initializing Puppeteer render container...',
  'Scraping Amazon Global Marketplaces (USA, UK, DE, IN)...',
  'Searching competitor saturation across Flipkart and Shopify...',
  'Calculating margin metrics & logistics Opportunity Score...',
  'Invoking AI recommendation engine...',
  'Compiling A4 pixel-perfect PDF catalog...'
];

const getSecureUrl = (url: string) => {
  if (!url) return '';
  if (window.location.protocol === 'https:' && url.startsWith('http://')) {
    if (!url.includes('localhost') && !url.includes('127.0.0.1')) {
      return url.replace('http://', 'https://');
    }
  }
  return url;
};

function App() {
  const [products, setProducts] = useState<ProductInput[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductInput | null>(null);
  const [activeCatalog, setActiveCatalog] = useState<Catalog | null>(null);
  const [productCatalogs, setProductCatalogs] = useState<Catalog[]>([]);
  const [showGenerateNewForm, setShowGenerateNewForm] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isGeneratingCatalog, setIsGeneratingCatalog] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(false);
  
  // Theme & Search
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Dark Mode effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  
  // Catalog Inputs
  const [preparedBy, setPreparedBy] = useState('Global Sourcing Lead');
  const [catalogTitle, setCatalogTitle] = useState('Market Feasibility & Landed Cost Report');
  
  // API settings
  const [geminiKey, setGeminiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Initial load
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setErrorMsg('');
      const data = await fetchProducts();
      setProducts(data);
    } catch (err: any) {
      setErrorMsg('Could not connect to Sourcing Server. Please verify the backend is running.');
      console.error(err);
    }
  };

  const handleSelectProduct = async (prod: ProductInput) => {
    setSelectedProduct(prod);
    setActiveCatalog(null);
    setProductCatalogs([]);
    setShowGenerateNewForm(false);
    setShowAddProduct(false);
    setIsLoadingCatalogs(true);
    
    if (prod._id) {
      try {
        const history = await fetchProductCatalogs(prod._id);
        setProductCatalogs(history);
        if (history.length > 0) {
          setActiveCatalog(history[0]);
        }
      } catch (err) {
        console.error('Error fetching catalog history:', err);
      } finally {
        setIsLoadingCatalogs(false);
      }
    } else {
      setIsLoadingCatalogs(false);
    }
  };

  const handleSaveProduct = async (newProduct: ProductInput) => {
    setIsSavingProduct(true);
    setErrorMsg('');
    try {
      const saved = await createProduct(newProduct);
      setProducts(prev => [saved, ...prev]);
      setSelectedProduct(saved);
      setShowAddProduct(false);
      setActiveCatalog(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save product.');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedProduct || !selectedProduct._id) return;
    
    setIsGeneratingCatalog(true);
    setErrorMsg('');
    
    // Simulate generation checkpoints for visual immersion
    const checkpoints = [
      'Initializing Puppeteer render container...',
      'Scraping Amazon Global Marketplaces (USA, UK, DE, IN)...',
      'Searching competitor saturation across Flipkart and Shopify...',
      'Calculating margin metrics & logistics Opportunity Score...',
      'Invoking AI recommendation engine...',
      'Compiling A4 pixel-perfect PDF catalog...'
    ];

    let stepIdx = 0;
    setGenerationStep(checkpoints[stepIdx]);
    
    const interval = setInterval(() => {
      stepIdx++;
      if (stepIdx < checkpoints.length) {
        setGenerationStep(checkpoints[stepIdx]);
      }
    }, 1800);

    try {
      // Configure local environment variable temporarily via query/header if needed,
      // but in this version we can save it on the window/config or make it read from .env on backend.
      // We will make the generate API request.
      const res = await generateCatalog(selectedProduct._id, {
        preparedBy,
        catalogTitle
      });

      clearInterval(interval);
      setGenerationStep('Finalizing files...');
      
      // Update selected product, catalog, and history
      setSelectedProduct(res.product);
      if (res.product._id) {
        const history = await fetchProductCatalogs(res.product._id);
        setProductCatalogs(history);
      }
      setActiveCatalog(res.catalog);
      setShowGenerateNewForm(false);
      
      // Refresh products list
      await loadProducts();
      
      // Refetch specific item to ensure state is synchronized
      const updatedList = await fetchProducts();
      const updatedProduct = updatedList.find(p => p._id === res.product._id);
      if (updatedProduct) {
        setSelectedProduct(updatedProduct);
      }
    } catch (err: any) {
      clearInterval(interval);
      setErrorMsg(err.message || 'Failed to generate catalog.');
    } finally {
      setIsGeneratingCatalog(false);
      setGenerationStep('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 bg-grid-pattern dark:bg-[#09090b] flex flex-col font-sans transition-colors duration-500">
      
      {/* Premium Studio Header */}
      {!selectedProduct && !showAddProduct && (
        <header className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-sm px-4 py-2.5 relative z-40 print:hidden transition-colors duration-500 rounded-full mx-3 sm:mx-auto mt-4 flex items-center justify-between gap-4" style={{ width: 'fit-content', maxWidth: 'calc(100vw - 24px)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center shadow-md shadow-brand-500/20 shrink-0">
            <svg style={{ width: '18px', height: '18px' }} className="text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <img src="/assets/importerr-logo.png" alt="importerr.com" style={{ height: '20px', width: 'auto', display: 'block' }} />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="hidden w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-full border border-slate-200 dark:border-zinc-700 transition-all cursor-pointer shadow-sm"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="hidden flex items-center gap-1.5 px-4 py-1.5 bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all border border-slate-200 dark:border-zinc-700 cursor-pointer shadow-sm"
          >
            <Key className="w-3.5 h-3.5" />
            API Settings
          </button>
          <button
            onClick={() => {
              setShowAddProduct(true);
              setSelectedProduct(null);
              setActiveCatalog(null);
            }}
            className="flex items-center gap-1.5 px-4 sm:px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer shadow-md shadow-brand-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">New</span> Product
          </button>
        </div>
      </header>
      )}

      {/* Main Workspace Wrapper */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-4 sm:gap-6 print:p-0">
        
        {/* Top: Sourcing Nodes List / Settings */}
        {!selectedProduct && !showAddProduct && (
          <div className="w-full space-y-6 print:hidden">
          
          {/* Settings Panel */}
          {showSettings && (
            <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-sm p-6 lg:p-8 rounded-[2rem] space-y-4 transition-all mb-6">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-zinc-800">
                <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-2 font-sans">
                  <Key className="w-4 h-4 text-brand-500" />
                  Credentials configuration
                </h4>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Gemini API Key</label>
                <input
                  type="password"
                  placeholder="Paste your Gemini AI API Key"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-sm font-medium bg-slate-50 dark:bg-zinc-950/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all dark:text-zinc-100 placeholder:text-slate-400"
                />
              </div>
              <p className="text-[10px] text-slate-400 dark:text-zinc-550 leading-relaxed font-semibold">
                Keys are utilized server-side. For testing, a robust template-driven rule engine is active as a zero-config fallback.
              </p>
            </div>
          )}

          {/* Sourcing Nodes Folder */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-sm rounded-[2rem] p-4 sm:p-6 lg:p-8 flex flex-col transition-all">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
                Sourcing Nodes
              </h3>
              <span className="text-[10px] font-bold bg-slate-50 dark:bg-zinc-800 px-3 py-1.5 rounded-full text-slate-500 dark:text-zinc-400">
                {products.length} Node(s)
              </span>
            </div>

            {/* Search Input */}
            <div className="mb-4 sm:mb-6 relative">
              <Search className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-4 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sourcing nodes..."
                className="w-full bg-white dark:bg-zinc-950 pl-11 pr-4 py-3 rounded-full text-xs font-medium border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:text-zinc-200 shadow-sm transition-all placeholder:text-slate-400"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-105 text-red-700 dark:text-red-400 text-xs rounded-xl mb-4">
                {errorMsg}
              </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {products
                .filter(p => p.productName.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((prod) => {
                  return (
                    <div
                      key={prod._id}
                      onClick={() => handleSelectProduct(prod)}
                      className="group flex flex-col bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 rounded-[1.5rem] overflow-hidden cursor-pointer hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 transition-all duration-300"
                    >
                      {/* Image Header with Score Overlay */}
                      <div className="relative w-full pt-[75%] bg-slate-50 dark:bg-zinc-950 overflow-hidden border-b border-slate-100 dark:border-zinc-800">
                        <img 
                          src={getSecureUrl(prod.images[0])} 
                          alt="Product" 
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                          crossOrigin="anonymous"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500&auto=format&fit=crop&q=80';
                          }}
                        />
                        {/* Score Badge floating on image */}
                        {prod.calculations && (
                          <div className="absolute top-3 right-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-2.5 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 z-10">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[10px] font-extrabold text-slate-700 dark:text-zinc-200 uppercase tracking-widest">
                              Score: {prod.calculations.opportunityScore}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Card Content */}
                      <div className="p-5 flex flex-col flex-1">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100 line-clamp-2 leading-snug mb-4 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                          {prod.productName}
                        </h4>
                        
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-5 mt-auto">
                          <div className="bg-slate-50 dark:bg-zinc-950/50 p-3 rounded-xl border border-slate-200 dark:border-zinc-800/80 flex flex-col justify-between">
                            <div>
                              <div className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Landed Cost</div>
                              <div className="text-sm font-extrabold text-slate-700 dark:text-zinc-300">₹{prod.cost}</div>
                            </div>
                            <div className="text-[9px] font-bold text-slate-450 dark:text-zinc-500 mt-1 uppercase">MOQ: {prod.moq} pcs</div>
                          </div>
                          <div className="bg-brand-50/50 dark:bg-brand-950/20 p-3 rounded-xl border border-brand-100/50 dark:border-brand-900/30">
                            <div className="text-[9px] font-bold text-brand-500/80 dark:text-brand-400 uppercase tracking-wider mb-1">EST Selling Price</div>
                            <div className="text-sm font-extrabold text-brand-700 dark:text-brand-400">₹{prod.tentativeSellingPrice || 0}</div>
                          </div>
                        </div>

                        {/* Badges Row */}
                        <div className="flex flex-wrap items-center gap-2">
                          {prod.calculations && (
                            <span className="px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                              Margin: {prod.calculations.marginPercentage}% (₹{prod.calculations.margin})
                            </span>
                          )}
                        </div>
                        {/* Sourcing Opportunity Score Spectrum Bar */}
                        {prod.calculations && (
                          <div className="mb-4">
                            <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2.5">
                              <span>Sourcing Opportunity</span>
                            </div>
                            
                            {/* Color Spectrum Gradient Bar */}
                            <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-emerald-500 mb-2.5 relative">
                              {/* Slide marker indicator corresponding to the score location */}
                              <div 
                                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white dark:bg-zinc-800 border-2 border-slate-900 dark:border-zinc-100 rounded-full shadow-sm"
                                style={{ left: `calc(${prod.calculations.opportunityScore}% - 6px)` }}
                              />
                            </div>
                            
                            {/* Spectrum Status Pill Labels */}
                            <div className="flex items-center justify-between gap-1 text-[8px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mt-1 relative">
                              {(() => {
                                const score = prod.calculations.opportunityScore;
                                const isLow = score < 50;
                                const isMed = score >= 50 && score < 70;
                                const isHigh = score >= 70 && score < 85;
                                const isVeryHigh = score >= 85;
                                return (
                                  <>
                                    <span className={`px-2 py-0.5 rounded-full transition-all ${isLow ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-black shadow-sm' : ''}`}>Low</span>
                                    <span className={`px-2 py-0.5 rounded-full transition-all ${isMed ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-black shadow-sm' : ''}`}>Medium</span>
                                    <span className={`px-2 py-0.5 rounded-full transition-all ${isHigh ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-black shadow-sm' : ''}`}>High</span>
                                    <span className={`px-2 py-0.5 rounded-full transition-all ${isVeryHigh ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-black shadow-sm' : ''}`}>Very High</span>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

              {products.filter(p => p.productName.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                <div className="p-8 text-center text-xs text-slate-450 dark:text-zinc-550 italic font-medium col-span-full">
                  No matches found for your search.
                </div>
              )}
            </div>
          </div>
        </div>
        )}

        {/* Bottom: Interactive Workspace Content */}
        {(selectedProduct || showAddProduct) && (
          <div className="w-full space-y-6 print:space-y-0">
            <button
              onClick={() => {
                setSelectedProduct(null);
                setShowAddProduct(false);
              }}
              className="print:hidden flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors bg-white/50 dark:bg-zinc-900/50 px-4 py-2 rounded-xl w-max border border-slate-200/50 dark:border-zinc-800/50 mb-2"
            >
              ← Back to Products
            </button>
          
          {/* 1. Add Product Form */}
          {showAddProduct && (
            <div className="print:hidden">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <Plus className="w-4 h-4 text-brand-500" />
                  Create Sourcing Product Node
                </h2>
              </div>
              <ProductForm onSave={handleSaveProduct} isSaving={isSavingProduct} />
            </div>
          )}

          {/* 2. Loading Catalog Generation overlay */}
          {isGeneratingCatalog && (
            <div className="glass-panel rounded-3xl p-10 max-w-xl mx-auto flex flex-col space-y-6 print:hidden transition-all text-center">
              <div className="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md shadow-brand-500/20">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">Sourcing Intelligence Compilation</h3>
                <p className="text-xxs text-slate-450 dark:text-zinc-550 uppercase tracking-widest font-bold">Execution Steps Pipeline</p>
              </div>

              {/* Checkpoint list */}
              <div className="bg-slate-50/50 dark:bg-zinc-950/40 border border-slate-100 dark:border-zinc-850 p-5 rounded-2xl space-y-3.5 text-left transition-all">
                {(() => {
                  const activeStepIndex = CHECKPOINTS.indexOf(generationStep);
                  return CHECKPOINTS.map((step, idx) => {
                    const isCompleted = idx < activeStepIndex;
                    const isActive = idx === activeStepIndex;
                    return (
                      <div key={idx} className="flex items-center gap-3.5">
                        {isCompleted ? (
                          <div className="w-4.5 h-4.5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm shadow-emerald-500/20">
                            ✓
                          </div>
                        ) : isActive ? (
                          <div className="w-4.5 h-4.5 bg-indigo-50 dark:bg-zinc-800 rounded-full flex items-center justify-center shrink-0 border border-indigo-200 dark:border-zinc-700">
                            <Loader2 className="w-3 h-3 text-indigo-500 animate-spin" />
                          </div>
                        ) : (
                          <div className="w-4.5 h-4.5 border border-slate-200 dark:border-zinc-800 rounded-full flex items-center justify-center shrink-0">
                            <div className="w-1.5 h-1.5 bg-slate-300 dark:bg-zinc-700 rounded-full"></div>
                          </div>
                        )}
                        <span className={`text-[11px] font-semibold transition-all ${
                          isCompleted 
                            ? 'text-slate-400 dark:text-zinc-600 line-through decoration-slate-300 dark:decoration-zinc-800 font-medium' 
                            : isActive 
                            ? 'text-slate-800 dark:text-zinc-200 font-bold' 
                            : 'text-slate-400 dark:text-zinc-650'
                        }`}>
                          {step}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>

              <p className="text-[10px] text-slate-400 dark:text-zinc-550 max-w-sm mx-auto leading-relaxed">
                Puppeteer controls local Google Chrome to layout the report page sheets, print vector margins, and calculate target opportunity grades.
              </p>
            </div>
          )}

          {/* 3. Catalog Preview Screen */}
          {selectedProduct && !showAddProduct && !isGeneratingCatalog && (
            <div className="space-y-6 print:space-y-0">
              {isLoadingCatalogs ? (
                <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-sm p-12 rounded-[2rem] flex flex-col justify-center items-center gap-4 text-center min-h-[350px]">
                  <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Loading Sourcing Catalog...</p>
                </div>
              ) : (
                <>
                  {/* Sourcing Node is Selected, but either no catalogs exist or they clicked 'New Version' */}
                  {(showGenerateNewForm || productCatalogs.length === 0) && (
                    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 sm:p-6 space-y-5 print:hidden">
                      
                      <div className="flex flex-wrap justify-between items-start gap-3 border-b border-slate-100 pb-4">
                        <div className="min-w-0">
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">
                            {productCatalogs.length === 0 ? 'Unanalyzed Sourcing Node' : 'Generate New Sourcing Snapshot'}
                          </span>
                          <h2 className="text-lg font-bold text-slate-800 mt-2 line-clamp-2">{selectedProduct.productName}</h2>
                        </div>
                        {productCatalogs.length > 0 && (
                          <button
                            onClick={() => setShowGenerateNewForm(false)}
                            className="text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer shrink-0"
                          >
                            Cancel
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        <div className="bg-slate-50/50 p-3 sm:p-4 rounded-xl border border-slate-100">
                          <span className="text-[9px] font-semibold text-slate-400 block mb-1">Product Cost</span>
                          <span className="text-sm font-bold text-slate-800">₹{selectedProduct.cost}</span>
                        </div>
                        <div className="bg-slate-50/50 p-3 sm:p-4 rounded-xl border border-slate-100">
                          <span className="text-[9px] font-semibold text-slate-400 block mb-1">MOQ</span>
                          <span className="text-sm font-bold text-slate-800">{selectedProduct.moq} pcs</span>
                        </div>
                        <div className="bg-slate-50/50 p-3 sm:p-4 rounded-xl border border-slate-100">
                          <span className="text-[9px] font-semibold text-slate-400 block mb-1">Target Price</span>
                          <span className="text-sm font-bold text-slate-800">₹{selectedProduct.tentativeSellingPrice}</span>
                        </div>
                      </div>

                      {/* Catalog Compilation Info */}
                      <div className="bg-slate-50 border border-slate-150 p-4 sm:p-5 rounded-2xl space-y-4">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-brand-500" />
                          Catalog Sheet Configuration
                        </h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-2">Catalog Sheet Title</label>
                            <input
                              type="text"
                              value={catalogTitle}
                              onChange={(e) => setCatalogTitle(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-2">Prepared By (Author)</label>
                            <input
                              type="text"
                              value={preparedBy}
                              onChange={(e) => setPreparedBy(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleGenerate}
                        className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold uppercase tracking-wider text-xs rounded-xl transition-all shadow-sm shadow-brand-500/15 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        Generate Market Intelligence Catalog
                      </button>
                    </div>
                  )}

                  {/* Sourcing Node has catalogs, and we are not in the new catalog generation view */}
                  {!showGenerateNewForm && productCatalogs.length > 0 && activeCatalog && (
                    <div className="space-y-4">
                      {/* Historical Report Version Archive Selector bar */}
                      <div className="bg-white border border-slate-150 px-3 sm:px-4 py-2.5 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3 print:hidden">
                        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">Snapshot:</span>
                          <select
                            value={activeCatalog._id}
                            onChange={(e) => {
                              const cat = productCatalogs.find(c => c._id === e.target.value);
                              if (cat) setActiveCatalog(cat);
                            }}
                            className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none cursor-pointer hover:border-slate-350 min-w-0 flex-1"
                          >
                            {productCatalogs.map((cat) => (
                              <option key={cat._id} value={cat._id}>
                                {new Date(cat.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })} - {cat.catalogTitle}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          onClick={() => setShowGenerateNewForm(true)}
                          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">New Version</span>
                          <span className="sm:hidden">New</span>
                        </button>
                      </div>

                      {/* Render Catalog Preview */}
                      <div className="print:m-0">
                        <CatalogPreview product={selectedProduct} catalog={activeCatalog} />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* 4. Empty State Workspace */}
          {/* Removed Empty State as grid acts as default view */}
          </div>
        )}
      </main>
      
      {/* Inject custom loader keyframe styles in document head */}
      <style>{`
        @keyframes loader {
          0% { width: 0%; }
          50% { width: 60%; }
          100% { width: 100%; }
        }
        .animate-loader {
          animation: loader 11s infinite linear;
        }
      `}</style>
    </div>
  );
}

export default App;
