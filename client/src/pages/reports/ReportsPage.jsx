import React, { useState, useEffect } from 'react';
import { FileText, Download, Plus, FileSpreadsheet, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import api from '../../api/client';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';

export function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    accountId: '',
    reportType: 'executive_summary_pdf',
  });
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchReports = async () => {
    try {
      const res = await api.get('/reports');
      if (res.success) setReports(res.data);
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
        if (res.success && res.data.length > 0) {
          setAccounts(res.data);
          setFormData((prev) => ({ ...prev, accountId: res.data[0]._id }));
        }
      } catch (err) {}
    }
    loadAccounts();
    fetchReports();
  }, []);

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await api.post('/reports', formData);
      if (res.success) {
        setIsModalOpen(false);
        fetchReports();
      }
    } catch (err) {
      alert(`Report generation failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (reportId, fileName) => {
    setDownloadingId(reportId);
    try {
      const token = localStorage.getItem('cloudguard_token');
      const response = await fetch(`/api/v1/reports/${reportId}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(`Download failed: ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Assessment Reports & Exports
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Download comprehensive executive security summaries and inventory exports
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          icon={Plus}
        >
          Generate New Report
        </Button>
      </div>

      {/* Reports Table */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton rows={5} height="h-10" />
          </div>
        ) : reports.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No reports generated yet"
            description="Generate an executive PDF or export a CSV inventory for compliance evidence."
            actionLabel="Generate Report"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 border-b border-slate-800 uppercase text-[10px] text-slate-400 font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Account Scope</th>
                  <th className="py-3 px-4">Posture Baseline</th>
                  <th className="py-3 px-4">File Size</th>
                  <th className="py-3 px-4">Generated</th>
                  <th className="py-3 px-4 text-right">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {reports.map((rep) => (
                  <tr key={rep._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        {rep.format === 'pdf' ? (
                          <FileText className="w-4 h-4 text-red-400 flex-shrink-0" />
                        ) : (
                          <FileSpreadsheet className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        )}
                        <div>
                          <span className="font-semibold text-slate-200 block">{rep.title}</span>
                          <span className="text-[11px] font-mono text-slate-500">{rep.fileName}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono uppercase font-bold text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                        {rep.format}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {rep.account?.name || 'Primary Cloud Account'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-400">
                      {rep.metadata?.postureScore ? `${rep.metadata.postureScore}/100` : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {rep.fileSize ? `${(rep.fileSize / 1024).toFixed(1)} KB` : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(rep.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        loading={downloadingId === rep._id}
                        onClick={() => handleDownload(rep._id, rep.fileName)}
                        icon={Download}
                      >
                        Download
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Generate Report */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Generate Security Assessment Report"
      >
        <form onSubmit={handleGenerateReport} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Target Cloud Account
            </label>
            <select
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              {accounts.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name} ({a.environment})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Report Format & Document Type
            </label>
            <select
              value={formData.reportType}
              onChange={(e) => setFormData({ ...formData, reportType: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="executive_summary_pdf">
                Executive Security Posture Report (PDF)
              </option>
              <option value="detailed_findings_csv">
                Detailed Security Findings Matrix (CSV)
              </option>
              <option value="resource_inventory_csv">
                Monitored Cloud Resource Inventory (CSV)
              </option>
            </select>
          </div>

          <p className="text-[11px] text-slate-400">
            PDF reports are rendered with branded executive summaries, severity distribution, remediation actions, and NIST CSF compliance metrics.
          </p>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={generating}>
              Generate Report
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
