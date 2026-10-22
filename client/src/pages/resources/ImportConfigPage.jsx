import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, CheckCircle2, AlertCircle, FileText, Code2, ArrowRight } from 'lucide-react';
import api from '../../api/client';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';

export function ImportConfigPage() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadAccounts() {
      try {
        const res = await api.get('/cloud-accounts');
        if (res.success && res.data.length > 0) {
          setAccounts(res.data);
          setSelectedAccountId(res.data[0]._id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadAccounts();
  }, []);

  const loadSample = (type) => {
    setError('');
    setPreviewData(null);
    let sample = {};

    if (type === 'vulnerable') {
      sample = {
        provider: 'simulated',
        accountName: 'Sandbox Vuln Test',
        region: 'us-east-1',
        resources: [
          {
            resourceId: 's3-leak-001',
            type: 'storage_bucket',
            name: 'unprotected-financial-archive',
            environment: 'production',
            criticality: 'critical',
            configuration: {
              publicAccess: true,
              encryptionEnabled: false,
              versioningEnabled: false,
              tlsRequired: false,
            },
            tags: { owner: 'finance' },
          },
          {
            resourceId: 'db-open-002',
            type: 'database',
            name: 'public-mysql-instance',
            environment: 'staging',
            criticality: 'critical',
            configuration: {
              publicAccess: true,
              backupEnabled: false,
              backupRetentionDays: 0,
              inboundRules: [{ protocol: 'tcp', port: 3306, source: '0.0.0.0/0' }],
            },
            tags: { owner: 'qa' },
          },
          {
            resourceId: 'vm-bastion-003',
            type: 'virtual_machine',
            name: 'open-ssh-host',
            environment: 'development',
            criticality: 'high',
            configuration: {
              publicIp: true,
              inboundRules: [{ protocol: 'tcp', port: 22, source: '0.0.0.0/0' }],
            },
            tags: {},
          },
        ],
      };
    } else if (type === 'secure') {
      sample = {
        provider: 'simulated',
        accountName: 'Hardened Vault',
        region: 'us-east-1',
        resources: [
          {
            resourceId: 's3-hardened-001',
            type: 'storage_bucket',
            name: 'hardened-encrypted-vault',
            environment: 'production',
            criticality: 'critical',
            configuration: {
              publicAccess: false,
              encryptionEnabled: true,
              versioningEnabled: true,
              tlsRequired: true,
            },
            tags: {
              owner: 'secops',
              environment: 'production',
              dataClassification: 'confidential',
            },
          },
          {
            resourceId: 'db-hardened-002',
            type: 'database',
            name: 'private-isolated-postgres',
            environment: 'production',
            criticality: 'critical',
            configuration: {
              publicAccess: false,
              encryptionEnabled: true,
              backupEnabled: true,
              backupRetentionDays: 30,
              inboundRules: [{ protocol: 'tcp', port: 5432, source: '10.0.10.0/24' }],
            },
            tags: {
              owner: 'data-platform',
              environment: 'production',
              dataClassification: 'restricted',
            },
          },
        ],
      };
    }

    setJsonText(JSON.stringify(sample, null, 2));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('File exceeds maximum upload size limit (2 MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setJsonText(event.target.result);
      setError('');
      setPreviewData(null);
    };
    reader.readAsText(file);
  };

  const handlePreview = async () => {
    setError('');
    setSuccessMsg('');
    if (!selectedAccountId) {
      setError('Please select a target cloud account.');
      return;
    }
    if (!jsonText.trim()) {
      setError('Please provide or paste JSON configuration content.');
      return;
    }

    try {
      const parsed = JSON.parse(jsonText);
      const resources = parsed.resources || [];
      if (!Array.isArray(resources) || resources.length === 0) {
        throw new Error('JSON must contain a "resources" array with at least one cloud resource.');
      }

      setLoading(true);
      const res = await api.post('/resources/import', {
        accountId: selectedAccountId,
        provider: parsed.provider || 'simulated',
        region: parsed.region || 'us-east-1',
        resources,
        previewOnly: true,
      });

      if (res.success) {
        setPreviewData(res.items);
      }
    } catch (err) {
      setError(err.message || 'Invalid JSON format or schema validation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    setError('');
    setSuccessMsg('');
    try {
      const parsed = JSON.parse(jsonText);
      setLoading(true);

      const res = await api.post('/resources/import', {
        accountId: selectedAccountId,
        provider: parsed.provider || 'simulated',
        region: parsed.region || 'us-east-1',
        resources: parsed.resources,
        previewOnly: false,
      });

      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          navigate('/resources');
        }, 1500);
      }
    } catch (err) {
      setError(err.message || 'Import persistence failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <Breadcrumbs
        items={[
          { label: 'Resource Inventory', to: '/resources' },
          { label: 'Import Configuration' },
        ]}
      />

      <div className="pb-2 border-b border-slate-200/80">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          Import Cloud Configuration JSON
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Upload or paste JSON configuration schemas for cloud infrastructure posture evaluation
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Editor & File Upload */}
        <div className="lg:col-span-2 space-y-4">
          <Card
            title="Configuration JSON Input"
            subtitle="Paste configuration payload or choose file"
            action={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadSample('vulnerable')}
                  className="text-xs text-orange-600 font-medium hover:underline"
                >
                  Load Vulnerable Sample
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => loadSample('secure')}
                  className="text-xs text-blue-600 font-medium hover:underline"
                >
                  Load Secure Sample
                </button>
              </div>
            }
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                />
              </div>

              <textarea
                rows={16}
                value={jsonText}
                onChange={(e) => {
                  setJsonText(e.target.value);
                  setPreviewData(null);
                }}
                placeholder='{\n  "provider": "simulated",\n  "accountName": "Demo Account",\n  "resources": [\n    {\n      "resourceId": "bucket-01",\n      "type": "storage_bucket",\n      "name": "data-archive",\n      "configuration": { "publicAccess": false, "encryptionEnabled": true }\n    }\n  ]\n}'
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-500">
                  Maximum 100 resources per import batch • 2 MB file limit
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handlePreview}
                  loading={loading && !previewData}
                >
                  Validate & Preview
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Col: Account Target & Preview Confirmation */}
        <div className="space-y-4">
          <Card title="Target Account" subtitle="Assign imported assets to authorized account">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Destination Cloud Account
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.name} ({acc.environment})
                    </option>
                  ))}
                </select>
              </div>

              {previewData && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Validated Resources:</span>
                    <span className="font-mono font-bold text-emerald-600">
                      {previewData.length} Valid
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-slate-50 rounded border border-slate-200">
                    {previewData.map((item, idx) => (
                      <div key={idx} className="text-[11px] font-mono text-slate-700 flex justify-between">
                        <span className="truncate max-w-[140px] font-medium">{item.name}</span>
                        <span className="text-slate-500">{item.type}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    className="w-full mt-2"
                    onClick={handleConfirmImport}
                    loading={loading && !!previewData}
                    icon={ArrowRight}
                  >
                    Confirm & Save to Inventory
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
