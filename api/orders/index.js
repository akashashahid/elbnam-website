const connectDB = require('../../lib/db');
const Order = require('../../lib/Order');
const Product = require('../../lib/Product');

export default async function handler(req, res) {
  await connectDB();

  if (req.method === 'GET') {
    try {
      const orders = await Order.find().sort({ createdAt: -1 });
      return res.json(orders);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { customerName, email, phone, address, items, total, payment } = req.body;
      if (!customerName || !phone || !address || !items || !total) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      // Deduct stock
      for (const item of items) {
        if (item.productId) {
          const prod = await Product.findById(item.productId);
          if (prod && item.size) {
            const sz = item.size;
            const cur = prod.sizeStock instanceof Map ? prod.sizeStock.get(sz) : (prod.sizeStock?.[sz] ?? 0);
            if (cur !== undefined) {
              if (prod.sizeStock instanceof Map) prod.sizeStock.set(sz, Math.max(0, cur - (item.qty || 1)));
              else prod.sizeStock[sz] = Math.max(0, cur - (item.qty || 1));
              prod.markModified('sizeStock');
              await prod.save();
            }
          }
        }
      }
      const order = new Order({ customerName, email, phone, address, items, total, payment: payment || 'COD' });
      await order.save();
      return res.status(201).json({ success: true, order });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Import orders (bulk)
  if (req.method === 'PUT' && req.query.bulk) {
    // handled elsewhere
  }

  // Bulk import endpoint
  if (req.url && req.url.includes('/import')) {
    return require('./import').default(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
