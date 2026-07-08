import fs from 'fs';
import path from 'path';
import cors from 'cors';
import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';

import { 
  connectDB, 
  saveProduct, 
  getProduct, 
  getAllProducts, 
  saveCatalog, 
  getCatalog,
  getCatalogsByProduct
} from './db';
import { fetchMarketIntelligence } from './services/scraper';
import { performCalculations } from './services/calculations';
import { generateRecommendation, analyzeCompetitorsWithAI } from './services/recommender';
import { generatePdfFromHtml } from './services/pdf';
import { getCatalogTemplateHtml } from './services/templates';

// Load environment variables
dotenv.config();

const app = express();
app.set('trust proxy', true);
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors({ origin: '*' })); // Enable CORS for React frontend
app.use(express.json());

// Setup Upload Directories
// On Railway, RAILWAY_VOLUME_MOUNT_PATH points to /app/uploads (persistent volume).
// Locally it falls back to the dist/../uploads relative path.
const UPLOADS_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH
  ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH)
  : path.join(__dirname, '..', 'uploads');
const CATALOGS_DIR = path.join(UPLOADS_DIR, 'catalogs');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(CATALOGS_DIR)) {
  fs.mkdirSync(CATALOGS_DIR, { recursive: true });
}

// Serve uploaded images and PDF catalogs statically
app.use('/uploads', express.static(UPLOADS_DIR));

// Configure Multer for File Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `img-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max per file
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, JPG, PNG, WebP) are allowed!'));
    }
  }
});

// API Routes

// 1. Upload Images: POST /api/upload
app.post('/api/upload', upload.array('images', 10), (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Please upload at least one image.' });
    }

    const host = req.get('host');
    const protocol = (req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https') ? 'https' : 'http';
    const filePaths = files.map(file => `${protocol}://${host}/uploads/${file.filename}`);

    return res.status(200).json({ urls: filePaths });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Image upload failed.' });
  }
});

// 2. Create / Update Product: POST /api/products
app.post('/api/products', async (req, res) => {
  try {
    const productData = req.body;
    
    // Simple verification
    if (!productData.productName) {
      return res.status(400).json({ error: 'Product name is required.' });
    }
    if (!productData.cost || isNaN(Number(productData.cost))) {
      return res.status(400).json({ error: 'Valid product cost is required.' });
    }
    if (!productData.tentativeSellingPrice || isNaN(Number(productData.tentativeSellingPrice))) {
      return res.status(400).json({ error: 'Valid selling price is required.' });
    }

    const saved = await saveProduct(productData);
    return res.status(201).json(saved);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Saving product failed.' });
  }
});

