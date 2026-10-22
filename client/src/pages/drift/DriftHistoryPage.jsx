import React, { useState, useEffect } from 'react';
import { GitCompare, AlertTriangle, CheckCircle2, RefreshCw, ArrowUpRight } from 'lucide-react';
import api from '../../api/client';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';

export function DriftHistoryPage() {
  const [driftEvents, setDriftEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDrift = async () => {
    try {
      // Scans that have diffs
      const scanRes = await api.get('/scans?limit=5');
      if (scanRes.success && scanRes.data.scans.length > 0) {
        const events = [];
        for (const scan of scanRes.data.scans) {
          try {
            const diffRes = await api.get(`/scans/${scan._id}/diff`);
            if (diffRes.success && diffRes.data.driftEvents) {
              events.push(...diffRes.data.driftEvents);
            }
          } catch (e) {}
        }
        setDriftEvents(events);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrift();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <div className="pb-2 border-b border-slate-200/80">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          Configuration Drift & Regression History
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Field-level before-and-after comparison detecting security regressions and remediation improvements
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton rows={5} height="h-32" />
      ) : driftEvents.length === 0 ? (
        <EmptyState
          icon={GitCompare}
          title="No configuration drift recorded"
          description="Modify simulated cloud configurations or re-import updated assets, then run consecutive scans to trace configuration drift."
        />
      ) : (
        <div className="space-y-4">
          {driftEvents.map((ev, idx) => (
            <Card key={idx}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                      ev.driftType === 'security_regression'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : ev.driftType === 'security_improvement'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {ev.driftType.replace('_', ' ')}
                  </span>
                  <span className="font-semibold text-sm text-slate-900">{ev.resourceName}</span>
                  <span className="font-mono text-xs text-slate-400">{ev.resourceId}</span>
                </div>
                <span className="text-xs text-slate-400">
                  Detected {new Date(ev.detectedAt).toLocaleString()}
                </span>
              </div>

              <p className="text-xs text-slate-600 mb-3">{ev.description}</p>

              {/* Changed fields diff */}
              {ev.changedFields?.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono space-y-1.5">
                  <div className="grid grid-cols-12 text-[10px] text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-200 font-semibold">
                    <span className="col-span-4">Field Attribute</span>
                    <span className="col-span-4 text-red-700">Previous Value (Before)</span>
                    <span className="col-span-4 text-emerald-700">Current Value (After)</span>
                  </div>
                  {ev.changedFields.map((f, fIdx) => (
                    <div key={fIdx} className="grid grid-cols-12 gap-2 items-center py-1">
                      <span className="col-span-4 text-slate-700 font-medium truncate">
                        {f.fieldPath}
                        {f.isSecurityRelevant && (
                          <span className="ml-1 text-[9px] bg-red-100 text-red-700 border border-red-200 px-1 rounded font-bold">
                            RISK
                          </span>
                        )}
                      </span>
                      <span className="col-span-4 text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded truncate">
                        - {JSON.stringify(f.previousValue)}
                      </span>
                      <span className="col-span-4 text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded truncate">
                        + {JSON.stringify(f.currentValue)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
