import React from 'react';

export function SeverityBadge({ severity }) {
  const sev = (severity || 'info').toLowerCase();
  const styles = {
    critical: 'bg-red-500/15 text-red-400 border-red-500/30',
    high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    low: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    info: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
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
    open: 'bg-red-500/10 text-red-300 border-red-500/20',
    in_progress: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    accepted_risk: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
    false_positive: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    pass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    fail: 'bg-red-500/10 text-red-400 border-red-500/20',
    not_applicable: 'bg-slate-600/15 text-slate-400 border-slate-600/30',
    not_assessed: 'bg-slate-600/15 text-slate-400 border-slate-600/30',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
        styles[stat] || 'bg-slate-700 text-slate-300 border-slate-600'
      }`}
    >
      {labels[stat] || status}
    </span>
  );
}

export function EnvironmentBadge({ env }) {
  const val = (env || 'development').toLowerCase();
  const styles = {
    production: 'bg-red-950/40 text-red-300 border-red-800/40',
    staging: 'bg-amber-950/40 text-amber-300 border-amber-800/40',
    development: 'bg-blue-950/40 text-blue-300 border-blue-800/40',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono border ${styles[val] || styles.development}`}>
      {val}
    </span>
  );
}
