# Ledgerly — GST Billing & Compliance Suite

An enterprise-grade **MERN Stack** (MongoDB, Express, React, Node.js) GST Invoicing and Statutory Filing platform designed in accordance with the Central Goods and Services Tax Rules, 2017 (Rule 46 Tax Invoice standards).

---

## 🚀 Key Features

### 1. Multi-User Architecture & Role-Based Access Control
Ledgerly provides three pre-configured user personas with distinct operational permissions and tailored views:
- **Owner (`owner@ledgerly.app`)**:
  - Full administrator control across business profile, bank accounts, and invoice prefix sequence.
  - Can create, edit, and delete any invoice regardless of status.
  - Full visibility into company profit, tax collections, and financial records.
- **Biller (`biller@ledgerly.app`)**:
  - Daily billing operations: Create, modify, and manage customers & products.
  - Issue new GST Tax Invoices and manage customer receivables.
  - Protected from accidentally modifying bank credentials or deleting finalized/paid invoices.
- **Chartered Accountant (CA) (`ca@ledgerly.app`)**:
  - Dedicated Audit Desk with access to GSTR-1 and GSTR-3B statutory returns.
  - Compliance audit workflow: review invoices, verify buyer GSTIN, validate intra vs inter-state tax rate classifications, and mark invoices as **CA Verified**.
  - Add official audit notes and export portal-ready JSON and CSV files.
  - Seamless 1-click role switcher directly in the top navigation bar.

### 2. Comprehensive Invoice Edit Feature
- Full edit lifecycle on existing invoices (`/invoices/:id/edit`).
- Modify customer, invoice date, payment due dates, and notes.
- Add, update, or remove line items with automatic recalculation of:
  - Base amounts and line discounts.
  - Taxable values.
  - Intra-State (CGST 50% + SGST 50%) or Inter-State (IGST 100%) distribution based on place of supply.
  - Round-off and Indian Rupees Amount in Words.
- Built-in **Audit Trail History**: every edit records the timestamp, user, role, and the mandatory edit reason for CA transparency.

### 3. Dynamic GST Engine
- Auto-detects **Intra-State** vs **Inter-State** supply by comparing the Supplier's State Code (e.g., `27` Maharashtra) with the Buyer's Place of Supply Code (e.g., `07` Delhi, `29` Karnataka).
- Supports standard Indian GST tax brackets: `0%`, `5%`, `12%`, `18%`, and `28%`.
- Automatic derivation of State and PAN from 15-digit GSTIN numbers.

### 4. Rule 46 Compliant Print & PDF Engine
- Generates official Indian GST Tax Invoices formatted with:
  - Original for Recipient indicator.
  - Supplier & Buyer GSTIN, PAN, and State Codes.
  - Itemized HSN/SAC table with Taxable Value, CGST/SGST/IGST breakdown.
  - Bank Account details (NEFT/RTGS).
  - Dynamic **UPI QR Code** generated on-the-fly for instant mobile payment scanning.
  - Authorized Signatory box & CA Verified stamp.

### 5. Statutory GST Reporting & Returns
- **GSTR-1**:
  - Table 4: B2B Invoices to registered taxpayers.
  - Table 7: B2C Invoices to unregistered retail clients.
  - Table 12: HSN-wise summary of outward supplies.
  - Table 13: Document series summary.
- **GSTR-3B**:
  - Table 3.1: Details of Outward Taxable Supplies.
  - Table 3.2: Inter-State supplies to unregistered persons.
- **Export Formats**:
  - Direct JSON export matching GST Offline Tool schema.
  - Sales register CSV export for spreadsheet reconciliation.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, React Router DOM, Tailwind CSS, Lucide React Icons.
- **Backend**: Node.js, Express.js, Mongoose, JWT Authentication, CORS.
- **Database**: MongoDB (running on `localhost:27017/ledgerly_gst`).

---

## 🏁 Quick Start

### 1. Start Both Backend and Frontend
From the root directory:
```bash
npm run dev
```
- Client runs on: `http://localhost:3000`
- API Server runs on: `http://localhost:5000`

### 2. Seed Sample Database (If needed)
```bash
npm run seed
```

### 3. Default Demo Accounts
All accounts use the password: `password123`
- **Owner**: `owner@ledgerly.app`
- **Biller**: `biller@ledgerly.app`
- **CA**: `ca@ledgerly.app`
*(You can also use the role switcher buttons in the top bar to switch instantaneously)*
