import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { regulatoryService } from '../services/regulatoryService';
import { trialService } from '../services/trialService';
import type {
  EthicsSubmission,
  CTRIRegistration,
  RegulatoryEvent,
  ClinicalTrialListItem,
  EthicsDecisionPayload
} from '../types';
import { EthicsDecisionModal } from '../components/modals/EthicsDecisionModal';
import {
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  Clock,
  CheckCircle,
  Plus,
  RefreshCw,
  BookOpen,
  Filter,
  X
} from 'lucide-react';

export const EthicsRegulatoryPage: React.FC = () => {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<'ethics' | 'ctri' | 'regulatory'>('ethics');

  // Data states
  const [trials, setTrials] = useState<ClinicalTrialListItem[]>([]);
  const [submissions, setSubmissions] = useState<EthicsSubmission[]>([]);
  const [ctriRegistrations, setCtriRegistrations] = useState<{ [trialId: number]: CTRIRegistration | null }>({});
  const [regulatoryEvents, setRegulatoryEvents] = useState<RegulatoryEvent[]>([]);
  const [filterTrialId, setFilterTrialId] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Modals & form states
  const [decisionModalSubmission, setDecisionModalSubmission] = useState<EthicsSubmission | null>(null);
  const [isNewEthicsModalOpen, setIsNewEthicsModalOpen] = useState(false);
  const [isNewRegEventModalOpen, setIsNewRegEventModalOpen] = useState(false);
  const [editingCtriTrial, setEditingCtriTrial] = useState<ClinicalTrialListItem | null>(null);

  // New Ethics form state
  const [ethicsForm, setEthicsForm] = useState({
    trial_id: 0,
    protocol_version: 'v1.0',
    submission_date: new Date().toISOString().split('T')[0],
    comments: ''
  });

  // New Regulatory Event form state
  const [regForm, setRegForm] = useState({
    trial_id: 0,
    event_type: 'Annual Safety Report to DCGI',
    due_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    responsible_person: 'Study Coordinator',
    notes: ''
  });

  // CTRI edit state
  const [ctriForm, setCtriForm] = useState({
    ctri_number: '',
    status: 'Draft',
    submission_date: '',
    registration_date: '',
    next_update_deadline: '',
    notes: '',
    responsible_person: ''
  });

  const loadData = useCallback(async () => {
    try {
      const [trialsList, ethicsList, regList] = await Promise.all([
        trialService.getTrials({ limit: 100 }),
        regulatoryService.getEthicsSubmissions(filterTrialId),
        regulatoryService.getRegulatoryEvents(filterTrialId)
      ]);

      setTrials(trialsList);
      setSubmissions(ethicsList);
      setRegulatoryEvents(regList);

      // Load CTRI for all trials
      const ctriMap: { [trialId: number]: CTRIRegistration | null } = {};
      await Promise.all(
        trialsList.map(async (t: ClinicalTrialListItem) => {
          try {
            const reg = await regulatoryService.getCTRIRegistration(t.id);
            ctriMap[t.id] = reg;
          } catch (e) {
            ctriMap[t.id] = null;
          }
        })
      );
      setCtriRegistrations(ctriMap);
    } catch (err) {
      console.error('Failed to load ethics & regulatory data', err);
    } finally {
      setIsLoading(false);
    }
  }, [filterTrialId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Actions
  const handleDecisionSubmit = async (subId: number, data: EthicsDecisionPayload) => {
    await regulatoryService.recordEthicsDecision(subId, data);
    await loadData();
  };

  const handleCreateEthics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ethicsForm.trial_id) {
      alert('Please select a trial');
      return;
    }
    try {
      await regulatoryService.createEthicsSubmission({
        trial_id: Number(ethicsForm.trial_id),
        protocol_version: ethicsForm.protocol_version,
        submission_date: ethicsForm.submission_date,
        comments: ethicsForm.comments || undefined
      });
      setIsNewEthicsModalOpen(false);
      setEthicsForm({
        trial_id: 0,
        protocol_version: 'v1.0',
        submission_date: new Date().toISOString().split('T')[0],
        comments: ''
      });
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to submit ethics review request');
    }
  };

  const handleCreateRegulatoryEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.trial_id) {
      alert('Please select a trial');
      return;
    }
    try {
      await regulatoryService.createRegulatoryEvent({
        trial_id: Number(regForm.trial_id),
        event_type: regForm.event_type,
        due_date: regForm.due_date,
        responsible_person: regForm.responsible_person || undefined,
        notes: regForm.notes || undefined
      });
      setIsNewRegEventModalOpen(false);
      setRegForm({
        trial_id: 0,
        event_type: 'Annual Safety Report to DCGI',
        due_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        responsible_person: 'Study Coordinator',
        notes: ''
      });
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to create regulatory event');
    }
  };

  const handleUpdateCtri = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCtriTrial) return;
    try {
      await regulatoryService.updateCTRIRegistration(editingCtriTrial.id, {
        ctri_number: ctriForm.ctri_number || undefined,
        status: ctriForm.status as any,
        submission_date: ctriForm.submission_date || undefined,
        registration_date: ctriForm.registration_date || undefined,
        next_update_deadline: ctriForm.next_update_deadline || undefined,
        notes: ctriForm.notes || undefined,
        responsible_person: ctriForm.responsible_person || undefined
      });
      setEditingCtriTrial(null);
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to update CTRI record');
    }
  };

  const handleMarkRegEventCompleted = async (eventId: number) => {
    try {
      await regulatoryService.updateRegulatoryEvent(eventId, {
        status: 'Completed',
        completion_date: new Date().toISOString().split('T')[0]
      });
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to update event');
    }
  };

  // Helper stats
  const totalSubmissions = submissions.length;
  const approvedSubmissions = submissions.filter((s) => s.status === 'Approved').length;
  const underReviewSubmissions = submissions.filter((s) => s.status === 'Under Review' || s.status === 'Submitted').length;

  const upcomingDeadlines = regulatoryEvents.filter((e) => e.status !== 'Completed').length;

  const canReviewEthics = role === 'ADMIN' || role === 'REGULATOR' || role === 'ETHICS_COMMITTEE';
  const canManage = role === 'ADMIN' || role === 'PRINCIPAL_INVESTIGATOR' || role === 'STUDY_COORDINATOR';
  if (isLoading && trials.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ayush-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <span>Governance</span>
            <span>/</span>
            <span className="font-semibold text-slate-800">Ethics, CTRI & Regulatory Tracking</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-ayush-700" />
            Ethics, CTRI & Statutory Compliance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Institutional Ethics Committee (IEC) workflows, Clinical Trials Registry - India (CTRI) oversight, and CDSCO/DCGI statutory timelines.
          </p>
        </div>

        {/* Global actions */}
        <div className="flex items-center space-x-2">
          {canManage && (
            <>
              <button
                onClick={() => setIsNewEthicsModalOpen(true)}
                className="inline-flex items-center px-3.5 py-2 bg-ayush-800 hover:bg-ayush-900 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Submit IEC Protocol
              </button>
              <button
                onClick={() => setIsNewRegEventModalOpen(true)}
                className="inline-flex items-center px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <Clock className="w-3.5 h-3.5 mr-1.5" />
                Add Filing Deadline
              </button>
            </>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">IEC Submissions</span>
            <FileCheck className="w-5 h-5 text-ayush-700" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{totalSubmissions}</span>
            <span className="text-xs text-emerald-600 font-medium">{approvedSubmissions} Approved</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Under IEC Review</span>
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{underReviewSubmissions}</span>
            <span className="text-xs text-amber-700 font-medium">Review Active</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">CTRI Registrations</span>
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">
              {Object.values(ctriRegistrations).filter((c) => c?.status === 'Registered').length}
            </span>
            <span className="text-xs text-blue-700 font-medium">{trials.length} Active Trials</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Statutory Filings</span>
            <AlertTriangle className="w-5 h-5 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{upcomingDeadlines}</span>
            <span className="text-xs text-purple-700 font-medium">Pending Deadlines</span>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 flex items-center justify-between px-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('ethics')}
              className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                activeTab === 'ethics'
                  ? 'border-ayush-700 text-ayush-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              IEC Ethics Submissions ({submissions.length})
            </button>
            <button
              onClick={() => setActiveTab('ctri')}
              className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                activeTab === 'ctri'
                  ? 'border-ayush-700 text-ayush-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              CTRI National Registry ({trials.length})
            </button>
            <button
              onClick={() => setActiveTab('regulatory')}
              className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                activeTab === 'regulatory'
                  ? 'border-ayush-700 text-ayush-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Statutory Filings & Deadlines ({regulatoryEvents.length})
            </button>
          </div>

          {/* Trial Filter */}
          <div className="flex items-center space-x-2 text-xs py-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterTrialId || ''}
              onChange={(e) => setFilterTrialId(e.target.value ? Number(e.target.value) : undefined)}
              className="text-xs py-1 px-2 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-ayush-600"
            >
              <option value="">All Clinical Trials</option>
              {trials.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.trial_id} - {t.trial_title.substring(0, 30)}...
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab 1: Ethics Submissions */}
        {activeTab === 'ethics' && (
          <div className="overflow-x-auto">
            {submissions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No ethics submissions found for the selected criteria.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Submission ID</th>
                    <th className="py-3 px-4">Trial ID</th>
                    <th className="py-3 px-4">Protocol Version</th>
                    <th className="py-3 px-4">Submitted On</th>
                    <th className="py-3 px-4">Review Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Approval Number</th>
                    <th className="py-3 px-4">Expiry Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {submissions.map((sub) => {
                    const matchedTrial = trials.find((t) => t.id === sub.trial_id);
                    const canRecord = canReviewEthics && sub.status !== 'Approved';
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {sub.submission_id || `ETH-${sub.id}`}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {matchedTrial ? matchedTrial.trial_id : `Trial #${sub.trial_id}`}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">{sub.protocol_version}</td>
                        <td className="py-3 px-4 text-slate-600">{sub.submission_date}</td>
                        <td className="py-3 px-4 text-slate-600">{sub.review_date || '—'}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sub.status === 'Approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : sub.status === 'Under Review' || sub.status === 'Submitted'
                                ? 'bg-amber-100 text-amber-800'
                                : sub.status === 'Rejected'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">{sub.approval_number || '—'}</td>
                        <td className="py-3 px-4 text-slate-600">{sub.expiry_date || '—'}</td>
                        <td className="py-3 px-4 text-right">
                          {canRecord ? (
                            <button
                              onClick={() => setDecisionModalSubmission(sub)}
                              className="inline-flex items-center px-2.5 py-1 bg-ayush-800 hover:bg-ayush-900 text-white rounded text-[11px] font-medium transition-colors"
                            >
                              Record Decision
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">Decided</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: CTRI Tracking */}
        {activeTab === 'ctri' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Trial ID</th>
                  <th className="py-3 px-4">Trial Title</th>
                  <th className="py-3 px-4">CTRI Number</th>
                  <th className="py-3 px-4">Registration Status</th>
                  <th className="py-3 px-4">Registration Date</th>
                  <th className="py-3 px-4">Next Update Deadline</th>
                  <th className="py-3 px-4">Responsible Person</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trials.map((trial) => {
                  const ctri = ctriRegistrations[trial.id];
                  return (
                    <tr key={trial.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{trial.trial_id}</td>
                      <td className="py-3 px-4 font-medium text-slate-800 max-w-xs truncate" title={trial.trial_title}>
                        {trial.trial_title}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">
                        {ctri?.ctri_number || 'Unregistered'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ctri?.status === 'Registered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ctri?.status === 'Submitted' || ctri?.status === 'Under Review'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {ctri?.status || 'Not Submitted'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{ctri?.registration_date || '—'}</td>
                      <td className="py-3 px-4 text-slate-600">{ctri?.next_update_deadline || '—'}</td>
                      <td className="py-3 px-4 text-slate-600">{ctri?.responsible_person || 'PI / Sponsor'}</td>
                      <td className="py-3 px-4 text-right">
                        {canManage && (
                          <button
                            onClick={() => {
                              setEditingCtriTrial(trial);
                              setCtriForm({
                                ctri_number: ctri?.ctri_number || '',
                                status: ctri?.status || 'Draft',
                                submission_date: ctri?.submission_date || '',
                                registration_date: ctri?.registration_date || '',
                                next_update_deadline: ctri?.next_update_deadline || '',
                                notes: ctri?.notes || '',
                                responsible_person: ctri?.responsible_person || ''
                              });
                            }}
                            className="inline-flex items-center px-2.5 py-1 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded text-[11px] font-medium transition-colors"
                          >
                            Update CTRI
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Statutory Filings & Deadlines */}
        {activeTab === 'regulatory' && (
          <div className="overflow-x-auto">
            {regulatoryEvents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No statutory deadlines configured.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Event ID</th>
                    <th className="py-3 px-4">Trial</th>
                    <th className="py-3 px-4">Event / Milestone Type</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Completion Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Responsible Person</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {regulatoryEvents.map((evt) => {
                    const matchedTrial = trials.find((t) => t.id === evt.trial_id);
                    const isCompleted = evt.status === 'Completed';
                    const isOverdue = !isCompleted && new Date(evt.due_date) < new Date();
                    return (
                      <tr key={evt.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">#REG-{evt.id}</td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {matchedTrial ? matchedTrial.trial_id : `Trial #${evt.trial_id}`}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{evt.event_type}</td>
                        <td className="py-3 px-4 text-slate-700 font-medium">{evt.due_date}</td>
                        <td className="py-3 px-4 text-slate-600">{evt.completion_date || '—'}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-800'
                                : isOverdue
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isCompleted ? 'Completed' : isOverdue ? 'Overdue' : evt.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{evt.responsible_person || 'Coordinator'}</td>
                        <td className="py-3 px-4 text-right">
                          {!isCompleted && canManage && (
                            <button
                              onClick={() => handleMarkRegEventCompleted(evt.id)}
                              className="inline-flex items-center px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-medium transition-colors"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Mark Filed
                            </button>
                          )}
                          {isCompleted && (
                            <span className="text-[11px] text-emerald-600 font-semibold">Filed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Decision Modal */}
      {decisionModalSubmission && (
        <EthicsDecisionModal
          submission={decisionModalSubmission}
          onClose={() => setDecisionModalSubmission(null)}
          onSubmitDecision={handleDecisionSubmit}
        />
      )}

      {/* New Ethics Submission Modal */}
      {isNewEthicsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-ayush-700" />
                Submit Protocol to Institutional Ethics Committee
              </h3>
              <button
                onClick={() => setIsNewEthicsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateEthics} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Clinical Trial *</label>
                <select
                  required
                  value={ethicsForm.trial_id}
                  onChange={(e) => setEthicsForm({ ...ethicsForm, trial_id: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                >
                  <option value={0}>Select trial...</option>
                  {trials.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.trial_id} - {t.trial_title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Protocol Version *</label>
                <input
                  type="text"
                  required
                  value={ethicsForm.protocol_version}
                  onChange={(e) => setEthicsForm({ ...ethicsForm, protocol_version: e.target.value })}
                  placeholder="e.g. v1.0, v2.1-amended"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Submission Date *</label>
                <input
                  type="date"
                  required
                  value={ethicsForm.submission_date}
                  onChange={(e) => setEthicsForm({ ...ethicsForm, submission_date: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Submission Notes / Summary</label>
                <textarea
                  rows={3}
                  value={ethicsForm.comments}
                  onChange={(e) => setEthicsForm({ ...ethicsForm, comments: e.target.value })}
                  placeholder="Summary of protocol amendments, investigator brochure versions, consent forms..."
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewEthicsModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-ayush-800 hover:bg-ayush-900 text-white rounded-lg font-semibold"
                >
                  Submit for IEC Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Regulatory Event Modal */}
      {isNewRegEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-ayush-700" />
                Add Statutory Filing / Regulatory Milestone
              </h3>
              <button
                onClick={() => setIsNewRegEventModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateRegulatoryEvent} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Clinical Trial *</label>
                <select
                  required
                  value={regForm.trial_id}
                  onChange={(e) => setRegForm({ ...regForm, trial_id: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                >
                  <option value={0}>Select trial...</option>
                  {trials.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.trial_id} - {t.trial_title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Event / Filing Type *</label>
                <input
                  type="text"
                  required
                  value={regForm.event_type}
                  onChange={(e) => setRegForm({ ...regForm, event_type: e.target.value })}
                  placeholder="e.g. Annual Status Report to DCGI, CTRI 6-month update, DSMB Safety review..."
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Due Date *</label>
                <input
                  type="date"
                  required
                  value={regForm.due_date}
                  onChange={(e) => setRegForm({ ...regForm, due_date: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Responsible Person</label>
                <input
                  type="text"
                  value={regForm.responsible_person}
                  onChange={(e) => setRegForm({ ...regForm, responsible_person: e.target.value })}
                  placeholder="e.g. Clinical Research Coordinator / Principal Investigator"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Filing Details</label>
                <textarea
                  rows={2}
                  value={regForm.notes}
                  onChange={(e) => setRegForm({ ...regForm, notes: e.target.value })}
                  placeholder="Special instructions or statutory reference..."
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewRegEventModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold"
                >
                  Add Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit CTRI Modal */}
      {editingCtriTrial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Update CTRI Details — {editingCtriTrial.trial_id}
                </h3>
                <p className="text-xs text-slate-500">{editingCtriTrial.trial_title}</p>
              </div>
              <button
                onClick={() => setEditingCtriTrial(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateCtri} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">CTRI Registration Number</label>
                <input
                  type="text"
                  value={ctriForm.ctri_number}
                  onChange={(e) => setCtriForm({ ...ctriForm, ctri_number: e.target.value })}
                  placeholder="e.g. CTRI/2026/03/084920"
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Registration Status</label>
                <select
                  value={ctriForm.status}
                  onChange={(e) => setCtriForm({ ...ctriForm, status: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                >
                  <option value="Not Submitted">Not Submitted</option>
                  <option value="Draft">Draft</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Registered">Registered</option>
                  <option value="Update Required">Update Required</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Submission Date</label>
                  <input
                    type="date"
                    value={ctriForm.submission_date}
                    onChange={(e) => setCtriForm({ ...ctriForm, submission_date: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Registration Date</label>
                  <input
                    type="date"
                    value={ctriForm.registration_date}
                    onChange={(e) => setCtriForm({ ...ctriForm, registration_date: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Next Periodic Update Deadline</label>
                <input
                  type="date"
                  value={ctriForm.next_update_deadline}
                  onChange={(e) => setCtriForm({ ...ctriForm, next_update_deadline: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Responsible Person / Contact</label>
                <input
                  type="text"
                  value={ctriForm.responsible_person}
                  onChange={(e) => setCtriForm({ ...ctriForm, responsible_person: e.target.value })}
                  placeholder="Principal Investigator / Regulatory Liaison"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCtriTrial(null)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold"
                >
                  Save CTRI Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EthicsRegulatoryPage;
