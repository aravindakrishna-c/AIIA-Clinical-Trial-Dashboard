import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { participantService } from '../services/participantService';
import { safetyService } from '../services/safetyService';
import type { ParticipantDetail, ParticipantVisit, AdverseEvent, AuditLog } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { RandomizationModal } from '../components/modals/RandomizationModal';
import { VisitModal } from '../components/modals/VisitModal';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  Shield,
  Activity,
  Shuffle,
  LogOut,
  Building,
  FlaskConical,
  ExternalLink
} from 'lucide-react';

export const ParticipantDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const participantId = Number(id);
  const navigate = useNavigate();
  const { role } = useAuth();

  const [participant, setParticipant] = useState<ParticipantDetail | null>(null);
  const [visits, setVisits] = useState<ParticipantVisit[]>([]);
  const [safetyEvents, setSafetyEvents] = useState<AdverseEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isRandomizeModalOpen, setIsRandomizeModalOpen] = useState(false);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<ParticipantVisit | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Withdrawal dialog state
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState('');

  const loadData = useCallback(async () => {
    if (!participantId || isNaN(participantId)) {
      setError('Invalid participant ID');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const [partData, visitsData] = await Promise.all([
        participantService.getParticipant(participantId),
        participantService.getVisits(participantId)
      ]);

      setParticipant(partData);
      setVisits(visitsData);

      // Load linked safety events
      try {
        const events = await safetyService.listEvents({ participant_id: participantId });
        setSafetyEvents(events);
      } catch (e) {
        console.warn('Could not load safety events', e);
      }

      // Load audit logs
      try {
        const logs = await participantService.getParticipantAuditLogs(partData.participant_id);
        setAuditLogs(logs);
      } catch (e) {
        console.warn('Could not load participant audit logs', e);
      }
    } catch (err: any) {
      console.error('Failed to load participant details', err);
      setError(err?.response?.data?.detail || 'Failed to load participant record');
    } finally {
      setIsLoading(false);
    }
  }, [participantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Actions
  const handleEnroll = async () => {
    if (!participant) return;
    if (!window.confirm(`Enroll participant ${participant.participant_id} into trial?`)) return;
    try {
      setActionLoading(true);
      await participantService.enrollParticipant(participant.id, {
        enrollment_date: new Date().toISOString().split('T')[0]
      });
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Enrollment failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!participant || !withdrawReason.trim()) return;
    try {
      setActionLoading(true);
      await participantService.withdrawParticipant(participant.id, {
        withdrawal_reason: withdrawReason.trim(),
        withdrawal_date: new Date().toISOString().split('T')[0]
      });
      setShowWithdrawDialog(false);
      setWithdrawReason('');
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Withdrawal failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!participant) return;
    if (!window.confirm(`Mark study protocol completed for participant ${participant.participant_id}?`)) return;
    try {
      setActionLoading(true);
      await participantService.completeParticipant(participant.id, {
        completion_date: new Date().toISOString().split('T')[0]
      });
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Protocol completion failed');
    } finally {
      setActionLoading(false);
    }
  };

  const canManage = role === 'ADMIN' || role === 'PRINCIPAL_INVESTIGATOR' || role === 'STUDY_COORDINATOR';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ayush-700"></div>
      </div>
    );
  }

  if (error || !participant) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center">
          <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto mb-2" />
          <h2 className="text-lg font-bold text-rose-900">Participant Record Not Found</h2>
          <p className="text-sm text-rose-700 mt-1">{error || 'Unknown error occurred.'}</p>
          <button
            onClick={() => navigate('/participants')}
            className="mt-4 inline-flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Return to Participants List
          </button>
        </div>
      </div>
    );
  }

  const pStatus = participant.participant_status || participant.status;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <Link to="/participants" className="hover:text-ayush-700 font-medium">Participants</Link>
            <span>/</span>
            <span className="font-mono text-slate-800 font-semibold">{participant.participant_id}</span>
          </div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{participant.participant_id}</span>
              <span className="text-sm font-mono text-slate-400 font-normal">({participant.screening_number})</span>
            </h1>
            <StatusBadge status={pStatus} type="participantStatus" />
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 font-medium text-slate-700">
              <FlaskConical className="w-3.5 h-3.5 text-ayush-600" />
              Trial: {participant.trial_id_str || `Trial #${participant.trial_id}`}
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 font-medium text-slate-700">
              <Building className="w-3.5 h-3.5 text-slate-500" />
              Site: {participant.site_name || `Site #${participant.site_id}`} ({participant.site_code || 'AIIA'})
            </span>
          </p>
        </div>

        {/* Action Buttons */}
        {canManage && (
          <div className="flex flex-wrap items-center gap-2">
            {pStatus === 'Eligible' && (
              <button
                onClick={handleEnroll}
                disabled={actionLoading}
                className="inline-flex items-center px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <UserCheck className="w-4 h-4 mr-1.5" />
                Enroll Participant
              </button>
            )}

            {pStatus === 'Enrolled' && (
              <button
                onClick={() => setIsRandomizeModalOpen(true)}
                disabled={actionLoading}
                className="inline-flex items-center px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <Shuffle className="w-4 h-4 mr-1.5" />
                Randomize
              </button>
            )}

            {(pStatus === 'Randomized' || pStatus === 'Active') && (
              <button
                onClick={handleComplete}
                disabled={actionLoading}
                className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <CheckCircle className="w-4 h-4 mr-1.5" />
                Complete Protocol
              </button>
            )}

            {pStatus !== 'Withdrawn' && pStatus !== 'Completed' && (
              <button
                onClick={() => setShowWithdrawDialog(true)}
                disabled={actionLoading}
                className="inline-flex items-center px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 mr-1" />
                Withdraw
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grid: Overview & Lifecycle Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Screening Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Screening</span>
            <span className="text-xs font-mono text-slate-400">Step 1</span>
          </div>
          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Screening No:</span>
              <span className="font-mono font-bold text-slate-800">{participant.screening_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Screened On:</span>
              <span className="font-medium text-slate-700">{participant.screening_date}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-slate-500">Eligibility:</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                participant.eligibility_status === 'Eligible'
                  ? 'bg-emerald-100 text-emerald-800'
                  : participant.eligibility_status === 'Ineligible'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {participant.eligibility_status}
              </span>
            </div>
          </div>
        </div>

        {/* Enrollment Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Enrollment</span>
            <span className="text-xs font-mono text-slate-400">Step 2</span>
          </div>
          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Enrolled On:</span>
              <span className="font-medium text-slate-800">{participant.enrollment_date || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cohort:</span>
              <span className="font-medium text-slate-700">Ayurveda CTMS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className="font-semibold text-emerald-700">
                {participant.enrollment_date ? 'Confirmed Enrolled' : 'Pending Enrollment'}
              </span>
            </div>
          </div>
        </div>

        {/* Randomization Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Randomization</span>
            <span className="text-xs font-mono text-slate-400">Step 3</span>
          </div>
          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Rnd Number:</span>
              <span className="font-mono font-bold text-purple-700">
                {participant.randomization_number || '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Rnd Date:</span>
              <span className="font-medium text-slate-700">{participant.randomization_date || '—'}</span>
            </div>
            <div className="flex flex-col pt-1">
              <span className="text-slate-500 mb-0.5">Assigned Group:</span>
              <span className="font-bold text-slate-800 text-[11px] truncate" title={participant.treatment_group || 'Unassigned'}>
                {participant.treatment_group || 'Unassigned'}
              </span>
            </div>
          </div>
        </div>

        {/* Demographics Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Demographics</span>
            <span className="text-xs font-mono text-emerald-600 font-semibold">De-Identified</span>
          </div>
          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Age:</span>
              <span className="font-bold text-slate-800">{participant.age} yrs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Age Group:</span>
              <span className="font-medium text-slate-700">{participant.age_group}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Sex:</span>
              <span className="font-medium text-slate-800">{participant.sex}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawal Banner if Withdrawn */}
      {pStatus === 'Withdrawn' && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-rose-900">Participant Withdrawn from Trial</p>
            <p className="text-rose-700 mt-0.5">
              Withdrawn on <span className="font-semibold">{participant.withdrawal_date}</span>. Reason:{' '}
              <span className="italic">{participant.withdrawal_reason || 'Not specified'}</span>
            </p>
          </div>
        </div>
      )}

      {/* Clinical Visits Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-ayush-700" />
              Clinical Protocol Visits ({visits.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Protocol scheduled observation timeline & electronic visit completion records
            </p>
          </div>
          <span className="text-xs text-slate-400">
            {visits.filter(v => (v.visit_status || v.status) === 'Completed').length} / {visits.length} Completed
          </span>
        </div>

        {visits.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No scheduled visits found for this participant.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Visit #</th>
                  <th className="py-2.5 px-4">Visit Name</th>
                  <th className="py-2.5 px-4">Planned Date</th>
                  <th className="py-2.5 px-4">Actual Date</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Notes</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visits.map((visit) => {
                  const vStat = visit.visit_status || visit.status;
                  const isCompleted = vStat === 'Completed';
                  return (
                    <tr key={visit.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-700">#{visit.visit_number}</td>
                      <td className="py-2.5 px-4 font-medium text-slate-900">{visit.visit_name}</td>
                      <td className="py-2.5 px-4 text-slate-600">{visit.planned_date}</td>
                      <td className="py-2.5 px-4 font-medium text-slate-800">{visit.actual_date || '—'}</td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : vStat === 'Overdue'
                              ? 'bg-rose-100 text-rose-800'
                              : vStat === 'Missed'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {vStat}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 max-w-xs truncate">{visit.notes || '—'}</td>
                      <td className="py-2.5 px-4 text-right">
                        {canManage && !isCompleted && (
                          <button
                            onClick={() => {
                              setSelectedVisit(visit);
                              setIsVisitModalOpen(true);
                            }}
                            className="inline-flex items-center px-2.5 py-1 bg-ayush-700 hover:bg-ayush-800 text-white rounded text-[11px] font-medium transition-colors"
                          >
                            Record Visit
                          </button>
                        )}
                        {isCompleted && (
                          <span className="text-[11px] text-emerald-600 font-semibold inline-flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" /> Logged
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Safety Events (Pharmacovigilance) Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-600" />
              Pharmacovigilance & Safety Events ({safetyEvents.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Logged Adverse Events (AE), Serious Adverse Events (SAE) & Adverse Drug Reactions (ADR)
            </p>
          </div>
          <Link
            to="/safety"
            className="text-xs text-ayush-700 hover:text-ayush-900 font-semibold inline-flex items-center gap-1"
          >
            PV Registry <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {safetyEvents.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No adverse events reported for this participant.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">AE ID</th>
                  <th className="py-2.5 px-4">Event Term</th>
                  <th className="py-2.5 px-4">Start Date</th>
                  <th className="py-2.5 px-4">Severity</th>
                  <th className="py-2.5 px-4">Seriousness</th>
                  <th className="py-2.5 px-4">Causality</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {safetyEvents.map((ae) => (
                  <tr key={ae.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono font-bold text-rose-700">{ae.ae_id}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{ae.event_term}</td>
                    <td className="py-2.5 px-4 text-slate-600">{ae.start_date}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-800">{ae.severity}</td>
                    <td className="py-2.5 px-4">
                      {ae.is_serious ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          SAE
                        </span>
                      ) : (
                        <span className="text-slate-500">Non-Serious</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700">{ae.causality}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                        {ae.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit History */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-700" />
            21 CFR Part 11 Audit Trail
          </h2>
          <span className="text-xs text-slate-400 font-mono">Entity: PARTICIPANT</span>
        </div>
        {auditLogs.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No audit records logged for this participant yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 hover:bg-slate-50 flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">
                      User #{log.user_id} {log.user?.role?.name ? `(${log.user.role.name})` : ''}
                    </span>
                  </div>
                  {log.description && (
                    <p className="text-slate-600 mt-1 font-mono text-[11px] bg-slate-50 p-1.5 rounded border border-slate-100">
                      {log.description}
                    </p>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Randomization Modal */}
      {isRandomizeModalOpen && participant && (
        <RandomizationModal
          participant={participant}
          onClose={() => setIsRandomizeModalOpen(false)}
          onRandomize={async (treatmentGroup?: string) => {
            await participantService.randomizeParticipant(participant.id, { treatment_group: treatmentGroup });
            setIsRandomizeModalOpen(false);
            await loadData();
          }}
        />
      )}

      {/* Visit Record Modal */}
      {isVisitModalOpen && selectedVisit && (
        <VisitModal
          visit={selectedVisit}
          onClose={() => {
            setIsVisitModalOpen(false);
            setSelectedVisit(null);
          }}
          onComplete={async (visitId: number, data: { actual_date: string; status: string; notes?: string }) => {
            await participantService.completeVisit(visitId, data);
            setIsVisitModalOpen(false);
            setSelectedVisit(null);
            await loadData();
          }}
        />
      )}

      {/* Withdrawal Dialog Modal */}
      {showWithdrawDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Withdraw Participant</h3>
            <p className="text-xs text-slate-600">
              Please enter the clinical or patient reason for withdrawing participant{' '}
              <span className="font-bold">{participant.participant_id}</span> from the study protocol.
            </p>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Withdrawal Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                  placeholder="e.g. Adverse event, Patient moved away, Consent withdrawn, Lost to follow-up..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWithdrawDialog(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !withdrawReason.trim()}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
                >
                  Confirm Withdrawal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantDetailPage;
