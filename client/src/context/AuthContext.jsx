import React, { createContext, useContext, useState } from 'react';
import { api } from '../api';

const AuthContext = createContext();

export const ROLES = {
  OWNER: {
    key: 'owner',
    title: 'Owner / Administrator',
    name: 'Aditya Sharma',
    email: 'owner@ledgerly.app',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    defaultPath: '/',
    description: 'Full business authority across all modules: Executive Financial Dashboard, Invoicing, Customers, Items, GST Reports, and Company & Bank Settings.',
    features: [
      'Full Executive Financial Dashboard & Real-Time Collections',
      'Create, Edit, and Delete Invoices',
      'Exclusive Access to Company Profile, GSTIN & Bank Setup',
      'Manage Sequential Invoice Numbering & Prefixes',
      'Audit GST Returns & Review CA Workpapers',
    ],
  },
  BILLER: {
    key: 'biller',
    title: 'Biller / Accounting Desk',
    name: 'Pooja Verma',
    email: 'biller@ledgerly.app',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    defaultPath: '/invoices',
    description: 'Operational billing desk: Create, view, and edit customer invoices, manage client profiles, catalog items, and track invoice payment settlements.',
    features: [
      'Dedicated Invoicing Desk (Create, View, Print & PDF)',
      'Invoice Edit Feature (dynamically recalculate items & GST)',
      'Client Directory (GSTIN validation & auto state lookup)',
      'Products & Services Catalog with HSN/SAC codes & tax rates',
      'Strictly restricted from Company Bank Settings & GST Returns',
    ],
  },
  CA: {
    key: 'ca',
    title: 'Chartered Accountant (CA)',
    name: 'Ramesh Mehta, FCA',
    email: 'ca@ledgerly.app',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    defaultPath: '/reports',
    description: 'Statutory GST Compliance & Audit Desk: Access GSTR-1, GSTR-3B, rate-wise tax slabs, inspect B2B counterpart GSTINs, mark CA audit stamps, and export portal JSON/CSV.',
    features: [
      'GSTR-1 Statutory Returns (Table 4 B2B, Table 7 B2C, Table 12 HSN)',
      'GSTR-3B Outward Taxable Supplies & Output Tax Liability',
      'Rate-Wise Tax Slabs Breakdown (0%, 5%, 12%, 18%, 28%)',
      'Audit & Verify Invoices with CA Compliance Notes',
      'Download Portal JSON (Offline Tool) & Export Sales CSV',
    ],
  },
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('ledgerly_token') || '');
  const [currentRole, setCurrentRole] = useState(
    localStorage.getItem('ledgerly_role') || ''
  );
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('ledgerly_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        // ignore
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(false);

  // Authenticate using email & password
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      const roleKey = res.role || 'owner';
      const roleMeta = ROLES[roleKey.toUpperCase()] || ROLES.OWNER;

      const userProfile = {
        ...roleMeta,
        _id: res._id,
        name: res.name || roleMeta.name,
        email: res.email || roleMeta.email,
        role: roleKey,
        phone: res.phone || '',
      };

      setToken(res.token);
      setCurrentRole(roleKey);
      setCurrentUser(userProfile);

      localStorage.setItem('ledgerly_token', res.token);
      localStorage.setItem('ledgerly_role', roleKey);
      localStorage.setItem('ledgerly_user', JSON.stringify(userProfile));

      return { success: true, user: userProfile, redirectPath: roleMeta.defaultPath };
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign out clears the session completely
  const logout = () => {
    setToken('');
    setCurrentRole('');
    setCurrentUser(null);
    localStorage.removeItem('ledgerly_token');
    localStorage.removeItem('ledgerly_role');
    localStorage.removeItem('ledgerly_user');
  };

  const isAuthenticated = Boolean(token && currentUser);

  // Strict Role Permissions
  const permissions = {
    isOwner: currentRole === 'owner',
    isBiller: currentRole === 'biller',
    isCA: currentRole === 'ca',

    // Access control:
    // Owner: ALL access
    canAccessDashboard: currentRole === 'owner',
    canAccessInvoices: currentRole === 'owner' || currentRole === 'biller' || currentRole === 'ca',
    canCreateInvoice: currentRole === 'owner' || currentRole === 'biller',
    canCreateInvoices: currentRole === 'owner' || currentRole === 'biller',
    canAddCustomer: currentRole === 'owner' || currentRole === 'biller',
    canAddItem: currentRole === 'owner' || currentRole === 'biller',
    canEditInvoice: currentRole === 'owner' || currentRole === 'biller', // CA cannot edit billing items
    canDeleteInvoice: currentRole === 'owner' || currentRole === 'biller',
    canDeleteInvoices: currentRole === 'owner' || currentRole === 'biller',
    canAccessCustomers: currentRole === 'owner' || currentRole === 'biller',
    canAccessItems: currentRole === 'owner' || currentRole === 'biller',
    canAccessReports: currentRole === 'owner' || currentRole === 'ca', // Biller has NO reports access
    canAccessSettings: currentRole === 'owner', // Only Owner has settings access
    canAuditInvoices: currentRole === 'ca' || currentRole === 'owner',
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated,
        currentRole,
        currentUser,
        login,
        logout,
        roles: ROLES,
        permissions,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
