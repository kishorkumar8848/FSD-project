import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ScanSearch,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  GitCompare,
  ArrowUpRight,
} from 'lucide-react';
import api from '../../api/client';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { SeverityBadge, StatusBadge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

export function ScanDetailPage() {
  const { id } = useParams();
  const [scan, setScan] = useState(null);
  const [findings, setFindings] = useState([]);
  const [compliance, setCompliance] = useState([]);
  const [diff, setDiff] = useState(null);
  const [activeTab, setActiveTab] = useState('findings'); // 'findings' | 'compliance' | 'diff'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadScanData() {
      try {
        const [scanRes, findRes, compRes, diffRes] = await Promise.all([
          api.get(`/scans/${id}`),
          api.get(`/scans/${id}/findings`),
          api.get(`/scans/${id}/compliance`),
          api.get(`/scans/${id}/diff`),
        ]);

        if (scanRes.success) setScan(scanRes.data);
        if (findRes.success) setFindings(findRes.data);
        if (compRes.success) setCompliance(findRes.data ? compRes.data : []);
        if (diffRes.success) setDiff(diffRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadScanData();
  }, [id]);

  if (loading) return <LoadingSkeleton rows={6} height="h-24" />;
  if (!scan) return <div className="text-center py-12 text-slate-400">Scan record not found.</div>;

  const score = scan.postureScore ?? 100;
  const scoreColor =
    score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Scan Center', to: '/scans' },
          { label: `Scan ${scan._id.slice(-8).toUpperCase()}` },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Assessment Report #{scan._id.slice(-8).toUpperCase()}
            </h1>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                scan.status === 'completed'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/15 text-red-400 border border-red-500/30'
              }`}
            >
              {scan.status}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Account: <span className="text-slate-200 font-medium">{scan.account?.name}</span> • Type:{' '}
            <span className="uppercase font-mono">{scan.scanType}</span> • Executed:{' '}
            {new Date(scan.completedAt || scan.startedAt).toLocaleString()}
          </div>
        </div>

        <Link to={`/reports`}>
          <Button variant="outline" size="sm">
            Export PDF Report
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Posture Score</span>
          <span className={`text-2xl font-bold font-mono ${scoreColor} mt-1 block`}>
            {score} / 100
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Penalty-deducted score</span>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Compliance</span>
          <span className="text-2xl font-bold font-mono text-blue-400 mt-1 block">
            {scan.complianceScore !== null ? `${scan.complianceScore}%` : 'N/A'}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">NIST CSF 2.0 pass rate</span>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Active Findings</span>
          <span className="text-2xl font-bold font-mono text-red-400 mt-1 block">
            {scan.findingsSummary?.totalActive || 0}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            {scan.findingsSummary?.critical || 0} Critical • {scan.findingsSummary?.high || 0} High
          </span>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Resolved Issues</span>
          <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
            +{scan.findingsSummary?.resolvedFindings || 0}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Verified compliant</span>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Evaluated Assets</span>
          <span className="text-2xl font-bold font-mono text-white mt-1 block">
            {scan.resourcesEvaluatedCount || 0}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Duration: {(scan.durationMs / 1000).toFixed(1)}s
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('findings')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'findings'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Discovered Findings ({findings.length})
        </button>

        <button
          onClick={() => setActiveTab('compliance')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'compliance'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          NIST Controls Assessment ({compliance.length})
        </button>

        <button
          onClick={() => setActiveTab('diff')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'diff'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Configuration Drift & Diff ({diff?.driftEvents?.length || 0})
        </button>
      </div>

      {/* Tab 1: Findings Table */}
      {activeTab === 'findings' && (
        <Card title="Assessment Findings" subtitle="All misconfigurations evaluated during this run">
          <div className="divide-y divide-slate-800">
            {findings.length === 0 ? (
              <div className="py-8 text-center text-xs text-emerald-400">
                ✓ Perfect evaluation! Zero misconfigurations detected.
              </div>
            ) : (
              findings.map((f) => (
                <div key={f._id} className="py-3 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <SeverityBadge severity={f.severity} />
                    <div>
                      <Link
                        to={`/findings/${f._id}`}
                        className="text-xs font-semibold text-slate-200 hover:text-blue-400 block"
                      >
                        {f.title}
                      </Link>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {f.ruleId} • Resource: {f.resourceName} ({f.resourceType})
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-2xl">
                        {f.evidence?.message || f.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <StatusBadge status={f.status} />
                    <span className="block text-[11px] font-mono text-slate-500 mt-1">
                      Risk: {f.riskScore}/100
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Tab 2: Compliance Results */}
      {activeTab === 'compliance' && (
        <Card title="NIST CSF 2.0 Control Results" subtitle="Per-control audit results for this scan snapshot">
          <div className="divide-y divide-slate-800">
            {compliance.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No compliance controls evaluated.</div>
            ) : (
              compliance.map((cr) => (
                <div key={cr._id} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-blue-400">{cr.controlId}</span>
                      <span className="text-xs font-semibold text-slate-200">{cr.controlTitle}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Category: {cr.category} • Assessed: {cr.applicableResourcesCount} asset(s)
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {cr.remediationGuidance}
                    </p>
                  </div>
                  <StatusBadge status={cr.status} />
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Tab 3: Configuration Drift & Diff */}
      {activeTab === 'diff' && (
        <Card
          title="Configuration Drift & Regression Analysis"
          subtitle="Field-by-field modifications detected between this assessment and the previous baseline"
        >
          <div className="space-y-4">
            {/* Diff Delta Header */}
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400">Comparing Against: </span>
                <span className="font-mono text-slate-200">
                  {diff?.previousScan
                    ? `Scan #${diff.previousScan._id.slice(-8).toUpperCase()} (${new Date(
                        diff.previousScan.createdAt
                      ).toLocaleDateString()})`
                    : 'Initial Baseline Assessment'}
                </span>
              </div>
              <div className="flex items-center gap-4 font-mono">
                <span>
                  Posture Delta:{' '}
                  <span
                    className={
                      diff?.postureDelta > 0
                        ? 'text-emerald-400 font-bold'
                        : diff?.postureDelta < 0
                        ? 'text-red-400 font-bold'
                        : 'text-slate-400'
                    }
                  >
                    {diff?.postureDelta > 0 ? `+${diff.postureDelta}` : diff?.postureDelta}
                  </span>
                </span>
              </div>
            </div>

            {/* Drift Events List */}
            {diff?.driftEvents?.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No configuration drift detected between consecutive snapshots.
              </div>
            ) : (
              <div className="space-y-3">
                {diff.driftEvents.map((ev, i) => (
                  <div key={i} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                            ev.driftType === 'security_regression'
                              ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                              : ev.driftType === 'security_improvement'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {ev.driftType.replace('_', ' ')}
                        </span>
                        <span className="font-semibold text-slate-200">{ev.resourceName}</span>
                        <span className="font-mono text-slate-500 text-[11px]">({ev.resourceId})</span>
                      </div>
                      <span className="text-slate-500 text-[11px]">
                        {new Date(ev.detectedAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">{ev.description}</p>

                    {/* Field Comparison Box */}
                    {ev.changedFields?.length > 0 && (
                      <div className="mt-2 bg-[#090D16] border border-slate-800 rounded-lg p-3 text-xs font-mono space-y-1">
                        {ev.changedFields.map((field, fIdx) => (
                          <div key={fIdx} className="grid grid-cols-3 gap-2">
                            <span className="text-slate-400 truncate">{field.fieldPath}:</span>
                            <span className="text-red-400 bg-red-950/30 px-1 rounded truncate">
                              - {JSON.stringify(field.previousValue)}
                            </span>
                            <span className="text-emerald-400 bg-emerald-950/30 px-1 rounded truncate">
                              + {JSON.stringify(field.currentValue)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
