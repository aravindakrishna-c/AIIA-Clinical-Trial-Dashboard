import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { safetyService } from '../services/safetyService';
import type { SafetyFilterParams } from '../services/safetyService';
import { trialService } from '../services/trialService';
import { participantService } from '../services/participantService';
import type { AdverseEvent, SafetySummaryStats, ClinicalTrialListItem, ParticipantListItem } from '../types';
import { SafetyReportModal } from '../components/modals/SafetyReportModal';
import {
  Activity,
  Search,
  Plus,
  RefreshCw,
  User,
  ArrowRight
} from 'lucide-react';

export const SafetyPage: React.FC = () => {
  const { role } = useAuth();

  // Data states
  const [events, setEvents] = useState<AdverseEvent[]>([]);
  const [stats, setStats] = useState<SafetySummaryStats | null>(null);
  const [trials, setTrials] = useState<ClinicalTrialListItem[]>([]);
  const [participants, setParticipants] = useState<ParticipantListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [filterTrialId, setFilterTrialId] = useState<number | undefined>(undefined);
  const [filterSeverity, setFilterSeverity] = useState<string>('');
  const [filterSeriousness, setFilterSeriousness] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [modalTrialId, setModalTrialId] = useState<number>(0);
  const [modalSiteId, setModalSiteId] = useState<number>(0);
  const [modalParticipantId, setModalParticipantId] = useState<number>(0);
  const [isSelectingParticipant, setIsSelectingParticipant] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const params: SafetyFilterParams = {};
      if (filterTrialId) params.trial_id = filterTrialId;
      if (filterSeverity) params.severity = filterSeverity;
      if (filterSeriousness === 'true') params.is_serious = true;
      if (filterSeriousness === 'false') params.is_serious = false;
      if (filterStatus) params.status = filterStatus;

      const [eventsList, summaryStats, trialsList, partsList] = await Promise.all([
        safetyService.listEvents(params),
        safetyService.getSummary(filterTrialId),
        trialService.getTrials({ limit: 100 }),
        participantService.listParticipants({ limit: 200 })
      ]);

      setEvents(eventsList);
      setStats(summaryStats);
      setTrials(trialsList);
      setParticipants(partsList);

      if (trialsList.length > 0 && modalTrialId === 0) {
        setModalTrialId(trialsList[0].id);
      }
    } catch (err) {
      console.error('Failed to load safety data', err);
    } finally {
      setIsLoading(false);
    }
  }, [filterTrialId, filterSeverity, filterSeriousness, filterStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open modal handler
  const handleOpenReportModal = () => {
    if (participants.length === 0) {
      alert('Please register at least one participant before logging adverse events.');
      return;
    }
    const defaultPart = participants[0];
    setModalParticipantId(defaultPart.id);
    setModalTrialId(defaultPart.trial_id);
    setModalSiteId(defaultPart.site_id);
    setIsSelectingParticipant(true);
  };

  const handleProceedToReport = () => {
    setIsSelectingParticipant(false);
    setIsReportModalOpen(true);
  };

  const handleReportSuccess = async (payload: any) => {
    await safetyService.reportEvent(payload);
    setIsReportModalOpen(false);
    await loadData();
  };

  const filteredEvents = events.filter((ae) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      ae.ae_id.toLowerCase().includes(q) ||
      ae.event_term.toLowerCase().includes(q) ||
      (ae.participant_id_str && ae.participant_id_str.toLowerCase().includes(q)) ||
      (ae.trial_id_str && ae.trial_id_str.toLowerCase().includes(q))
    );
  });

  const canReport = role === 'ADMIN' || role === 'PRINCIPAL_INVESTIGATOR' || role === 'STUDY_COORDINATOR';

  if (isLoading && events.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <span>Safety Oversight</span>
            <span>/</span>
            <span className="font-semibold text-slate-800">Pharmacovigilance & Safety Registry</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-rose-600" />
            Adverse Events (AE) & Pharmacovigilance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            GCP-aligned surveillance, MedDRA-ready coding terminology, Serious Adverse Events (SAE) reporting, and WHO-UMC causality assessments.
          </p>
        </div>

        {/* Global actions */}
        <div className="flex items-center space-x-2">
          {canReport && (
            <button
              onClick={handleOpenReportModal}
              className="inline-flex items-center px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Report Safety Event (AE)
            </button>
          )}
          <button
            onClick={loadData}
            title="Refresh"
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total AEs</span>
          <span className="text-xl font-bold text-slate-900 mt-1 block">{stats?.total_ae ?? '...'}</span>
          <span className="text-[10px] text-slate-400">All severity levels</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-rose-200 bg-rose-50/20 shadow-sm">
          <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider block">Total SAEs</span>
          <span className="text-xl font-bold text-rose-700 mt-1 block">{stats?.total_sae ?? '...'}</span>
          <span className="text-[10px] text-rose-600 font-medium">Critical attention</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-purple-200 bg-purple-50/20 shadow-sm">
          <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider block">Total ADRs</span>
          <span className="text-xl font-bold text-purple-700 mt-1 block">{stats?.total_adr ?? '...'}</span>
          <span className="text-[10px] text-purple-600">Intervention linked</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-amber-200 bg-amber-50/20 shadow-sm">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">Open Events</span>
          <span className="text-xl font-bold text-amber-700 mt-1 block">{stats?.open_events ?? '...'}</span>
          <span className="text-[10px] text-amber-600">Active monitoring</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-blue-200 bg-blue-50/20 shadow-sm">
          <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">Under Review</span>
          <span className="text-xl font-bold text-blue-700 mt-1 block">{stats?.events_under_review ?? '...'}</span>
          <span className="text-[10px] text-blue-600">Medical assessment</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-sm">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">Resolved</span>
          <span className="text-xl font-bold text-emerald-700 mt-1 block">{stats?.resolved_events ?? '...'}</span>
          <span className="text-[10px] text-emerald-600 font-medium">Closed / Recovered</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
        <div className="flex-1 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by AE ID, event term, participant ID, or trial..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterTrialId || ''}
            onChange={(e) => setFilterTrialId(e.target.value ? Number(e.target.value) : undefined)}
            className="py-2 px-2.5 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none"
          >
            <option value="">All Clinical Trials</option>
            {trials.map((t) => (
              <option key={t.id} value={t.id}>
                {t.trial_id}
              </option>
            ))}
          </select>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="py-2 px-2.5 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none"
          >
            <option value="">All Severity</option>
            <option value="Mild">Mild</option>
            <option value="Moderate">Moderate</option>
            <option value="Severe">Severe</option>
          </select>

          <select
            value={filterSeriousness}
            onChange={(e) => setFilterSeriousness(e.target.value)}
            className="py-2 px-2.5 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none"
          >
            <option value="">All Seriousness</option>
            <option value="true">SAE Only (Serious)</option>
            <option value="false">Non-Serious Only</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="py-2 px-2.5 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Reported">Reported</option>
            <option value="Under Review">Under Review</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Closed">Closed</option>
          </select>

          {(filterTrialId || filterSeverity || filterSeriousness || filterStatus || searchQuery) && (
            <button
              onClick={() => {
                setFilterTrialId(undefined);
                setFilterSeverity('');
                setFilterSeriousness('');
                setFilterStatus('');
                setSearchQuery('');
              }}
              className="px-2.5 py-2 text-rose-600 hover:bg-rose-50 rounded-lg font-medium"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Safety Events Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Safety Surveillance Records ({filteredEvents.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Individual safety cases reported under GCP/ICH-E2A reporting timelines
            </p>
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No adverse events match the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">AE ID</th>
                  <th className="py-3 px-4">Participant</th>
                  <th className="py-3 px-4">Trial</th>
                  <th className="py-3 px-4">Event Term (MedDRA-Ready)</th>
                  <th className="py-3 px-4">Onset Date</th>
                  <th className="py-3 px-4">Severity (Intensity)</th>
                  <th className="py-3 px-4">Seriousness</th>
                  <th className="py-3 px-4">ADR</th>
                  <th className="py-3 px-4">Causality</th>
                  <th className="py-3 px-4">Outcome</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.map((ae) => {
                  const isSAE = ae.is_serious;
                  return (
                    <tr key={ae.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-rose-700">
                        <Link to={`/safety/${ae.id}`} className="hover:underline">
                          {ae.ae_id}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                        <Link to={`/participants/${ae.participant_id}`} className="hover:underline text-ayush-700">
                          {ae.participant_id_str || `P#${ae.participant_id}`}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {ae.trial_id_str || `Trial #${ae.trial_id}`}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 max-w-xs truncate" title={ae.event_term}>
                        {ae.event_term}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{ae.start_date}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ae.severity === 'Severe'
                              ? 'bg-red-100 text-red-800'
                              : ae.severity === 'Moderate'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {ae.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {isSAE ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            SAE Serious
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">Non-Serious</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {ae.is_adr ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                            ADR
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{ae.causality}</td>
                      <td className="py-3 px-4 text-slate-600">{ae.outcome}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ae.status === 'Closed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ae.status === 'Under Review'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ae.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/safety/${ae.id}`}
                          className="inline-flex items-center px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-[11px] font-medium transition-colors"
                        >
                          Review <ArrowRight className="w-3 h-3 ml-1" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Participant Picker Modal before Reporting AE */}
      {isSelectingParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-rose-600" />
                Select Participant for AE Report
              </h3>
            </div>
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Participant ID *</label>
                <select
                  value={modalParticipantId}
                  onChange={(e) => {
                    const pid = Number(e.target.value);
                    setModalParticipantId(pid);
                    const matched = participants.find((p) => p.id === pid);
                    if (matched) {
                      setModalTrialId(matched.trial_id);
                      setModalSiteId(matched.site_id);
                    }
                  }}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                >
                  {participants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.participant_id} ({p.status}) — Trial #{p.trial_id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSelectingParticipant(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProceedToReport}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold"
                >
                  Continue to AE Form
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Adverse Event Modal */}
      {isReportModalOpen && modalParticipantId > 0 && (
        <SafetyReportModal
          trialId={modalTrialId}
          siteId={modalSiteId}
          participantId={modalParticipantId}
          onClose={() => setIsReportModalOpen(false)}
          onReport={handleReportSuccess}
        />
      )}
    </div>
  );
};

export default SafetyPage;
