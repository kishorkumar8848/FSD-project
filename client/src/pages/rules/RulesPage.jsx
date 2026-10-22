import React, { useState, useEffect } from 'react';
import { Sliders, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import api from '../../api/client';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { SeverityBadge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

export function RulesPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchRules = async () => {
    try {
      const res = await api.get('/rules');
      if (res.success) setRules(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const toggleRuleStatus = async (ruleId, currentStatus) => {
    setUpdatingId(ruleId);
    const newStatus = currentStatus === 'enabled' ? 'disabled' : 'enabled';
    try {
      const res = await api.patch(`/rules/${ruleId}`, { status: newStatus });
      if (res.success) {
        fetchRules();
      }
    } catch (err) {
      alert(`Failed to update rule status: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="pb-2 border-b border-slate-200/80">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          Security Rule Governance
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Inspect and configure deterministic assessment rules, baseline thresholds, and severity classifications
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton rows={5} height="h-20" />
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <Card key={rule.ruleId}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-xs text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                      {rule.ruleId}
                    </span>
                    <SeverityBadge severity={rule.severity} />
                    <span className="text-xs font-semibold text-slate-900">{rule.name}</span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {rule.description}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono pt-1">
                    <span>Category: <strong className="text-slate-700 font-sans">{rule.category}</strong></span>
                    <span>Applies to: <strong className="text-slate-700">[{rule.supportedResourceTypes?.join(', ')}]</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span
                    className={`text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded ${
                      rule.status === 'enabled'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {rule.status}
                  </span>

                  <Button
                    variant={rule.status === 'enabled' ? 'outline' : 'primary'}
                    size="sm"
                    loading={updatingId === rule.ruleId}
                    onClick={() => toggleRuleStatus(rule.ruleId, rule.status)}
                  >
                    {rule.status === 'enabled' ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
