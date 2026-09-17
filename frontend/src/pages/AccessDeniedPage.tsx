import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Home } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export const AccessDeniedPage: React.FC = () => {
  const { role } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 bg-rose-100 border border-rose-200 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
        <ShieldAlert className="w-9 h-9 text-rose-600" />
      </div>

      <span className="px-3 py-1 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold uppercase tracking-wider rounded-full mb-3">
        403 Forbidden • Access Denied
      </span>

      <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
        Restricted Government CTMS Resource
      </h1>

      <p className="mt-2 text-sm text-slate-600 max-w-md">
        Your current role ({role && <StatusBadge status={role} type="role" />}) is not authorized to access this module or administrative endpoint.
      </p>

      <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 max-w-md text-left space-y-1">
        <p className="font-semibold text-slate-700">Role-Based Security Policy:</p>
        <p>• Only <strong className="text-purple-700">ADMIN</strong> personnel may access user administration.</p>
        <p>• Only <strong className="text-purple-700">ADMIN</strong> and <strong className="text-slate-800">REGULATOR</strong> personnel may access the audit log trail.</p>
      </div>

      <div className="mt-6 flex items-center space-x-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-ayush-800 hover:bg-ayush-900 text-white rounded-lg text-xs font-semibold shadow transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </button>
      </div>
    </div>
  );
};

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-4xl font-extrabold text-slate-800">404</h1>
      <p className="text-sm text-slate-600 mt-2">The requested CTMS page was not found.</p>
      <button
        onClick={() => navigate('/dashboard')}
        className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900 transition-colors"
      >
        Return to Dashboard
      </button>
    </div>
  );
};
