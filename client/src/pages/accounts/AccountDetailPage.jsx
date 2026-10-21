import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Cloud, Play, ArrowLeft, Server, ShieldAlert, CheckCircle2 } from 'lucide-react';
import api from '../../api/client';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { EnvironmentBadge, SeverityBadge, StatusBadge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

export function AccountDetailPage() {
  const { id } = useParams();
  const [account, setAccount] = useState(null);
  const [resources, setResources] = useState([]);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');

  const fetchDetails = async () => {
    try {
      const [accRes, resRes, findRes] = await Promise.all([
        api.get(`/cloud-accounts/${id}`),
        api.get(`/resources?accountId=${id}&limit=50`),
        api.get(`/findings?accountId=${id}&limit=50`),
      ]);

      if (accRes.success) setAccount(accRes.data);
      if (resRes.success) setResources(resRes.data.resources);
      if (findRes.success) setFindings(findRes.data.findings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleRunScan = async () => {
    setScanning(true);
    setScanMessage('');
    try {
      const res = await api.post('/scans', { accountId: id, scanType: 'manual' });
      if (res.success) {
        setScanMessage(`Assessment completed! Posture: ${res.data.postureScore}/100.`);
        fetchDetails();
      }
    } catch (err) {
      alert(`Scan failed: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  if (loading) return <LoadingSkeleton rows={6} height="h-20" />;
  if (!account) return <div className="text-center py-12 text-slate-400">Account not found.</div>;

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Cloud Accounts', to: '/accounts' },
          { label: account.name },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white tracking-tight">{account.name}</h1>
            <EnvironmentBadge env={account.environment} />
          </div>
          <div className="text-xs font-mono text-slate-400 mt-1">
            Account ID: {account.accountId} • Region: {account.region} • Mode: {account.connectionMode}
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleRunScan}
          loading={scanning}
          icon={Play}
        >
          Execute Security Scan
        </Button>
      </div>

      {scanMessage && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{scanMessage}</span>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Security Posture Score</span>
          <span className="text-2xl font-bold font-mono text-blue-400 mt-1 block">
            {account.postureScore ?? 100} / 100
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Calculated from active findings
          </span>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Inventoried Resources</span>
          <span className="text-2xl font-bold font-mono text-white mt-1 block">
            {resources.length}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Storage, DBs, IAM, VMs, Logs
          </span>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Active Risk Findings</span>
          <span className="text-2xl font-bold font-mono text-red-400 mt-1 block">
            {findings.filter((f) => f.status === 'open' || f.status === 'in_progress').length}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Across rule evaluation checks
          </span>
        </div>
      </div>

      {/* Tabs / Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resources Table */}
        <Card
          title={`Inventoried Resources (${resources.length})`}
          subtitle="Configurations assessed within this account perimeter"
        >
          <div className="divide-y divide-slate-800 max-h-96 overflow-y-auto">
            {resources.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">No resources linked to this account.</div>
            ) : (
              resources.map((res) => (
                <div key={res._id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <Link
                      to={`/resources/${res._id}`}
                      className="text-xs font-semibold text-slate-200 hover:text-blue-400"
                    >
                      {res.name}
                    </Link>
                    <div className="text-[11px] font-mono text-slate-400">
                      {res.resourceId} • {res.type}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                    {res.criticality}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Findings Table */}
        <Card
          title={`Detected Findings (${findings.length})`}
          subtitle="Identified misconfigurations and compliance gaps"
        >
          <div className="divide-y divide-slate-800 max-h-96 overflow-y-auto">
            {findings.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">No findings detected for this account.</div>
            ) : (
              findings.map((f) => (
                <div key={f._id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={f.severity} />
                    <div>
                      <Link
                        to={`/findings/${f._id}`}
                        className="text-xs font-medium text-slate-200 hover:text-blue-400"
                      >
                        {f.title}
                      </Link>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {f.ruleId} • {f.resourceName}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={f.status} />
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
