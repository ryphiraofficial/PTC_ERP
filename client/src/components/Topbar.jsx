import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  ShieldCheck,
  ChevronDown,
  UserCheck,
  Receipt,
  FileCheck,
  LogOut,
  Menu,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Topbar({ onSearch, onMenuToggle }) {
  const navigate = useNavigate();
  const { currentRole, currentUser, logout, permissions } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm no-print">
      {/* Mobile Hamburger & Search Input */}
      <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-lg">
        {/* Hamburger Menu on Mobile */}
        <button
          onClick={onMenuToggle}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg lg:hidden"
          title="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search invoices, GSTIN, clients..."
            onChange={(e) => onSearch && onSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Right Actions: Role Badge & Profile */}
      <div className="flex items-center gap-2 sm:gap-3 pl-2">
        {/* Create Invoice Button (Only Owner & Biller) */}
        {permissions.canCreateInvoice && (
          <button
            onClick={() => navigate('/invoices/new')}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Invoice</span>
          </button>
        )}

        {/* CA Quick Action to GST Returns */}
        {permissions.isCA && (
          <button
            onClick={() => navigate('/reports')}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs sm:text-sm font-bold rounded-lg shadow-sm transition-all whitespace-nowrap"
          >
            <FileCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Audit Returns</span>
          </button>
        )}

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 sm:pr-2.5 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all text-left"
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white ${
                currentRole === 'owner'
                  ? 'bg-indigo-600'
                  : currentRole === 'ca'
                  ? 'bg-amber-600 text-slate-950 font-black'
                  : 'bg-emerald-600'
              }`}
            >
              {currentRole === 'owner' ? 'O' : currentRole === 'ca' ? 'CA' : 'B'}
            </div>
            <div className="hidden md:block leading-tight">
              <div className="text-xs font-semibold text-slate-900 capitalize">
                {currentRole === 'owner' ? 'Owner' : currentRole === 'ca' ? 'CA (Audit)' : 'Biller'}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                Active Session
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-4 py-2 border-b border-slate-100">
                <div
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    currentRole === 'owner'
                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      : currentRole === 'ca'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {currentRole === 'owner' ? 'Owner' : currentRole === 'ca' ? 'CA (Audit)' : 'Biller'}
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Active workspace session</p>
              </div>

              {/* Sign Out Action */}
              <div className="p-1.5">
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
