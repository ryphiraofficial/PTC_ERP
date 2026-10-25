import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, currentRole, currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific roles required, check currentRole
  if (allowedRoles && !allowedRoles.includes(currentRole)) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-2xl p-8 border border-slate-200 shadow-xl text-center space-y-4">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Restricted Access</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          The requested page is restricted to <strong>{allowedRoles.join(' / ').toUpperCase()}</strong>.
          You are currently signed in as <strong>{currentUser?.name}</strong> with role{' '}
          <span className="font-bold uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
            {currentRole}
          </span>
          .
        </p>

        <div className="pt-4 flex items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back</span>
          </button>
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Switch Account / Sign In</span>
          </button>
        </div>
      </div>
    );
  }

  return children;
}
