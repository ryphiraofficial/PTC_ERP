import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Package,
  Boxes,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  Tag,
  Percent,
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/gstUtils';

export default function Items() {
  const { permissions } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalForm, setModalForm] = useState({
    name: '',
    type: 'goods',
    hsnSac: '8471',
    sku: '',
    unit: 'PCS',
    sellingPrice: '',
    purchasePrice: '',
    gstRate: 18,
    stock: 100,
    description: '',
  });
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (typeFilter !== 'All') params.append('type', typeFilter);
      const data = await api.getItems(params.toString());
      setItems(data);
    } catch (err) {
      console.error('Error fetching items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [searchTerm, typeFilter]);

  const openAddModal = () => {
    setEditingItem(null);
    setModalForm({
      name: '',
      type: 'goods',
      hsnSac: '8471',
      sku: '',
      unit: 'PCS',
      sellingPrice: '',
      purchasePrice: '',
      gstRate: 18,
      stock: 50,
      description: '',
    });
    setModalError('');
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setModalForm({
      name: item.name,
      type: item.type || 'goods',
      hsnSac: item.hsnSac,
      sku: item.sku || '',
      unit: item.unit || 'PCS',
      sellingPrice: item.sellingPrice,
      purchasePrice: item.purchasePrice || 0,
      gstRate: item.gstRate || 18,
      stock: item.stock || 0,
      description: item.description || '',
    });
    setModalError('');
    setShowModal(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!modalForm.name.trim()) {
      setModalError('Item / Service name is required');
      return;
    }
    if (!modalForm.hsnSac.trim()) {
      setModalError('HSN / SAC code is mandatory for GST compliance');
      return;
    }
    if (modalForm.sellingPrice === '' || Number(modalForm.sellingPrice) < 0) {
      setModalError('Please enter a valid selling price');
      return;
    }

    try {
      setSaving(true);
      setModalError('');

      const payload = {
        name: modalForm.name,
        type: modalForm.type,
        hsnSac: modalForm.hsnSac,
        sku: modalForm.sku,
        unit: modalForm.unit,
        sellingPrice: Number(modalForm.sellingPrice),
        purchasePrice: Number(modalForm.purchasePrice) || 0,
        gstRate: Number(modalForm.gstRate),
        stock: Number(modalForm.stock) || 0,
        description: modalForm.description,
      };

      if (editingItem) {
        const updated = await api.updateItem(editingItem._id, payload);
        setItems(items.map((it) => (it._id === editingItem._id ? updated : it)));
      } else {
        const created = await api.createItem(payload);
        setItems([created, ...items]);
      }

      setShowModal(false);
    } catch (err) {
      setModalError(err.message || 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item from catalog?')) return;
    try {
      await api.deleteItem(id);
      setItems(items.filter((it) => it._id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete item');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Items & Services Catalog</h1>
          <p className="text-xs text-slate-500">
            Maintain products, service rates, HSN/SAC codes, and GST tax brackets
          </p>
        </div>

        {(permissions.isOwner || permissions.isBiller) && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item / Service</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, HSN/SAC, SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {['All', 'goods', 'service'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                typeFilter === t
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t === 'All' ? 'All Catalog' : `${t}s Only`}
            </button>
          ))}
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[620px]">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider">
                <th className="p-3.5">Item Name & SKU</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5 text-center">HSN/SAC</th>
                <th className="p-3.5 text-center">Unit</th>
                <th className="p-3.5 text-right">Selling Price</th>
                <th className="p-3.5 text-center">GST Rate</th>
                <th className="p-3.5 text-center">Stock</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    <p className="mt-2 text-xs">Loading catalog items...</p>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No items found</p>
                    <p className="text-xs text-slate-400">Add an item to speed up your billing</p>
                  </td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr key={it._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{it.name}</div>
                      {it.sku && <div className="text-[10px] text-slate-400 font-mono">SKU: {it.sku}</div>}
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          it.type === 'service'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {it.type}
                      </span>
                    </td>

                    <td className="p-3.5 text-center font-mono font-semibold text-slate-700">
                      {it.hsnSac}
                    </td>

                    <td className="p-3.5 text-center text-slate-600 font-medium">{it.unit}</td>

                    <td className="p-3.5 text-right font-bold font-mono text-slate-950">
                      {formatINR(it.sellingPrice)}
                    </td>

                    <td className="p-3.5 text-center">
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                        {it.gstRate}%
                      </span>
                    </td>

                    <td className="p-3.5 text-center font-medium text-slate-700">
                      {it.type === 'goods' ? it.stock : 'N/A'}
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(it)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {permissions.isOwner && (
                          <button
                            onClick={() => handleDelete(it._id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Item Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 my-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingItem ? 'Edit Item / Service' : 'Add New Item / Service'}
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

            <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Item / Service Name *</label>
                <input
                  type="text"
                  required
                  value={modalForm.name}
                  onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                  placeholder="e.g. Dell PowerEdge Server or Cloud Setup Service"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Classification Type</label>
                  <select
                    value={modalForm.type}
                    onChange={(e) => setModalForm({ ...modalForm, type: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  >
                    <option value="goods">Goods (Physical Product)</option>
                    <option value="service">Service (Consulting / SaaS)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">HSN / SAC Code *</label>
                  <input
                    type="text"
                    required
                    value={modalForm.hsnSac}
                    onChange={(e) => setModalForm({ ...modalForm, hsnSac: e.target.value })}
                    placeholder="e.g. 8471 or 9983"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={modalForm.sellingPrice}
                    onChange={(e) => setModalForm({ ...modalForm, sellingPrice: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-right"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">GST Tax Bracket *</label>
                  <select
                    value={modalForm.gstRate}
                    onChange={(e) => setModalForm({ ...modalForm, gstRate: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-indigo-700"
                  >
                    <option value={0}>0% (Nil / Exempt)</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18% (Standard)</option>
                    <option value={28}>28%</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit of Measure</label>
                  <select
                    value={modalForm.unit}
                    onChange={(e) => setModalForm({ ...modalForm, unit: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
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

              {modalForm.type === 'goods' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">SKU / Item Code</label>
                    <input
                      type="text"
                      value={modalForm.sku}
                      onChange={(e) => setModalForm({ ...modalForm, sku: e.target.value })}
                      placeholder="e.g. HW-SRV-01"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Opening Stock Qty</label>
                    <input
                      type="number"
                      value={modalForm.stock}
                      onChange={(e) => setModalForm({ ...modalForm, stock: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description / Spec</label>
                <textarea
                  rows={2}
                  value={modalForm.description}
                  onChange={(e) => setModalForm({ ...modalForm, description: e.target.value })}
                  placeholder="Optional technical specification or service terms"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
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
                  {saving ? 'Saving...' : editingItem ? 'Update Catalog' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
