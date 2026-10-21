import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Server, ShieldAlert, Code2, Tag, Calendar, ArrowLeft, ArrowUpRight } from 'lucide-react';
import api from '../../api/client';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { EnvironmentBadge, SeverityBadge, StatusBadge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

export function ResourceDetailPage() {
  const { id } = useParams();
  const [resource, setResource] = useState(null);
  const [findings, setFindings] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [resRes, histRes] = await Promise.all([
          api.get(`/resources/${id}`),
          api.get(`/resources/${id}/history`),
        ]);

        if (resRes.success) {
          setResource(resRes.data.resource);
          setFindings(resRes.data.findings || []);
        }
        if (histRes.success) {
          setHistory(histRes.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) return <LoadingSkeleton rows={6} height="h-20" />;
  if (!resource) return <div className="text-center py-12 text-slate-400">Resource not found.</div>;

  const rawTags = resource.tags instanceof Map ? Object.fromEntries(resource.tags) : (resource.tags || {});

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Resources', to: '/resources' },
          { label: resource.name },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white tracking-tight">{resource.name}</h1>
            <span className="font-mono text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
              {resource.type}
            </span>
            <EnvironmentBadge env={resource.environment} />
          </div>
          <div className="text-xs font-mono text-slate-400 mt-1">
            Resource ID: {resource.resourceId} • Account: {resource.account?.name} • Region: {resource.region}
          </div>
        </div>

        <Link to={`/findings?resourceId=${encodeURIComponent(resource.resourceId)}`}>
          <Button variant="outline" size="sm" icon={ShieldAlert}>
            View All Findings ({findings.length})
          </Button>
        </Link>
      </div>

      {/* Resource Metadata & Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Configuration JSON Inspector */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Resource Configuration Object"
            subtitle="Raw evaluated properties extracted for security analysis"
            action={<Code2 className="w-4 h-4 text-slate-400" />}
          >
            <div className="bg-[#090D16] border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-[420px]">
              <pre>{JSON.stringify(resource.configuration, null, 2)}</pre>
            </div>
          </Card>

          {/* Associated Findings */}
          <Card
            title={`Active Findings on this Asset (${findings.length})`}
            subtitle="Rule violations identified by deterministic evaluation engine"
          >
            <div className="divide-y divide-slate-800">
              {findings.length === 0 ? (
                <div className="py-6 text-center text-xs text-emerald-400 font-medium">
                  ✓ No active security findings. Asset conforms to defined baseline rules.
                </div>
              ) : (
                findings.map((f) => (
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
                        <p className="text-[11px] text-slate-400 mt-0.5 max-w-lg">
                          {f.evidence?.message || f.description}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={f.status} />
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right: Tags & Assessment Timeline */}
        <div className="space-y-6">
          {/* Metadata Tags */}
          <Card title="Resource Metadata Tags" subtitle="Governance & ownership attributes">
            <div className="space-y-2">
              {Object.keys(rawTags).length === 0 ? (
                <div className="text-xs text-slate-400">No tags assigned to this resource.</div>
              ) : (
                Object.entries(rawTags).map(([k, v]) => (
                  <div
                    key={k}
                    className="p-2 bg-slate-900 border border-slate-800 rounded text-xs flex justify-between"
                  >
                    <span className="font-mono text-slate-400">{k}:</span>
                    <span className="font-medium text-slate-200">{v}</span>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Assessment History */}
          <Card title="Historical Assessment Snapshots" subtitle="Past scans evaluating this asset">
            <div className="space-y-3">
              {history.length === 0 ? (
                <div className="text-xs text-slate-400">No snapshot history recorded yet.</div>
              ) : (
                history.map((snap) => (
                  <div key={snap._id} className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs">
                    <div className="flex items-center justify-between text-slate-300 font-medium mb-1">
                      <span>Scan {snap.scan?._id?.slice(-6) || 'N/A'}</span>
                      <span className="font-mono text-blue-400">
                        Score: {snap.scan?.postureScore ?? 100}/100
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Captured: {new Date(snap.capturedAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
