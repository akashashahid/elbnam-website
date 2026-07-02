const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  externalId:   { type: String, default: null },
  customerName: { type: String, required: true },
  email:        { type: String, default: '' },
  phone:        { type: String, required: true },
  address:      { type: String, required: true },
  items: [{
    productId: String,
    name:      String,
    size:      String,
    qty:       Number,
    price:     Number,
  }],
  total:   { type: Number, required: true },
  payment: { type: String, default: 'COD' },
  status:  { type: String, default: 'Pending' },
}, { timestamps: true });

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
