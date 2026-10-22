import React from 'react';

export function SeverityBadge({ severity }) {
  const sev = (severity || 'info').toLowerCase();
  const styles = {
    critical: 'bg-red-50 text-red-700 border-red-200',
    high: 'bg-orange-50 text-orange-700 border-orange-200',
    medium: 'bg-amber-50 text-amber-800 border-amber-200',
    low: 'bg-blue-50 text-blue-700 border-blue-200',
    info: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border ${
        styles[sev] || styles.info
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        sev === 'critical' ? 'bg-red-500' :
        sev === 'high' ? 'bg-orange-500' :
        sev === 'medium' ? 'bg-amber-500' :
        sev === 'low' ? 'bg-blue-500' : 'bg-slate-400'
      }`} />
      {severity}
    </span>
  );
}

export function StatusBadge({ status }) {
  const stat = (status || 'open').toLowerCase();
  const labels = {
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    accepted_risk: 'Accepted Risk',
    false_positive: 'False Positive',
    pass: 'Pass',
    fail: 'Fail',
    not_applicable: 'N/A',
    not_assessed: 'Not Assessed',
  };

  const styles = {
    open: 'bg-red-50 text-red-700 border-red-200',
    in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
    resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    accepted_risk: 'bg-purple-50 text-purple-700 border-purple-200',
    false_positive: 'bg-slate-100 text-slate-600 border-slate-200',
    pass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    fail: 'bg-red-50 text-red-700 border-red-200',
    not_applicable: 'bg-slate-100 text-slate-600 border-slate-200',
    not_assessed: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        styles[stat] || 'bg-slate-100 text-slate-700 border-slate-200'
      }`}
    >
      {labels[stat] || status}
    </span>
  );
}

export function EnvironmentBadge({ env }) {
  const val = (env || 'development').toLowerCase();
  const styles = {
    production: 'bg-red-50 text-red-700 border-red-200',
    staging: 'bg-amber-50 text-amber-700 border-amber-200',
    development: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border ${styles[val] || styles.development}`}>
      {val}
    </span>
  );
}
