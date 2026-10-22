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
          <div className="h-8 bg-slate-200 rounded w-48 animate-pulse" />
          <div className="h-8 bg-slate-200 rounded w-28 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-28 bg-white border border-slate-200 rounded-xl animate-pulse shadow-xs" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-white border border-slate-200 rounded-xl animate-pulse shadow-xs" />
          <div className="h-64 bg-white border border-slate-200 rounded-xl animate-pulse shadow-xs" />
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
    postureScore >= 80 ? 'text-emerald-600' : postureScore >= 50 ? 'text-amber-600' : 'text-red-600';

  const severityChartColors = {
    critical: '#EF4444',
    high: '#F97316',
    medium: '#F59E0B',
    low: '#3B82F6',
    info: '#94A3B8',
  };

  const compliancePieColors = {
    pass: '#10B981',
    fail: '#EF4444',
    not_applicable: '#64748B',
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Quick Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Security Posture Overview
            <span className="text-xs bg-blue-50 text-blue-600 font-medium px-2.5 py-0.5 rounded-full border border-blue-100">
              Live State
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
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
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Security Posture</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="my-2">
            <div className={`text-3xl font-extrabold tracking-tight ${postureColor}`}>
              {postureScore}
              <span className="text-sm font-normal text-slate-400"> / 100</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              100 base - active finding penalties
            </div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full transition-all duration-500 ${
                postureScore >= 80 ? 'bg-emerald-500' : postureScore >= 50 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, postureScore))}%` }}
            />
          </div>
        </div>

        {/* NIST Compliance Score */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider text-[10px]">NIST CSF Compliance</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-extrabold text-blue-600 tracking-tight">
              {summaryCards.complianceScore !== null ? `${summaryCards.complianceScore}%` : 'N/A'}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              NIST Cybersecurity Framework 2.0
            </div>
          </div>
          <Link
            to="/compliance"
            className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium pt-1"
          >
            Inspect framework controls <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Critical & High Findings */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Priority Findings</span>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-baseline gap-2">
              <span className="text-red-600">{summaryCards.criticalFindings || 0}</span>
              <span className="text-xs text-slate-500 font-normal">critical</span>
              <span className="text-orange-500 text-2xl font-bold ml-1">{summaryCards.highFindings || 0}</span>
              <span className="text-xs text-slate-500 font-normal">high</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {summaryCards.totalActiveFindings || 0} total active risk findings
            </div>
          </div>
          <Link
            to="/findings?severity=critical"
            className="text-[11px] text-red-600 hover:text-red-700 flex items-center gap-1 font-medium pt-1"
          >
            Review critical issues <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Cloud Assets Assessed */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Monitored Assets</span>
            <Server className="w-4 h-4 text-purple-600" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {summaryCards.totalResources || 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Across {summaryCards.totalAccounts || 0} cloud accounts
            </div>
          </div>
          <Link
            to="/resources"
            className="text-[11px] text-purple-600 hover:text-purple-700 flex items-center gap-1 font-medium pt-1"
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
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="severity" stroke="#94A3B8" fontSize={11} tickFormatter={(v) => v.toUpperCase()} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#0F172A',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)'
                  }}
                  labelStyle={{ color: '#0F172A', fontWeight: 'bold' }}
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
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#0F172A',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">No scan results to display yet.</div>
            )}
          </div>
          <div className="flex justify-center gap-6 text-xs text-slate-600 mt-2">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Pass
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Fail
            </span>
            <span className="flex items-center gap-1.5 font-medium">
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="#94A3B8" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#E2E8F0',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#0F172A',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)'
                      }}
                    />
                    <Line type="monotone" dataKey="postureScore" stroke="#1D68F0" strokeWidth={2.5} dot={{ fill: '#1D68F0', r: 4 }} name="Posture Score" />
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
              { label: 'False Positive Suppressed', count: charts.remediationProgress?.false_positive || 0, color: 'bg-slate-400' },
            ].map((st, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-600 font-medium">
                  <span className={`w-2 h-2 rounded-full ${st.color}`} />
                  {st.label}
                </span>
                <span className="font-mono font-semibold text-slate-900">{st.count}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100">
            <Link
              to="/reports"
              className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 text-xs font-semibold transition-colors shadow-2xs"
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
            <Link to="/rules" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              View all rules
            </Link>
          }
        >
          <div className="divide-y divide-slate-100">
            {topFailingRules.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">No failing rules recorded.</div>
            ) : (
              topFailingRules.map((rule) => (
                <div key={rule.ruleId} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <SeverityBadge severity={rule.severity} />
                    <div>
                      <div className="text-xs font-semibold text-slate-900">{rule.ruleId}</div>
                      <div className="text-[11px] text-slate-500 max-w-sm truncate">{rule.ruleName}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-red-600">{rule.count}</span>
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
            <Link to="/resources" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              View all resources
            </Link>
          }
        >
          <div className="divide-y divide-slate-100">
            {highestRiskResources.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">No high risk assets identified.</div>
            ) : (
              highestRiskResources.map((res) => (
                <div key={res.resourceId} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-900">{res.resourceName}</div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {res.resourceId} • {res.resourceType}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-orange-600 font-mono">
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
