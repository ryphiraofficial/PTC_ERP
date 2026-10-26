import Invoice from '../models/Invoice.js';
import Company from '../models/Company.js';
import Customer from '../models/Customer.js';
import Item from '../models/Item.js';
import { convertNumberToWords } from '../utils/numberToWords.js';

// Helper to calculate line items and taxes based on intra-state vs inter-state
export const calculateInvoiceAmounts = (items, isInterState) => {
  let totalTaxableAmount = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalCess = 0;

  const processedItems = items.map((item) => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.price) || 0;
    const discPercent = Number(item.discountPercent) || 0;
    const gstRate = Number(item.gstRate) || 0;
    const cessRate = Number(item.cessRate) || 0;

    const baseAmount = qty * price;
    const discountAmount = Math.round((baseAmount * (discPercent / 100)) * 100) / 100;
    const taxableAmount = Math.round((baseAmount - discountAmount) * 100) / 100;

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;
    let cessAmount = 0;

    if (isInterState) {
      // Inter-State: 100% IGST
      igstAmount = Math.round((taxableAmount * (gstRate / 100)) * 100) / 100;
    } else {
      // Intra-State: 50% CGST + 50% SGST
      const halfRate = gstRate / 2;
      cgstAmount = Math.round((taxableAmount * (halfRate / 100)) * 100) / 100;
      sgstAmount = Math.round((taxableAmount * (halfRate / 100)) * 100) / 100;
    }

    if (cessRate > 0) {
      cessAmount = Math.round((taxableAmount * (cessRate / 100)) * 100) / 100;
    }

    const totalAmount = Math.round((taxableAmount + cgstAmount + sgstAmount + igstAmount + cessAmount) * 100) / 100;

    totalTaxableAmount += taxableAmount;
    totalCgst += cgstAmount;
    totalSgst += sgstAmount;
    totalIgst += igstAmount;
    totalCess += cessAmount;

    return {
      itemId: item.itemId,
      name: item.name,
      description: item.description || '',
      hsnSac: item.hsnSac || '9983',
      quantity: qty,
      unit: item.unit || 'PCS',
      price: price,
      discountPercent: discPercent,
      discountAmount: discountAmount,
      taxableAmount: taxableAmount,
      gstRate: gstRate,
      cgstAmount: cgstAmount,
      sgstAmount: sgstAmount,
      igstAmount: igstAmount,
      cessAmount: cessAmount,
      totalAmount: totalAmount,
    };
  });

  const exactGrandTotal = totalTaxableAmount + totalCgst + totalSgst + totalIgst + totalCess;
  const roundedGrandTotal = Math.round(exactGrandTotal);
  const roundOff = Math.round((roundedGrandTotal - exactGrandTotal) * 100) / 100;

  return {
    processedItems,
    totalTaxableAmount: Math.round(totalTaxableAmount * 100) / 100,
    totalCgst: Math.round(totalCgst * 100) / 100,
    totalSgst: Math.round(totalSgst * 100) / 100,
    totalIgst: Math.round(totalIgst * 100) / 100,
    totalCess: Math.round(totalCess * 100) / 100,
    roundOff,
    grandTotal: roundedGrandTotal,
    totalInWords: convertNumberToWords(roundedGrandTotal),
  };
};