// 3. Get All Products: GET /api/products
app.get('/api/products', async (req, res) => {
  try {
    const products = await getAllProducts();
    return res.status(200).json(products);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// 4. Generate Catalog: POST /api/catalog/generate/:productId
app.post('/api/catalog/generate/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { preparedBy, catalogTitle, logoUrl } = req.body;

    if (!preparedBy || !catalogTitle) {
      return res.status(400).json({ error: 'Prepared By name and Catalog Title are required.' });
    }

    // Retrieve Product details
    const product = await getProduct(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    console.log(`Step 1: Fetching Market Intelligence for ${product.productName}...`);
    const fetchedData = await fetchMarketIntelligence(product.productName, product.simplifiedName);

    // Sync with actual researched marketplace sellers and ads count
    if (product.marketplaceSellers) {
      const actualSellers = 
        (product.marketplaceSellers.amazon || 0) + 
        (product.marketplaceSellers.flipkart || 0) + 
        (product.marketplaceSellers.meesho || 0) + 
        (product.marketplaceSellers.jiomart || 0);
      
      if (actualSellers > 0) {
        fetchedData.approxSellers = actualSellers;
      }
    }
    if (product.adsCount !== undefined && product.adsCount !== null) {
      fetchedData.metaAdsCount = product.adsCount;
    }

    console.log('Step 2: Calculating Metrics...');
    const calculations = performCalculations(
      product.cost,
      product.tentativeSellingPrice,
      product.logistics.shippingCost,
      product.rtoPercentage,
      fetchedData.firstMoverAdvantage,
      fetchedData.amazonBestSellerCountries
    );

    // Auto-populate ads count if not entered manually
    if (!product.adsCount || product.adsCount === 0) {
      product.adsCount = fetchedData.metaAdsCount;
    }

    // Auto-populate marketplace sellers if they are default fallback or zero
    const isDefaultSellers = 
      !product.marketplaceSellers ||
      (product.marketplaceSellers.amazon === 12 &&
       product.marketplaceSellers.flipkart === 8 &&
       product.marketplaceSellers.meesho === 6 &&
       product.marketplaceSellers.jiomart === 3) ||
      (product.marketplaceSellers.amazon === 0 &&
       product.marketplaceSellers.flipkart === 0 &&
       product.marketplaceSellers.meesho === 0 &&
       product.marketplaceSellers.jiomart === 0);

    if (isDefaultSellers) {
      const approx = fetchedData.approxSellers || 15;
      // Distribute approxSellers across marketplaces dynamically
      product.marketplaceSellers = {
        amazon: Math.max(1, Math.round(approx * 0.45)),
        flipkart: Math.max(1, Math.round(approx * 0.30)),
        meesho: Math.max(1, Math.round(approx * 0.18)),
        jiomart: Math.max(1, Math.round(approx * 0.07))
      };
    }

    // Update Product object temporarily to run recommendation
    const tempProduct = {
      ...product,
      fetchedData,
      calculations
    };

    console.log('Step 3: Generating Recommendation Summary...');
    const aiRecommendation = await generateRecommendation(tempProduct);

    // Save fetched data, calculations, and recommendation on the product collection
    product.fetchedData = fetchedData;
    product.calculations = calculations;
    product.aiRecommendation = aiRecommendation;
    const updatedProduct = await saveProduct(product);

    console.log('Step 4: Creating Catalog entry in Database...');
    const catalogData = {
      productId: updatedProduct._id,
      preparedBy,
      catalogTitle,
      logoUrl: logoUrl || '',
      fetchedData,
      calculations,
      aiRecommendation
    };
    const savedCatalog = await saveCatalog(catalogData);

    console.log('Step 5: Generating PDF Catalog via Puppeteer...');
    const htmlContent = getCatalogTemplateHtml(updatedProduct, savedCatalog);
    
    // Partition catalogs datewise
    const dateFolder = new Date().toISOString().split('T')[0];
    const dateCatalogDir = path.join(CATALOGS_DIR, dateFolder);
    if (!fs.existsSync(dateCatalogDir)) {
      fs.mkdirSync(dateCatalogDir, { recursive: true });
    }

    const pdfFileName = `catalog-${savedCatalog._id}.pdf`;
    const pdfFilePath = path.join(dateCatalogDir, pdfFileName);
    
    await generatePdfFromHtml(htmlContent, pdfFilePath);

    // Save PDF server URL on the Catalog record
    const host = req.get('host');
    const protocol = (req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https') ? 'https' : 'http';
    savedCatalog.pdfPath = `${protocol}://${host}/uploads/catalogs/${dateFolder}/${pdfFileName}`;
    const finalizedCatalog = await saveCatalog(savedCatalog);

    return res.status(200).json({
      message: 'Catalog generated successfully.',
      catalog: finalizedCatalog,
      product: updatedProduct
    });
  } catch (error: any) {
    console.error('Catalog Generation Error:', error);
    return res.status(500).json({ error: error.message || 'Catalog generation failed.' });
  }
});

// 5. Get Catalog Metadata: GET /api/catalog/:catalogId
app.get('/api/catalog/:catalogId', async (req, res) => {
  try {
    const { catalogId } = req.params;
    const catalog = await getCatalog(catalogId);
    if (!catalog) {
      return res.status(404).json({ error: 'Catalog not found.' });
    }

    const product = await getProduct(catalog.productId);
    return res.status(200).json({ catalog, product });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// 6. Download PDF: GET /api/catalog/download/:catalogId
app.get('/api/catalog/download/:catalogId', async (req, res) => {
  try {
    const { catalogId } = req.params;
    const catalog = await getCatalog(catalogId);
    if (!catalog || !catalog.pdfPath) {
      return res.status(404).json({ error: 'Catalog PDF not found.' });
    }

    // Resolve date-partitioned physical file path relative to uploads directory
    const relativePath = catalog.pdfPath.split('/uploads/')[1];
    const localPdfPath = path.join(UPLOADS_DIR, relativePath);

    if (!fs.existsSync(localPdfPath)) {
      return res.status(404).json({ error: 'Physical PDF file not found on server.' });
    }

    const fileName = path.basename(localPdfPath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    const fileStream = fs.createReadStream(localPdfPath);
    fileStream.pipe(res);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// 7. Get All Catalogs for a Product: GET /api/catalog/product/:productId
app.get('/api/catalog/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const catalogs = await getCatalogsByProduct(productId);
    return res.status(200).json(catalogs);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// 8. AI Sourcing Competitor Research: POST /api/products/ai-research
app.post('/api/products/ai-research', async (req, res) => {
  try {
    const { productName, images } = req.body;
    if (!productName) {
      return res.status(400).json({ error: 'Product name is required for AI research.' });
    }
    const analysis = await analyzeCompetitorsWithAI(productName, images);
    return res.status(200).json(analysis);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Start Server
async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Express Sourcing Backend is listening on port ${PORT}`);
  });
}

start();
