import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Lock, User, AlertCircle, Loader2, ShieldCheck, KeyRound } from 'lucide-react';

const DEMO_CREDENTIALS = [
  { label: 'Admin', username: 'admin', role: 'ADMIN', color: 'border-purple-300 text-purple-800 bg-purple-50' },
  { label: 'Principal Investigator', username: 'investigator', role: 'PRINCIPAL_INVESTIGATOR', color: 'border-blue-300 text-blue-800 bg-blue-50' },
  { label: 'Study Coordinator', username: 'coordinator', role: 'STUDY_COORDINATOR', color: 'border-teal-300 text-teal-800 bg-teal-50' },
  { label: 'Trial Monitor', username: 'monitor', role: 'CLINICAL_TRIAL_MONITOR', color: 'border-amber-300 text-amber-800 bg-amber-50' },
  { label: 'Ethics Committee', username: 'ethics', role: 'ETHICS_COMMITTEE', color: 'border-indigo-300 text-indigo-800 bg-indigo-50' },
  { label: 'Pharmacovigilance', username: 'pharmacovigilance', role: 'PHARMACOVIGILANCE_OFFICER', color: 'border-rose-300 text-rose-800 bg-rose-50' },
  { label: 'Regulator', username: 'regulator', role: 'REGULATOR', color: 'border-slate-300 text-slate-800 bg-slate-100' },
];

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.detail || 'Authentication failed. Please check your credentials.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoAccount = (demoUser: string) => {
    setUsername(demoUser);
    setPassword('Password@AIIA2026!');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Ministry & AIIA Header Branding */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-ayush-700 to-ayush-950 flex items-center justify-center shadow-lg border border-ayush-600/40 mb-4">
            <Activity className="w-9 h-9 text-emerald-300" />
          </div>
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-ayush-100 text-ayush-800 mb-2 border border-ayush-200">
            <ShieldCheck className="w-3.5 h-3.5 text-ayush-700" />
            <span>Ministry of Ayush • Govt. of India</span>
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            AIIA Clinical Trials Dashboard
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            All India Institute of Ayurveda Clinical Trial Management System (CTMS)
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-200/80">
            {error && (
              <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start space-x-3 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Authentication Error:</span> {error}
                </div>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Username or Email
                </label>
                <div className="mt-1 relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. admin or dr.sharma@aiia.gov.in"
                    className="block w-full pl-9 pr-3 py-2.5 sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:border-ayush-600 bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <div className="mt-1 relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="block w-full pl-9 pr-3 py-2.5 sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:border-ayush-600 bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-ayush-800 hover:bg-ayush-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ayush-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    'Sign In to CTMS'
                  )}
                </button>
              </div>
            </form>

            {/* Quick-Select Demo Credentials Section */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">
                <KeyRound className="w-4 h-4 text-ayush-700" />
                <span>Phase 1 Demo Credentials (1-Click Fill)</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Select any role to populate credentials for evaluation:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {DEMO_CREDENTIALS.map((c) => (
                  <button
                    key={c.username}
                    type="button"
                    onClick={() => fillDemoAccount(c.username)}
                    className={`px-2.5 py-1.5 rounded-lg border text-left font-medium transition-all hover:scale-[1.02] ${c.color}`}
                  >
                    <div className="font-semibold leading-tight">{c.label}</div>
                    <div className="text-[10px] opacity-75 font-mono">@{c.username}</div>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[10px] text-slate-400 text-center font-mono">
                Default password: Password@AIIA2026!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
