import React, { useState, useEffect } from 'react';
import {
  Building,
  CreditCard,
  FileText,
  Shield,
  Save,
  CheckCircle,
  AlertCircle,
  Users,
  QrCode,
  Info,
} from 'lucide-react';
import { api } from '../api';
import { useAuth, ROLES } from '../context/AuthContext';
import { GST_STATES } from '../utils/gstUtils';

export default function Settings() {
  const { currentRole, currentUser, permissions } = useAuth();

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [form, setForm] = useState({
    businessName: '',
    tradeName: '',
    gstin: '',
    pan: '',
    email: '',
    phone: '',
    website: '',
    street: '',
    city: '',
    state: 'Maharashtra',
    stateCode: '27',
    pincode: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
    ifscCode: '',
    branch: '',
    upiId: '',
    prefix: 'INV-2024-',
    nextNumber: 1001,
    termsAndConditions: '',
    authorizedSignatory: '',
  });

  useEffect(() => {
    async function loadCompany() {
      try {
        setLoading(true);
        const data = await api.getCompany();
        setCompany(data);
        setForm({
          businessName: data.businessName || '',
          tradeName: data.tradeName || '',
          gstin: data.gstin || '',
          pan: data.pan || '',
          email: data.email || '',
          phone: data.phone || '',
          website: data.website || '',
          street: data.address?.street || '',
          city: data.address?.city || '',
          state: data.address?.state || 'Maharashtra',
          stateCode: data.address?.stateCode || '27',
          pincode: data.address?.pincode || '',
          bankName: data.bankDetails?.bankName || '',
          accountName: data.bankDetails?.accountName || '',
          accountNumber: data.bankDetails?.accountNumber || '',
          ifscCode: data.bankDetails?.ifscCode || '',
          branch: data.bankDetails?.branch || '',
          upiId: data.bankDetails?.upiId || '',
          prefix: data.invoiceSettings?.prefix || 'INV-2024-',
          nextNumber: data.invoiceSettings?.nextNumber || 1001,
          termsAndConditions: data.invoiceSettings?.termsAndConditions || '',
          authorizedSignatory: data.invoiceSettings?.authorizedSignatory || '',
        });
      } catch (err) {
        console.error('Failed to load company details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCompany();
  }, []);

  const handleStateChange = (code) => {
    const s = GST_STATES.find((st) => st.code === code);
    setForm({
      ...form,
      stateCode: code,
      state: s ? s.name : form.state,
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!permissions.isOwner) {
      setMessage({
        text: 'Only the Owner has permission to update company & banking configuration.',
        type: 'error',
      });
      return;
    }

    try {
      setSaving(true);
      setMessage({ text: '', type: '' });

      const payload = {
        businessName: form.businessName,
        tradeName: form.tradeName,
        gstin: form.gstin,
        pan: form.pan,
        email: form.email,
        phone: form.phone,
        website: form.website,
        address: {
          street: form.street,
          city: form.city,
          state: form.state,
          stateCode: form.stateCode,
          pincode: form.pincode,
        },
        bankDetails: {
          bankName: form.bankName,
          accountName: form.accountName,
          accountNumber: form.accountNumber,
          ifscCode: form.ifscCode,
          branch: form.branch,
          upiId: form.upiId,
        },
        invoiceSettings: {
          prefix: form.prefix,
          nextNumber: Number(form.nextNumber),
          termsAndConditions: form.termsAndConditions,
          authorizedSignatory: form.authorizedSignatory,
        },
      };

      const updated = await api.updateCompany(payload);
      setCompany(updated);
      setMessage({ text: 'Company profile and GST details updated successfully!', type: 'success' });
    } catch (err) {
      setMessage({ text: err.message || 'Failed to update company settings', type: 'error' });
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
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Company Settings</h1>
          <p className="text-xs text-slate-500">
            Configure business identity, GST credentials, banking details, and invoice template defaults
          </p>
        </div>

        {permissions.isOwner && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-sm hover:shadow transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        )}
      </div>

      {message.text && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {!permissions.isOwner && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-center gap-2.5">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            You are currently viewing in <strong>{currentRole.toUpperCase()}</strong> role. Only the{' '}
            <strong>Owner</strong> role has permission to modify bank credentials and GST settings.
            Switch to Owner role using the top bar to edit.
          </span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Section 1: Business Identity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <Building className="w-4 h-4 text-indigo-600" />
            Business Identification & GSTIN
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Legal Business Name *</label>
              <input
                type="text"
                disabled={!permissions.isOwner}
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold disabled:opacity-75"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Trade Name (Brand Name)</label>
              <input
                type="text"
                disabled={!permissions.isOwner}
                value={form.tradeName}
                onChange={(e) => setForm({ ...form, tradeName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg disabled:opacity-75"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">GSTIN Number *</label>
              <input
                type="text"
                disabled={!permissions.isOwner}
                value={form.gstin}
                onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-indigo-900 disabled:opacity-75"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Permanent Account Number (PAN)</label>
              <input
                type="text"
                disabled={!permissions.isOwner}
                value={form.pan}
                onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold disabled:opacity-75"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Business Email</label>
              <input
                type="email"
                disabled={!permissions.isOwner}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg disabled:opacity-75"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Business Phone</label>
              <input
                type="text"
                disabled={!permissions.isOwner}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg disabled:opacity-75"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Website URL</label>
              <input
                type="text"
                disabled={!permissions.isOwner}
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg disabled:opacity-75"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Registered Office Address</label>
            <input
              type="text"
              disabled={!permissions.isOwner}
              value={form.street}
              onChange={(e) => setForm({ ...form, street: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg disabled:opacity-75"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">City</label>
              <input
                type="text"
                disabled={!permissions.isOwner}
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg disabled:opacity-75"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">State / UT (Home State)</label>
              <select
                disabled={!permissions.isOwner}
                value={form.stateCode}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold disabled:opacity-75"
              >
                {GST_STATES.map((st) => (
                  <option key={st.code} value={st.code}>
                    [{st.code}] {st.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Pincode</label>
              <input
                type="text"
                disabled={!permissions.isOwner}
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg disabled:opacity-75"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Bank & Remittance Details */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <CreditCard className="w-4 h-4 text-indigo-600" />
            Bank Account & UPI Payment Gateway
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Bank Name</label>
              <input
                type="text"
                disabled={!permissions.isOwner}
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg disabled:opacity-75"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Account Beneficiary Name</label>
              <input
                type="text"
                disabled={!permissions.isOwner}
                value={form.accountName}
                onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg disabled:opacity-75"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Account Number</label>
              <input
                type="text"
                disabled={!permissions.isOwner}
                value={form.accountNumber}
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold disabled:opacity-75"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">IFSC Code</label>
              <input
                type="text"
                disabled={!permissions.isOwner}
                value={form.ifscCode}
                onChange={(e) => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-indigo-900 disabled:opacity-75"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">UPI ID (For dynamic QR code)</label>
              <input
                type="text"
                disabled={!permissions.isOwner}
                value={form.upiId}
                onChange={(e) => setForm({ ...form, upiId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono disabled:opacity-75"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Invoice Preferences */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            Invoice Prefixes & Default Terms
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Invoice Prefix</label>
              <input
                type="text"
                disabled={!permissions.isOwner}
                value={form.prefix}
                onChange={(e) => setForm({ ...form, prefix: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono disabled:opacity-75"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Next Sequence Number</label>
              <input
                type="number"
                disabled={!permissions.isOwner}
                value={form.nextNumber}
                onChange={(e) => setForm({ ...form, nextNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono disabled:opacity-75"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Authorized Signatory Name</label>
            <input
              type="text"
              disabled={!permissions.isOwner}
              value={form.authorizedSignatory}
              onChange={(e) => setForm({ ...form, authorizedSignatory: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg disabled:opacity-75"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Standard Terms & Conditions</label>
            <textarea
              rows={3}
              disabled={!permissions.isOwner}
              value={form.termsAndConditions}
              onChange={(e) => setForm({ ...form, termsAndConditions: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg disabled:opacity-75"
            />
          </div>
        </div>

        {/* Section 4: Three Users Matrix */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <Users className="w-4 h-4 text-indigo-600" />
            Configured User Roles & Access Rights
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.values(ROLES).map((r) => (
              <div
                key={r.key}
                className={`p-4 rounded-xl border ${
                  currentRole === r.key
                    ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 text-sm">{r.title}</span>
                  {currentRole === r.key && (
                    <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full uppercase">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-slate-600 font-semibold">{r.name}</p>
                <p className="text-slate-400 font-mono text-[11px]">{r.email}</p>
                <p className="text-slate-500 text-[11px] mt-2 pt-2 border-t border-slate-200/60 leading-relaxed">
                  {r.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
