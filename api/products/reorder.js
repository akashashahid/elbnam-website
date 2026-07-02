const connectDB = require('../../lib/db');
const Product = require('../../lib/Product');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  await connectDB();
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids must be an array' });
    await Promise.all(ids.map((id, idx) => Product.findByIdAndUpdate(id, { order: idx })));
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
