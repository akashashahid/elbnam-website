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

export default async function handler(req, res) {
  await connectDB();
  const { id } = req.query;

  if (req.method === 'PUT') {
    await runMiddleware(req, res, upload.array('images', 5));
    const { name, category, subcategory, price, originalPrice, label, sizes, sizeStock, keepImages } = req.body;
    const sizeList  = sizes      ? sizes.split(',').map(s => s.trim()).filter(Boolean) : [];
    const stockData = sizeStock  ? JSON.parse(sizeStock)  : {};
    const keep      = keepImages ? JSON.parse(keepImages) : [];
    const newUrls   = [];
    for (const file of (req.files || [])) {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder: 'elbnam' }, (err, r) => err ? reject(err) : resolve(r)).end(file.buffer);
      });
      newUrls.push(result.secure_url);
    }
    const images = [...keep, ...newUrls];
    const product = await Product.findByIdAndUpdate(id,
      { name, category, subcategory: subcategory || '', price: Number(price), originalPrice: Number(originalPrice) || 0, label: label || '', sizes: sizeList, sizeStock: stockData, images, inStock: images.length > 0 },
      { new: true }
    );
    if (!product) return res.status(404).json({ error: 'Not found' });
    return res.json({ success: true, product });
  }

  if (req.method === 'DELETE') {
    await Product.findByIdAndDelete(id);
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
