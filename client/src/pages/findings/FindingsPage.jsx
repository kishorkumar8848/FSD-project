import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ShieldAlert, Search, Filter, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api/client';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { SeverityBadge, StatusBadge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';

export function FindingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [findings, setFindings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Filters initialized from URL query params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [severity, setSeverity] = useState(searchParams.get('severity') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [resourceId, setResourceId] = useState(searchParams.get('resourceId') || '');

  const fetchFindings = async (page = 1) => {
    setLoading(true);
    try {
      let query = `/findings?page=${page}&limit=12`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (severity) query += `&severity=${encodeURIComponent(severity)}`;
      if (status) query += `&status=${encodeURIComponent(status)}`;
      if (category) query += `&category=${encodeURIComponent(category)}`;
      if (resourceId) query += `&resourceType=${encodeURIComponent(resourceId)}`;

      const res = await api.get(query);
      if (res.success) {
        setFindings(res.data.findings);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFindings(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search, severity, status, category]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Findings Center
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
              {pagination.total} Violations
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Triaged security misconfigurations, rule non-compliances, and remediation workflows
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#111827] border border-slate-800 p-4 rounded-xl flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, rule ID, or resource..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="accepted_risk">Accepted Risk</option>
          <option value="false_positive">False Positive</option>
        </select>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Categories</option>
          <option value="Storage Security">Storage Security</option>
          <option value="Database Security">Database Security</option>
          <option value="Identity & Access Management">IAM</option>
          <option value="Logging & Monitoring">Logging & Monitoring</option>
          <option value="Network Security">Network Security</option>
          <option value="Governance & Metadata">Governance & Tags</option>
          <option value="Backup & Recovery">Backup & Recovery</option>
        </select>
      </div>

      {/* Findings Table */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton rows={6} height="h-10" />
          </div>
        ) : findings.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title="No findings matched filter criteria"
            description="All monitored resources either conform to defined rules or match no active filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 border-b border-slate-800 uppercase text-[10px] text-slate-400 font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Finding Title</th>
                  <th className="py-3 px-4">Affected Resource</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Risk</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Detected</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {findings.map((f) => (
                  <tr key={f._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <SeverityBadge severity={f.severity} />
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        to={`/findings/${f._id}`}
                        className="font-semibold text-slate-200 hover:text-blue-400 block max-w-sm truncate"
                      >
                        {f.title}
                      </Link>
                      <span className="font-mono text-[11px] text-slate-500">{f.ruleId}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-300 block">{f.resourceName}</span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {f.resourceType} • {f.account?.name}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{f.category}</td>
                    <td className="py-3 px-4 font-mono font-bold text-orange-400">
                      {f.riskScore}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={f.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(f.lastDetectedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/findings/${f._id}`}
                        className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 font-medium"
                      >
                        Remediate <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} findings)
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchFindings(pagination.page - 1)}
                icon={ChevronLeft}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchFindings(pagination.page + 1)}
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
