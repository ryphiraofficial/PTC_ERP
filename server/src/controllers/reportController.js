import Invoice from '../models/Invoice.js';
import Customer from '../models/Customer.js';
import Item from '../models/Item.js';
import Company from '../models/Company.js';

export const getDashboardStats = async (req, res) => {
  try {
    const invoices = await Invoice.find({});
    const totalCustomers = await Customer.countDocuments();
    const totalItems = await Item.countDocuments();
    const company = await Company.findOne();

    let totalRevenue = 0;
    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    let caAuditedCount = 0;
    let caPendingAuditCount = 0;

    const statusCounts = {
      Draft: 0,
      Sent: 0,
      Paid: 0,
      Overdue: 0,
      Cancelled: 0,
    };

    const monthlySalesMap = {};

    invoices.forEach((inv) => {
      if (inv.status !== 'Cancelled') {
        totalRevenue += inv.grandTotal;
        totalTaxable += inv.totalTaxableAmount;
        totalCgst += inv.totalCgst;
        totalSgst += inv.totalSgst;
        totalIgst += inv.totalIgst;

        if (inv.status === 'Paid') {
          paidAmount += inv.grandTotal;
        } else {
          pendingAmount += inv.grandTotal;
        }

        if (inv.isCaAudited) {
          caAuditedCount++;
        } else {
          caPendingAuditCount++;
        }

        // Group by month
        const d = new Date(inv.invoiceDate);
        const monthKey = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        if (!monthlySalesMap[monthKey]) {
          monthlySalesMap[monthKey] = { month: monthKey, sales: 0, tax: 0, count: 0 };
        }
        monthlySalesMap[monthKey].sales += inv.grandTotal;
        monthlySalesMap[monthKey].tax += inv.totalCgst + inv.totalSgst + inv.totalIgst;
        monthlySalesMap[monthKey].count += 1;
      }

      if (statusCounts[inv.status] !== undefined) {
        statusCounts[inv.status]++;
      }
    });

    const recentInvoices = await Invoice.find({})
      .sort({ createdAt: -1 })
      .limit(6);

    const monthlyTrends = Object.values(monthlySalesMap);

    res.json({
      summary: {
        totalRevenue: Math.round(totalRevenue),
        totalTaxable: Math.round(totalTaxable),
        totalTax: Math.round(totalCgst + totalSgst + totalIgst),
        totalCgst: Math.round(totalCgst),
        totalSgst: Math.round(totalSgst),
        totalIgst: Math.round(totalIgst),
        paidAmount: Math.round(paidAmount),
        pendingAmount: Math.round(pendingAmount),
        totalInvoices: invoices.length,
        totalCustomers,
        totalItems,
        caAuditedCount,
        caPendingAuditCount,
      },
      statusCounts,
      recentInvoices,
      monthlyTrends,
      companyState: company?.address?.state || 'Maharashtra',
      companyGstin: company?.gstin || '27AABCN1234F1Z8',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getGstr1Report = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = { status: { $ne: 'Cancelled' } };

    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) query.invoiceDate.$gte = new Date(startDate);
      if (endDate) query.invoiceDate.$lte = new Date(endDate);
    }

    const invoices = await Invoice.find(query).sort({ invoiceDate: 1 });

    const b2bInvoices = [];
    const b2cInvoices = [];
    const hsnSummaryMap = {};
    const rateWiseTaxMap = {};

    let totalB2bTaxable = 0;
    let totalB2bTax = 0;
    let totalB2cTaxable = 0;
    let totalB2cTax = 0;

    invoices.forEach((inv) => {
      const isB2B = inv.customerDetails?.gstin && inv.customerDetails.gstin.trim() !== '';

      const invoiceSummary = {
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        customerName: inv.customerDetails.name,
        gstin: inv.customerDetails.gstin || 'Unregistered',
        placeOfSupply: `${inv.placeOfSupplyState} (${inv.placeOfSupplyStateCode})`,
        taxableAmount: inv.totalTaxableAmount,
        cgst: inv.totalCgst,
        sgst: inv.totalSgst,
        igst: inv.totalIgst,
        totalTax: inv.totalCgst + inv.totalSgst + inv.totalIgst,
        grandTotal: inv.grandTotal,
        isCaAudited: inv.isCaAudited,
      };

      if (isB2B) {
        b2bInvoices.push(invoiceSummary);
        totalB2bTaxable += inv.totalTaxableAmount;
        totalB2bTax += invoiceSummary.totalTax;
      } else {
        b2cInvoices.push(invoiceSummary);
        totalB2cTaxable += inv.totalTaxableAmount;
        totalB2cTax += invoiceSummary.totalTax;
      }

      // HSN Breakdown
      inv.items.forEach((item) => {
        const code = item.hsnSac || 'General';
        if (!hsnSummaryMap[code]) {
          hsnSummaryMap[code] = {
            hsnSac: code,
            description: item.name,
            uqc: item.unit || 'PCS',
            totalQuantity: 0,
            totalValue: 0,
            taxableValue: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
          };
        }
        hsnSummaryMap[code].totalQuantity += item.quantity;
        hsnSummaryMap[code].totalValue += item.totalAmount;
        hsnSummaryMap[code].taxableValue += item.taxableAmount;
        hsnSummaryMap[code].cgst += item.cgstAmount;
        hsnSummaryMap[code].sgst += item.sgstAmount;
        hsnSummaryMap[code].igst += item.igstAmount;

        // Rate Wise
        const rateKey = `${item.gstRate}%`;
        if (!rateWiseTaxMap[rateKey]) {
          rateWiseTaxMap[rateKey] = {
            rate: item.gstRate,
            taxableValue: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            totalTax: 0,
          };
        }
        rateWiseTaxMap[rateKey].taxableValue += item.taxableAmount;
        rateWiseTaxMap[rateKey].cgst += item.cgstAmount;
        rateWiseTaxMap[rateKey].sgst += item.sgstAmount;
        rateWiseTaxMap[rateKey].igst += item.igstAmount;
        rateWiseTaxMap[rateKey].totalTax += (item.cgstAmount + item.sgstAmount + item.igstAmount);
      });
    });

    res.json({
      b2b: {
        count: b2bInvoices.length,
        totalTaxable: Math.round(totalB2bTaxable * 100) / 100,
        totalTax: Math.round(totalB2bTax * 100) / 100,
        invoices: b2bInvoices,
      },
      b2c: {
        count: b2cInvoices.length,
        totalTaxable: Math.round(totalB2cTaxable * 100) / 100,
        totalTax: Math.round(totalB2cTax * 100) / 100,
        invoices: b2cInvoices,
      },
      hsnSummary: Object.values(hsnSummaryMap),
      rateWiseTax: Object.values(rateWiseTaxMap).sort((a, b) => a.rate - b.rate),
      documentSummary: {
        totalIssued: invoices.length,
        cancelled: await Invoice.countDocuments({ status: 'Cancelled' }),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getGstr3bReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = { status: { $ne: 'Cancelled' } };

    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) query.invoiceDate.$gte = new Date(startDate);
      if (endDate) query.invoiceDate.$lte = new Date(endDate);
    }

    const invoices = await Invoice.find(query);

    let totalTaxableValue = 0;
    let totalIgst = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalCess = 0;

    let interStateUnregisteredTaxable = 0;
    let interStateUnregisteredIgst = 0;

    invoices.forEach((inv) => {
      totalTaxableValue += inv.totalTaxableAmount;
      totalIgst += inv.totalIgst;
      totalCgst += inv.totalCgst;
      totalSgst += inv.totalSgst;
      totalCess += inv.totalCess;

      const isUnregistered = !inv.customerDetails?.gstin || inv.customerDetails.gstin.trim() === '';
      if (inv.isInterState && isUnregistered) {
        interStateUnregisteredTaxable += inv.totalTaxableAmount;
        interStateUnregisteredIgst += inv.totalIgst;
      }
    });

    res.json({
      section31: {
        title: '3.1 Details of Outward Supplies and inward supplies liable to reverse charge',
        outwardTaxableSupplies: {
          totalTaxableValue: Math.round(totalTaxableValue * 100) / 100,
          integratedTax: Math.round(totalIgst * 100) / 100,
          centralTax: Math.round(totalCgst * 100) / 100,
          stateUtTax: Math.round(totalSgst * 100) / 100,
          cess: Math.round(totalCess * 100) / 100,
        },
        zeroRatedSupplies: { totalTaxableValue: 0, integratedTax: 0, cess: 0 },
        nilRatedExempted: { totalTaxableValue: 0 },
      },
      section32: {
        title: '3.2 Inter-State supplies made to unregistered persons',
        suppliesToUnregistered: {
          taxableValue: Math.round(interStateUnregisteredTaxable * 100) / 100,
          integratedTax: Math.round(interStateUnregisteredIgst * 100) / 100,
        },
      },
      totalTaxLiability: Math.round((totalIgst + totalCgst + totalSgst + totalCess) * 100) / 100,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
