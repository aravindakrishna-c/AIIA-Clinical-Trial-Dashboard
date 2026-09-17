import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import { trialService } from '../services/trialService';
import type {
  DashboardMetricsResponse,
  DashboardAlertItem,
  ClinicalTrialListItem
} from '../types';
import {
  Users,
  AlertTriangle,
  Activity,
  Calendar,
  Clock,
  CheckCircle,
  Building,
  RefreshCw,
  TrendingUp,
  ArrowRight,
  FlaskConical,
  Bell,
  AlertCircle,
  Filter
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetricsResponse | null>(null);
  const [alerts, setAlerts] = useState<DashboardAlertItem[]>([]);
  const [trials, setTrials] = useState<ClinicalTrialListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [selectedTrialId, setSelectedTrialId] = useState<number | undefined>(undefined);
  const [selectedSiteId, setSelectedSiteId] = useState<number | undefined>(undefined);

  const loadDashboard = useCallback(async (showRefreshingSpinner = false) => {
    try {
      if (showRefreshingSpinner) setIsRefreshing(true);
      const [m, a, tList] = await Promise.all([
        dashboardService.getMetrics(selectedTrialId, selectedSiteId),
        dashboardService.getAlerts(),
        trialService.getTrials({ limit: 50 })
      ]);
      setMetrics(m);
      setAlerts(a);
      setTrials(tList);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Error loading dashboard data', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedTrialId, selectedSiteId]);

  useEffect(() => {
    loadDashboard();

    // Auto-refresh interval (every 45 seconds)
    const interval = setInterval(() => {
      loadDashboard(false);
    }, 45000);

    return () => clearInterval(interval);
  }, [loadDashboard]);

  if (isLoading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ayush-700"></div>
      </div>
    );
  }

  const trialStats = metrics?.trial_stats;
  const partStats = metrics?.participant_stats;
  const safetyStats = metrics?.safety_stats;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-ayush-950 via-ayush-900 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-ayush-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-ayush-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <span>All India Institute of Ayurveda (AIIA)</span>
              <span>•</span>
              <span className="text-emerald-400">Clinical Research Monitoring Platform</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Clinical Trials Operations Dashboard
            </h1>
            <p className="text-slate-300 text-xs mt-1 max-w-2xl">
              Real-time oversight of multi-centric Ayurveda clinical trials, GCP compliance, participant lifecycles, and pharmacovigilance surveillance.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <span className="text-[11px] text-slate-400 block font-mono">
                Auto-refreshed: {lastRefreshed.toLocaleTimeString()}
              </span>
              <span className="inline-flex items-center text-[10px] text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5 animate-pulse"></span>
                PostgreSQL Dynamic KPIs
              </span>
            </div>

            <button
              onClick={() => loadDashboard(true)}
              disabled={isRefreshing}
              className="p-2.5 bg-ayush-800 hover:bg-ayush-700 text-white rounded-xl border border-ayush-600/50 shadow-sm transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Bar inside header */}
        <div className="mt-5 pt-4 border-t border-ayush-800/60 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <Filter className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium">Filter Dashboard Scope:</span>
          </div>

          <select
            value={selectedTrialId || ''}
            onChange={(e) => setSelectedTrialId(e.target.value ? Number(e.target.value) : undefined)}
            className="bg-ayush-900 border border-ayush-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="">All Clinical Trials ({trials.length})</option>
            {trials.map((t) => (
              <option key={t.id} value={t.id}>
                {t.trial_id} - {t.trial_title.substring(0, 30)}...
              </option>
            ))}
          </select>

          {selectedTrialId && (
            <button
              onClick={() => {
                setSelectedTrialId(undefined);
                setSelectedSiteId(undefined);
              }}
              className="text-xs text-emerald-400 hover:text-emerald-300 underline font-medium"
            >
              Clear Scope
            </button>
          )}
        </div>
      </div>

      {/* KPI Ribbon: 4 Primary Functional Areas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Clinical Trials */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Clinical Trials</span>
            <FlaskConical className="w-5 h-5 text-ayush-700" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{trialStats?.total_trials ?? 0}</span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {trialStats?.active_trials ?? 0} Active / Recruiting
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 pt-1 text-[11px] text-slate-600 border-t border-slate-50">
            <div>
              <span className="text-slate-400 block text-[10px]">Draft</span>
              <span className="font-bold text-slate-800">{trialStats?.draft_trials ?? 0}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Completed</span>
              <span className="font-bold text-slate-800">{trialStats?.completed_trials ?? 0}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Suspended</span>
              <span className="font-bold text-slate-800">{trialStats?.suspended_trials ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Participants */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Participants</span>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{partStats?.total_screened ?? 0}</span>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              {partStats?.enrolled ?? 0} Enrolled ({partStats?.randomized ?? 0} Rnd)
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 pt-1 text-[11px] text-slate-600 border-t border-slate-50">
            <div>
              <span className="text-slate-400 block text-[10px]">Eligible</span>
              <span className="font-bold text-slate-800">{partStats?.eligible ?? 0}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Active Protocol</span>
              <span className="font-bold text-emerald-700">{partStats?.active ?? 0}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Withdrawn</span>
              <span className="font-bold text-slate-800">{partStats?.withdrawn ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Sites & Operations */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sites & Protocol Visits</span>
            <Building className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{metrics?.total_sites ?? 0}</span>
            <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              {metrics?.recruiting_sites ?? 0} Recruiting
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 pt-1 text-[11px] text-slate-600 border-t border-slate-50">
            <div>
              <span className="text-slate-400 block text-[10px]">Active Sites</span>
              <span className="font-bold text-slate-800">{metrics?.activated_sites ?? 0}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Overdue Visits</span>
              <span className={`font-bold ${(metrics?.overdue_visits_count ?? 0) > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                {metrics?.overdue_visits_count ?? 0}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Statutory Filings</span>
              <span className="font-bold text-slate-800">{metrics?.regulatory_deadlines_count ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Safety & Pharmacovigilance */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pharmacovigilance (PV)</span>
            <Activity className="w-5 h-5 text-rose-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{safetyStats?.total_ae ?? 0}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
              (safetyStats?.total_sae ?? 0) > 0
                ? 'bg-rose-100 text-rose-800 border-rose-300'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              {safetyStats?.total_sae ?? 0} SAE Serious
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 pt-1 text-[11px] text-slate-600 border-t border-slate-50">
            <div>
              <span className="text-slate-400 block text-[10px]">Ayush ADRs</span>
              <span className="font-bold text-purple-700">{safetyStats?.total_adr ?? 0}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Under Review</span>
              <span className="font-bold text-amber-600">{safetyStats?.events_under_review ?? 0}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Resolved</span>
              <span className="font-bold text-emerald-700">{safetyStats?.resolved_events ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Live Centralized Alert Center */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-amber-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Real-Time Operations & Compliance Alert Center
              </h2>
              <p className="text-xs text-slate-500">
                Automated GCP risk notifications, protocol deviation flags, and deadline monitoring
              </p>
            </div>
          </div>
          <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-bold">
            {alerts.length} Active Alerts
          </span>
        </div>

        {alerts.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 flex flex-col items-center justify-center">
            <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
            <span className="font-semibold text-slate-700">All Operations Clear</span>
            <span className="text-slate-400 mt-0.5">No overdue visits, unresolved SAEs, or expiring ethics approvals.</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {alerts.map((alert) => {
              const isCrit = alert.severity === 'CRITICAL';
              const isWarn = alert.severity === 'WARNING';
              return (
                <div
                  key={alert.id}
                  className={`p-3.5 flex items-start justify-between hover:bg-slate-50 transition-colors ${
                    isCrit ? 'bg-rose-50/30' : isWarn ? 'bg-amber-50/20' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5">
                      {isCrit ? (
                        <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      ) : isWarn ? (
                        <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-slate-900">{alert.title}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                            alert.category === 'SAFETY'
                              ? 'bg-rose-100 text-rose-800'
                              : alert.category === 'VISIT'
                              ? 'bg-amber-100 text-amber-800'
                              : alert.category === 'ETHICS'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {alert.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {alert.entity_type} #{alert.entity_id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 leading-normal">{alert.message}</p>
                    </div>
                  </div>

                  {alert.action_url && (
                    <Link
                      to={alert.action_url}
                      className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-100 transition-colors ml-4 flex-shrink-0"
                    >
                      View <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section: Recruitment & Site Enrollment Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (7 cols): Trial Enrollment Progress */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-emerald-700" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Trial Enrollment Targets vs Actuals
              </h2>
            </div>
            <Link to="/trials" className="text-xs text-ayush-700 hover:underline font-semibold">
              All Trials
            </Link>
          </div>

          <div className="space-y-4">
            {metrics?.trial_enrollment_progress?.map((prog) => {
              const pct = Math.min(100, Math.max(0, prog.enrollment_percentage));
              return (
                <div key={prog.trial_id} className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-slate-900">{prog.trial_id_str}</span>
                      <span className="text-slate-600 ml-2 font-medium truncate max-w-xs inline-block align-bottom">
                        {prog.trial_title}
                      </span>
                    </div>
                    <div className="text-right font-mono font-bold text-slate-800">
                      <span>{prog.current_enrolled}</span>
                      <span className="text-slate-400 font-normal"> / {prog.target_participants}</span>
                      <span className="ml-2 text-ayush-800 text-[11px]">({pct.toFixed(1)}%)</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        pct >= 80 ? 'bg-emerald-600' : pct >= 40 ? 'bg-blue-600' : 'bg-amber-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right (5 cols): Site Enrollment Breakdown */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Building className="w-5 h-5 text-purple-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Multi-Centric Site Enrollment
              </h2>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Real-time</span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto">
            {metrics?.site_enrollment_breakdown?.map((site) => (
              <div
                key={site.site_id}
                className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono font-bold text-slate-800">{site.site_code}</span>
                    <span className="text-slate-500 text-[11px]">({site.trial_id_str})</span>
                  </div>
                  <p className="text-slate-700 font-medium text-[11px] mt-0.5 truncate max-w-xs">{site.site_name}</p>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-slate-900">
                    {site.current_enrollment} / {site.enrollment_target}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    {site.enrollment_percentage.toFixed(0)}% Target
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section: Status Distributions & Trends */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Participant Status Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Participant Status Funnel
          </h3>
          <div className="space-y-2 text-xs">
            {metrics?.participant_status_distribution?.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">{item.status}</span>
                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Trial Status Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Trial Status Portfolio
          </h3>
          <div className="space-y-2 text-xs">
            {metrics?.trial_status_distribution?.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">{item.status}</span>
                <span className="font-mono font-bold text-ayush-800 bg-ayush-50 px-2 py-0.5 rounded border border-ayush-100">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Safety Trend AE/SAE */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Pharmacovigilance Monthly Trend
          </h3>
          <div className="space-y-2.5 text-xs">
            {metrics?.safety_trend?.map((item) => (
              <div key={item.month} className="flex items-center justify-between border-b border-slate-50 pb-1.5">
                <span className="font-mono text-slate-700 font-medium">{item.month}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-semibold">
                    {item.ae_count} AE
                  </span>
                  <span className="text-[11px] bg-rose-100 px-1.5 py-0.5 rounded text-rose-800 font-semibold">
                    {item.sae_count} SAE
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section: Upcoming Trial Milestones */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-ayush-700" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Upcoming Study Milestones & Governance Deadlines
            </h2>
          </div>
          <Link to="/ethics-regulatory" className="text-xs text-ayush-700 hover:underline font-semibold">
            View Regulatory Registry
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Trial</th>
                <th className="py-2.5 px-4">Milestone</th>
                <th className="py-2.5 px-4">Planned Date</th>
                <th className="py-2.5 px-4">Actual Date</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Deadline Tracker</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metrics?.milestones?.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{m.trial_id_str}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900">{m.milestone_name}</td>
                  <td className="py-2.5 px-4 text-slate-600">{m.planned_date}</td>
                  <td className="py-2.5 px-4 text-slate-600">{m.actual_date || '—'}</td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                      {m.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        m.deadline_status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : m.deadline_status === 'Overdue'
                          ? 'bg-rose-100 text-rose-800'
                          : m.deadline_status === 'Due Soon'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {m.deadline_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
