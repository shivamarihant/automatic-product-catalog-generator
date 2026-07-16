import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

// Define Interfaces
export interface Product {
  _id: string;
  productName: string;
  simplifiedName?: string;
  primaryAdsKeywords?: string;
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
  fetchedData: {
    amazonBestSellerCountries: string[];
    firstMoverAdvantage: 'YES' | 'MEDIUM' | 'LOW';
    estimatedCompetition: string;
    approxSellers: number;
  };
  calculations: {
    margin: number;
    marginPercentage: number;
    netProfit: number;
    opportunityScore: number;
  };
  aiRecommendation: string;
  createdAt: Date;
}

export interface Catalog {
  _id: string;
  productId: string;
  preparedBy: string;
  catalogTitle: string;
  logoUrl?: string;
  pdfPath?: string;
  fetchedData?: any;
  calculations?: any;
  aiRecommendation?: string;
  createdAt: Date;
}

// Mongoose Schemas (for production MongoDB)
const ProductSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  simplifiedName: { type: String },
  primaryAdsKeywords: { type: String },
  images: [String],
  cost: { type: Number, required: true },
  moq: { type: Number, required: true },
  marketplaceSellers: {
    amazon: { type: Number, default: 0 },
    flipkart: { type: Number, default: 0 },
    meesho: { type: Number, default: 0 },
    jiomart: { type: Number, default: 0 }
  },
  shopifyStores: [String],
  adsCount: { type: Number, default: 0 },
  logistics: {
    weight: { type: String, required: true },
    dimensions: {
      length: { type: Number, required: true },
      width: { type: Number, required: true },
      height: { type: Number, required: true }
    },
    shippingCost: { type: Number, required: true },
    shippingType: { type: String, enum: ['cosmetics', 'non-cosmetics'], default: 'non-cosmetics' }
  },
  tentativeSellingPrice: { type: Number, required: true },
  rtoPercentage: { type: Number, required: true },
  upsellPotential: { type: String, enum: ['YES', 'MEDIUM', 'LOW'], default: 'MEDIUM' },
  lowerCac: { type: String, enum: ['YES', 'MEDIUM', 'LOW'], default: 'MEDIUM' },
  fetchedData: {
    amazonBestSellerCountries: [String],
    firstMoverAdvantage: { type: String, enum: ['YES', 'MEDIUM', 'LOW'], default: 'MEDIUM' },
    estimatedCompetition: { type: String, default: 'Medium' },
    approxSellers: { type: Number, default: 0 }
  },
  calculations: {
    margin: { type: Number, default: 0 },
    marginPercentage: { type: Number, default: 0 },
    netProfit: { type: Number, default: 0 },
    opportunityScore: { type: Number, default: 0 }
  },
  aiRecommendation: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const CatalogSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  preparedBy: { type: String, required: true },
  catalogTitle: { type: String, required: true },
  logoUrl: { type: String },
  pdfPath: { type: String },
  fetchedData: { type: mongoose.Schema.Types.Mixed },
  calculations: { type: mongoose.Schema.Types.Mixed },
  aiRecommendation: { type: String },
  createdAt: { type: Date, default: Date.now }
});

let ProductModel: mongoose.Model<any>;
let CatalogModel: mongoose.Model<any>;

// Database State
let isUsingMongoDB = false;
const DATA_DIR = path.join(__dirname, '..', 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const CATALOGS_FILE = path.join(DATA_DIR, 'catalogs.json');

// Ensure JSON directories exist
function initJsonDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(PRODUCTS_FILE)) {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(CATALOGS_FILE)) {
    fs.writeFileSync(CATALOGS_FILE, JSON.stringify([], null, 2));
  }
}

// Connect to Database
export async function connectDB() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/product_catalog_generator';
  initJsonDatabase();

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 2000 });
    isUsingMongoDB = true;
    ProductModel = mongoose.model('Product', ProductSchema);
    CatalogModel = mongoose.model('Catalog', CatalogSchema);
    console.log('Connected to MongoDB successfully.');
  } catch (error) {
    console.warn('MongoDB connection failed. Falling back to local JSON database.');
    isUsingMongoDB = false;
  }
}

