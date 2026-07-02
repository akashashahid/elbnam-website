const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  category:      { type: String, required: true },
  subcategory:   { type: String, default: '' },
  price:         { type: Number, required: true },
  originalPrice: { type: Number, default: 0 },
  label:         { type: String, default: '' },
  sizes:         [String],
  sizeStock:     { type: Map, of: Number, default: {} },
  images:        [String],
  inStock:       { type: Boolean, default: true },
  order:         { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
