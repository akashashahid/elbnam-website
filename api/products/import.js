const connectDB = require('../../lib/db');
const Product = require('../../lib/Product');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  await connectDB();
  try {
    const { name, category, subcategory, price, originalPrice, sizes, label, available } = req.body;
    if (!name || !category || !price) return res.status(400).json({ success: false, message: 'Missing required fields' });
    const sizeList = Array.isArray(sizes) ? sizes : String(sizes || '').split(',').map(s => s.trim()).filter(Boolean);
    // Parse available stock string: "S:5;M:3;L:4"
    const sizeStock = {};
    if (available) {
      String(available).split(';').forEach(part => {
        const [sz, qty] = part.split(':');
        if (sz && qty !== undefined) sizeStock[sz.trim()] = parseInt(qty) || 0;
      });
    }
    let existing = await Product.findOne({ name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
    if (existing) {
      Object.assign(existing, { category, subcategory: subcategory || '', price: Number(price), originalPrice: Number(originalPrice) || 0, sizes: sizeList, label: label || '', sizeStock });
      await existing.save();
      return res.json({ success: true, updated: true });
    }
    const product = new Product({ name, category, subcategory: subcategory || '', price: Number(price), originalPrice: Number(originalPrice) || 0, sizes: sizeList, label: label || '', sizeStock, images: [], inStock: true });
    await product.save();
    return res.status(201).json({ success: true, updated: false });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