// Helper: read JSON database
function readJsonFile(filePath: string): any[] {
  try {
    initJsonDatabase();
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return [];
  }
}

// Helper: write JSON database
function writeJsonFile(filePath: string, data: any[]): void {
  try {
    initJsonDatabase();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error writing to ${filePath}:`, err);
  }
}

// Database API Methods
export async function saveProduct(productData: any): Promise<Product> {
  if (isUsingMongoDB && ProductModel) {
    if (productData._id && mongoose.isValidObjectId(productData._id)) {
      const updated = await ProductModel.findByIdAndUpdate(productData._id, productData, { new: true });
      return updated.toObject();
    } else {
      const product = new ProductModel(productData);
      const saved = await product.save();
      return saved.toObject();
    }
  } else {
    // JSON Fallback
    const products = readJsonFile(PRODUCTS_FILE);
    let id = productData._id;

    if (!id) {
      id = new mongoose.Types.ObjectId().toString();
    }

    const newProduct = {
      ...productData,
      _id: id,
      createdAt: productData.createdAt || new Date()
    };

    const index = products.findIndex((p: any) => p._id === id);
    if (index >= 0) {
      products[index] = newProduct;
    } else {
      products.push(newProduct);
    }

    writeJsonFile(PRODUCTS_FILE, products);
    return newProduct as Product;
  }
}

export async function getProduct(id: string): Promise<Product | null> {
  if (isUsingMongoDB && ProductModel) {
    if (!mongoose.isValidObjectId(id)) return null;
    const product = await ProductModel.findById(id);
    return product ? product.toObject() : null;
  } else {
    const products = readJsonFile(PRODUCTS_FILE);
    const product = products.find((p: any) => p._id === id);
    return product || null;
  }
}

export async function getAllProducts(): Promise<Product[]> {
  if (isUsingMongoDB && ProductModel) {
    const products = await ProductModel.find().sort({ createdAt: -1 });
    return products.map(p => p.toObject());
  } else {
    const products = readJsonFile(PRODUCTS_FILE);
    return products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export async function saveCatalog(catalogData: any): Promise<Catalog> {
  if (isUsingMongoDB && CatalogModel) {
    if (catalogData._id && mongoose.isValidObjectId(catalogData._id)) {
      const updated = await CatalogModel.findByIdAndUpdate(catalogData._id, catalogData, { new: true });
      return updated.toObject();
    } else {
      const catalog = new CatalogModel(catalogData);
      const saved = await catalog.save();
      return saved.toObject();
    }
  } else {
    const catalogs = readJsonFile(CATALOGS_FILE);
    let id = catalogData._id;

    if (!id) {
      id = new mongoose.Types.ObjectId().toString();
    }

    const newCatalog = {
      ...catalogData,
      _id: id,
      createdAt: catalogData.createdAt || new Date()
    };

    const index = catalogs.findIndex((c: any) => c._id === id);
    if (index >= 0) {
      catalogs[index] = newCatalog;
    } else {
      catalogs.push(newCatalog);
    }

    writeJsonFile(CATALOGS_FILE, catalogs);
    return newCatalog as Catalog;
  }
}

export async function getCatalog(id: string): Promise<Catalog | null> {
  if (isUsingMongoDB && CatalogModel) {
    if (!mongoose.isValidObjectId(id)) return null;
    const catalog = await CatalogModel.findById(id);
    return catalog ? catalog.toObject() : null;
  } else {
    const catalogs = readJsonFile(CATALOGS_FILE);
    const catalog = catalogs.find((c: any) => c._id === id);
    return catalog || null;
  }
}

export async function getCatalogsByProduct(productId: string): Promise<Catalog[]> {
  if (isUsingMongoDB && CatalogModel) {
    const catalogs = await CatalogModel.find({ productId }).sort({ createdAt: -1 });
    return catalogs.map(c => c.toObject());
  } else {
    const catalogs = readJsonFile(CATALOGS_FILE);
    const filtered = catalogs.filter((c: any) => c.productId === productId);
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}
