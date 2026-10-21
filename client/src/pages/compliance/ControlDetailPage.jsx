import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ClipboardCheck, ShieldAlert, CheckCircle2, ArrowLeft, ArrowUpRight } from 'lucide-react';
import api from '../../api/client';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { StatusBadge, SeverityBadge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

export function ControlDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadControl() {
      try {
        const res = await api.get(`/compliance/controls/${id}`);
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadControl();
  }, [id]);

  if (loading) return <LoadingSkeleton rows={6} height="h-24" />;
  if (!data?.control) return <div className="text-center py-12 text-slate-400">Control not found.</div>;

  const { control, result, mappedFindings } = data;

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Compliance Overview', to: '/compliance' },
          { label: `${control.controlId}: ${control.title}` },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono font-bold text-sm bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded">
              {control.controlId}
            </span>
            <span className="font-mono text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
              {control.nistFunction}
            </span>
            <StatusBadge status={result?.status || 'not_assessed'} />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">{control.title}</h1>
          <p className="text-xs text-slate-400 mt-1">
            Category: {control.category} • Framework: {control.framework || 'NIST CSF 2.0'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Control Specs & Evidence */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Control Specification & Objective" subtitle="NIST CSF 2.0 Standard Guidance">
            <p className="text-xs text-slate-300 leading-relaxed mb-4">{control.description}</p>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs">
              <span className="text-slate-400 font-semibold block mb-1">Evidence Baseline:</span>
              <p className="text-slate-300 leading-relaxed">{control.evidenceRequirements}</p>
            </div>
          </Card>

          {/* Active Mapped Violations */}
          <Card
            title={`Active Findings Impairing this Control (${mappedFindings?.length || 0})`}
            subtitle="Security rule failures causing this control to evaluate as Fail"
          >
            <div className="divide-y divide-slate-800">
              {mappedFindings?.length === 0 ? (
                <div className="py-6 text-center text-xs text-emerald-400 font-medium">
                  ✓ All applicable assets conform to this control. Zero mapped violations.
                </div>
              ) : (
                mappedFindings.map((f) => (
                  <div key={f._id} className="py-3 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <SeverityBadge severity={f.severity} />
                      <div>
                        <Link
                          to={`/findings/${f._id}`}
                          className="text-xs font-semibold text-slate-200 hover:text-blue-400 block"
                        >
                          {f.title}
                        </Link>
                        <span className="font-mono text-[11px] text-slate-400">
                          {f.ruleId} • Resource: {f.resourceName} ({f.resourceType})
                        </span>
                      </div>
                    </div>
                    <Link
                      to={`/findings/${f._id}`}
                      className="text-blue-400 hover:text-blue-300 text-xs font-medium inline-flex items-center gap-1"
                    >
                      Remediate <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right Col: Assessment Telemetry */}
        <div className="space-y-6">
          <Card title="Assessment Methodology" subtitle="Deterministic Evaluation">
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[11px] text-slate-500 block">Evaluation Method</span>
                <span className="text-slate-300">{control.assessmentMethod}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Mapped Security Rules</span>
                <div className="flex gap-1.5 flex-wrap mt-1">
                  {control.mappedRuleIds?.map((rId) => (
                    <span
                      key={rId}
                      className="font-mono text-[11px] bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-blue-400"
                    >
                      {rId}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Applicable Asset Types</span>
                <div className="flex gap-1 flex-wrap mt-1">
                  {control.applicableResourceTypes?.map((t) => (
                    <span key={t} className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
