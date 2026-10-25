import React, { useRef } from 'react';
import { X, Printer, Download, CheckCircle2, ShieldCheck } from 'lucide-react';
import { formatINR, formatDate } from '../utils/gstUtils';

export default function InvoicePrintModal({ invoice, company, onClose }) {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const isInterState = invoice.isInterState;
  const seller = company || {
    businessName: 'Apex Cloud Solutions Pvt Ltd',
    tradeName: 'Apex Technologies',
    gstin: '27AAACA1234Q1ZP',
    pan: 'AAACA1234Q',
    email: 'finance@apexsolutions.in',
    phone: '+91 22 4950 1200',
    address: {
      street: 'Unit 401, Mindspace IT Park, Malad West',
      city: 'Mumbai',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '400064',
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
      termsAndConditions:
        '1. Goods/services once delivered cannot be cancelled.\n2. Payment terms: Net 15 days from invoice issuance.\n3. Delayed payments are subject to 1.5% interest per month.\n4. Disputes subject to Mumbai jurisdiction.',
      authorizedSignatory: 'Aditya Sharma (Managing Director)',
    },
  };

  const buyer = invoice.customerDetails;
  const upiPayUrl = `upi://pay?pa=${encodeURIComponent(
    seller.bankDetails?.upiId || 'apexcloud@icici'
  )}&pn=${encodeURIComponent(seller.businessName)}&am=${invoice.grandTotal}&cu=INR&tn=Invoice%20${encodeURIComponent(
    invoice.invoiceNumber
  )}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(
    upiPayUrl
  )}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Modal Controls Header (no-print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800 no-print">
          <div className="flex items-center gap-3">
            <span className="font-bold text-base">GST Tax Invoice Preview</span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
              {invoice.invoiceNumber}
            </span>
            {invoice.isCaAudited && (
              <span className="flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                CA Audited
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE INVOICE CONTENT */}
        <div id="printable-invoice" className="p-8 text-slate-900 bg-white font-sans text-xs">
          {/* Header Row: Tax Invoice Title & Copy tag */}
          <div className="border-b-2 border-slate-900 pb-3 mb-4 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 uppercase">
                TAX INVOICE
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Issued in accordance with Rule 46 of the Central Goods & Services Tax Rules, 2017
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block border border-slate-300 bg-slate-50 text-slate-700 font-bold px-2.5 py-1 rounded text-[11px] uppercase tracking-wider">
                Original for Recipient
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Supply Type: <strong className="text-slate-800">{isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}</strong>
              </p>
            </div>
          </div>

          {/* Supplier & Invoice Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 border border-slate-300 rounded-lg p-3.5 mb-4 bg-slate-50/50">
            {/* Supplier / Seller Info */}
            <div className="pr-4 border-r border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Supplier / Sold By:
              </span>
              <h2 className="text-base font-bold text-slate-950">{seller.businessName}</h2>
              {seller.tradeName && <p className="text-xs text-slate-600 font-medium">{seller.tradeName}</p>}
              <p className="text-slate-600 mt-1">
                {seller.address?.street}, {seller.address?.city}, {seller.address?.state} - {seller.address?.pincode}
              </p>
              <div className="mt-2 space-y-0.5 font-mono text-[11px]">
                <p>
                  <span className="font-semibold text-slate-700">GSTIN:</span>{' '}
                  <strong className="text-slate-900">{seller.gstin}</strong>
                </p>
                <p>
                  <span className="font-semibold text-slate-700">State & Code:</span>{' '}
                  {seller.address?.state} ({seller.address?.stateCode})
                </p>
                <p>
                  <span className="font-semibold text-slate-700">Email:</span> {seller.email} |{' '}
                  <span className="font-semibold text-slate-700">Phone:</span> {seller.phone}
                </p>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="pl-2 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Invoice Details:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Invoice No:</span>
                  <strong className="text-slate-900 font-mono text-sm">{invoice.invoiceNumber}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Invoice Date:</span>
                  <strong className="text-slate-900">{formatDate(invoice.invoiceDate)}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Payment Due Date:</span>
                  <strong className="text-slate-900">{formatDate(invoice.dueDate)}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Place of Supply:</span>
                  <strong className="text-slate-900 font-semibold">
                    {invoice.placeOfSupplyState} ({invoice.placeOfSupplyStateCode})
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Reverse Charge:</span>
                  <span className="text-slate-800">No</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Payment Status:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[11px] inline-block ${
                      invoice.status === 'Paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : invoice.status === 'Overdue'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {invoice.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Billed To / Buyer Info */}
          <div className="border border-slate-300 rounded-lg p-3.5 mb-4 bg-slate-50/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Billed To (Recipient / Customer):
            </span>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-950">
                  {buyer.companyName || buyer.name}
                </h3>
                {buyer.companyName && (
                  <p className="text-xs text-slate-600 font-medium">Attn: {buyer.name}</p>
                )}
                <p className="text-slate-600 mt-1">
                  {buyer.billingAddress?.street || 'N/A'}, {buyer.billingAddress?.city || ''},{' '}
                  {buyer.billingAddress?.state} - {buyer.billingAddress?.pincode}
                </p>
              </div>
              <div className="font-mono text-[11px] space-y-0.5">
                <p>
                  <span className="font-semibold text-slate-700">GSTIN / UIN:</span>{' '}
                  <strong className="text-slate-900 font-bold">
                    {buyer.gstin || 'Unregistered Consumer (B2C)'}
                  </strong>
                </p>
                <p>
                  <span className="font-semibold text-slate-700">State & Code:</span>{' '}
                  {buyer.billingAddress?.state} ({buyer.billingAddress?.stateCode})
                </p>
                {buyer.email && (
                  <p>
                    <span className="font-semibold text-slate-700">Email:</span> {buyer.email}
                  </p>
                )}
                {buyer.phone && (
                  <p>
                    <span className="font-semibold text-slate-700">Phone:</span> {buyer.phone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Items & GST Calculation Table */}
          <table className="w-full border-collapse border border-slate-300 mb-4 text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300">
                <th className="p-2 border border-slate-300 text-center w-10">#</th>
                <th className="p-2 border border-slate-300 text-left">Item / Service Description</th>
                <th className="p-2 border border-slate-300 text-center w-20">HSN/SAC</th>
                <th className="p-2 border border-slate-300 text-center w-14">Qty</th>
                <th className="p-2 border border-slate-300 text-right w-20">Rate</th>
                <th className="p-2 border border-slate-300 text-right w-16">Disc %</th>
                <th className="p-2 border border-slate-300 text-right w-24">Taxable Val</th>
                {isInterState ? (
                  <>
                    <th className="p-2 border border-slate-300 text-right w-24">IGST</th>
                  </>
                ) : (
                  <>
                    <th className="p-2 border border-slate-300 text-right w-20">CGST</th>
                    <th className="p-2 border border-slate-300 text-right w-20">SGST</th>
                  </>
                )}
                <th className="p-2 border border-slate-300 text-right w-28">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50/50">
                  <td className="p-2 border border-slate-300 text-center">{idx + 1}</td>
                  <td className="p-2 border border-slate-300">
                    <div className="font-bold text-slate-900">{item.name}</div>
                    {item.description && (
                      <div className="text-[11px] text-slate-500">{item.description}</div>
                    )}
                  </td>
                  <td className="p-2 border border-slate-300 text-center font-mono">{item.hsnSac}</td>
                  <td className="p-2 border border-slate-300 text-center font-semibold">
                    {item.quantity} <span className="text-[10px] text-slate-500">{item.unit}</span>
                  </td>
                  <td className="p-2 border border-slate-300 text-right">{formatINR(item.price)}</td>
                  <td className="p-2 border border-slate-300 text-right">
                    {item.discountPercent ? `${item.discountPercent}%` : '-'}
                  </td>
                  <td className="p-2 border border-slate-300 text-right font-medium">
                    {formatINR(item.taxableAmount)}
                  </td>
                  {isInterState ? (
                    <td className="p-2 border border-slate-300 text-right">
                      <div>{formatINR(item.igstAmount)}</div>
                      <div className="text-[10px] text-slate-500">({item.gstRate}%)</div>
                    </td>
                  ) : (
                    <>
                      <td className="p-2 border border-slate-300 text-right">
                        <div>{formatINR(item.cgstAmount)}</div>
                        <div className="text-[10px] text-slate-500">({item.gstRate / 2}%)</div>
                      </td>
                      <td className="p-2 border border-slate-300 text-right">
                        <div>{formatINR(item.sgstAmount)}</div>
                        <div className="text-[10px] text-slate-500">({item.gstRate / 2}%)</div>
                      </td>
                    </>
                  )}
                  <td className="p-2 border border-slate-300 text-right font-bold text-slate-950">
                    {formatINR(item.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals & Tax Summary Breakdown */}
          <div className="grid grid-cols-12 gap-4 mb-4">
            {/* Amount in words & Bank Details */}
            <div className="col-span-7 space-y-3">
              <div className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Total Invoice Amount in Words:
                </span>
                <p className="font-bold text-slate-900 text-xs italic">
                  {invoice.totalInWords || 'Rupees Only'}
                </p>
              </div>

              {/* Bank Details & UPI QR */}
              <div className="border border-slate-200 rounded-lg p-3 bg-white flex items-center justify-between">
                <div className="text-xs space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Bank & NEFT / RTGS Remittance Details:
                  </span>
                  <p>
                    <span className="font-semibold text-slate-700">Bank Name:</span>{' '}
                    {seller.bankDetails?.bankName}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Account Name:</span>{' '}
                    {seller.bankDetails?.accountName || seller.businessName}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Account No:</span>{' '}
                    <strong className="font-mono text-slate-950">{seller.bankDetails?.accountNumber}</strong>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">IFSC Code:</span>{' '}
                    <strong className="font-mono text-slate-950">{seller.bankDetails?.ifscCode}</strong>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">UPI ID:</span>{' '}
                    <span className="font-mono text-indigo-700">{seller.bankDetails?.upiId}</span>
                  </p>
                </div>
                {/* Dynamic QR Code for UPI */}
                <div className="text-center pl-2 border-l border-slate-100 flex flex-col items-center">
                  <img
                    src={qrCodeUrl}
                    alt="UPI Payment QR Code"
                    className="w-20 h-20 border border-slate-200 p-0.5 rounded"
                  />
                  <span className="text-[9px] text-slate-500 font-semibold mt-1">
                    Scan with any UPI App
                  </span>
                </div>
              </div>
            </div>

            {/* Calculations Summary Card */}
            <div className="col-span-5 border border-slate-300 rounded-lg overflow-hidden bg-white">
              <div className="divide-y divide-slate-200 text-xs">
                <div className="flex justify-between px-3.5 py-2">
                  <span className="text-slate-600">Total Taxable Value:</span>
                  <span className="font-semibold text-slate-900">
                    {formatINR(invoice.totalTaxableAmount)}
                  </span>
                </div>

                {isInterState ? (
                  <div className="flex justify-between px-3.5 py-2 bg-slate-50">
                    <span className="text-slate-600">Integrated GST (IGST):</span>
                    <span className="font-semibold text-slate-900">
                      {formatINR(invoice.totalIgst)}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between px-3.5 py-2 bg-slate-50">
                      <span className="text-slate-600">Central GST (CGST):</span>
                      <span className="font-semibold text-slate-900">
                        {formatINR(invoice.totalCgst)}
                      </span>
                    </div>
                    <div className="flex justify-between px-3.5 py-2 bg-slate-50">
                      <span className="text-slate-600">State GST (SGST):</span>
                      <span className="font-semibold text-slate-900">
                        {formatINR(invoice.totalSgst)}
                      </span>
                    </div>
                  </>
                )}

                {invoice.roundOff !== 0 && (
                  <div className="flex justify-between px-3.5 py-1.5 text-slate-500 text-[11px]">
                    <span>Round Off:</span>
                    <span>{formatINR(invoice.roundOff)}</span>
                  </div>
                )}

                <div className="flex justify-between px-3.5 py-3 bg-slate-900 text-white text-sm font-bold">
                  <span>Grand Total (INR):</span>
                  <span className="font-mono text-base">{formatINR(invoice.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Conditions and Signature Section */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200 mt-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Terms & Conditions:
              </span>
              <p className="text-[10px] text-slate-600 whitespace-pre-line leading-relaxed">
                {invoice.termsAndConditions || seller.invoiceSettings?.termsAndConditions}
              </p>
            </div>
            <div className="text-right flex flex-col justify-end items-end">
              {invoice.isCaAudited && (
                <div className="mb-3 px-3 py-1 bg-amber-50 border border-amber-300 rounded text-amber-800 text-[10px] font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Verified & Audited for GST Compliance</span>
                </div>
              )}
              <div className="h-14 flex items-end justify-center">
                <span className="text-xs font-serif italic text-indigo-900 font-bold tracking-wider">
                  {seller.businessName}
                </span>
              </div>
              <div className="border-t border-slate-400 pt-1 w-52 text-center">
                <p className="text-[11px] font-bold text-slate-900">
                  {seller.invoiceSettings?.authorizedSignatory || 'Authorized Signatory'}
                </p>
                <p className="text-[9px] text-slate-400">For {seller.businessName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
