// Support Vercel production hosting via VITE_API_URL or fallback to local /api proxy
const getApiBase = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    const cleanUrl = envUrl.replace(/\/+$/, '');
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  }
  return '/api';
};

const API_BASE = getApiBase();

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('ledgerly_token');
  const activeRole = localStorage.getItem('ledgerly_role') || 'owner';

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'x-demo-role': activeRole,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
};

export const api = {
  // Auth & Roles
  getMe: () => apiFetch('/auth/me'),
  login: (credentials) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  switchRole: (role) => apiFetch(`/auth/switch-role/${role}`, { method: 'POST' }),

  // Company
  getCompany: () => apiFetch('/company'),
  updateCompany: (data) => apiFetch('/company', { method: 'PUT', body: JSON.stringify(data) }),

  // Customers
  getCustomers: (params = '') => apiFetch(`/customers${params ? `?${params}` : ''}`),
  getCustomer: (id) => apiFetch(`/customers/${id}`),
  createCustomer: (data) => apiFetch('/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id, data) => apiFetch(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCustomer: (id) => apiFetch(`/customers/${id}`, { method: 'DELETE' }),

  // Items
  getItems: (params = '') => apiFetch(`/items${params ? `?${params}` : ''}`),
  getItem: (id) => apiFetch(`/items/${id}`),
  createItem: (data) => apiFetch('/items', { method: 'POST', body: JSON.stringify(data) }),
  updateItem: (id, data) => apiFetch(`/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteItem: (id) => apiFetch(`/items/${id}`, { method: 'DELETE' }),

  // Invoices
  getInvoices: (params = '') => apiFetch(`/invoices${params ? `?${params}` : ''}`),
  getInvoice: (id) => apiFetch(`/invoices/${id}`),
  createInvoice: (data) => apiFetch('/invoices', { method: 'POST', body: JSON.stringify(data) }),
  // FULL INVOICE EDIT
  updateInvoice: (id, data) => apiFetch(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  // CA AUDIT
  auditInvoice: (id, data) => apiFetch(`/invoices/${id}/audit`, { method: 'POST', body: JSON.stringify(data) }),
  deleteInvoice: (id) => apiFetch(`/invoices/${id}`, { method: 'DELETE' }),

  // Reports
  getDashboardStats: () => apiFetch('/reports/dashboard'),
  getGstr1: (params = '') => apiFetch(`/reports/gstr-1${params ? `?${params}` : ''}`),
  getGstr3b: (params = '') => apiFetch(`/reports/gstr-3b${params ? `?${params}` : ''}`),
};
