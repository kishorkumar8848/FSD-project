import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ScanSearch, Play, CheckCircle2, Clock, AlertCircle, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api/client';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';

export function ScansPage() {
  const [scans, setScans] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');

  const fetchScans = async (page = 1) => {
    try {
      const res = await api.get(`/scans?page=${page}&limit=12`);
      if (res.success) {
        setScans(res.data.scans);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadAccounts() {
      try {
        const res = await api.get('/cloud-accounts');
        if (res.success && res.data.length > 0) {
          setAccounts(res.data);
          setSelectedAccountId(res.data[0]._id);
        }
      } catch (err) {}
    }
    loadAccounts();
    fetchScans(1);
  }, []);

  const handleStartScan = async () => {
    if (!selectedAccountId) return;
    setScanning(true);
    setAlertMsg('');
    try {
      const res = await api.post('/scans', {
        accountId: selectedAccountId,
        scanType: 'manual',
      });
      if (res.success) {
        setAlertMsg(`Assessment finished successfully! Posture Score: ${res.data.postureScore}/100.`);
        fetchScans(1);
      }
    } catch (err) {
      alert(`Scan failed: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Scan Center
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-semibold border border-blue-100">
              {pagination.total} Total
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Execute manual and scheduled deterministic security assessments across cloud accounts
          </p>
        </div>

        {/* Scan Initiation Trigger Bar */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-xl shadow-xs">
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name} ({a.environment})
              </option>
            ))}
          </select>
          <Button
            variant="primary"
            size="sm"
            onClick={handleStartScan}
            loading={scanning}
            icon={Play}
          >
            Run Scan
          </Button>
        </div>
      </div>

      {alertMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{alertMsg}</span>
        </div>
      )}

      {/* Scans History Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton rows={5} height="h-10" />
          </div>
        ) : scans.length === 0 ? (
          <EmptyState
            icon={ScanSearch}
            title="No assessments recorded"
            description="Select an account and run your first automated security scan."
            actionLabel="Run First Scan"
            onAction={handleStartScan}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 uppercase text-[10px] text-slate-500 font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Scan Identifier</th>
                  <th className="py-3 px-4">Account Target</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Posture Score</th>
                  <th className="py-3 px-4">Compliance</th>
                  <th className="py-3 px-4">Active Findings</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Initiated</th>
                  <th className="py-3 px-4 text-right">Results</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scans.map((scan) => {
                  const score = scan.postureScore ?? 100;
                  const scoreColor =
                    score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-red-600';

                  return (
                    <tr key={scan._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        {scan._id.slice(-8).toUpperCase()}
                        <span className="block text-[10px] text-slate-500 font-sans uppercase">
                          {scan.scanType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {scan.account?.name || 'Primary Account'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            scan.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : scan.status === 'running'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {scan.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-sm">
                        <span className={scoreColor}>{score}</span>
                        <span className="text-[10px] text-slate-400 font-normal"> / 100</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-blue-600 font-medium">
                        {scan.complianceScore !== null ? `${scan.complianceScore}%` : 'N/A'}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span className="text-red-600 font-bold">
                          {scan.findingsSummary?.critical || 0}C
                        </span>{' '}
                        •{' '}
                        <span className="text-orange-500 font-semibold">
                          {scan.findingsSummary?.high || 0}H
                        </span>{' '}
                        •{' '}
                        <span className="text-slate-500">
                          {scan.findingsSummary?.totalActive || 0} total
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {scan.durationMs ? `${(scan.durationMs / 1000).toFixed(1)}s` : '<1s'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {new Date(scan.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/scans/${scan._id}`}
                          className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
                        >
                          Details <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} scans)
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchScans(pagination.page - 1)}
                icon={ChevronLeft}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchScans(pagination.page + 1)}
              >
                Next <ChevronRight className="w-3.5 h-3.5 ml-1 inline" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
