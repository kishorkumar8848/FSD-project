import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Check,
  RefreshCw,
  FileCheck,
  ShieldX,
  ExternalLink,
  Calendar,
  User,
  History,
} from 'lucide-react';
import api from '../../api/client';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { SeverityBadge, StatusBadge, EnvironmentBadge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

export function FindingDetailPage() {
  const { id } = useParams();
  const [finding, setFinding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState(null);

  // Modals
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);

  // Forms
  const [targetStatus, setTargetStatus] = useState('in_progress');
  const [statusReason, setStatusReason] = useState('');
  const [riskJustification, setRiskJustification] = useState('');
  const [riskExpiry, setRiskExpiry] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );

  const fetchFinding = async () => {
    try {
      const res = await api.get(`/findings/${id}`);
      if (res.success) {
        setFinding(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinding();
  }, [id]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      const res = await api.patch(`/findings/${id}/status`, {
        status: targetStatus,
        reason: statusReason,
      });
      if (res.success) {
        setIsStatusModalOpen(false);
        fetchFinding();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAcceptRisk = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/findings/${id}/accept-risk`, {
        justification: riskJustification,
        expiresAt: new Date(riskExpiry).toISOString(),
      });
      if (res.success) {
        setIsRiskModalOpen(false);
        fetchFinding();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleVerifyRemediation = async () => {
    setVerifying(true);
    setVerifyMessage(null);
    try {
      const res = await api.post(`/findings/${id}/verify`);
      if (res.success) {
        setVerifyMessage({
          success: res.verified,
          text: res.message,
        });
        fetchFinding();
      }
    } catch (err) {
      setVerifyMessage({
        success: false,
        text: `Verification error: ${err.message}`,
      });
    } finally {
      setVerifying(false);
    }
  };

  if (loading) return <LoadingSkeleton rows={6} height="h-20" />;
  if (!finding) return <div className="text-center py-12 text-slate-400">Finding not found.</div>;

  return (
    <div className="space-y-6 pb-12">
      <Breadcrumbs
        items={[
          { label: 'Findings Center', to: '/findings' },
          { label: `${finding.ruleId} — ${finding.resourceName}` },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <SeverityBadge severity={finding.severity} />
            <StatusBadge status={finding.status} />
            <span className="font-mono text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
              Risk: {finding.riskScore}/100
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">{finding.title}</h1>
          <p className="text-xs text-slate-400 mt-1">
            Rule ID: <span className="text-slate-200 font-mono">{finding.ruleId}</span> (v{finding.ruleVersion}) •
            Category: {finding.category} • First detected: {new Date(finding.firstDetectedAt).toLocaleDateString()}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsStatusModalOpen(true)}
          >
            Update Status
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsRiskModalOpen(true)}
          >
            Accept Risk
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleVerifyRemediation}
            loading={verifying}
            icon={FileCheck}
          >
            Verify Remediation
          </Button>
        </div>
      </div>

      {verifyMessage && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-3 ${
            verifyMessage.success
              ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
              : 'bg-red-950/40 border-red-800/80 text-red-300'
          }`}
        >
          {verifyMessage.success ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400" />
          )}
          <span>{verifyMessage.text}</span>
        </div>
      )}

      {/* Grid: Details, Evidence, Remediation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Evidence & Remediation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Configuration Evidence Box */}
          <Card
            title="Configuration Evidence & Detection Rationale"
            subtitle="Deterministic rule evaluation telemetry supporting this finding"
          >
            <div className="space-y-4">
              <div className="p-3 bg-red-950/30 border border-red-900/60 rounded-lg text-xs">
                <span className="font-semibold text-red-300 block mb-1">Observed Violation:</span>
                <p className="text-slate-300 font-mono text-[11px] leading-relaxed">
                  {finding.evidence?.message || finding.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                    Actual Detected State
                  </span>
                  <span className="text-red-400">
                    {finding.evidence?.actualValue || 'Non-compliant configuration'}
                  </span>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                    Expected Secure Baseline
                  </span>
                  <span className="text-emerald-400">
                    {finding.evidence?.expectedValue || 'Compliant configuration'}
                  </span>
                </div>
              </div>

              {finding.businessImpact && (
                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs">
                  <span className="text-slate-400 font-medium block mb-1">Business Impact:</span>
                  <p className="text-slate-300 leading-relaxed">{finding.businessImpact}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Remediation Guidance */}
          <Card
            title="Step-by-Step Remediation Guidance"
            subtitle="Prescriptive technical hardening instructions to eliminate this vulnerability"
          >
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-semibold text-slate-200 mb-1">Summary</h4>
                <p className="text-slate-300 leading-relaxed">
                  {finding.remediationInstructions?.summary}
                </p>
              </div>

              {finding.remediationInstructions?.stepByStep?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-200 mb-2">Prescribed Actions</h4>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                    {finding.remediationInstructions.stepByStep.map((step, idx) => (
                      <li key={idx} className="leading-relaxed pl-1">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {finding.remediationInstructions?.operationalImpact && (
                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <span className="text-[11px] font-semibold text-amber-400 block mb-0.5">
                    Operational Considerations:
                  </span>
                  <p className="text-[11px] text-slate-300">
                    {finding.remediationInstructions.operationalImpact}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Status Change Audit Trail */}
          <Card
            title="Finding Status Audit Trail"
            subtitle="Immutable chronological history of status adjustments and risk exceptions"
          >
            <div className="space-y-3">
              {finding.statusHistory?.length === 0 ? (
                <div className="text-xs text-slate-500">No status updates recorded.</div>
              ) : (
                finding.statusHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-slate-300">
                        {item.actorName || 'System'} changed status to{' '}
                        <span className="uppercase font-mono font-bold text-blue-400">
                          {item.toStatus}
                        </span>
                      </span>
                      <span className="text-slate-500">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {item.reason && (
                      <p className="text-[11px] text-slate-400 font-sans italic">
                        "{item.reason}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Asset Details & Compliance Mappings */}
        <div className="space-y-6">
          {/* Affected Resource Card */}
          <Card title="Affected Cloud Asset" subtitle="Inventory reference">
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[11px] text-slate-500 block">Resource Name</span>
                <Link
                  to={`/resources/${finding.resource?._id || finding.resource}`}
                  className="font-semibold text-blue-400 hover:underline block truncate"
                >
                  {finding.resourceName}
                </Link>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block">Resource Identifier</span>
                <span className="font-mono text-slate-300">{finding.resourceId}</span>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block">Asset Type</span>
                <span className="font-mono text-slate-300">{finding.resourceType}</span>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block">Cloud Account</span>
                <span className="text-slate-300">{finding.account?.name}</span>
              </div>
            </div>
          </Card>

          {/* Compliance Mappings */}
          <Card title="Mapped Security Controls" subtitle="Associated framework baselines">
            <div className="space-y-2">
              {finding.complianceMappings?.length === 0 ? (
                <div className="text-xs text-slate-500">No framework mappings.</div>
              ) : (
                finding.complianceMappings.map((cm, i) => (
                  <div key={i} className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs">
                    <span className="font-mono font-bold text-blue-400 block">{cm.controlId}</span>
                    <span className="text-slate-200 font-medium block mt-0.5">{cm.controlTitle}</span>
                    <span className="text-[10px] text-slate-500 uppercase">{cm.framework}</span>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Risk Acceptance Info (if accepted) */}
          {finding.status === 'accepted_risk' && (
            <Card title="Active Risk Exception" subtitle="Documented risk tolerance">
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[10px] text-purple-400 uppercase tracking-wider block">
                    Justification
                  </span>
                  <p className="text-slate-300 mt-1 italic">
                    "{finding.riskAcceptance?.justification}"
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                    Expiry Date
                  </span>
                  <span className="font-mono text-slate-300">
                    {finding.riskAcceptance?.expiresAt
                      ? new Date(finding.riskAcceptance.expiresAt).toLocaleDateString()
                      : 'None'}
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Modal 1: Update Status */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Update Finding Status"
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Select New Status
            </label>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="false_positive">False Positive</option>
              <option value="resolved">Resolved (Manual Override)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Reason / Analyst Notes
            </label>
            <textarea
              rows={3}
              required
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="Provide reason for this status change..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsStatusModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Status
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Accept Risk */}
      <Modal
        isOpen={isRiskModalOpen}
        onClose={() => setIsRiskModalOpen(false)}
        title="Authorize Risk Acceptance Exception"
      >
        <form onSubmit={handleAcceptRisk} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Business Justification (Mandatory)
            </label>
            <textarea
              rows={3}
              required
              value={riskJustification}
              onChange={(e) => setRiskJustification(e.target.value)}
              placeholder="e.g. Compensating controls in place: asset is segregated behind corporate VPN with strict network firewall."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Mandatory Expiry Date
            </label>
            <input
              type="date"
              required
              value={riskExpiry}
              onChange={(e) => setRiskExpiry(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              When the exception expires, CloudGuard will automatically return the finding to Open.
            </p>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsRiskModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Confirm Risk Acceptance
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
