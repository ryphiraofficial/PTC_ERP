import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import InvoiceForm from './pages/InvoiceForm';
import Customers from './pages/Customers';
import Items from './pages/Items';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

// Dynamic root redirect based on strictly authenticated role
function RoleRootRedirect() {
  const { currentRole } = useAuth();
  if (currentRole === 'biller') {
    return <Navigate to="/invoices" replace />;
  }
  if (currentRole === 'ca') {
    return <Navigate to="/reports" replace />;
  }
  return <Dashboard />;
}

function AppLayout() {
  const [globalSearch, setGlobalSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Main Navigation Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Right Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onSearch={(val) => setGlobalSearch(val)} onMenuToggle={() => setSidebarOpen(true)} />

        <main className="flex-1 p-3.5 sm:p-6 md:p-8 max-w-7xl w-full mx-auto min-w-0">
          <Routes>
            {/* Root Route: Owner -> Dashboard, Biller -> Invoices, CA -> Reports */}
            <Route
              path="/"
              element={
                <ProtectedRoute allowedRoles={['owner', 'biller', 'ca']}>
                  <RoleRootRedirect />
                </ProtectedRoute>
              }
            />

            {/* Invoices List: Owner, Biller, CA (Audit view) */}
            <Route
              path="/invoices"
              element={
                <ProtectedRoute allowedRoles={['owner', 'biller', 'ca']}>
                  <Invoices />
                </ProtectedRoute>
              }
            />

            {/* Create New Invoice: Owner & Biller ONLY (CA cannot create invoices) */}
            <Route
              path="/invoices/new"
              element={
                <ProtectedRoute allowedRoles={['owner', 'biller']}>
                  <InvoiceForm />
                </ProtectedRoute>
              }
            />

            {/* INVOICE EDIT FEATURE: Owner & Biller ONLY (CA cannot edit billing data) */}
            <Route
              path="/invoices/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['owner', 'biller']}>
                  <InvoiceForm />
                </ProtectedRoute>
              }
            />

            {/* Customers Directory: Owner & Biller ONLY (CA blocked) */}
            <Route
              path="/customers"
              element={
                <ProtectedRoute allowedRoles={['owner', 'biller']}>
                  <Customers />
                </ProtectedRoute>
              }
            />

            {/* Items & Services Catalog: Owner & Biller ONLY (CA blocked) */}
            <Route
              path="/items"
              element={
                <ProtectedRoute allowedRoles={['owner', 'biller']}>
                  <Items />
                </ProtectedRoute>
              }
            />

            {/* GST Reports & Statutory Filing: CA & Owner ONLY (Biller blocked) */}
            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={['owner', 'ca']}>
                  <Reports />
                </ProtectedRoute>
              }
            />

            {/* Company Settings & Bank Credentials: Owner ONLY (Biller & CA blocked) */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <Settings />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Authenticated App Routes */}
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