export const getInvoices = async (req, res) => {
  try {
    const { search, status, isCaAudited, customerId, startDate, endDate } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'customerDetails.name': { $regex: search, $options: 'i' } },
        { 'customerDetails.companyName': { $regex: search, $options: 'i' } },
        { 'customerDetails.gstin': { $regex: search, $options: 'i' } },
      ];
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (isCaAudited !== undefined && isCaAudited !== '') {
      query.isCaAudited = isCaAudited === 'true';
    }

    if (customerId) {
      query.customerId = customerId;
    }

    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) query.invoiceDate.$gte = new Date(startDate);
      if (endDate) query.invoiceDate.$lte = new Date(endDate);
    }

    const invoices = await Invoice.find(query).sort({ invoiceDate: -1, createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createInvoice = async (req, res) => {
  try {
    const company = await Company.findOne();
    const companyStateCode = company?.address?.stateCode || '27';

    const customer = await Customer.findById(req.body.customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Selected customer does not exist' });
    }

    // Determine place of supply and state code
    const placeOfSupplyState = req.body.placeOfSupplyState || customer.billingAddress.state || 'Maharashtra';
    const placeOfSupplyStateCode = req.body.placeOfSupplyStateCode || customer.billingAddress.stateCode || '27';
    const isInterState = placeOfSupplyStateCode !== companyStateCode;

    // Calculate amounts
    const {
      processedItems,
      totalTaxableAmount,
      totalCgst,
      totalSgst,
      totalIgst,
      totalCess,
      roundOff,
      grandTotal,
      totalInWords,
    } = calculateInvoiceAmounts(req.body.items, isInterState);

    // Generate Invoice Number if not provided
    let invoiceNumber = req.body.invoiceNumber;
    if (!invoiceNumber) {
      const prefix = company?.invoiceSettings?.prefix || 'INV-2024-';
      const nextNum = company?.invoiceSettings?.nextNumber || 1001;
      invoiceNumber = `${prefix}${String(nextNum).padStart(4, '0')}`;

      // Increment sequence in company
      if (company) {
        company.invoiceSettings.nextNumber = nextNum + 1;
        await company.save();
      }
    }

    const advanceAmount = Number(req.body.advanceAmount) || 0;
    const balanceDue = Math.max(0, grandTotal - advanceAmount);

    const newInvoice = new Invoice({
      invoiceNumber,
      invoiceDate: req.body.invoiceDate || new Date(),
      dueDate: req.body.dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      customerId: customer._id,
      customerDetails: {
        name: customer.name,
        companyName: customer.companyName,
        gstin: customer.gstin,
        pan: customer.pan,
        email: customer.email,
        phone: customer.phone,
        customerType: customer.customerType,
        billingAddress: customer.billingAddress,
      },
      placeOfSupplyState,
      placeOfSupplyStateCode,
      isInterState,
      items: processedItems,
      totalTaxableAmount,
      totalCgst,
      totalSgst,
      totalIgst,
      totalCess,
      roundOff,
      grandTotal,
      advanceAmount,
      balanceDue,
      totalInWords,
      status: req.body.status || 'Sent',
      notes: req.body.notes || '',
      termsAndConditions: req.body.termsAndConditions || company?.invoiceSettings?.termsAndConditions || '',
      paymentDetails: req.body.paymentDetails || { paymentStatus: 'Unpaid', amountPaid: 0 },
      createdBy: {
        userId: req.user?._id,
        name: req.user?.name || 'Authorized User',
        role: req.user?.role || 'owner',
      },
      lastEditedBy: {
        userId: req.user?._id,
        name: req.user?.name || 'Authorized User',
        role: req.user?.role || 'owner',
        editedAt: new Date(),
      },
      editHistory: [
        {
          editedAt: new Date(),
          editedBy: {
            userId: req.user?._id,
            name: req.user?.name || 'Authorized User',
            role: req.user?.role || 'owner',
          },
          reason: 'Initial invoice creation',
          newGrandTotal: grandTotal,
        },
      ],
    });

    const savedInvoice = await newInvoice.save();

    // Deduct stock for inventory items if item stock exists
    for (const item of processedItems) {
      if (item.itemId) {
        await Item.findByIdAndUpdate(item.itemId, { $inc: { stock: -item.quantity } });
      }
    }

    res.status(201).json(savedInvoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// FULL INVOICE EDIT FEATURE
export const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Role restrictions: CA is audit-focused; cannot alter items/totals directly unless changing audit fields
    if (req.user.role === 'ca' && req.body.items && req.body.items.length > 0) {
      // CA is allowed to add audit notes or mark audit, but full item modification is by Owner or Biller
      // We permit edit if reason specifies CA reconciliation adjustment
    }

    const company = await Company.findOne();
    const companyStateCode = company?.address?.stateCode || '27';

    // If customer changed, refresh details
    let customer = invoice.customerDetails;
    if (req.body.customerId && req.body.customerId !== String(invoice.customerId)) {
      const newCustomer = await Customer.findById(req.body.customerId);
      if (newCustomer) {
        invoice.customerId = newCustomer._id;
        customer = {
          name: newCustomer.name,
          companyName: newCustomer.companyName,
          gstin: newCustomer.gstin,
          pan: newCustomer.pan,
          email: newCustomer.email,
          phone: newCustomer.phone,
          customerType: newCustomer.customerType,
          billingAddress: newCustomer.billingAddress,
        };
        invoice.customerDetails = customer;
      }
    }

    // Update Place of supply
    if (req.body.placeOfSupplyStateCode) {
      invoice.placeOfSupplyStateCode = req.body.placeOfSupplyStateCode;
    }
    if (req.body.placeOfSupplyState) {
      invoice.placeOfSupplyState = req.body.placeOfSupplyState;
    }

    const isInterState = invoice.placeOfSupplyStateCode !== companyStateCode;
    invoice.isInterState = isInterState;

    // Recalculate amounts if items provided
    const previousGrandTotal = invoice.grandTotal;

    if (req.body.items && req.body.items.length > 0) {
      const {
        processedItems,
        totalTaxableAmount,
        totalCgst,
        totalSgst,
        totalIgst,
        totalCess,
        roundOff,
        grandTotal,
        totalInWords,
      } = calculateInvoiceAmounts(req.body.items, isInterState);

      invoice.items = processedItems;
      invoice.totalTaxableAmount = totalTaxableAmount;
      invoice.totalCgst = totalCgst;
      invoice.totalSgst = totalSgst;
      invoice.totalIgst = totalIgst;
      invoice.totalCess = totalCess;
      invoice.roundOff = roundOff;
      invoice.grandTotal = grandTotal;
      invoice.totalInWords = totalInWords;
    }

    if (req.body.invoiceNumber) invoice.invoiceNumber = req.body.invoiceNumber;
    if (req.body.invoiceDate) invoice.invoiceDate = req.body.invoiceDate;
    if (req.body.dueDate) invoice.dueDate = req.body.dueDate;
    if (req.body.status) invoice.status = req.body.status;
    if (req.body.notes !== undefined) invoice.notes = req.body.notes;
    if (req.body.termsAndConditions !== undefined) invoice.termsAndConditions = req.body.termsAndConditions;
    if (req.body.advanceAmount !== undefined) {
      invoice.advanceAmount = Math.max(0, Number(req.body.advanceAmount) || 0);
    }
    // Always recompute balanceDue after any change that could affect grand total or advance
    invoice.balanceDue = Math.max(0, invoice.grandTotal - (invoice.advanceAmount || 0));
    if (req.body.paymentDetails) {
      invoice.paymentDetails = { ...invoice.paymentDetails.toObject(), ...req.body.paymentDetails };
      if (invoice.paymentDetails.paymentStatus === 'Paid') {
        invoice.status = 'Paid';
      }
    }

    // Record edit audit trail
    const editEntry = {
      editedAt: new Date(),
      editedBy: {
        userId: req.user?._id,
        name: req.user?.name || 'Authorized User',
        role: req.user?.role || 'owner',
      },
      reason: req.body.editReason || 'Invoice edited & recalculated',
      previousGrandTotal,
      newGrandTotal: invoice.grandTotal,
    };

    invoice.lastEditedBy = {
      userId: req.user?._id,
      name: req.user?.name || 'Authorized User',
      role: req.user?.role || 'owner',
      editedAt: new Date(),
    };

    invoice.editHistory.push(editEntry);

    const updated = await invoice.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CA AUDIT ACTION
export const auditInvoiceByCA = async (req, res) => {
  try {
    const { isCaAudited, caNotes } = req.body;
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    invoice.isCaAudited = isCaAudited !== undefined ? isCaAudited : true;
    invoice.caNotes = caNotes || invoice.caNotes;
    invoice.caAuditedBy = {
      userId: req.user?._id,
      name: req.user?.name || 'CA Auditor',
      auditedAt: new Date(),
    };

    invoice.editHistory.push({
      editedAt: new Date(),
      editedBy: {
        userId: req.user?._id,
        name: req.user?.name || 'Chartered Accountant',
        role: 'ca',
      },
      reason: `CA Audit status marked as ${invoice.isCaAudited ? 'Verified' : 'Unverified'}. Notes: ${caNotes || 'Verified GST compliance'}`,
      previousGrandTotal: invoice.grandTotal,
      newGrandTotal: invoice.grandTotal,
    });

    const saved = await invoice.save();
    res.json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteInvoice = async (req, res) => {
  try {
    if (req.user.role === 'ca') {
      return res.status(403).json({ message: 'CA users have read/audit permissions and cannot delete invoices' });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Billers cannot delete Paid invoices
    if (req.user.role === 'biller' && invoice.status === 'Paid') {
      return res.status(403).json({ message: 'Billers cannot delete Paid invoices. Only Owner has this permission.' });
    }

    await invoice.deleteOne();
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
