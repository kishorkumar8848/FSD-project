import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Cloud, Plus, Play, Trash2, ArrowUpRight, ShieldCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';
import api from '../../api/client';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { EnvironmentBadge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

export function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scanningId, setScanningId] = useState(null);
  const [scanMessage, setScanMessage] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    accountId: '',
    provider: 'simulated',
    environment: 'development',
    region: 'us-east-1',
    description: '',
  });
  const navigate = useNavigate();

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/cloud-accounts');
      if (res.success) {
        setAccounts(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await api.post('/cloud-accounts', formData);
      if (res.success) {
        setIsModalOpen(false);
        setFormData({
          name: '',
          accountId: '',
          provider: 'simulated',
          environment: 'development',
          region: 'us-east-1',
          description: '',
        });
        fetchAccounts();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleRunScan = async (accountId) => {
    setScanningId(accountId);
    setScanMessage('');
    try {
      const res = await api.post('/scans', { accountId, scanType: 'manual' });
      if (res.success) {
        setScanMessage(`Scan completed! Posture: ${res.data.postureScore}/100.`);
        fetchAccounts();
        setTimeout(() => setScanMessage(''), 5000);
      }
    } catch (err) {
      alert(`Scan failed: ${err.message}`);
    } finally {
      setScanningId(null);
    }
  };

  const handleDeleteAccount = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete cloud account "${name}" and all associated resources and findings?`)) return;
    try {
      await api.delete(`/cloud-accounts/${id}`);
      fetchAccounts();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Cloud Accounts
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
              {accounts.length}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitored cloud provider accounts and isolated simulation perimeters
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          icon={Plus}
        >
          Add Cloud Account
        </Button>
      </div>

      {scanMessage && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{scanMessage}</span>
        </div>
      )}

      {/* Accounts List / Cards */}
      {loading ? (
        <LoadingSkeleton rows={4} height="h-28" />
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={Cloud}
          title="No cloud accounts registered"
          description="Provision a simulated cloud account to import resource configurations and run automated security assessments."
          actionLabel="Add Cloud Account"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {accounts.map((acc) => {
            const score = acc.postureScore ?? 100;
            const scoreColor =
              score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400';

            return (
              <div
                key={acc._id}
                className="bg-[#111827] border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-white tracking-tight hover:text-blue-400 transition-colors">
                        <Link to={`/accounts/${acc._id}`}>{acc.name}</Link>
                      </h3>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {acc.accountId}
                      </div>
                    </div>
                    <EnvironmentBadge env={acc.environment} />
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                    {acc.description || 'No description provided for this cloud account.'}
                  </p>

                  <div className="grid grid-cols-3 gap-2 py-3 px-3 bg-slate-900/60 rounded-lg border border-slate-800/80 mb-4 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Posture</span>
                      <span className={`text-sm font-bold font-mono ${scoreColor}`}>{score}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Assets</span>
                      <span className="text-sm font-bold font-mono text-slate-200">{acc.totalResources || 0}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Findings</span>
                      <span className="text-sm font-bold font-mono text-red-400">{acc.totalFindings || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    {acc.lastScanAt ? `Scanned ${new Date(acc.lastScanAt).toLocaleDateString()}` : 'Never scanned'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRunScan(acc._id)}
                      loading={scanningId === acc._id}
                      icon={Play}
                    >
                      Scan
                    </Button>
                    <button
                      onClick={() => handleDeleteAccount(acc._id, acc.name)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                      title="Delete account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Account Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Cloud Account"
      >
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Account Display Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. AWS Core Production"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Account Identifier (Simulation ID or AWS Account ID)
            </label>
            <input
              type="text"
              required
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              placeholder="e.g. 123456789012 or acc-prod-01"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Provider Type
              </label>
              <select
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="simulated">Simulated (Local Engine)</option>
                <option value="aws">AWS (Simulated Adapter)</option>
                <option value="azure">Azure (Simulated Adapter)</option>
                <option value="gcp">GCP (Simulated Adapter)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Environment Tier
              </label>
              <select
                value={formData.environment}
                onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="development">Development</option>
                <option value="staging">Staging</option>
                <option value="production">Production</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Primary Region
            </label>
            <input
              type="text"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              placeholder="us-east-1"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Core microservices, databases, and assets..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={formLoading}
            >
              Confirm Registration
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
