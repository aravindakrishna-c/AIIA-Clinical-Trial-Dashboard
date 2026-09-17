import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type {
  ClinicalTrialListItem,
  ClinicalTrialSummaryStats,
  TrialStatus
} from '../types';
import { trialService } from '../services/trialService';
import { StatusBadge } from '../components/StatusBadge';
import { StatusTransitionModal } from '../components/StatusTransitionModal';
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit2,
  RefreshCw,
  Building2,
  Users,
  Activity,
  AlertCircle,
  FileText,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export const TrialsPage: React.FC = () => {
  const { role } = useAuth();
  const navigate = useNavigate();

  const [trials, setTrials] = useState<ClinicalTrialListItem[]>([]);
  const [summary, setSummary] = useState<ClinicalTrialSummaryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('');
  const [studyTypeFilter, setStudyTypeFilter] = useState('');

  // Status modal state
  const [statusModalTrial, setStatusModalTrial] = useState<{ id: string; status: TrialStatus } | null>(null);

  const canCreateTrial = role === 'ADMIN' || role === 'PRINCIPAL_INVESTIGATOR';
  const canEditTrial = role === 'ADMIN' || role === 'PRINCIPAL_INVESTIGATOR' || role === 'STUDY_COORDINATOR';
  const canChangeStatus = role === 'ADMIN' || role === 'PRINCIPAL_INVESTIGATOR' || role === 'ETHICS_COMMITTEE';

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [trialsData, summaryData] = await Promise.all([
        trialService.getTrials({
          search: search || undefined,
          status: statusFilter || undefined,
          study_phase: phaseFilter || undefined,
          study_type: studyTypeFilter || undefined
        }),
        trialService.getSummary()
      ]);
      setTrials(trialsData);
      setSummary(summaryData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load clinical trials.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, phaseFilter, studyTypeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPhaseFilter('');
    setStudyTypeFilter('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-ayush-700 bg-ayush-50 px-2 py-0.5 rounded border border-ayush-200">
              GCP Clinical Trials Registry
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">Ministry of Ayush / AIIA</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">Clinical Trials Management</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Database-driven registry of Ayurveda research protocols, multi-center sites, and trial workflows
          </p>
        </div>

        {canCreateTrial && (
          <button
            onClick={() => navigate('/trials/new')}
            className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-white bg-ayush-700 hover:bg-ayush-800 rounded-lg shadow-sm transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Register Clinical Trial</span>
          </button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Total Trials</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900">
              {summary ? summary.total_trials : '...'}
            </span>
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Draft Protocols</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-bold text-slate-700">
              {summary ? summary.draft_trials : '...'}
            </span>
            <span className="ml-1.5 text-[11px] text-slate-400">pending IEC</span>
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-600 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Recruiting</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-bold text-blue-700">
              {summary ? summary.recruiting_trials : '...'}
            </span>
            <span className="ml-1.5 text-[11px] text-blue-600/80 font-medium">enrolling</span>
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-teal-600 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Active</span>
            <Activity className="w-4 h-4 text-teal-500" />
          </div>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-bold text-teal-700">
              {summary ? summary.active_trials : '...'}
            </span>
            <span className="ml-1.5 text-[11px] text-teal-600/80 font-medium">in-treatment</span>
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-600 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-purple-700">
              {summary ? summary.completed_trials : '...'}
            </span>
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-orange-600 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Suspended</span>
            <XCircle className="w-4 h-4 text-orange-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-orange-700">
              {summary ? summary.suspended_trials : '...'}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filtering Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Trial ID, title, disease condition, PI, or protocol number..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none placeholder-slate-400"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center space-x-1 text-slate-500 mr-2">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold uppercase tracking-wider text-[10px]">Filter By:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Ethics Review">Ethics Review</option>
            <option value="Ethics Approved">Ethics Approved</option>
            <option value="CTRI Pending">CTRI Pending</option>
            <option value="Recruiting">Recruiting</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            <option value="Completed">Completed</option>
            <option value="Terminated">Terminated</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={phaseFilter}
            onChange={(e) => setPhaseFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
          >
            <option value="">All Phases</option>
            <option value="Early Phase">Early Phase</option>
            <option value="Phase I">Phase I</option>
            <option value="Phase II">Phase II</option>
            <option value="Phase III">Phase III</option>
            <option value="Phase IV">Phase IV</option>
            <option value="Not Applicable">Not Applicable</option>
          </select>

          <select
            value={studyTypeFilter}
            onChange={(e) => setStudyTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
          >
            <option value="">All Study Types</option>
            <option value="Interventional">Interventional</option>
            <option value="Observational">Observational</option>
          </select>

          {(search || statusFilter || phaseFilter || studyTypeFilter) && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-rose-600 hover:text-rose-800 ml-auto font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Trials Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-ayush-600 mb-2" />
            <span>Loading clinical trials database records...</span>
          </div>
        ) : trials.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Clinical Trials Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No clinical trials matched your search criteria. Try modifying your filters or register a new trial.
            </p>
            {canCreateTrial && (
              <button
                onClick={() => navigate('/trials/new')}
                className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-ayush-700 hover:bg-ayush-800 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register First Trial</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Trial ID & Protocol</th>
                  <th className="py-3 px-4">Title & Disease / Condition</th>
                  <th className="py-3 px-4">Principal Investigator</th>
                  <th className="py-3 px-4">Phase & Design</th>
                  <th className="py-3 px-4">Sites</th>
                  <th className="py-3 px-4">Targets</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Timeline</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trials.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-900">{t.trial_id}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {t.protocol_number} (v{t.protocol_version})
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <button
                        onClick={() => navigate(`/trials/${t.trial_id}`)}
                        className="text-slate-900 font-semibold hover:text-ayush-700 text-left line-clamp-2 transition-colors"
                      >
                        {t.trial_title}
                      </button>
                      <span className="inline-block mt-1 text-[11px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {t.disease_condition}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800">
                        {t.principal_investigator?.full_name || 'Assigned PI'}
                      </div>
                      <div className="text-[11px] text-slate-400">{t.sponsor}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-700">{t.study_phase}</div>
                      <div className="text-[11px] text-slate-400">{t.study_type}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-mono text-[11px]">
                        <Building2 className="w-3 h-3 text-slate-500" />
                        <span>{t.site_count} sites</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-mono font-semibold text-slate-800">
                      {t.target_participants}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={t.status} type="trialStatus" />
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-slate-500 font-mono">
                      <div>Start: {t.start_date}</div>
                      <div>End: {t.expected_completion_date}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => navigate(`/trials/${t.trial_id}`)}
                          title="View Complete Trial Dossier"
                          className="p-1.5 text-slate-500 hover:text-ayush-700 hover:bg-ayush-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {canEditTrial && (
                          <button
                            onClick={() => navigate(`/trials/${t.trial_id}/edit`)}
                            title="Edit Trial Attributes"
                            className="p-1.5 text-slate-500 hover:text-ayush-700 hover:bg-ayush-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {canChangeStatus && (
                          <button
                            onClick={() => setStatusModalTrial({ id: t.trial_id, status: t.status })}
                            title="Lifecycle Status Workflow Transition"
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status Transition Modal */}
      {statusModalTrial && (
        <StatusTransitionModal
          isOpen={Boolean(statusModalTrial)}
          onClose={() => setStatusModalTrial(null)}
          trialId={statusModalTrial.id}
          currentStatus={statusModalTrial.status}
          onSuccess={loadData}
        />
      )}
    </div>
  );
};
