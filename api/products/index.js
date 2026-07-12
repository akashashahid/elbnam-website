const connectDB = require('../../lib/db');
const Product = require('../../lib/Product');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const config = { api: { bodyParser: false } };

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => fn(req, res, err => err ? reject(err) : resolve()));
}

function uploadFiles(files) {
  return Promise.all((files || []).map(file => new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({ folder: 'elbnam' }, (err, result) => err ? reject(err) : resolve(result.secure_url)).end(file.buffer);
  })));
}

export default async function handler(req, res) {
  try {
    await connectDB();

    if (req.method === 'GET') {
      const products = await Product.find().sort({ order: 1, createdAt: -1 });
      return res.json(products);
    }

    if (req.method === 'POST') {
      // Surface a clear error if Cloudinary credentials are not configured.
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        return res.status(500).json({ error: 'Cloudinary environment variables are not set in Vercel.' });
      }

      await runMiddleware(req, res, upload.any());
      const { name, category, subcategory, price, originalPrice, label, sizes, sizeStock, colors } = req.body;
      if (!name || !price) return res.status(400).json({ error: 'Name and price required' });
      const sizeList = sizes ? sizes.split(',').map(s => s.trim()).filter(Boolean) : [];
      const stockData = sizeStock ? JSON.parse(sizeStock) : {};
      const files = req.files || [];
      const imageUrls = await uploadFiles(files.filter(f => f.fieldname === 'images'));
      const colorsInput = colors ? JSON.parse(colors) : [];
      const colorsOut = [];
      for (let i = 0; i < colorsInput.length; i++) {
        const c = colorsInput[i];
        const uploaded = await uploadFiles(files.filter(f => f.fieldname === 'color_' + i));
        const imgs = [...(c.keep || []), ...uploaded];
        if ((c.name && c.name.trim()) || imgs.length) colorsOut.push({ name: c.name || '', hex: c.hex || '', images: imgs });
      }
      const product = new Product({ name, category, subcategory: subcategory || '', price: Number(price), originalPrice: Number(originalPrice) || 0, label: label || '', sizes: sizeList, sizeStock: stockData, images: imageUrls, colors: colorsOut, inStock: true });
      await product.save();
      return res.status(201).json({ success: true, product });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('POST /api/products failed:', err);
    return res.status(500).json({ error: err.message || 'Server error', type: err.name || 'Error' });
  }
}
