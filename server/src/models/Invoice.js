import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  hsnSac: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0.01,
    default: 1,
  },
  unit: {
    type: String,
    default: 'PCS',
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  discountPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
  taxableAmount: {
    type: Number,
    required: true,
  },
  gstRate: {
    type: Number,
    required: true,
    default: 18,
  },
  cgstAmount: {
    type: Number,
    default: 0,
  },
  sgstAmount: {
    type: Number,
    default: 0,
  },
  igstAmount: {
    type: Number,
    default: 0,
  },
  cessAmount: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
});

const editHistorySchema = new mongoose.Schema({
  editedAt: {
    type: Date,
    default: Date.now,
  },
  editedBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    role: String,
  },
  reason: {
    type: String,
    default: 'Invoice details updated',
  },
  previousGrandTotal: Number,
  newGrandTotal: Number,
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    invoiceDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    customerDetails: {
      name: { type: String, required: true },
      companyName: String,
      gstin: String,
      pan: String,
      email: String,
      phone: String,
      customerType: { type: String, default: 'B2B' },
      billingAddress: {
        street: String,
        city: String,
        state: { type: String, required: true },
        stateCode: { type: String, required: true },
        pincode: String,
      },
    },
    placeOfSupplyState: {
      type: String,
      required: true,
    },
    placeOfSupplyStateCode: {
      type: String,
      required: true,
    },
    isInterState: {
      type: Boolean,
      default: false,
    },
    items: [lineItemSchema],
    totalTaxableAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    totalCgst: {
      type: Number,
      default: 0,
    },
    totalSgst: {
      type: Number,
      default: 0,
    },
    totalIgst: {
      type: Number,
      default: 0,
    },
    totalCess: {
      type: Number,
      default: 0,
    },
    roundOff: {
      type: Number,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    advanceAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    balanceDue: {
      type: Number,
      default: 0,
    },
    totalInWords: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'],
      default: 'Sent',
    },
    notes: {
      type: String,
      default: '',
    },
    termsAndConditions: {
      type: String,
      default: '',
    },
    paymentDetails: {
      paymentStatus: {
        type: String,
        enum: ['Unpaid', 'Partially Paid', 'Paid'],
        default: 'Unpaid',
      },
      amountPaid: {
        type: Number,
        default: 0,
      },
      paymentMode: {
        type: String,
        enum: ['Cash', 'Bank Transfer / NEFT / RTGS', 'UPI', 'Cheque', 'Credit Card'],
      },
      transactionRef: String,
      paidAt: Date,
    },
    // CA specific compliance tracking
    isCaAudited: {
      type: Boolean,
      default: false,
    },
    caAuditedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: String,
      auditedAt: Date,
    },
    caNotes: {
      type: String,
      default: '',
    },
    // Authoring & Editing metadata
    createdBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: String,
      role: { type: String, enum: ['owner', 'biller', 'ca'] },
    },
    lastEditedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: String,
      role: String,
      editedAt: Date,
    },
    editHistory: [editHistorySchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Invoice', invoiceSchema);
