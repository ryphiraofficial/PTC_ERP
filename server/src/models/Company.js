import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      required: true,
      default: 'Nexus Enterprises Pvt. Ltd.',
    },
    tradeName: {
      type: String,
      default: 'Nexus Infotech & Trading',
    },
    gstin: {
      type: String,
      required: true,
      default: '27AABCN1234F1Z8',
      trim: true,
      uppercase: true,
    },
    pan: {
      type: String,
      default: 'AABCN1234F',
      uppercase: true,
    },
    email: {
      type: String,
      default: 'accounts@nexusenterprises.in',
    },
    phone: {
      type: String,
      default: '+91 98765 43210',
    },
    website: {
      type: String,
      default: 'www.nexusenterprises.in',
    },
    address: {
      street: { type: String, default: 'Plot 42, Tech Park, Andheri East' },
      city: { type: String, default: 'Mumbai' },
      state: { type: String, default: 'Maharashtra' },
      stateCode: { type: String, default: '27' },
      pincode: { type: String, default: '400069' },
      country: { type: String, default: 'India' },
    },
    bankDetails: {
      bankName: { type: String, default: 'HDFC Bank Ltd' },
      accountName: { type: String, default: 'Nexus Enterprises Pvt. Ltd.' },
      accountNumber: { type: String, default: '50200012345678' },
      ifscCode: { type: String, default: 'HDFC0001234' },
      branch: { type: String, default: 'Andheri East Branch' },
      upiId: { type: String, default: 'nexus@okhdfcbank' },
    },
    invoiceSettings: {
      prefix: { type: String, default: 'INV-2024-' },
      nextNumber: { type: Number, default: 1001 },
      // Per-prefix sequential counters: { 'PTC-A-2627': 1, 'PTC-B-2627': 3, ... }
      prefixCounters: { type: Map, of: Number, default: {} },
      termsAndConditions: {
        type: String,
        default:
          '1. Payment due within 15 days of invoice date.\n2. Goods once sold will not be taken back or exchanged.\n3. Subject to local jurisdiction only.',
      },
      authorizedSignatory: { type: String, default: 'Authorized Signatory' },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Company', companySchema);
