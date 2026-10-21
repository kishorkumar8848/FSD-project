import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Server,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Play,
  UploadCloud,
  FileText,
  Activity,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import api from '../../api/client';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { SeverityBadge, StatusBadge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

export function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard/summary');
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-slate-800 rounded w-48 animate-pulse" />
          <div className="h-8 bg-slate-800 rounded w-28 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-28 bg-slate-800/60 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-800/60 rounded-xl animate-pulse" />
          <div className="h-64 bg-slate-800/60 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const { summaryCards, charts, topFailingRules, highestRiskResources } = data || {
    summaryCards: {},
    charts: {},
    topFailingRules: [],
    highestRiskResources: [],
  };

  const postureScore = summaryCards.postureScore ?? 100;
  const postureColor =
    postureScore >= 80 ? 'text-emerald-400' : postureScore >= 50 ? 'text-amber-400' : 'text-red-400';

  const severityChartColors = {
    critical: '#DC2626',
    high: '#EA580C',
    medium: '#D97706',
    low: '#2563EB',
    info: '#64748B',
  };

  const compliancePieColors = {
    pass: '#16A34A',
    fail: '#DC2626',
    not_applicable: '#64748B',
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Quick Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Security Posture Overview
            <span className="text-xs bg-slate-800 text-slate-300 font-normal px-2 py-0.5 rounded border border-slate-700">
              Live State
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time security configuration compliance and cloud risk posture
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            loading={refreshing}
            icon={RefreshCw}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/scans')}
            icon={Play}
          >
            Run Scan
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/resources/import')}
            icon={UploadCloud}
          >
            Import JSON
          </Button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Posture Score Gauge Card */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Security Posture</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="my-2">
            <div className={`text-3xl font-extrabold tracking-tight ${postureColor}`}>
              {postureScore}
              <span className="text-sm font-normal text-slate-400"> / 100</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              100 base - active finding penalties
            </div>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full transition-all duration-500 ${
                postureScore >= 80 ? 'bg-emerald-500' : postureScore >= 50 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, postureScore))}%` }}
            />
          </div>
        </div>

        {/* NIST Compliance Score */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">NIST CSF Compliance</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-extrabold text-blue-400 tracking-tight">
              {summaryCards.complianceScore !== null ? `${summaryCards.complianceScore}%` : 'N/A'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              NIST Cybersecurity Framework 2.0
            </div>
          </div>
          <Link
            to="/compliance"
            className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium pt-1"
          >
            Inspect framework controls <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Critical & High Findings */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Priority Findings</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-2">
              <span className="text-red-400">{summaryCards.criticalFindings || 0}</span>
              <span className="text-xs text-slate-400 font-normal">critical</span>
              <span className="text-orange-400 text-2xl font-bold ml-1">{summaryCards.highFindings || 0}</span>
              <span className="text-xs text-slate-400 font-normal">high</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {summaryCards.totalActiveFindings || 0} total active risk findings
            </div>
          </div>
          <Link
            to="/findings?severity=critical"
            className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 font-medium pt-1"
          >
            Review critical issues <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Cloud Assets Assessed */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Monitored Assets</span>
            <Server className="w-4 h-4 text-purple-400" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {summaryCards.totalResources || 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Across {summaryCards.totalAccounts || 0} cloud accounts
            </div>
          </div>
          <Link
            to="/resources"
            className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium pt-1"
          >
            View resource inventory <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Charts Row 1: Severity Distribution & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Bar Chart */}
        <Card title="Active Findings by Severity" subtitle="Quantified severity breakdown across cloud resources">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.findingsBySeverity || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="severity" stroke="#64748B" fontSize={11} tickFormatter={(v) => v.toUpperCase()} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#F8FAFC', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {(charts.findingsBySeverity || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={severityChartColors[entry.severity] || '#3B82F6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Compliance Distribution Pie Chart */}
        <Card title="Compliance Controls Status" subtitle="Evaluated control distribution against NIST CSF 2.0">
          <div className="h-64 w-full flex items-center justify-center">
            {charts.complianceDistribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.complianceDistribution}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={50}
                    paddingAngle={3}
                  >
                    {charts.complianceDistribution.map((entry, index) => (
                      <Cell key={`comp-${index}`} fill={compliancePieColors[entry.status] || '#3B82F6'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">No scan results to display yet.</div>
            )}
          </div>
          <div className="flex justify-center gap-6 text-xs text-slate-300 mt-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Pass
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Fail
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500" /> N/A
            </span>
          </div>
        </Card>
      </div>

      {/* Charts Row 2: Scan Posture History & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Posture Score Over Time */}
        <div className="lg:col-span-2">
          <Card title="Posture Score History" subtitle="Assessment trajectory across historical scans">
            <div className="h-64 w-full">
              {charts.scanHistory?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.scanHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="#64748B" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Line type="monotone" dataKey="postureScore" stroke="#3B82F6" strokeWidth={2.5} dot={{ fill: '#3B82F6', r: 4 }} name="Posture Score" />
                    <Line type="monotone" dataKey="complianceScore" stroke="#10B981" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Compliance %" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Execute multiple assessment scans to visualize posture trajectory.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Remediation Funnel */}
        <Card title="Remediation Lifecycle" subtitle="Current status distribution of all recorded findings">
          <div className="space-y-3 pt-2">
            {[
              { label: 'Open Violations', count: charts.remediationProgress?.open || 0, color: 'bg-red-500' },
              { label: 'In Remediation', count: charts.remediationProgress?.in_progress || 0, color: 'bg-amber-500' },
              { label: 'Verified Resolved', count: charts.remediationProgress?.resolved || 0, color: 'bg-emerald-500' },
              { label: 'Risk Accepted (Exception)', count: charts.remediationProgress?.accepted_risk || 0, color: 'bg-purple-500' },
              { label: 'False Positive Suppressed', count: charts.remediationProgress?.false_positive || 0, color: 'bg-slate-500' },
            ].map((st, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-300">
                  <span className={`w-2 h-2 rounded-full ${st.color}`} />
                  {st.label}
                </span>
                <span className="font-mono font-semibold text-slate-100">{st.count}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800">
            <Link
              to="/reports"
              className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-medium transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              Generate Executive PDF Report
            </Link>
          </div>
        </Card>
      </div>

      {/* Tables Row: Most Frequently Failing Rules & Highest Risk Assets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Failing Rules */}
        <Card
          title="Most Frequently Failing Rules"
          subtitle="Security baselines with highest violation frequency"
          action={
            <Link to="/rules" className="text-xs text-blue-400 hover:text-blue-300">
              View all rules
            </Link>
          }
        >
          <div className="divide-y divide-slate-800">
            {topFailingRules.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">No failing rules recorded.</div>
            ) : (
              topFailingRules.map((rule) => (
                <div key={rule.ruleId} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <SeverityBadge severity={rule.severity} />
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{rule.ruleId}</div>
                      <div className="text-[11px] text-slate-400 max-w-sm truncate">{rule.ruleName}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-red-400">{rule.count}</span>
                    <span className="text-[10px] text-slate-400 block">violations</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Highest Risk Resources */}
        <Card
          title="Highest Risk Resources"
          subtitle="Cloud assets with highest cumulative vulnerability exposure"
          action={
            <Link to="/resources" className="text-xs text-blue-400 hover:text-blue-300">
              View all resources
            </Link>
          }
        >
          <div className="divide-y divide-slate-800">
            {highestRiskResources.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">No high risk assets identified.</div>
            ) : (
              highestRiskResources.map((res) => (
                <div key={res.resourceId} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{res.resourceName}</div>
                    <div className="text-[11px] font-mono text-slate-400">
                      {res.resourceId} • {res.resourceType}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-orange-400 font-mono">
                      Risk: {res.totalRiskScore}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {res.findingsCount} active finding(s)
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
