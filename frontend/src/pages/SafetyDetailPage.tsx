import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { safetyService } from '../services/safetyService';
import type { AdverseEvent, AdverseEventReviewPayload, AECausality, AEOutcome, AEStatus, AuditLog } from '../types';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  User,
  FlaskConical,
  Building,
  FileText,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export const SafetyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const eventId = Number(id);
  const navigate = useNavigate();
  const { role } = useAuth();

  const [event, setEvent] = useState<AdverseEvent | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review form state
  const [reviewStatus, setReviewStatus] = useState<AEStatus>('Under Review');
  const [reviewCausality, setReviewCausality] = useState<AECausality>('Possible');
  const [reviewOutcome, setReviewOutcome] = useState<AEOutcome>('Recovered');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const loadData = useCallback(async () => {
    if (!eventId || isNaN(eventId)) {
      setError('Invalid safety event ID');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await safetyService.getEvent(eventId);
      setEvent(data);
      setReviewStatus(data.status);
      setReviewCausality(data.causality);
      setReviewOutcome(data.outcome);
      setReviewNotes(data.investigator_assessment || '');

      // Load audit logs
      try {
        const logs = await safetyService.getSafetyAuditLogs(data.ae_id);
        setAuditLogs(logs);
      } catch (e) {
        console.warn('Could not load safety audit logs', e);
      }
    } catch (err: any) {
      console.error('Failed to load adverse event details', err);
      setError(err?.response?.data?.detail || 'Failed to load safety event record');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    try {
      setIsSubmittingReview(true);
      const payload: AdverseEventReviewPayload = {
        status: reviewStatus,
        causality: reviewCausality,
        outcome: reviewOutcome,
        investigator_assessment: reviewNotes
      };
      await safetyService.reviewEvent(event.id, payload);
      await loadData();
      alert('Safety event review successfully recorded.');
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to update safety event review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const canReview = role === 'ADMIN' || role === 'PRINCIPAL_INVESTIGATOR' || role === 'REGULATOR';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center">
          <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto mb-2" />
          <h2 className="text-lg font-bold text-rose-900">Safety Event Not Found</h2>
          <p className="text-sm text-rose-700 mt-1">{error || 'Unknown error occurred.'}</p>
          <button
            onClick={() => navigate('/safety')}
            className="mt-4 inline-flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Return to Safety Registry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <Link to="/safety" className="hover:text-rose-700 font-medium">Pharmacovigilance</Link>
            <span>/</span>
            <span className="font-mono text-slate-800 font-semibold">{event.ae_id}</span>
          </div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="w-6 h-6 text-rose-600" />
              <span>{event.event_term}</span>
              <span className="text-sm font-mono text-slate-400 font-normal">({event.ae_id})</span>
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                event.status === 'Closed'
                  ? 'bg-emerald-100 text-emerald-800'
                  : event.status === 'Under Review'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {event.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
            <span className="inline-flex items-center gap-1 font-medium text-slate-700">
              <User className="w-3.5 h-3.5 text-ayush-700" />
              Participant:{' '}
              <Link to={`/participants/${event.participant_id}`} className="font-mono text-ayush-800 underline">
                {event.participant_id_str || `P#${event.participant_id}`}
              </Link>
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 font-medium text-slate-700">
              <FlaskConical className="w-3.5 h-3.5 text-slate-500" />
              Trial: {event.trial_id_str || `Trial #${event.trial_id}`}
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 font-medium text-slate-700">
              <Building className="w-3.5 h-3.5 text-slate-500" />
              Site: {event.site_name || `Site #${event.site_id}`}
            </span>
          </p>
        </div>

        <button
          onClick={() => navigate('/safety')}
          className="inline-flex items-center px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to List
        </button>
      </div>

      {/* Critical Concept Alert: Severity vs Seriousness */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3 text-xs">
        <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-amber-900">Regulatory Clinical Distinction: Severity vs. Seriousness</h3>
          <p className="text-amber-800 mt-0.5">
            <span className="font-semibold">Severity</span> refers to the medical intensity of the adverse experience (Mild, Moderate, Severe).{' '}
            <span className="font-semibold">Seriousness</span> is defined by ICH/GCP regulatory criteria (Death, Inpatient Hospitalization, Life-threatening, Incapacity/Disability). A severe headache is not necessarily serious unless it causes hospitalization.
          </p>
        </div>
      </div>

      {/* Grid: Primary Safety Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Severity */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Intensity (Severity)</span>
          <div className="mt-2 flex items-center justify-between">
            <span className={`text-xl font-bold ${
              event.severity === 'Severe' ? 'text-rose-700' : event.severity === 'Moderate' ? 'text-amber-700' : 'text-slate-800'
            }`}>
              {event.severity}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
              Grade {event.severity === 'Mild' ? '1' : event.severity === 'Moderate' ? '2' : '3'}
            </span>
          </div>
        </div>

        {/* Seriousness */}
        <div className={`p-4 rounded-xl border shadow-sm ${
          event.is_serious ? 'bg-rose-50/60 border-rose-300' : 'bg-white border-slate-200'
        }`}>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Seriousness (SAE)</span>
          <div className="mt-2 flex items-center justify-between">
            <span className={`text-xl font-bold ${event.is_serious ? 'text-rose-700' : 'text-slate-800'}`}>
              {event.is_serious ? 'Serious (SAE)' : 'Non-Serious'}
            </span>
            {event.is_serious && (
              <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold">
                Expedited
              </span>
            )}
          </div>
        </div>

        {/* ADR Classification */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Drug Reaction (ADR)</span>
          <div className="mt-2 flex items-center justify-between">
            <span className={`text-xl font-bold ${event.is_adr ? 'text-purple-700' : 'text-slate-700'}`}>
              {event.is_adr ? 'Adverse Reaction' : 'Not Linked'}
            </span>
            {event.is_adr && (
              <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-bold">
                Ayush ADR
              </span>
            )}
          </div>
        </div>

        {/* Causality Assessment */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">WHO-UMC Causality</span>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xl font-bold text-slate-900">{event.causality}</span>
            <span className="text-[10px] text-slate-400 font-mono">Assessed</span>
          </div>
        </div>
      </div>

      {/* Main Content Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Clinical Description & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detailed Narrative */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-ayush-700" />
              Event Narrative & Clinical Details
            </h2>

            <div className="text-xs space-y-3">
              <div>
                <span className="font-semibold text-slate-700 block mb-1">Detailed Clinical Description</span>
                <p className="text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200 whitespace-pre-wrap leading-relaxed">
                  {event.event_description || 'No detailed narrative provided.'}
                </p>
              </div>

              {event.is_serious && event.seriousness_criteria && event.seriousness_criteria.length > 0 && (
                <div>
                  <span className="font-semibold text-rose-800 block mb-1">Reported Seriousness Criteria</span>
                  <div className="flex flex-wrap gap-1.5">
                    {event.seriousness_criteria.map((crit, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-semibold text-[11px] border border-rose-200">
                        • {crit}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-slate-500 block">Onset / Start Date:</span>
                  <span className="font-medium text-slate-900">{event.start_date}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Resolution / End Date:</span>
                  <span className="font-medium text-slate-900">{event.end_date || 'Ongoing / Unresolved'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-slate-500 block">Suspected Intervention:</span>
                  <span className="font-semibold text-slate-800">{event.suspected_intervention || 'Study Drug'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Action Taken:</span>
                  <span className="font-semibold text-slate-800">{event.action_taken}</span>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-slate-500 block">Clinical Outcome:</span>
                <span className="font-bold text-slate-900">{event.outcome}</span>
              </div>
            </div>
          </div>

          {/* Investigator Assessment */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Principal Investigator & Medical Assessment
            </h2>
            <p className="text-xs text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
              {event.investigator_assessment || 'Awaiting formal investigator causality assessment commentary.'}
            </p>
          </div>

          {/* Audit Trail */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Safety Audit Trail (21 CFR Part 11)
              </h3>
              <span className="text-[11px] font-mono text-slate-400">Entity: SAFETY</span>
            </div>
            {auditLogs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No audit events recorded for this case.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3 hover:bg-slate-50 flex items-start justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{log.action}</span>
                      <span className="text-[10px] ml-2 bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">
                        User #{log.user_id}
                      </span>
                      {log.description && (
                        <p className="text-slate-600 mt-1 font-mono text-[11px]">
                          {log.description}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Review & Resolution Action Form */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-600" />
              Medical Review & Status Transition
            </h2>

            {canReview ? (
              <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lifecycle Status</label>
                  <select
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value as AEStatus)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  >
                    <option value="Reported">Reported (Initial)</option>
                    <option value="Under Review">Under Review (Medical Assessment)</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Closed">Closed (Resolved / Terminated)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Causality Assessment (WHO-UMC)</label>
                  <select
                    value={reviewCausality}
                    onChange={(e) => setReviewCausality(e.target.value as AECausality)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  >
                    <option value="Not Related">Not Related</option>
                    <option value="Unlikely">Unlikely</option>
                    <option value="Possible">Possible</option>
                    <option value="Probable">Probable</option>
                    <option value="Very Likely">Very Likely</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Clinical Outcome</label>
                  <select
                    value={reviewOutcome}
                    onChange={(e) => setReviewOutcome(e.target.value as AEOutcome)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  >
                    <option value="Recovering">Recovering</option>
                    <option value="Recovered">Recovered</option>
                    <option value="Recovered with sequelae">Recovered with sequelae</option>
                    <option value="Not recovered">Not recovered</option>
                    <option value="Fatal">Fatal</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Investigator / DSMB Notes</label>
                  <textarea
                    rows={4}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Enter formal medical reviewer remarks, dechallenge outcome, or regulatory filing references..."
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-xs transition-colors"
                >
                  {isSubmittingReview ? 'Updating...' : 'Save Review Assessment'}
                </button>
              </form>
            ) : (
              <div className="p-4 bg-slate-50 rounded-lg text-xs text-slate-500 text-center">
                Your role ({role}) has read-only access to safety event reviews.
              </div>
            )}
          </div>

          {/* Quick Regulatory Timelines Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
            <span className="font-bold text-slate-800 block">ICH-E2A / CDSCO Timelines</span>
            <div className="space-y-1 text-slate-600">
              <p>• <span className="font-semibold">Fatal/Life-Threatening SAE:</span> Report within 24 hours.</p>
              <p>• <span className="font-semibold">Other Serious AE:</span> Report within 7 calendar days.</p>
              <p>• <span className="font-semibold">Complete Follow-up:</span> Submit within 14 calendar days.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyDetailPage;
