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
  if (!scan) return <div className="text-center py-12 text-slate-500">Scan record not found.</div>;

  const score = scan.postureScore ?? 100;
  const scoreColor =
    score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="space-y-6 pb-12">
      <Breadcrumbs
        items={[
          { label: 'Scan Center', to: '/scans' },
          { label: `Scan ${scan._id.slice(-8).toUpperCase()}` },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Assessment Report #{scan._id.slice(-8).toUpperCase()}
            </h1>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                scan.status === 'completed'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {scan.status}
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Account: <span className="text-slate-900 font-medium">{scan.account?.name}</span> • Type:{' '}
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
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Posture Score</span>
          <span className={`text-2xl font-bold font-mono ${scoreColor} mt-1 block`}>
            {score} / 100
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Penalty-deducted score</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Compliance</span>
          <span className="text-2xl font-bold font-mono text-blue-600 mt-1 block">
            {scan.complianceScore !== null ? `${scan.complianceScore}%` : 'N/A'}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">NIST CSF 2.0 pass rate</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Active Findings</span>
          <span className="text-2xl font-bold font-mono text-red-600 mt-1 block">
            {scan.findingsSummary?.totalActive || 0}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {scan.findingsSummary?.critical || 0} Critical • {scan.findingsSummary?.high || 0} High
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Resolved Issues</span>
          <span className="text-2xl font-bold font-mono text-emerald-600 mt-1 block">
            +{scan.findingsSummary?.resolvedFindings || 0}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Verified compliant</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Evaluated Assets</span>
          <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
            {scan.resourcesEvaluatedCount || 0}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Duration: {(scan.durationMs / 1000).toFixed(1)}s
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('findings')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'findings'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Discovered Findings ({findings.length})
        </button>

        <button
          onClick={() => setActiveTab('compliance')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'compliance'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          NIST Controls Assessment ({compliance.length})
        </button>

        <button
          onClick={() => setActiveTab('diff')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'diff'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Configuration Drift & Diff ({diff?.driftEvents?.length || 0})
        </button>
      </div>

      {/* Tab 1: Findings Table */}
      {activeTab === 'findings' && (
        <Card title="Assessment Findings" subtitle="All misconfigurations evaluated during this run">
          <div className="divide-y divide-slate-100">
            {findings.length === 0 ? (
              <div className="py-8 text-center text-xs text-emerald-600 font-medium">
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
                        className="text-xs font-semibold text-slate-900 hover:text-blue-600 block transition-colors"
                      >
                        {f.title}
                      </Link>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {f.ruleId} • Resource: {f.resourceName} ({f.resourceType})
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 max-w-2xl">
                        {f.evidence?.message || f.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <StatusBadge status={f.status} />
                    <span className="block text-[11px] font-mono text-slate-400 mt-1">
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
          <div className="divide-y divide-slate-100">
            {compliance.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No compliance controls evaluated.</div>
            ) : (
              compliance.map((cr) => (
                <div key={cr._id} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-blue-600">{cr.controlId}</span>
                      <span className="text-xs font-semibold text-slate-900">{cr.controlTitle}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Category: {cr.category} • Assessed: {cr.applicableResourcesCount} asset(s)
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
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
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 font-medium">Comparing Against: </span>
                <span className="font-mono text-slate-800 font-semibold">
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
                        ? 'text-emerald-600 font-bold'
                        : diff?.postureDelta < 0
                        ? 'text-red-600 font-bold'
                        : 'text-slate-500'
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
                  <div key={i} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                            ev.driftType === 'security_regression'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : ev.driftType === 'security_improvement'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {ev.driftType.replace('_', ' ')}
                        </span>
                        <span className="font-semibold text-slate-900">{ev.resourceName}</span>
                        <span className="font-mono text-slate-500 text-[11px]">({ev.resourceId})</span>
                      </div>
                      <span className="text-slate-400 text-[11px]">
                        {new Date(ev.detectedAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">{ev.description}</p>

                    {/* Field Comparison Box */}
                    {ev.changedFields?.length > 0 && (
                      <div className="mt-2 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono space-y-1">
                        {ev.changedFields.map((field, fIdx) => (
                          <div key={fIdx} className="grid grid-cols-3 gap-2">
                            <span className="text-slate-600 truncate">{field.fieldPath}:</span>
                            <span className="text-red-700 bg-red-50 border border-red-200 px-1 rounded truncate">
                              - {JSON.stringify(field.previousValue)}
                            </span>
                            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 rounded truncate">
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
