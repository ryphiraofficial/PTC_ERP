import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    companyName: {
      type: String,
      trim: true,
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
    },
    pan: {
      type: String,
      trim: true,
      uppercase: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    customerType: {
      type: String,
      enum: ['B2B', 'B2C', 'SEZ', 'Export'],
      default: 'B2B',
    },
    billingAddress: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, required: true, default: 'Maharashtra' },
      stateCode: { type: String, required: true, default: '27' },
      pincode: { type: String, default: '' },
      country: { type: String, default: 'India' },
    },
    shippingAddress: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      stateCode: { type: String, default: '' },
      pincode: { type: String, default: '' },
      country: { type: String, default: 'India' },
    },
    openingBalance: {
      type: Number,
      default: 0,
    },
    creditLimit: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Customer', customerSchema);
