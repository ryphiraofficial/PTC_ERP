import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Company from '../models/Company.js';
import Customer from '../models/Customer.js';
import Item from '../models/Item.js';
import Invoice from '../models/Invoice.js';
import { calculateInvoiceAmounts } from '../controllers/invoiceController.js';

dotenv.config();

export const seedData = async (forceClear = false) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ledgerly_gst');
      console.log('Connected to MongoDB for seeding...');
    }

    const existingUsers = await User.countDocuments();
    if (existingUsers > 0 && !forceClear) {
      console.log('Database already initialized. Skipping auto-seed.');
      return;
    }

    if (forceClear) {
      await User.deleteMany({});
      await Company.deleteMany({});
      await Customer.deleteMany({});
      await Item.deleteMany({});
      await Invoice.deleteMany({});
      console.log('Cleared existing collections for fresh seed.');
    }

    // 1. Create Users (Owner, Biller, CA)
    const owner = await User.create({
      name: 'Aditya Sharma (Owner)',
      email: 'owner@ledgerly.app',
      password: 'password123',
      role: 'owner',
      phone: '+91 98201 23456',
    });

    const biller = await User.create({
      name: 'Pooja Verma (Biller)',
      email: 'biller@ledgerly.app',
      password: 'password123',
      role: 'biller',
      phone: '+91 98202 34567',
    });

    const ca = await User.create({
      name: 'Ramesh Mehta, FCA (Chartered Accountant)',
      email: 'ca@ledgerly.app',
      password: 'password123',
      role: 'ca',
      phone: '+91 98203 45678',
    });

    console.log('Created Users: Owner, Biller, CA.');

    // 2. Create Company
    const company = await Company.create({
      businessName: 'Apex Cloud Solutions Pvt Ltd',
      tradeName: 'Apex Technologies',
      gstin: '27AAACA1234Q1ZP',
      pan: 'AAACA1234Q',
      email: 'finance@apexsolutions.in',
      phone: '+91 22 4950 1200',
      website: 'www.apexsolutions.in',
      address: {
        street: 'Unit 401, Mindspace IT Park, Malad West',
        city: 'Mumbai',
        state: 'Maharashtra',
        stateCode: '27',
        pincode: '400064',
        country: 'India',
      },
      bankDetails: {
        bankName: 'ICICI Bank Ltd',
        accountName: 'Apex Cloud Solutions Pvt Ltd',
        accountNumber: '001105018923',
        ifscCode: 'ICIC0000011',
        branch: 'Malad West Branch, Mumbai',
        upiId: 'apexcloud@icici',
      },
      invoiceSettings: {
        prefix: 'INV-2024-',
        nextNumber: 1006,
        termsAndConditions:
          '1. Goods/services once delivered cannot be cancelled.\n2. Payment terms: Net 15 days from invoice issuance.\n3. Delayed payments are subject to 1.5% interest per month.\n4. Disputes subject to Mumbai jurisdiction.',
        authorizedSignatory: 'Aditya Sharma (Managing Director)',
      },
    });

    console.log('Created Company Profile.');

    // 3. Create Customers
    const customers = await Customer.create([
      {
        name: 'Sunil Nair',
        companyName: 'TechnoSphere Digital Labs',
        gstin: '27AAACT9876C1Z3', // Maharashtra (Intra-state)
        pan: 'AAACT9876C',
        email: 'accounts@technosphere.io',
        phone: '+91 98334 11223',
        customerType: 'B2B',
        billingAddress: {
          street: '12th Floor, Trade Center, BKC',
          city: 'Mumbai',
          state: 'Maharashtra',
          stateCode: '27',
          pincode: '400051',
          country: 'India',
        },
      },
      {
        name: 'Ananya Deshmukh',
        companyName: 'Zenith Logistics & Supply Chain',
        gstin: '29ABCDE1234F1Z5', // Karnataka (Inter-state)
        pan: 'ABCDE1234F',
        email: 'billing@zenithlogistics.in',
        phone: '+91 98450 99887',
        customerType: 'B2B',
        billingAddress: {
          street: 'Indiranagar 100ft Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          stateCode: '29',
          pincode: '560038',
          country: 'India',
        },
      },
      {
        name: 'Vikas Singhania',
        companyName: 'Capital Infotech LLP',
        gstin: '07AABCC3456D1Z2', // Delhi (Inter-state)
        pan: 'AABCC3456D',
        email: 'finance@capitalinfotech.com',
        phone: '+91 98110 55443',
        customerType: 'B2B',
        billingAddress: {
          street: 'Barakhamba Road, Connaught Place',
          city: 'New Delhi',
          state: 'Delhi',
          stateCode: '07',
          pincode: '110001',
          country: 'India',
        },
      },
      {
        name: 'Rajesh Kulkarni',
        companyName: '',
        gstin: '', // Unregistered B2C
        email: 'rajesh.kulkarni@gmail.com',
        phone: '+91 99201 88776',
        customerType: 'B2C',
        billingAddress: {
          street: 'Flat 502, Green Acres, Viman Nagar',
          city: 'Pune',
          state: 'Maharashtra',
          stateCode: '27',
          pincode: '411014',
          country: 'India',
        },
      },
      {
        name: 'Priya Mehra',
        companyName: 'Mehra Design Studio',
        gstin: '24AAECM4433K1Z1', // Gujarat (Inter-state)
        pan: 'AAECM4433K',
        email: 'priya@mehradesign.in',
        phone: '+91 97230 66554',
        customerType: 'B2B',
        billingAddress: {
          street: 'SG Highway, Bodakdev',
          city: 'Ahmedabad',
          state: 'Gujarat',
          stateCode: '24',
          pincode: '380054',
          country: 'India',
        },
      },
    ]);

    console.log(`Created ${customers.length} Customers.`);

    // 4. Create Items & Services
    const items = await Item.create([
      {
        name: 'Enterprise Cloud Server Setup',
        type: 'service',
        hsnSac: '998313',
        sku: 'SRV-CLOUD-ENT',
        unit: 'HRS',
        sellingPrice: 4500,
        purchasePrice: 2000,
        gstRate: 18,
        description: 'Architecture design, server hardening, CI/CD automated deployment',
        stock: 500,
      },
      {
        name: 'Dell PowerEdge R750 Rack Server',
        type: 'goods',
        hsnSac: '84715000',
        sku: 'HW-DELL-R750',
        unit: 'PCS',
        sellingPrice: 245000,
        purchasePrice: 195000,
        gstRate: 18,
        description: '2x Intel Xeon Silver 4314, 64GB DDR4 ECC, 2x 960GB NVMe SSD',
        stock: 12,
      },
      {
        name: 'Annual Cyber Security Audit & VAPT',
        type: 'service',
        hsnSac: '998315',
        sku: 'SRV-SEC-VAPT',
        unit: 'SET',
        sellingPrice: 85000,
        purchasePrice: 40000,
        gstRate: 18,
        description: 'Comprehensive vulnerability assessment and penetration testing with report',
        stock: 50,
      },
      {
        name: 'Cisco Gigabit Managed Switch 24-Port',
        type: 'goods',
        hsnSac: '85176290',
        sku: 'NET-CISCO-24P',
        unit: 'PCS',
        sellingPrice: 38000,
        purchasePrice: 29000,
        gstRate: 18,
        description: 'Layer 3 manageable PoE+ gigabit enterprise network switch',
        stock: 25,
      },
      {
        name: 'ERP Software License - Annual Standard',
        type: 'service',
        hsnSac: '997331',
        sku: 'LIC-ERP-STD',
        unit: 'NOS',
        sellingPrice: 12500,
        purchasePrice: 7000,
        gstRate: 18,
        description: 'Single organization annual license up to 25 concurrent users',
        stock: 200,
      },
      {
        name: 'Hardware Warranty Extension - 3 Years',
        type: 'service',
        hsnSac: '998713',
        sku: 'WARR-3YR',
        unit: 'NOS',
        sellingPrice: 15000,
        purchasePrice: 9000,
        gstRate: 18,
        description: 'On-site 24x7 4-hour response mission critical hardware support',
        stock: 999,
      },
    ]);

    console.log(`Created ${items.length} Items & Services.`);

    // 5. Create Invoices
    const invoiceSeeds = [
      {
        invoiceNumber: 'INV-2024-1001',
        customer: customers[0], // TechnoSphere (Maharashtra, Intra-state)
        date: new Date('2024-10-05'),
        dueDate: new Date('2024-10-20'),
        status: 'Paid',
        isCaAudited: true,
        caNotes: 'Verified with GSTR-2B counterpart match. 100% compliant.',
        paymentDetails: {
          paymentStatus: 'Paid',
          amountPaid: 100300,
          paymentMode: 'Bank Transfer / NEFT / RTGS',
          transactionRef: 'NEFT-HDFC-9938210',
          paidAt: new Date('2024-10-18'),
        },
        items: [
          {
            itemId: items[0]._id,
            name: items[0].name,
            hsnSac: items[0].hsnSac,
            quantity: 10,
            unit: items[0].unit,
            price: items[0].sellingPrice,
            discountPercent: 5,
            gstRate: items[0].gstRate,
          },
          {
            itemId: items[3]._id,
            name: items[3].name,
            hsnSac: items[3].hsnSac,
            quantity: 1,
            unit: items[3].unit,
            price: items[3].sellingPrice,
            discountPercent: 0,
            gstRate: items[3].gstRate,
          },
        ],
      },
      {
        invoiceNumber: 'INV-2024-1002',
        customer: customers[1], // Zenith Logistics (Karnataka, Inter-state)
        date: new Date('2024-10-12'),
        dueDate: new Date('2024-10-27'),
        status: 'Paid',
        isCaAudited: true,
        caNotes: 'IGST inter-state supply verified. Place of Supply 29 (KA).',
        paymentDetails: {
          paymentStatus: 'Paid',
          amountPaid: 289100,
          paymentMode: 'Bank Transfer / NEFT / RTGS',
          transactionRef: 'RTGS-ICICI-8847120',
          paidAt: new Date('2024-10-25'),
        },
        items: [
          {
            itemId: items[1]._id,
            name: items[1].name,
            hsnSac: items[1].hsnSac,
            quantity: 1,
            unit: items[1].unit,
            price: items[1].sellingPrice,
            discountPercent: 0,
            gstRate: items[1].gstRate,
          },
        ],
      },
      {
        invoiceNumber: 'INV-2024-1003',
        customer: customers[2], // Capital Infotech (Delhi, Inter-state)
        date: new Date('2024-10-18'),
        dueDate: new Date('2024-11-02'),
        status: 'Sent',
        isCaAudited: false,
        caNotes: 'Pending customer verification on GST portal.',
        paymentDetails: {
          paymentStatus: 'Unpaid',
          amountPaid: 0,
        },
        items: [
          {
            itemId: items[2]._id,
            name: items[2].name,
            hsnSac: items[2].hsnSac,
            quantity: 1,
            unit: items[2].unit,
            price: items[2].sellingPrice,
            discountPercent: 10,
            gstRate: items[2].gstRate,
          },
          {
            itemId: items[4]._id,
            name: items[4].name,
            hsnSac: items[4].hsnSac,
            quantity: 2,
            unit: items[4].unit,
            price: items[4].sellingPrice,
            discountPercent: 0,
            gstRate: items[4].gstRate,
          },
        ],
      },
      {
        invoiceNumber: 'INV-2024-1004',
        customer: customers[3], // Rajesh Kulkarni (B2C, Intra-state)
        date: new Date('2024-10-22'),
        dueDate: new Date('2024-10-22'),
        status: 'Paid',
        isCaAudited: true,
        caNotes: 'B2C consumer invoice. Included in GSTR-1 Table 7.',
        paymentDetails: {
          paymentStatus: 'Paid',
          amountPaid: 14750,
          paymentMode: 'UPI',
          transactionRef: 'UPI-RAZORPAY-399182',
          paidAt: new Date('2024-10-22'),
        },
        items: [
          {
            itemId: items[4]._id,
            name: items[4].name,
            hsnSac: items[4].hsnSac,
            quantity: 1,
            unit: items[4].unit,
            price: items[4].sellingPrice,
            discountPercent: 0,
            gstRate: items[4].gstRate,
          },
        ],
      },
      {
        invoiceNumber: 'INV-2024-1005',
        customer: customers[4], // Mehra Design (Gujarat, Inter-state)
        date: new Date('2024-10-24'),
        dueDate: new Date('2024-11-08'),
        status: 'Sent',
        isCaAudited: false,
        paymentDetails: {
          paymentStatus: 'Unpaid',
          amountPaid: 0,
        },
        items: [
          {
            itemId: items[0]._id,
            name: items[0].name,
            hsnSac: items[0].hsnSac,
            quantity: 5,
            unit: items[0].unit,
            price: items[0].sellingPrice,
            discountPercent: 0,
            gstRate: items[0].gstRate,
          },
          {
            itemId: items[5]._id,
            name: items[5].name,
            hsnSac: items[5].hsnSac,
            quantity: 1,
            unit: items[5].unit,
            price: items[5].sellingPrice,
            discountPercent: 5,
            gstRate: items[5].gstRate,
          },
        ],
      },
    ];

    for (const seedInv of invoiceSeeds) {
      const isInterState = seedInv.customer.billingAddress.stateCode !== company.address.stateCode;
      const amounts = calculateInvoiceAmounts(seedInv.items, isInterState);

      await Invoice.create({
        invoiceNumber: seedInv.invoiceNumber,
        invoiceDate: seedInv.date,
        dueDate: seedInv.dueDate,
        customerId: seedInv.customer._id,
        customerDetails: {
          name: seedInv.customer.name,
          companyName: seedInv.customer.companyName,
          gstin: seedInv.customer.gstin,
          pan: seedInv.customer.pan,
          email: seedInv.customer.email,
          phone: seedInv.customer.phone,
          customerType: seedInv.customer.customerType,
          billingAddress: seedInv.customer.billingAddress,
        },
        placeOfSupplyState: seedInv.customer.billingAddress.state,
        placeOfSupplyStateCode: seedInv.customer.billingAddress.stateCode,
        isInterState,
        items: amounts.processedItems,
        totalTaxableAmount: amounts.totalTaxableAmount,
        totalCgst: amounts.totalCgst,
        totalSgst: amounts.totalSgst,
        totalIgst: amounts.totalIgst,
        totalCess: amounts.totalCess,
        roundOff: amounts.roundOff,
        grandTotal: amounts.grandTotal,
        totalInWords: amounts.totalInWords,
        status: seedInv.status,
        paymentDetails: seedInv.paymentDetails,
        isCaAudited: seedInv.isCaAudited,
        caNotes: seedInv.caNotes,
        caAuditedBy: seedInv.isCaAudited
          ? {
              userId: ca._id,
              name: ca.name,
              auditedAt: new Date(seedInv.date.getTime() + 2 * 24 * 60 * 60 * 1000),
            }
          : undefined,
        createdBy: {
          userId: biller._id,
          name: biller.name,
          role: 'biller',
        },
        lastEditedBy: {
          userId: owner._id,
          name: owner.name,
          role: 'owner',
          editedAt: seedInv.date,
        },
        editHistory: [
          {
            editedAt: seedInv.date,
            editedBy: {
              userId: biller._id,
              name: biller.name,
              role: 'biller',
            },
            reason: 'Generated GST Tax Invoice',
            newGrandTotal: amounts.grandTotal,
          },
        ],
      });
    }

    console.log(`Created ${invoiceSeeds.length} Invoices with realistic GST & edit history.`);
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Seeding error:', error);
    if (process.argv[1]?.includes('seedData.js')) {
      process.exit(1);
    }
    throw error;
  }
};

// If run directly from CLI (e.g. npm run seed)
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('seedData.js')) {
  seedData(true).then(() => process.exit(0)).catch(() => process.exit(1));
}
