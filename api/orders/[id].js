const connectDB = require('../../lib/db');
const Order = require('../../lib/Order');
const Product = require('../../lib/Product');

export default async function handler(req, res) {
  await connectDB();
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const order = await Order.findById(id);
      if (!order) return res.status(404).json({ error: 'Not found' });
      return res.json(order);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { status } = req.body;
      // If cancelling, restore stock
      if (status === 'Cancelled') {
        const order = await Order.findById(id);
        if (order && order.status !== 'Cancelled') {
          for (const item of order.items || []) {
            if (item.productId) {
              const prod = await Product.findById(item.productId);
              if (prod && item.size) {
                const sz = item.size;
                const cur = prod.sizeStock instanceof Map ? prod.sizeStock.get(sz) : (prod.sizeStock?.[sz] ?? 0);
                if (prod.sizeStock instanceof Map) prod.sizeStock.set(sz, (cur || 0) + (item.qty || 1));
                else prod.sizeStock[sz] = (cur || 0) + (item.qty || 1);
                prod.markModified('sizeStock');
                await prod.save();
              }
            }
          }
        }
      }
      const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
      if (!order) return res.status(404).json({ error: 'Not found' });
      return res.json({ success: true, order });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await Order.findByIdAndDelete(id);
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
