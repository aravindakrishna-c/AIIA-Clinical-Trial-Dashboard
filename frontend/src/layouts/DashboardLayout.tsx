import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  ScrollText,
  UserCircle,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Building2,
  ChevronRight,
  Activity,
  FlaskConical,
  UserCheck,
  FileCheck2,
  Network
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export const DashboardLayout: React.FC = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isAdmin = role === 'ADMIN';
  const canViewAudit = role === 'ADMIN' || role === 'REGULATOR';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Government/Institute Header */}
      <header className="bg-ayush-950 text-white shadow-md border-b border-ayush-800 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left branding */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-ayush-200 hover:text-white hover:bg-ayush-900 focus:outline-none"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-ayush-600 to-ayush-800 flex items-center justify-center border border-ayush-500/30 shadow-inner">
                  <Activity className="w-6 h-6 text-emerald-300" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-ayush-300">Ministry of Ayush</span>
                    <span className="text-[10px] bg-ayush-900 border border-ayush-700 px-1.5 py-0.2 rounded text-ayush-200">GCP CTMS</span>
                  </div>
                  <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    AIIA Clinical Trials Dashboard
                  </h1>
                </div>
              </div>
            </div>

            {/* Right user & session status */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-medium text-slate-200">{user?.full_name}</span>
                <span className="text-[11px] text-ayush-300 font-mono">{user?.username}</span>
              </div>
              {role && <StatusBadge status={role} type="role" />}
              
              <button
                onClick={handleLogout}
                title="Log Out"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-ayush-900 hover:bg-rose-900/60 hover:text-rose-200 border border-ayush-700 rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Navigation Sidebar */}
        <aside
          className={`
            fixed md:static inset-y-0 left-0 z-20 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out md:translate-x-0 flex flex-col justify-between pt-16 md:pt-0
            ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
          `}
        >
          <div className="p-4 space-y-6">
            {/* Institute badge */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center space-x-3">
              <Building2 className="w-5 h-5 text-ayush-700 flex-shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-slate-800">All India Institute of Ayurveda</p>
                <p className="text-slate-500 text-[11px]">New Delhi, India</p>
              </div>
            </div>

            {/* Main Menu Links */}
            <div>
              <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Navigation
              </p>
              <nav className="space-y-1">
                <NavLink
                  to="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-ayush-50 text-ayush-900 font-semibold border-l-4 border-ayush-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3">
                    <LayoutDashboard className="w-4 h-4 text-ayush-600" />
                    <span>Dashboard</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </NavLink>

                <NavLink
                  to="/trials"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-ayush-50 text-ayush-900 font-semibold border-l-4 border-ayush-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3">
                    <FlaskConical className="w-4 h-4 text-ayush-600" />
                    <span>Clinical Trials</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </NavLink>

                <NavLink
                  to="/participants"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-ayush-50 text-ayush-900 font-semibold border-l-4 border-ayush-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3">
                    <UserCheck className="w-4 h-4 text-ayush-600" />
                    <span>Participants</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </NavLink>

                <NavLink
                  to="/ethics-regulatory"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-ayush-50 text-ayush-900 font-semibold border-l-4 border-ayush-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3">
                    <FileCheck2 className="w-4 h-4 text-ayush-600" />
                    <span>Ethics & CTRI</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </NavLink>

                <NavLink
                  to="/safety"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-ayush-50 text-ayush-900 font-semibold border-l-4 border-ayush-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3">
                    <Activity className="w-4 h-4 text-rose-600" />
                    <span>Safety & PV</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </NavLink>

                <NavLink
                  to="/interoperability"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-ayush-50 text-ayush-900 font-semibold border-l-4 border-ayush-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3">
                    <Network className="w-4 h-4 text-emerald-600" />
                    <span>FHIR / CDISC</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </NavLink>

                {isAdmin && (
                  <NavLink
                    to="/users"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-ayush-50 text-ayush-900 font-semibold border-l-4 border-ayush-700'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    }
                  >
                    <div className="flex items-center space-x-3">
                      <Users className="w-4 h-4 text-ayush-600" />
                      <span>Users</span>
                    </div>
                    <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-mono font-medium">Admin</span>
                  </NavLink>
                )}

                {canViewAudit && (
                  <NavLink
                    to="/audit-logs"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-ayush-50 text-ayush-900 font-semibold border-l-4 border-ayush-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3">
                    <ScrollText className="w-4 h-4 text-ayush-600" />
                    <span>Audit Log</span>
                  </div>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                </NavLink>
                )}

                <NavLink
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-ayush-50 text-ayush-900 font-semibold border-l-4 border-ayush-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3">
                    <UserCircle className="w-4 h-4 text-ayush-600" />
                    <span>My Profile</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </NavLink>
              </nav>
            </div>
          </div>

          {/* Bottom user footer bar */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/80">
            <div className="text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">User:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[120px]">{user?.username}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Role:</span>
                <span className="font-semibold text-ayush-800 text-[11px] truncate max-w-[130px]">{role}</span>
              </div>
              <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                <span>Compliance:</span>
                <span className="text-emerald-700 font-mono">GCP / 21 CFR 11</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Footer bar */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>All India Institute of Ayurveda (AIIA) — Clinical Trial Management System</span>
          <span className="text-slate-400 text-[11px]">PS SIH26046 • Phase 1 Foundation & RBAC</span>
        </div>
      </footer>
    </div>
  );
};
