import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  BarChart3,
  Settings,
  ShieldCheck,
  Receipt,
  UserCheck,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { currentRole, currentUser, permissions, logout } = useAuth();

  const getNavItems = () => {
    if (permissions.isOwner) {
      return [
        { to: '/', label: 'Overview', icon: LayoutDashboard },
        { to: '/invoices', label: 'Invoices', icon: FileText },
        { to: '/customers', label: 'Customers', icon: Users },
        { to: '/items', label: 'Items & Services', icon: Package },
        { to: '/reports', label: 'GST Reports', icon: BarChart3 },
        { to: '/settings', label: 'Company Settings', icon: Settings },
      ];
    }

    if (permissions.isBiller) {
      return [
        { to: '/invoices', label: 'Invoices & Billing', icon: FileText },
        { to: '/customers', label: 'Customers Directory', icon: Users },
        { to: '/items', label: 'Items & Services', icon: Package },
      ];
    }

    if (permissions.isCA) {
      return [
        { to: '/reports', label: 'GST Returns & Audit', icon: BarChart3 },
        { to: '/invoices', label: 'Invoices Audit Register', icon: FileText },
      ];
    }

    return [];
  };

  const navItems = getNavItems();

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (onClose) onClose();
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:h-screen lg:sticky lg:top-0 no-print select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white font-sans">
                  Ledgerly
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded">
                  GST
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Compliance Suite</p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg lg:hidden"
            title="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Pill Banner */}
        <div className="p-3.5 mx-3 my-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
          <div className="flex items-center gap-2">
            {permissions.isCA && <ShieldCheck className="w-4 h-4 text-amber-400" />}
            {permissions.isOwner && <UserCheck className="w-4 h-4 text-indigo-400" />}
            {permissions.isBiller && <Receipt className="w-4 h-4 text-emerald-400" />}
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                currentRole === 'owner'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : currentRole === 'ca'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {currentRole === 'owner' ? 'Owner' : currentRole === 'ca' ? 'CA (Audit)' : 'Biller'}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold tracking-wider uppercase text-slate-400">
            {permissions.isCA
              ? 'CA Audit Workflows'
              : permissions.isBiller
              ? 'Billing Desk'
              : 'Executive Controls'}
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 group-hover:bg-slate-700">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sign Out Footer */}
        <div className="p-3 border-t border-slate-800/80 space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-all"
          >
            <div className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              <span>Sign Out Session</span>
            </div>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
              Exit
            </span>
          </button>

          <div className="px-2 pt-1 text-[10px] text-slate-400 flex justify-between">
            <span>GSTIN: 27AAACA1234Q1ZP</span>
            <span>MH (27)</span>
          </div>
        </div>
      </aside>
    </>
  );
}
