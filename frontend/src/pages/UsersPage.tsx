import React, { useState, useEffect } from 'react';
import { userService, roleService } from '../services/userService';
import type { User, Role } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<number | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<boolean | undefined>(undefined);

  // Create User Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState<number>(3); // default to Study Coordinator
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersData, rolesData] = await Promise.all([
        userService.getUsers(search || undefined, selectedRole, selectedStatus),
        roleService.getRoles()
      ]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (err: any) {
      console.error('Failed to load users', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedRole, selectedStatus]);

  const handleToggleStatus = async (user: User) => {
    try {
      const updated = await userService.toggleUserStatus(user.id, !user.is_active);
      setUsers(users.map(u => u.id === user.id ? updated : u));
      setActionSuccess(`User '${user.username}' was ${updated.is_active ? 'activated' : 'deactivated'}.`);
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setIsSubmitting(true);

    try {
      const newUser = await userService.createUser({
        full_name: fullName,
        username,
        email,
        role_id: roleId,
        password
      });

      setUsers([...users, newUser]);
      setIsModalOpen(false);
      setFullName('');
      setUsername('');
      setEmail('');
      setPassword('');
      setActionSuccess(`User '${newUser.username}' created successfully with encrypted credentials.`);
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err: any) {
      setModalError(err.response?.data?.message || err.response?.data?.detail || 'Failed to create user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-purple-700" />
            <h1 className="text-xl font-bold text-slate-900">User Management</h1>
            <span className="bg-purple-100 text-purple-700 text-xs px-2.5 py-0.5 rounded-full font-semibold">
              Admin Only
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Maintain authorized CTMS personnel, enforce role assignments, and govern system access.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-ayush-800 hover:bg-ayush-900 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create New User</span>
        </button>
      </div>

      {/* Action Success Alert */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-3 text-emerald-800 text-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, username, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:border-ayush-600 bg-slate-50/50"
          />
        </div>

        {/* Role Filter & Status Filter */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select
            value={selectedRole || ''}
            onChange={(e) => setSelectedRole(e.target.value ? Number(e.target.value) : undefined)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-slate-50/50 text-slate-700 focus:ring-2 focus:ring-ayush-600"
          >
            <option value="">All Roles ({roles.length})</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus === undefined ? '' : selectedStatus ? 'true' : 'false'}
            onChange={(e) => {
              if (e.target.value === '') setSelectedStatus(undefined);
              else setSelectedStatus(e.target.value === 'true');
            }}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-slate-50/50 text-slate-700 focus:ring-2 focus:ring-ayush-600"
          >
            <option value="">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">User Details</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-ayush-600" />
                    Loading registered personnel...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{u.full_name}</div>
                      <div className="text-[11px] text-slate-500">{u.email}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">@{u.username}</td>
                    <td className="py-3 px-4">
                      {u.role && <StatusBadge status={u.role.name} type="role" />}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={u.is_active} type="status" />
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {u.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'Never'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
                          u.is_active
                            ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New CTMS User">
        {modalError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-2 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{modalError}</span>
          </div>
        )}

        <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Full Legal / Professional Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dr. Rajesh Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 bg-slate-50/50 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Username
              </label>
              <input
                type="text"
                required
                placeholder="e.g. rsharma"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 bg-slate-50/50 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Institutional Email
              </label>
              <input
                type="email"
                required
                placeholder="rsharma@aiia.gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 bg-slate-50/50 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Assigned CTMS Role
            </label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 bg-slate-50/50 text-sm text-slate-800"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name.replace(/_/g, ' ')} — {r.description?.slice(0, 45)}...
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Temporary Initial Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={8}
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 bg-slate-50/50 text-sm"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400 flex items-center space-x-1">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Passwords are cryptographically hashed using Argon2/bcrypt upon submission.</span>
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-ayush-800 hover:bg-ayush-900 text-white rounded-lg font-semibold shadow-sm transition-colors flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Hashing & Saving...</span>
                </>
              ) : (
                <span>Register User</span>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
