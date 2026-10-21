import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, CheckCircle2, ShieldAlert, ArrowUpRight, AlertCircle, Info } from 'lucide-react';
import api from '../../api/client';
import { Card } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

export function CompliancePage() {
  const [summary, setSummary] = useState(null);
  const [controls, setControls] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadComplianceData() {
      try {
        let query = '/compliance/controls';
        const params = [];
        if (categoryFilter) params.push(`category=${encodeURIComponent(categoryFilter)}`);
        if (statusFilter) params.push(`status=${encodeURIComponent(statusFilter)}`);
        if (params.length > 0) query += `?${params.join('&')}`;

        const [sumRes, ctrlRes] = await Promise.all([
          api.get('/compliance/summary'),
          api.get(query),
        ]);

        if (sumRes.success) setSummary(sumRes.data);
        if (ctrlRes.success) setControls(ctrlRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadComplianceData();
  }, [categoryFilter, statusFilter]);

  if (loading) return <LoadingSkeleton rows={6} height="h-24" />;

  const complianceScore = summary?.complianceScore ?? 100;
  const coverage = summary?.complianceCoverage ?? 100;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="pb-2 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          NIST Cybersecurity Framework 2.0 Compliance
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Automated control evaluation and security baseline posture tracking
        </p>
      </div>

      {/* Mandatory Disclaimer Alert */}
      <div className="p-3.5 bg-blue-950/40 border border-blue-800/60 rounded-xl text-xs text-blue-300 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold block text-blue-200">Demonstration Assessment Notice</span>
          <p className="text-[11px] text-blue-300/80 mt-0.5 leading-relaxed">
            {summary?.disclaimer ||
              'This mapping reflects automated rule checks against a simulated cloud inventory inspired by NIST CSF 2.0 guidelines. It does not constitute formal certification, an accredited SOC2 audit, or guarantee regulatory compliance.'}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Compliance Score</span>
          <span className="text-3xl font-extrabold font-mono text-blue-400 mt-1 block">
            {complianceScore !== null ? `${complianceScore}%` : 'N/A'}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {summary?.passedControls || 0} passed of {summary?.totalAssessedControls || 0} assessed
          </span>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Control Coverage</span>
          <span className="text-3xl font-extrabold font-mono text-purple-400 mt-1 block">
            {coverage}%
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Applicable assets evaluated
          </span>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Failing Controls</span>
          <span className="text-3xl font-extrabold font-mono text-red-400 mt-1 block">
            {summary?.failedControls || 0}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Require remediation
          </span>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Framework Controls</span>
          <span className="text-3xl font-extrabold font-mono text-white mt-1 block">
            {summary?.totalControls || 10}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            NIST CSF 2.0 cloud profile
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#111827] border border-slate-800 p-4 rounded-xl flex flex-wrap items-center gap-3">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Control Categories</option>
          <option value="Governance & Asset Inventory">Governance & Asset Inventory</option>
          <option value="Identity & Access Management">Identity & Access Management</option>
          <option value="Data Protection">Data Protection</option>
          <option value="Infrastructure Security">Infrastructure Security</option>
          <option value="Logging & Monitoring">Logging & Monitoring</option>
          <option value="Backup & Recovery">Backup & Recovery</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="pass">Pass</option>
          <option value="fail">Fail</option>
          <option value="not_applicable">Not Applicable</option>
          <option value="not_assessed">Not Assessed</option>
        </select>
      </div>

      {/* Controls List */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-800">
        {controls.map((ctrl) => (
          <div key={ctrl.controlId} className="p-4 hover:bg-slate-800/40 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-blue-400">
                    {ctrl.controlId}
                  </span>
                  <span className="text-xs font-semibold text-slate-100">{ctrl.title}</span>
                  <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded border border-slate-700">
                    {ctrl.nistFunction}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                  {ctrl.description}
                </p>

                <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-2">
                  <span>Category: <strong className="text-slate-400">{ctrl.category}</strong></span>
                  <span>Mapped Rules: <strong className="text-slate-400 font-mono">[{ctrl.mappedRuleIds?.join(', ')}]</strong></span>
                  {ctrl.failingResourcesCount > 0 && (
                    <span className="text-red-400 font-semibold">
                      {ctrl.failingResourcesCount} failing asset(s)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <StatusBadge status={ctrl.status} />
                <Link
                  to={`/compliance/controls/${ctrl.controlId}`}
                  className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 font-medium mt-1"
                >
                  Control Evidence <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
