import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Clock, Calendar, Key } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export const ProfilePage: React.FC = () => {
  const { user, role } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-ayush-800 to-ayush-600 flex items-center justify-center text-white text-xl font-bold border-2 border-white shadow">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{user?.full_name}</h1>
            <p className="text-xs text-slate-500">CTMS Authorized User Profile</p>
          </div>
        </div>
        {role && <StatusBadge status={role} type="role" />}
      </div>

      {/* Profile Details Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">
          Account Credentials & Designation
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Username</span>
            <div className="text-sm font-mono font-bold text-slate-800">@{user?.username}</div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Institutional Email</span>
            <div className="text-sm font-medium text-slate-800 flex items-center space-x-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{user?.email}</span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Current System Role</span>
            <div className="text-sm font-semibold text-ayush-800">{role?.replace(/_/g, ' ')}</div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Account Status</span>
            <div className="mt-1">
              <StatusBadge status={user?.is_active ?? true} type="status" />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Account Created</span>
            <div className="text-sm text-slate-700 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{user?.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'}</span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Last Session Timestamp</span>
            <div className="text-sm text-slate-700 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{user?.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Active session'}</span>
            </div>
          </div>
        </div>

        {/* Security Policy Notice */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center space-x-3 text-slate-500 text-xs">
          <Key className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>
            Passwords are encrypted using Argon2/bcrypt key derivation. Passwords and hashes are never exposed or returned to the client.
          </span>
        </div>
      </div>
    </div>
  );
};
