import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

export async function generatePdfFromHtml(htmlContent: string, outputPath: string): Promise<string> {
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  let browser;

  try {
    const launchOptions: any = {
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    };

    // Use local Google Chrome executable if available (faster & bypasses download hurdles)
    if (fs.existsSync(chromePath)) {
      console.log(`Launching Puppeteer using local Chrome at: ${chromePath}`);
      launchOptions.executablePath = chromePath;
    } else {
      console.warn(`Local Google Chrome not found at ${chromePath}. Using default Puppeteer Chromium.`);
    }

    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    
    // Set HTML page content
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`Compiling HTML into PDF at: ${outputPath}`);
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm'
      }
    });

    return outputPath;
  } catch (error) {
    console.error('Puppeteer HTML-to-PDF compiler failed:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
