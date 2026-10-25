import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['goods', 'service'],
      default: 'goods',
    },
    hsnSac: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
      default: '',
    },
    unit: {
      type: String,
      required: true,
      default: 'PCS',
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    purchasePrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    gstRate: {
      type: Number,
      required: true,
      default: 18,
      enum: [0, 5, 12, 18, 28],
    },
    cess: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      default: 100,
    },
    minStockAlert: {
      type: Number,
      default: 10,
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Item', itemSchema);
