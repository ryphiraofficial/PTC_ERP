import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Users,
  Building,
  Mail,
  Phone,
  MapPin,
  Edit2,
  Trash2,
  FilePlus,
  X,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { GST_STATES, getStateCodeFromGstin, isValidGSTIN } from '../utils/gstUtils';

export default function Customers() {
  const navigate = useNavigate();
  const { permissions } = useAuth();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [modalForm, setModalForm] = useState({
    name: '',
    companyName: '',
    gstin: '',
    pan: '',
    email: '',
    phone: '',
    customerType: 'B2B',
    street: '',
    city: '',
    state: 'Maharashtra',
    stateCode: '27',
    pincode: '',
  });
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (typeFilter !== 'All') params.append('customerType', typeFilter);
      const data = await api.getCustomers(params.toString());
      setCustomers(data);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [searchTerm, typeFilter]);

  const openAddModal = () => {
    setEditingCustomer(null);
    setModalForm({
      name: '',
      companyName: '',
      gstin: '',
      pan: '',
      email: '',
      phone: '',
      customerType: 'B2B',
      street: '',
      city: '',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '',
    });
    setModalError('');
    setShowModal(true);
  };

  const openEditModal = (c) => {
    setEditingCustomer(c);
    setModalForm({
      name: c.name || '',
      companyName: c.companyName || '',
      gstin: c.gstin || '',
      pan: c.pan || '',
      email: c.email || '',
      phone: c.phone || '',
      customerType: c.customerType || 'B2B',
      street: c.billingAddress?.street || '',
      city: c.billingAddress?.city || '',
      state: c.billingAddress?.state || 'Maharashtra',
      stateCode: c.billingAddress?.stateCode || '27',
      pincode: c.billingAddress?.pincode || '',
    });
    setModalError('');
    setShowModal(true);
  };

  const handleGstinChange = (e) => {
    const val = e.target.value.toUpperCase();
    const update = { gstin: val };

    if (val.length >= 2) {
      const derived = getStateCodeFromGstin(val);
      if (derived) {
        update.state = derived.state;
        update.stateCode = derived.code;
      }
    }
    if (val.length >= 12) {
      // PAN is characters 3 to 10
      update.pan = val.substring(2, 12);
    }

    setModalForm({ ...modalForm, ...update });
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!modalForm.name.trim()) {
      setModalError('Customer / Contact name is required');
      return;
    }

    if (modalForm.gstin && !isValidGSTIN(modalForm.gstin)) {
      setModalError('Please enter a valid 15-character Indian GSTIN');
      return;
    }

    try {
      setSaving(true);
      setModalError('');

      const payload = {
        name: modalForm.name,
        companyName: modalForm.companyName,
        gstin: modalForm.gstin,
        pan: modalForm.pan,
        email: modalForm.email,
        phone: modalForm.phone,
        customerType: modalForm.gstin ? 'B2B' : modalForm.customerType,
        billingAddress: {
          street: modalForm.street,
          city: modalForm.city,
          state: modalForm.state,
          stateCode: modalForm.stateCode,
          pincode: modalForm.pincode,
        },
      };

      if (editingCustomer) {
        const updated = await api.updateCustomer(editingCustomer._id, payload);
        setCustomers(customers.map((c) => (c._id === editingCustomer._id ? updated : c)));
      } else {
        const created = await api.createCustomer(payload);
        setCustomers([created, ...customers]);
      }

      setShowModal(false);
    } catch (err) {
      setModalError(err.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await api.deleteCustomer(id);
      setCustomers(customers.filter((c) => c._id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete customer');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customers & Clients</h1>
          <p className="text-xs text-slate-500">
            Manage B2B registered enterprises with GSTIN validation and B2C retail clients
          </p>
        </div>

        {(permissions.isOwner || permissions.isBiller) && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customer, GSTIN, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {['All', 'B2B', 'B2C'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                typeFilter === t
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t === 'All' ? 'All Clients' : `${t} Clients`}
            </button>
          ))}
        </div>
      </div>

      {/* Customers Cards / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-8 text-center text-slate-400">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-xs">Loading customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="col-span-full p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No customers found</p>
            <p className="text-xs text-slate-400">Add a customer to get started with billing</p>
            {(permissions.isOwner || permissions.isBiller) && (
              <button
                onClick={openAddModal}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Customer</span>
              </button>
            )}
          </div>
        ) : (
          customers.map((c) => (
            <div
              key={c._id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{c.name}</h3>
                    {c.companyName && (
                      <p className="text-xs text-indigo-700 font-semibold">{c.companyName}</p>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      c.gstin
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {c.gstin ? 'B2B Registered' : 'B2C Retail'}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-xs text-slate-600 font-sans">
                  {c.gstin ? (
                    <div className="flex items-center gap-1.5 font-mono text-slate-900 bg-slate-50 p-1.5 rounded border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">GSTIN:</span>
                      <strong className="text-xs text-indigo-900">{c.gstin}</strong>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic">No GSTIN (Unregistered)</div>
                  )}

                  {c.email && (
                    <div className="flex items-center gap-1.5 text-slate-500 pt-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}

                  {c.phone && (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{c.phone}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {c.billingAddress?.city || 'City'}, {c.billingAddress?.state} [
                      {c.billingAddress?.stateCode}]
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => navigate('/invoices/new')}
                  className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  <FilePlus className="w-3.5 h-3.5" />
                  <span>Bill Client</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(c)}
                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {permissions.isOwner && (
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Customer Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-4 sm:p-6 space-y-4 my-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={modalForm.name}
                    onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                    placeholder="e.g. Sunil Nair"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Business / Company Name</label>
                  <input
                    type="text"
                    value={modalForm.companyName}
                    onChange={(e) => setModalForm({ ...modalForm, companyName: e.target.value })}
                    placeholder="e.g. TechnoSphere Digital Labs"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  GSTIN (15 Digits - Auto-derives State & PAN)
                </label>
                <input
                  type="text"
                  maxLength={15}
                  value={modalForm.gstin}
                  onChange={handleGstinChange}
                  placeholder="e.g. 27AAACT9876C1Z3"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold uppercase tracking-wider text-indigo-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    value={modalForm.email}
                    onChange={(e) => setModalForm({ ...modalForm, email: e.target.value })}
                    placeholder="accounts@client.com"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={modalForm.phone}
                    onChange={(e) => setModalForm({ ...modalForm, phone: e.target.value })}
                    placeholder="+91 98200 12345"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Street Address</label>
                <input
                  type="text"
                  value={modalForm.street}
                  onChange={(e) => setModalForm({ ...modalForm, street: e.target.value })}
                  placeholder="Plot / Street / Office number"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City</label>
                  <input
                    type="text"
                    value={modalForm.city}
                    onChange={(e) => setModalForm({ ...modalForm, city: e.target.value })}
                    placeholder="Mumbai"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">State</label>
                  <select
                    value={modalForm.stateCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      const s = GST_STATES.find((st) => st.code === code);
                      setModalForm({
                        ...modalForm,
                        stateCode: code,
                        state: s ? s.name : modalForm.state,
                      });
                    }}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
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
                    value={modalForm.pincode}
                    onChange={(e) => setModalForm({ ...modalForm, pincode: e.target.value })}
                    placeholder="400001"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm"
                >
                  {saving ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
