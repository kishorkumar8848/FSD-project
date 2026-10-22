import React, { useState, useEffect } from 'react';
import { History, Shield, Filter, Search } from 'lucide-react';
import api from '../../api/client';
import { Card } from '../../components/common/Card';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';

export function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = '/audit-logs?limit=30';
      if (actionFilter) query += `&action=${encodeURIComponent(actionFilter)}`;
      const res = await api.get(query);
      if (res.success) {
        setLogs(res.data.logs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Administrative Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-resistant append-only governance log capturing identity actions and security mutations
          </p>
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Action Types</option>
          <option value="AUTH_LOGIN">Login Events</option>
          <option value="AUTH_LOGOUT">Logout Events</option>
          <option value="SCAN_COMPLETED">Scans</option>
          <option value="FINDING_STATUS_CHANGED">Status Changes</option>
          <option value="RISK_ACCEPTED">Risk Acceptances</option>
          <option value="RULE_UPDATED">Rule Modifications</option>
          <option value="REPORT_GENERATED">Report Generations</option>
          <option value="RESOURCE_IMPORTED">Resource Imports</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton rows={6} height="h-10" />
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={History}
            title="No audit logs matched"
            description="All platform interactions will be recorded here chronologically."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 uppercase text-[10px] text-slate-500 font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Target Type</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-sans">
                      {new Date(log.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-800">
                      {log.actorEmail}
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="py-3 px-4 uppercase text-slate-600">{log.targetType}</td>
                    <td className="py-3 px-4 text-slate-600 font-sans text-xs max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
