import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Calculator,
  Building,
  User,
  Calendar,
  Percent,
  CheckCircle2,
  AlertCircle,
  FileEdit,
  History,
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { formatINR, GST_STATES, formatDate } from '../utils/gstUtils';

export default function InvoiceForm() {
  const navigate = useNavigate();
  const { id } = useParams(); // If id exists, it's EDIT MODE!
  const isEditMode = Boolean(id);
  const { currentUser, permissions } = useAuth();

  const [company, setCompany] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [itemsCatalog, setItemsCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editHistory, setEditHistory] = useState([]);

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [customerId, setCustomerId] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [placeOfSupplyState, setPlaceOfSupplyState] = useState('Maharashtra');
  const [placeOfSupplyStateCode, setPlaceOfSupplyStateCode] = useState('27');
  const [status, setStatus] = useState('Sent');
  const [notes, setNotes] = useState('Thank you for your business!');
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [editReason, setEditReason] = useState('Updated invoice details and tax amounts');
  const [advanceAmount, setAdvanceAmount] = useState(0);

  // Line Items
  const [items, setItems] = useState([
    {
      itemId: '',
      name: '',
      description: '',
      hsnSac: '9983',
      quantity: 1,
      unit: 'PCS',
      price: 0,
      discountPercent: 0,
      gstRate: 18,
    },
  ]);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [compRes, custRes, itemRes] = await Promise.all([
          api.getCompany(),
          api.getCustomers(),
          api.getItems(),
        ]);

        setCompany(compRes);
        setCustomers(custRes);
        setItemsCatalog(itemRes);

        if (!isEditMode && compRes?.invoiceSettings) {
          const p = compRes.invoiceSettings.prefix || 'INV-2024-';
          const n = compRes.invoiceSettings.nextNumber || 1001;
          setInvoiceNumber(`${p}${String(n).padStart(4, '0')}`);
          setTermsAndConditions(compRes.invoiceSettings.termsAndConditions || '');
          if (custRes.length > 0) {
            handleCustomerChange(custRes[0]._id, custRes, compRes);
          }
        }

        // If Edit Mode, fetch the invoice to edit
        if (isEditMode) {
          const inv = await api.getInvoice(id);
          setInvoiceNumber(inv.invoiceNumber);
          setInvoiceDate(new Date(inv.invoiceDate).toISOString().split('T')[0]);
          setDueDate(new Date(inv.dueDate).toISOString().split('T')[0]);
          setCustomerId(inv.customerId);
          setSelectedCustomer(inv.customerDetails);
          setPlaceOfSupplyState(inv.placeOfSupplyState);
          setPlaceOfSupplyStateCode(inv.placeOfSupplyStateCode);
          setStatus(inv.status);
          setNotes(inv.notes || '');
          setTermsAndConditions(inv.termsAndConditions || '');
          setEditHistory(inv.editHistory || []);
          setAdvanceAmount(inv.advanceAmount || 0);

          if (inv.items && inv.items.length > 0) {
            setItems(
              inv.items.map((it) => ({
                itemId: it.itemId || '',
                name: it.name,
                description: it.description || '',
                hsnSac: it.hsnSac,
                quantity: it.quantity,
                unit: it.unit || 'PCS',
                price: it.price,
                discountPercent: it.discountPercent || 0,
                gstRate: it.gstRate,
              }))
            );
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load initial invoice data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, isEditMode]);

  const companyStateCode = company?.address?.stateCode || '27';
  const isInterState = placeOfSupplyStateCode !== companyStateCode;

  // Handle customer selection
  const handleCustomerChange = (cId, custList = customers, comp = company) => {
    setCustomerId(cId);
    const found = custList.find((c) => c._id === cId);
    if (found) {
      setSelectedCustomer(found);
      const targetState = found.billingAddress?.state || 'Maharashtra';
      const targetCode = found.billingAddress?.stateCode || '27';
      setPlaceOfSupplyState(targetState);
      setPlaceOfSupplyStateCode(targetCode);
    }
  };

  const handlePlaceOfSupplyChange = (code) => {
    setPlaceOfSupplyStateCode(code);
    const match = GST_STATES.find((s) => s.code === code);
    if (match) {
      setPlaceOfSupplyState(match.name);
    }
  };

  // Add line item
  const addItemRow = () => {
    setItems([
      ...items,
      {
        itemId: '',
        name: '',
        description: '',
        hsnSac: '9983',
        quantity: 1,
        unit: 'PCS',
        price: 0,
        discountPercent: 0,
        gstRate: 18,
      },
    ]);
  };

  // Remove line item
  const removeItemRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  // Item field change
  const handleItemFieldChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    // If selecting an item from the catalog, autofill
    if (field === 'itemId') {
      const catItem = itemsCatalog.find((it) => it._id === value);
      if (catItem) {
        updated[index].name = catItem.name;
        updated[index].description = catItem.description || '';
        updated[index].hsnSac = catItem.hsnSac;
        updated[index].unit = catItem.unit || 'PCS';
        updated[index].price = catItem.sellingPrice;
        updated[index].gstRate = catItem.gstRate;
      }
    }

    setItems(updated);
  };

  // Calculate live totals
  let calculatedTaxable = 0;
  let calculatedCgst = 0;
  let calculatedSgst = 0;
  let calculatedIgst = 0;

  const itemCalculations = items.map((it) => {
    const qty = Number(it.quantity) || 0;
    const rate = Number(it.price) || 0;
    const disc = Number(it.discountPercent) || 0;
    const gstRate = Number(it.gstRate) || 0;

    const baseAmount = qty * rate;
    const discountAmount = Math.round(baseAmount * (disc / 100) * 100) / 100;
    const taxableAmount = Math.round((baseAmount - discountAmount) * 100) / 100;

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isInterState) {
      igst = Math.round(taxableAmount * (gstRate / 100) * 100) / 100;
    } else {
      const halfRate = gstRate / 2;
      cgst = Math.round(taxableAmount * (halfRate / 100) * 100) / 100;
      sgst = Math.round(taxableAmount * (halfRate / 100) * 100) / 100;
    }

    const total = taxableAmount + cgst + sgst + igst;

    calculatedTaxable += taxableAmount;
    calculatedCgst += cgst;
    calculatedSgst += sgst;
    calculatedIgst += igst;

    return {
      taxableAmount,
      cgst,
      sgst,
      igst,
      total,
    };
  });

  const exactTotal = calculatedTaxable + calculatedCgst + calculatedSgst + calculatedIgst;
  const roundedGrandTotal = Math.round(exactTotal);
  const roundOff = Math.round((roundedGrandTotal - exactTotal) * 100) / 100;
  const advanceAmountNum = Number(advanceAmount) || 0;
  const balanceDue = Math.max(0, roundedGrandTotal - advanceAmountNum);

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerId) {
      setError('Please select a customer for this invoice');
      return;
    }
    if (items.some((it) => !it.name.trim())) {
      setError('Please provide a name/description for all line items');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        invoiceNumber,
        invoiceDate,
        dueDate,
        customerId,
        placeOfSupplyState,
        placeOfSupplyStateCode,
        status,
        notes,
        termsAndConditions,
        items,
        advanceAmount: Number(advanceAmount) || 0,
        editReason: isEditMode ? editReason : 'Initial invoice creation',
      };

      if (isEditMode) {
        // FULL INVOICE EDIT ACTION
        await api.updateInvoice(id, payload);
      } else {
        await api.createInvoice(payload);
      }

      navigate('/invoices');
    } catch (err) {
      setError(err.message || 'Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/invoices')}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">
                {isEditMode ? 'Edit GST Invoice' : 'Create New GST Invoice'}
              </h1>
              {isEditMode && (
                <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full border border-amber-300">
                  <FileEdit className="w-3.5 h-3.5" />
                  Edit Mode
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {isEditMode
                ? `Updating ${invoiceNumber} • Recalculates CGST/SGST/IGST dynamically`
                : 'Generate a compliant Indian GST Tax Invoice under Rule 46'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-semibold rounded-lg transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-sm hover:shadow transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : isEditMode ? 'Save & Update Invoice' : 'Generate Invoice'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Edit Mode Audit Banner */}
      {isEditMode && (
        <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 uppercase tracking-wider">
              <History className="w-4 h-4 text-indigo-600" />
              Invoice Edit & Audit Trail Tracking
            </span>
            <span className="text-xs text-indigo-700">
              Edited by: <strong>{currentUser?.name}</strong> ({currentUser?.title})
            </span>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Reason for Editing this Invoice (Mandatory for Compliance Audit):
            </label>
            <input
              type="text"
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              placeholder="e.g. Rate amended after client PO revision, added discount, corrected HSN"
              className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}

      {/* Main Grid: Form Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Customer & Basic Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Customer & Place of Supply */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <User className="w-4 h-4 text-indigo-600" />
              Customer Details & Place of Supply
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Select Customer:
                </label>
                <select
                  value={customerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.companyName ? `${c.companyName} (${c.name})` : c.name} —{' '}
                      {c.gstin || 'B2C Unregistered'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Place of Supply (State):
                </label>
                <select
                  value={placeOfSupplyStateCode}
                  onChange={(e) => handlePlaceOfSupplyChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium"
                >
                  {GST_STATES.map((st) => (
                    <option key={st.code} value={st.code}>
                      [{st.code}] {st.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live GST Tax Type Detection Banner */}
            <div
              className={`p-3 rounded-lg flex items-center justify-between text-xs font-semibold ${
                isInterState
                  ? 'bg-purple-50 text-purple-900 border border-purple-200'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  Supply Classification:{' '}
                  <strong>{isInterState ? 'Inter-State Supply (IGST applies)' : 'Intra-State Supply (CGST + SGST applies)'}</strong>
                </span>
              </div>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white/80 border border-current">
                Seller: {companyStateCode} ⇄ Buyer: {placeOfSupplyStateCode}
              </span>
            </div>

            {selectedCustomer && (
              <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">GSTIN:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedCustomer.gstin || 'Unregistered B2C Customer'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Billing Address:</span>
                  <span>
                    {selectedCustomer.billingAddress?.street || 'N/A'},{' '}
                    {selectedCustomer.billingAddress?.city || ''},{' '}
                    {selectedCustomer.billingAddress?.state} - {selectedCustomer.billingAddress?.pincode}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Line Items Table */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Calculator className="w-4 h-4 text-indigo-600" />
                Line Items & Tax Calculations
              </h2>
              <button
                type="button"
                onClick={addItemRow}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Row</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => {
                const calc = itemCalculations[idx];
                return (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3 hover:border-slate-300 transition-all"
                  >
                    <div className="grid grid-cols-12 gap-3 items-start">
                      {/* Catalog Select or Custom Name */}
                      <div className="col-span-12 sm:col-span-5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-600 uppercase">
                            Item / Service #{idx + 1}
                          </label>
                          {itemsCatalog.length > 0 && (
                            <select
                              value={item.itemId}
                              onChange={(e) => handleItemFieldChange(idx, 'itemId', e.target.value)}
                              className="text-[11px] bg-white border border-slate-200 rounded px-1.5 py-0.5 text-indigo-600 font-medium"
                            >
                              <option value="">-- Choose from Catalog --</option>
                              {itemsCatalog.map((it) => (
                                <option key={it._id} value={it._id}>
                                  {it.name} (HSN: {it.hsnSac})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleItemFieldChange(idx, 'name', e.target.value)}
                          placeholder="Item Name or Service Title"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                        />
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemFieldChange(idx, 'description', e.target.value)}
                          placeholder="Optional specifications, model number or scope"
                          className="w-full px-3 py-1 bg-white border border-slate-200 rounded text-[11px] text-slate-600"
                        />
                      </div>

                      {/* HSN/SAC */}
                      <div className="col-span-6 sm:col-span-2">
                        <label className="text-[11px] font-bold text-slate-600 block mb-1 uppercase">
                          HSN/SAC
                        </label>
                        <input
                          type="text"
                          value={item.hsnSac}
                          onChange={(e) => handleItemFieldChange(idx, 'hsnSac', e.target.value)}
                          placeholder="e.g. 9983"
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-center"
                        />
                      </div>

                      {/* Quantity & Unit */}
                      <div className="col-span-6 sm:col-span-2">
                        <label className="text-[11px] font-bold text-slate-600 block mb-1 uppercase">
                          Qty & Unit
                        </label>
                        <div className="flex gap-1">
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            value={item.quantity}
                            onChange={(e) => handleItemFieldChange(idx, 'quantity', e.target.value)}
                            className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center"
                          />
                          <select
                            value={item.unit}
                            onChange={(e) => handleItemFieldChange(idx, 'unit', e.target.value)}
                            className="w-14 px-1 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-semibold"
                          >
                            <option value="PCS">PCS</option>
                            <option value="NOS">NOS</option>
                            <option value="HRS">HRS</option>
                            <option value="SET">SET</option>
                            <option value="BOX">BOX</option>
                            <option value="KG">KG</option>
                            <option value="MTR">MTR</option>
                          </select>
                        </div>
                      </div>

                      {/* Rate / Price */}
                      <div className="col-span-6 sm:col-span-2">
                        <label className="text-[11px] font-bold text-slate-600 block mb-1 uppercase">
                          Rate (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.price}
                          onChange={(e) => handleItemFieldChange(idx, 'price', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-right"
                        />
                      </div>

                      {/* Delete Row Action */}
                      <div className="col-span-6 sm:col-span-1 flex justify-end pt-5">
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          disabled={items.length === 1}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg disabled:opacity-30 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Subrow: Discount %, GST Rate, Line Totals */}
                    <div className="pt-2 border-t border-slate-200/80 grid grid-cols-12 gap-3 items-center text-xs">
                      <div className="col-span-4 sm:col-span-3 flex items-center gap-1.5">
                        <span className="text-slate-500 text-[11px]">Disc %:</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discountPercent}
                          onChange={(e) => handleItemFieldChange(idx, 'discountPercent', e.target.value)}
                          className="w-14 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-center text-xs"
                        />
                      </div>

                      <div className="col-span-4 sm:col-span-3 flex items-center gap-1.5">
                        <span className="text-slate-500 text-[11px]">GST Rate:</span>
                        <select
                          value={item.gstRate}
                          onChange={(e) => handleItemFieldChange(idx, 'gstRate', Number(e.target.value))}
                          className="px-2 py-0.5 bg-white border border-slate-200 rounded text-xs font-semibold text-indigo-700"
                        >
                          <option value={0}>0%</option>
                          <option value={5}>5%</option>
                          <option value={12}>12%</option>
                          <option value={18}>18%</option>
                          <option value={28}>28%</option>
                        </select>
                      </div>

                      <div className="col-span-4 sm:col-span-6 flex items-center justify-end gap-3 text-[11px]">
                        <span className="text-slate-500">
                          Taxable: <strong>{formatINR(calc?.taxableAmount)}</strong>
                        </span>
                        <span className="text-indigo-600 font-semibold">
                          Tax:{' '}
                          <strong>
                            {formatINR(isInterState ? calc?.igst : (calc?.cgst || 0) + (calc?.sgst || 0))}
                          </strong>
                        </span>
                        <span className="text-slate-900 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                          Line Total: {formatINR(calc?.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Metadata & Live Totals Summary Card */}
        <div className="space-y-6">
          {/* Card 3: Dates & Invoice Number */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3.5">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Invoice Metadata
            </h2>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Invoice Number:
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono font-bold text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Invoice Date:
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Due Date:
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Status:
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
              >
                <option value="Draft">Draft</option>
                <option value="Sent">Sent (Unpaid)</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Advance Amount Received (₹):
              </label>
              <input
                id="advance-amount-input"
                type="number"
                min="0"
                step="any"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-right"
              />
              {advanceAmountNum > 0 && advanceAmountNum > roundedGrandTotal && (
                <p className="text-rose-500 text-[11px] mt-1">Advance exceeds grand total</p>
              )}
            </div>
          </div>

          {/* Card 4: Live Totals & Tax Breakdown */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
              Tax Computation Summary
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Taxable Subtotal:</span>
                <span className="font-semibold text-white font-mono">
                  {formatINR(calculatedTaxable)}
                </span>
              </div>

              {isInterState ? (
                <div className="flex justify-between text-indigo-300 bg-slate-800/80 p-2 rounded-lg">
                  <span>Integrated GST (IGST):</span>
                  <span className="font-semibold font-mono">{formatINR(calculatedIgst)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-indigo-300 bg-slate-800/80 p-2 rounded-lg">
                    <span>Central GST (CGST):</span>
                    <span className="font-semibold font-mono">{formatINR(calculatedCgst)}</span>
                  </div>
                  <div className="flex justify-between text-indigo-300 bg-slate-800/80 p-2 rounded-lg">
                    <span>State GST (SGST):</span>
                    <span className="font-semibold font-mono">{formatINR(calculatedSgst)}</span>
                  </div>
                </>
              )}

              {roundOff !== 0 && (
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Round Off:</span>
                  <span>{formatINR(roundOff)}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-300">Grand Total:</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  {formatINR(roundedGrandTotal)}
                </span>
              </div>

              {advanceAmountNum > 0 && (
                <>
                  <div className="flex justify-between text-amber-300 text-xs bg-amber-900/30 px-2 py-1.5 rounded-lg">
                    <span>Advance Received:</span>
                    <span className="font-semibold font-mono">− {formatINR(advanceAmountNum)}</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-1 border-t border-slate-700">
                    <span className="text-sm font-bold text-slate-300">Balance Due:</span>
                    <span className={`text-xl font-black font-mono ${
                      balanceDue === 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {formatINR(balanceDue)}
                    </span>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Processing...' : isEditMode ? 'Update Invoice & Recalculate' : 'Save & Issue Invoice'}</span>
            </button>
          </div>

          {/* Notes and Terms */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Customer Notes:
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Terms & Conditions:
              </label>
              <textarea
                rows={2}
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
