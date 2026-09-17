import React, { useState, useEffect } from 'react';
import { auditService } from '../services/userService';
import type { AuditLog } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  ScrollText,
  Search,
  Filter,
  Lock,
  Loader2,
  RefreshCw
} from 'lucide-react';

const COMMON_ACTIONS = [
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'LOGOUT',
  'USER_CREATED',
  'USER_UPDATED',
  'USER_ACTIVATED',
  'USER_DEACTIVATED',
  'ROLE_CHANGED'
];

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('');

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await auditService.getAuditLogs(
        selectedAction || undefined,
        undefined,
        search || undefined
      );
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch audit records', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [selectedAction, search]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ScrollText className="w-6 h-6 text-blue-700" />
            <h1 className="text-xl font-bold text-slate-900">Compliance Audit Trail</h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200">
              GCP / 21 CFR Part 11
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Read-only chronological record of security, authentication, and administrative activities.
          </p>
        </div>

        <button
          onClick={loadLogs}
          disabled={isLoading}
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Immutability Notice Banner */}
      <div className="p-4 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 flex items-start space-x-3 text-xs shadow-inner">
        <Lock className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-white">Immutable Electronic Ledger Policy</p>
          <p className="text-slate-300 leading-relaxed">
            In compliance with clinical trial Good Clinical Practice (GCP) and US FDA 21 CFR Part 11 requirements, all log records are cryptographically timestamped and write-only. Modification, tampering, or deletion of audit records is strictly prevented at database and API levels.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search action, description, user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 bg-slate-50/50"
          />
        </div>

        {/* Action Filter */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-slate-50/50 text-slate-700 focus:ring-2 focus:ring-ayush-600"
          >
            <option value="">All Event Actions ({COMMON_ACTIONS.length})</option>
            {COMMON_ACTIONS.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Fetching verified electronic audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No audit records matched your filter criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-600">
                      {new Date(log.timestamp).toISOString().replace('T', ' ').substring(0, 19)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={log.action} type="action" />
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[11px]">
                        {log.entity_type} {log.entity_id ? `(#${log.entity_id})` : ''}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {log.user ? (
                        <div>
                          <div className="font-semibold text-slate-900">{log.user.full_name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">@{log.user.username}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic font-mono text-[11px]">System / Unauth</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-md">
                      <div className="font-medium leading-relaxed">{log.description}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
