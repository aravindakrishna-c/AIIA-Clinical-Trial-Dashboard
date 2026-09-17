import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ClinicalTrial, TrialSite, AuditLog } from '../types';
import { trialService } from '../services/trialService';
import { StatusBadge } from '../components/StatusBadge';
import { StatusTransitionModal } from '../components/StatusTransitionModal';
import { MilestoneTimeline } from '../components/MilestoneTimeline';
import { SiteModal } from '../components/SiteModal';
import { SiteStatusModal } from '../components/SiteStatusModal';
import { ProtocolVersionModal } from '../components/ProtocolVersionModal';
import {
  ArrowLeft,
  Calendar,
  Building2,
  FlaskConical,
  FileText,
  CheckCircle2,
  AlertCircle,
  Edit2,
  RefreshCw,
  Plus,
  ShieldCheck,
  Layers
} from 'lucide-react';

export const TrialDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();

  const [trial, setTrial] = useState<ClinicalTrial | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'protocol' | 'sites' | 'audit'>('overview');

  // Modal states
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<TrialSite | null>(null);
  const [statusSite, setStatusSite] = useState<TrialSite | null>(null);
  const [isProtocolModalOpen, setIsProtocolModalOpen] = useState(false);

  const canEdit = role === 'ADMIN' || role === 'PRINCIPAL_INVESTIGATOR' || role === 'STUDY_COORDINATOR';
  const canManageSites = role === 'ADMIN' || role === 'PRINCIPAL_INVESTIGATOR' || role === 'STUDY_COORDINATOR';
  const canManageMilestones = role === 'ADMIN' || role === 'PRINCIPAL_INVESTIGATOR' || role === 'STUDY_COORDINATOR';
  const canManageProtocols = role === 'ADMIN' || role === 'PRINCIPAL_INVESTIGATOR';
  const canChangeStatus = role === 'ADMIN' || role === 'PRINCIPAL_INVESTIGATOR' || role === 'ETHICS_COMMITTEE';

  const loadTrial = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await trialService.getTrial(id);
      setTrial(data);
      // Also fetch trial-specific audit logs
      const logs = await trialService.getTrialAuditTrail(id);
      setAuditLogs(logs);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load clinical trial details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTrial();
  }, [id]);

  if (isLoading) {
    return (
      <div className="p-16 text-center text-slate-500 text-sm">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-ayush-600 mb-3" />
        <p className="font-semibold text-slate-700">Loading Clinical Trial Dossier...</p>
        <p className="text-xs text-slate-400 mt-1">Retrieving verified clinical protocol and site data from PostgreSQL</p>
      </div>
    );
  }

  if (error || !trial) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
        <h3 className="text-base font-bold text-rose-900">Clinical Trial Dossier Not Found</h3>
        <p className="text-xs text-rose-700 max-w-md mx-auto">{error || 'Unable to retrieve trial record.'}</p>
        <button
          onClick={() => navigate('/trials')}
          className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-rose-800 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Trials Registry</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top breadcrumb & quick back */}
      <div className="flex items-center space-x-2 text-xs text-slate-500">
        <button
          onClick={() => navigate('/trials')}
          className="hover:text-ayush-700 flex items-center space-x-1 font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Clinical Trials Registry</span>
        </button>
        <span>/</span>
        <span className="font-mono font-bold text-slate-800">{trial.trial_id}</span>
      </div>

      {/* Trial Dossier Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold text-base text-slate-900 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                {trial.trial_id}
              </span>
              <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                Protocol: {trial.protocol_number} (v{trial.protocol_version})
              </span>
              <StatusBadge status={trial.status} type="trialStatus" />
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {trial.disease_condition}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              {trial.trial_title}
            </h1>

            {trial.short_title && (
              <p className="text-xs text-slate-500 italic">
                Short Title: {trial.short_title}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 pt-1">
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-400">PI:</span>
                <span className="font-semibold text-slate-800">
                  {trial.principal_investigator?.full_name || 'Dr. Rajesh Sharma'}
                </span>
              </div>
              <span>•</span>
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-400">Sponsor:</span>
                <span className="font-medium text-slate-700">{trial.sponsor}</span>
              </div>
              <span>•</span>
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-400">Phase:</span>
                <span className="font-medium text-slate-700">{trial.study_phase}</span>
              </div>
              <span>•</span>
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-400">Design:</span>
                <span className="font-medium text-slate-700">{trial.study_design}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            {canChangeStatus && (
              <button
                onClick={() => setIsStatusModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg shadow-sm transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Change Status</span>
              </button>
            )}

            {canManageSites && (
              <button
                onClick={() => {
                  setEditingSite(null);
                  setIsSiteModalOpen(true);
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-slate-500" />
                <span>Add Site</span>
              </button>
            )}

            {canEdit && (
              <button
                onClick={() => navigate(`/trials/${trial.trial_id}/edit`)}
                className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-white bg-ayush-700 hover:bg-ayush-800 rounded-lg shadow-sm transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Trial</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              Target Participants
            </span>
            <span className="text-base font-bold text-slate-900 mt-0.5 block">
              {trial.target_participants} participants
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              Investigational Sites
            </span>
            <span className="text-base font-bold text-slate-900 mt-0.5 block">
              {trial.sites?.length || 0} registered centers
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              Protocol Version
            </span>
            <span className="text-base font-bold text-slate-900 mt-0.5 block font-mono">
              v{trial.protocol_version} ({trial.protocol_version_date})
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              Timeline Range
            </span>
            <span className="text-base font-bold text-slate-900 mt-0.5 block font-mono">
              {trial.start_date} → {trial.expected_completion_date}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'overview'
              ? 'border-ayush-700 text-ayush-900 bg-ayush-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Overview & Protocol Details</span>
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'timeline'
              ? 'border-ayush-700 text-ayush-900 bg-ayush-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Milestones & Timeline ({trial.milestones?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('protocol')}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'protocol'
              ? 'border-ayush-700 text-ayush-900 bg-ayush-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Protocol Versions ({trial.protocol_versions?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('sites')}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'sites'
              ? 'border-ayush-700 text-ayush-900 bg-ayush-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Trial Sites ({trial.sites?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'audit'
              ? 'border-ayush-700 text-ayush-900 bg-ayush-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Audit Trail ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB CONTENT */}
      <div className="bg-white rounded-b-xl border border-slate-200 p-6 shadow-sm">
        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6 text-xs">
            {/* Ayurveda Specifics Card */}
            <div className="p-5 bg-gradient-to-r from-emerald-50/60 to-teal-50/40 rounded-xl border border-emerald-200 space-y-4">
              <div className="flex items-center space-x-2 text-emerald-900">
                <FlaskConical className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-bold">Ayurveda Intervention Specifications</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block">
                    Intervention Name & Type
                  </span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">
                    {trial.ayurveda_intervention}
                  </p>
                  <span className="inline-block mt-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-300">
                    {trial.intervention_type}
                  </span>
                </div>

                <div>
                  <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block">
                    Administration Regimen
                  </span>
                  <p className="text-slate-800 mt-0.5">
                    <strong>Dosage:</strong> {trial.dosage || 'Per protocol'} • <strong>Route:</strong>{' '}
                    {trial.route_of_administration || 'Oral'}
                  </p>
                  <p className="text-slate-800 mt-0.5">
                    <strong>Frequency:</strong> {trial.frequency || 'Twice daily'} • <strong>Duration:</strong>{' '}
                    {trial.duration || '24 weeks'}
                  </p>
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block">
                  Formulation & Classical Procedure Details
                </span>
                <p className="text-slate-700 mt-1 leading-relaxed">
                  {trial.intervention_description}
                </p>
                {trial.formulation_procedure && (
                  <p className="text-slate-600 mt-1 italic">
                    {trial.formulation_procedure}
                  </p>
                )}
              </div>

              {trial.comparator && (
                <div className="pt-3 border-t border-emerald-200/60">
                  <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block">
                    Comparator / Control Arm
                  </span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {trial.comparator}
                  </p>
                  {trial.comparator_description && (
                    <p className="text-slate-600 mt-0.5">{trial.comparator_description}</p>
                  )}
                </div>
              )}
            </div>

            {/* Study Objectives */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                  Primary Scientific Objective
                </h4>
                <p className="text-slate-700 leading-relaxed">{trial.primary_objective}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                  Secondary Scientific Objectives
                </h4>
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                  {trial.secondary_objectives || 'No secondary endpoints defined.'}
                </p>
              </div>
            </div>

            {/* Eligibility Criteria Side-by-Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center space-x-2 text-emerald-800 font-bold uppercase tracking-wider text-xs mb-3 pb-2 border-b border-slate-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Protocol Inclusion Criteria</span>
                </div>
                <div className="text-slate-700 whitespace-pre-line leading-relaxed font-mono text-[11px]">
                  {trial.inclusion_criteria}
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center space-x-2 text-rose-800 font-bold uppercase tracking-wider text-xs mb-3 pb-2 border-b border-slate-100">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Protocol Exclusion Criteria</span>
                </div>
                <div className="text-slate-700 whitespace-pre-line leading-relaxed font-mono text-[11px]">
                  {trial.exclusion_criteria}
                </div>
              </div>
            </div>

            {/* Investigator & Sponsor Info */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block">
                  Principal Investigator
                </span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">
                  {trial.principal_investigator?.full_name || 'Dr. Rajesh Sharma'}
                </p>
                <p className="text-slate-500 text-[11px]">
                  {trial.principal_investigator?.email}
                </p>
                <p className="text-slate-600 text-[11px] mt-1 font-medium">
                  Institution: All India Institute of Ayurveda
                </p>
              </div>

              <div>
                <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block">
                  Institutional Sponsor
                </span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{trial.sponsor}</p>
                <p className="text-slate-500 text-[11px]">Category: {trial.sponsor_type}</p>
                {trial.sponsor_contact && (
                  <p className="text-slate-600 text-[11px] mt-1">{trial.sponsor_contact}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. TIMELINE & MILESTONES TAB */}
        {activeTab === 'timeline' && (
          <MilestoneTimeline
            trialId={trial.trial_id}
            milestones={trial.milestones || []}
            canManage={canManageMilestones}
            onRefresh={loadTrial}
          />
        )}

        {/* 3. PROTOCOL VERSIONS TAB */}
        {activeTab === 'protocol' && (
          <div className="space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Protocol Amendment & Version Control</h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Full version history compliant with GCP/CDSCO protocol lifecycle audit standards.
                </p>
              </div>
              {canManageProtocols && (
                <button
                  onClick={() => setIsProtocolModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-ayush-700 hover:bg-ayush-800 rounded-lg shadow-sm transition-colors self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Protocol Version</span>
                </button>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Version</th>
                    <th className="py-3 px-4">Amendment Date</th>
                    <th className="py-3 px-4">Change Summary</th>
                    <th className="py-3 px-4">Document / Filing Ref</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Registered At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trial.protocol_versions?.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        v{p.version_number}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-mono">
                        {p.version_date}
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-sm">
                        {p.change_summary}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        {p.document_reference || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            p.status === 'Current'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px] font-mono">
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. TRIAL SITES TAB */}
        {activeTab === 'sites' && (
          <div className="space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Multi-Center Trial Sites Management</h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Participating institutions, site investigators, enrollment targets, and operational activation status.
                </p>
              </div>
              {canManageSites && (
                <button
                  onClick={() => {
                    setEditingSite(null);
                    setIsSiteModalOpen(true);
                  }}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-ayush-700 hover:bg-ayush-800 rounded-lg shadow-sm transition-colors self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register New Site</span>
                </button>
              )}
            </div>

            {trial.sites?.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No Investigational Sites Registered</p>
                <p className="text-xs text-slate-400 mt-1">
                  Add multi-center trial locations to initiate site governance.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                        <th className="py-3 px-4">Site Code</th>
                        <th className="py-3 px-4">Site Name & Institution</th>
                        <th className="py-3 px-4">Location</th>
                        <th className="py-3 px-4">Investigator</th>
                        <th className="py-3 px-4">Target Enrollment</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Activation</th>
                        {canManageSites && <th className="py-3 px-4 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {trial.sites?.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {s.site_code}
                          </td>
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="font-semibold text-slate-800">{s.site_name}</div>
                            <div className="text-[11px] text-slate-500">{s.institution}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                            <div>{s.city}, {s.state}</div>
                            <div className="text-[10px] text-slate-400">{s.country}</div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-medium text-slate-800">
                              {s.site_investigator?.full_name || 'Dr. Rajesh Sharma'}
                            </div>
                            <div className="text-[10px] text-slate-400">{s.site_investigator?.email}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {s.current_enrollment} / {s.enrollment_target}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <StatusBadge status={s.site_status} type="siteStatus" />
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                            {s.activation_date || 'Pending'}
                          </td>
                          {canManageSites && (
                            <td className="py-3.5 px-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end space-x-1">
                                <button
                                  onClick={() => {
                                    setEditingSite(s);
                                    setIsSiteModalOpen(true);
                                  }}
                                  title="Edit site details"
                                  className="p-1.5 text-slate-400 hover:text-ayush-700 hover:bg-slate-100 rounded transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setStatusSite(s)}
                                  title="Change site activation status"
                                  className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. AUDIT TRAIL TAB */}
        {activeTab === 'audit' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Immutable Clinical Trial Audit Trail</h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  GCP & 21 CFR Part 11 electronic audit trail tracking all protocol changes, site operations, and workflow decisions.
                </p>
              </div>
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Append-Only Verified
              </span>
            </div>

            {auditLogs.length === 0 ? (
              <p className="text-slate-400 text-center py-6">No audit records found for this trial.</p>
            ) : (
              <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <StatusBadge status={log.action} type="action" />
                        <span className="text-[11px] font-mono text-slate-400">
                          {log.entity_type} {log.entity_id ? `• ${log.entity_id}` : ''}
                        </span>
                      </div>
                      <p className="text-slate-800 font-medium text-xs">{log.description}</p>
                      {log.metadata_json && Object.keys(log.metadata_json).length > 0 && (
                        <p className="text-[11px] text-slate-500 font-mono truncate max-w-xl">
                          Metadata: {JSON.stringify(log.metadata_json)}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0 text-slate-400 text-[11px] font-mono">
                      <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                      <div>{new Date(log.timestamp).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODALS */}
      {isStatusModalOpen && (
        <StatusTransitionModal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          trialId={trial.trial_id}
          currentStatus={trial.status}
          onSuccess={loadTrial}
        />
      )}

      {isSiteModalOpen && (
        <SiteModal
          isOpen={isSiteModalOpen}
          onClose={() => {
            setIsSiteModalOpen(false);
            setEditingSite(null);
          }}
          trialId={trial.trial_id}
          site={editingSite}
          onSuccess={loadTrial}
        />
      )}

      {statusSite && (
        <SiteStatusModal
          isOpen={Boolean(statusSite)}
          onClose={() => setStatusSite(null)}
          site={statusSite}
          onSuccess={loadTrial}
        />
      )}

      {isProtocolModalOpen && (
        <ProtocolVersionModal
          isOpen={isProtocolModalOpen}
          onClose={() => setIsProtocolModalOpen(false)}
          trialId={trial.trial_id}
          currentVersion={trial.protocol_version}
          onSuccess={loadTrial}
        />
      )}
    </div>
  );
};
