export const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5001'
  : 'https://product-catalog-backend-production-bf40.up.railway.app';

export interface ProductInput {
  _id?: string;
  productName: string;
  simplifiedName?: string;
  images: string[];
  cost: number;
  moq: number;
  marketplaceSellers: {
    amazon: number;
    flipkart: number;
    meesho: number;
    jiomart: number;
  };
  shopifyStores: string[];
  adsCount: number;
  logistics: {
    weight: string;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    shippingCost: number;
    shippingType?: 'cosmetics' | 'non-cosmetics';
  };
  tentativeSellingPrice: number;
  rtoPercentage: number;
  upsellPotential?: 'YES' | 'MEDIUM' | 'LOW';
  lowerCac?: 'YES' | 'MEDIUM' | 'LOW';
  fetchedData?: {
    amazonBestSellerCountries: string[];
    firstMoverAdvantage: 'YES' | 'MEDIUM' | 'LOW';
    estimatedCompetition: string;
    approxSellers: number;
    metaAdsCount?: number;
  };
  calculations?: {
    margin: number;
    marginPercentage: number;
    netProfit: number;
    opportunityScore: number;
  };
  aiRecommendation?: string;
  createdAt?: string;
}

export interface Catalog {
  _id: string;
  productId: string;
  preparedBy: string;
  catalogTitle: string;
  logoUrl?: string;
  pdfPath?: string;
  simplifiedName?: string;
  upsellPotential?: 'YES' | 'MEDIUM' | 'LOW';
  lowerCac?: 'YES' | 'MEDIUM' | 'LOW';
  fetchedData?: {
    amazonBestSellerCountries: string[];
    firstMoverAdvantage: 'YES' | 'MEDIUM' | 'LOW';
    estimatedCompetition: string;
    approxSellers: number;
    metaAdsCount?: number;
  };
  calculations?: {
    margin: number;
    marginPercentage: number;
    netProfit: number;
    opportunityScore: number;
  };
  aiRecommendation?: string;
  createdAt: string;
}

export async function fetchProductCatalogs(productId: string): Promise<Catalog[]> {
  const response = await fetch(`${BACKEND_URL}/api/catalog/product/${productId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch product catalogs history');
  }
  return response.json();
}

export async function fetchProducts(): Promise<ProductInput[]> {
  const response = await fetch(`${BACKEND_URL}/api/products`);
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  return response.json();
}

export async function createProduct(productData: ProductInput): Promise<ProductInput> {
  const response = await fetch(`${BACKEND_URL}/api/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(productData)
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to save product');
  }
  return response.json();
}

export async function uploadImages(files: File[]): Promise<string[]> {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('images', file);
  });

  const response = await fetch(`${BACKEND_URL}/api/upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to upload images');
  }

  const result = await response.json();
  return result.urls;
}

export interface GenerateCatalogInput {
  preparedBy: string;
  catalogTitle: string;
  logoUrl?: string;
}

export interface GenerateCatalogResponse {
  message: string;
  catalog: Catalog;
  product: ProductInput;
}

export async function generateCatalog(
  productId: string, 
  data: GenerateCatalogInput
): Promise<GenerateCatalogResponse> {
  const response = await fetch(`${BACKEND_URL}/api/catalog/generate/${productId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Catalog generation failed');
  }

  return response.json();
}

export async function fetchCatalog(catalogId: string): Promise<{ catalog: Catalog; product: ProductInput }> {
  const response = await fetch(`${BACKEND_URL}/api/catalog/${catalogId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch catalog details');
  }
  return response.json();
}

export interface AiCompetitorResponse {
  amazon: number;
  flipkart: number;
  meesho: number;
  jiomart: number;
  shopifyStores: string[];
  adsCount: number;
  simplifiedName: string;
}

export async function fetchAiCompetitorAnalysis(productName: string, images?: string[]): Promise<AiCompetitorResponse> {
  const response = await fetch(`${BACKEND_URL}/api/products/ai-research`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ productName, images })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to fetch AI competitor analysis');
  }

  return response.json();
}
