import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Server, Search, Filter, UploadCloud, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api/client';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { EnvironmentBadge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';

export function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [envFilter, setEnvFilter] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [accountFilter, setAccountFilter] = useState('');

  const fetchResources = async (page = 1) => {
    setLoading(true);
    try {
      let query = `/resources?page=${page}&limit=10`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (typeFilter) query += `&type=${encodeURIComponent(typeFilter)}`;
      if (envFilter) query += `&environment=${encodeURIComponent(envFilter)}`;
      if (accountFilter) query += `&accountId=${encodeURIComponent(accountFilter)}`;

      const res = await api.get(query);
      if (res.success) {
        setResources(res.data.resources);
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
        if (res.success) setAccounts(res.data);
      } catch (e) {}
    }
    loadAccounts();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchResources(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search, typeFilter, envFilter, accountFilter]);

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Resource Inventory
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
              {pagination.total} Total
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Centralized registry of monitored cloud assets, services, and identity configurations
          </p>
        </div>

        <Link to="/resources/import">
          <Button variant="primary" size="sm" icon={UploadCloud}>
            Import JSON Config
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#111827] border border-slate-800 p-4 rounded-xl flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by resource name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Resource Types</option>
          <option value="storage_bucket">Storage Buckets</option>
          <option value="database">Databases</option>
          <option value="iam_user">IAM Users</option>
          <option value="iam_role">IAM Roles</option>
          <option value="virtual_machine">Virtual Machines</option>
          <option value="security_group">Security Groups</option>
          <option value="audit_log">Audit Logs</option>
        </select>

        <select
          value={envFilter}
          onChange={(e) => setEnvFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Environments</option>
          <option value="production">Production</option>
          <option value="staging">Staging</option>
          <option value="development">Development</option>
        </select>

        <select
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Accounts</option>
          {accounts.map((a) => (
            <option key={a._id} value={a._id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {/* Resources Table */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton rows={6} height="h-10" />
          </div>
        ) : resources.length === 0 ? (
          <EmptyState
            icon={Server}
            title="No cloud resources matched"
            description="Adjust your search criteria or import configuration JSON files to populate your inventory."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 border-b border-slate-800 uppercase text-[10px] text-slate-400 font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Resource Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Cloud Account</th>
                  <th className="py-3 px-4">Tier</th>
                  <th className="py-3 px-4">Criticality</th>
                  <th className="py-3 px-4">Last Assessed</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {resources.map((res) => (
                  <tr key={res._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <Link
                        to={`/resources/${res._id}`}
                        className="font-semibold text-slate-200 hover:text-blue-400 block truncate max-w-xs"
                      >
                        {res.name}
                      </Link>
                      <span className="font-mono text-[11px] text-slate-400">{res.resourceId}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                        {res.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {res.account?.name || 'Primary Account'}
                    </td>
                    <td className="py-3 px-4">
                      <EnvironmentBadge env={res.environment} />
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] uppercase font-bold font-mono px-1.5 py-0.5 rounded ${
                          res.criticality === 'critical'
                            ? 'bg-red-500/15 text-red-400'
                            : res.criticality === 'high'
                            ? 'bg-orange-500/15 text-orange-400'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {res.criticality}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {res.lastAssessedAt
                        ? new Date(res.lastAssessedAt).toLocaleDateString()
                        : 'Pending Scan'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/resources/${res._id}`}
                        className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 font-medium"
                      >
                        Inspect <ArrowUpRight className="w-3.5 h-3.5" />
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
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} items)
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchResources(pagination.page - 1)}
                icon={ChevronLeft}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchResources(pagination.page + 1)}
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
