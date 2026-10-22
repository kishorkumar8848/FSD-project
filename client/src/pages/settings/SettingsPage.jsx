import React, { useState, useEffect } from 'react';
import { Settings, Shield, User, Bell, CheckCircle2 } from 'lucide-react';
import api from '../../api/client';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

export function SettingsPage() {
  const { user, organization } = useAuth();
  const [settings, setSettings] = useState(null);
  const [orgName, setOrgName] = useState('');
  const [alertThreshold, setAlertThreshold] = useState('medium');
  const [retentionDays, setRetentionDays] = useState(90);
  const [savedMsg, setSavedMsg] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await api.get('/settings');
        if (res.success) {
          setSettings(res.data);
          setOrgName(res.data.organization?.name || '');
          setAlertThreshold(res.data.organization?.settings?.alertThreshold || 'medium');
          setRetentionDays(res.data.organization?.settings?.retentionDays || 90);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.patch('/settings', {
        name: orgName,
        settings: {
          alertThreshold,
          retentionDays: parseInt(retentionDays, 10),
        },
      });
      if (res.success) {
        setSavedMsg(true);
        setTimeout(() => setSavedMsg(false), 4000);
      }
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="pb-2 border-b border-slate-200/80">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          Platform & Organization Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Tenant governance configuration, alert thresholds, and security profile parameters
        </p>
      </div>

      {savedMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>Organization settings saved successfully.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Org Governance Settings */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Organization Profile" subtitle="Multi-tenant context and scan governance">
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Organization Name</label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Default Alert Notification Threshold
                </label>
                <select
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="critical">Critical Severities Only</option>
                  <option value="high">High and Critical Severities</option>
                  <option value="medium">Medium, High, and Critical</option>
                  <option value="low">All Severities (Low+)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Determines when proactive high-priority notifications are emitted during scan completion.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Snapshot Retention Window (Days)
                </label>
                <input
                  type="number"
                  min={30}
                  max={365}
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" size="sm" loading={loading}>
                  Save Organizational Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Col: Current User Profile */}
        <div className="space-y-6">
          <Card title="User Session Profile" subtitle="Authenticated identity details">
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-[#1d68f0] flex items-center justify-center text-white font-bold text-sm shadow-xs">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">{user?.name}</h4>
                  <span className="text-[11px] text-slate-500">{user?.email}</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block">Assigned Role</span>
                <span className="font-mono text-xs uppercase text-purple-700 font-bold bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                  {user?.role}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block">Organization</span>
                <span className="text-slate-800 font-medium">{organization?.name}</span>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block">Session Token Expiry</span>
                <span className="text-slate-600 font-mono text-[11px]">24 hours (JWT with Authorization header)</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
