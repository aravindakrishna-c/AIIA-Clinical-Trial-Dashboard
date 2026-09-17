import React from 'react';

interface StatusBadgeProps {
  status: boolean | string;
  type?: 'status' | 'role' | 'action' | 'trialStatus' | 'siteStatus' | 'milestoneStatus' | 'participantStatus';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'status', className = '' }) => {
  if (type === 'participantStatus') {
    const s = String(status);
    let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
    let dotClass = 'bg-slate-400';

    switch (s) {
      case 'Screened':
        colorClass = 'bg-slate-100 text-slate-700 border-slate-300';
        dotClass = 'bg-slate-500';
        break;
      case 'Eligible':
        colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-300';
        dotClass = 'bg-emerald-500';
        break;
      case 'Ineligible':
        colorClass = 'bg-rose-50 text-rose-800 border-rose-200';
        dotClass = 'bg-rose-500';
        break;
      case 'Enrolled':
        colorClass = 'bg-blue-50 text-blue-800 border-blue-300';
        dotClass = 'bg-blue-600';
        break;
      case 'Randomized':
      case 'Active':
        colorClass = 'bg-purple-50 text-purple-800 border-purple-300';
        dotClass = 'bg-purple-600';
        break;
      case 'Completed':
        colorClass = 'bg-emerald-100 text-emerald-900 border-emerald-400';
        dotClass = 'bg-emerald-700';
        break;
      case 'Withdrawn':
      case 'Lost to Follow-up':
        colorClass = 'bg-rose-100 text-rose-900 border-rose-300';
        dotClass = 'bg-rose-600';
        break;
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClass} ${className}`}>
        <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${dotClass}`} />
        {s}
      </span>
    );
  }
  if (type === 'status') {
    const isActive = Boolean(status);
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
          isActive
            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            : 'bg-rose-100 text-rose-800 border border-rose-200'
        } ${className}`}
      >
        <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${isActive ? 'bg-emerald-600' : 'bg-rose-600'}`} />
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  }

  if (type === 'trialStatus') {
    const s = String(status);
    let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
    let dotClass = 'bg-slate-400';

    switch (s) {
      case 'Draft':
        colorClass = 'bg-slate-100 text-slate-700 border-slate-300';
        dotClass = 'bg-slate-400';
        break;
      case 'Ethics Review':
        colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        dotClass = 'bg-indigo-500 animate-pulse';
        break;
      case 'Ethics Approved':
        colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
        dotClass = 'bg-emerald-500';
        break;
      case 'CTRI Pending':
        colorClass = 'bg-amber-50 text-amber-800 border-amber-200';
        dotClass = 'bg-amber-500';
        break;
      case 'Recruiting':
        colorClass = 'bg-sky-50 text-sky-800 border-sky-300 shadow-sm';
        dotClass = 'bg-sky-500 animate-pulse';
        break;
      case 'Active':
        colorClass = 'bg-teal-50 text-teal-800 border-teal-200';
        dotClass = 'bg-teal-500';
        break;
      case 'Suspended':
        colorClass = 'bg-orange-50 text-orange-800 border-orange-200';
        dotClass = 'bg-orange-500';
        break;
      case 'Completed':
        colorClass = 'bg-purple-50 text-purple-800 border-purple-200';
        dotClass = 'bg-purple-500';
        break;
      case 'Terminated':
        colorClass = 'bg-rose-50 text-rose-800 border-rose-200';
        dotClass = 'bg-rose-500';
        break;
      case 'Closed':
        colorClass = 'bg-zinc-100 text-zinc-700 border-zinc-300';
        dotClass = 'bg-zinc-400';
        break;
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${colorClass} ${className}`}>
        <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${dotClass}`} />
        {s}
      </span>
    );
  }

  if (type === 'siteStatus') {
    const s = String(status);
    let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
    let dotClass = 'bg-slate-400';

    switch (s) {
      case 'Pending':
        colorClass = 'bg-slate-100 text-slate-700 border-slate-300';
        dotClass = 'bg-slate-400';
        break;
      case 'Ethics Pending':
        colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        dotClass = 'bg-indigo-500';
        break;
      case 'Activated':
        colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
        dotClass = 'bg-emerald-500';
        break;
      case 'Recruiting':
        colorClass = 'bg-blue-50 text-blue-800 border-blue-200';
        dotClass = 'bg-blue-500 animate-pulse';
        break;
      case 'Suspended':
        colorClass = 'bg-orange-50 text-orange-800 border-orange-200';
        dotClass = 'bg-orange-500';
        break;
      case 'Closed':
        colorClass = 'bg-zinc-100 text-zinc-700 border-zinc-300';
        dotClass = 'bg-zinc-400';
        break;
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${colorClass} ${className}`}>
        <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${dotClass}`} />
        {s}
      </span>
    );
  }

  if (type === 'milestoneStatus') {
    const s = String(status);
    let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';

    switch (s) {
      case 'Planned':
        colorClass = 'bg-slate-100 text-slate-700 border-slate-300';
        break;
      case 'In Progress':
        colorClass = 'bg-blue-50 text-blue-700 border-blue-200 font-medium';
        break;
      case 'Completed':
        colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium';
        break;
      case 'Delayed':
        colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'Cancelled':
        colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
        break;
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${colorClass} ${className}`}>
        {s}
      </span>
    );
  }

  if (type === 'action') {
    const actionStr = String(status);
    let colorClass = 'bg-slate-100 text-slate-800 border-slate-200';

    if (actionStr.includes('SUCCESS') || actionStr.includes('CREATED') || actionStr.includes('ACTIVATED')) {
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (actionStr.includes('FAILED') || actionStr.includes('DEACTIVATED') || actionStr.includes('ERROR')) {
      colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
    } else if (actionStr.includes('STATUS') || actionStr.includes('ROLE') || actionStr.includes('UPDATED')) {
      colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
    } else if (actionStr.includes('LOGOUT')) {
      colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border ${colorClass} ${className}`}>
        {actionStr}
      </span>
    );
  }

  // Role badge
  const roleName = String(status);
  const roleColors: Record<string, string> = {
    ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
    PRINCIPAL_INVESTIGATOR: 'bg-blue-100 text-blue-800 border-blue-200',
    STUDY_COORDINATOR: 'bg-teal-100 text-teal-800 border-teal-200',
    CLINICAL_TRIAL_MONITOR: 'bg-amber-100 text-amber-800 border-amber-200',
    ETHICS_COMMITTEE: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    PHARMACOVIGILANCE_OFFICER: 'bg-rose-100 text-rose-800 border-rose-200',
    REGULATOR: 'bg-slate-200 text-slate-800 border-slate-300',
  };

  const style = roleColors[roleName] || 'bg-slate-100 text-slate-800 border-slate-200';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style} ${className}`}>
      {roleName.replace(/_/g, ' ')}
    </span>
  );
};
