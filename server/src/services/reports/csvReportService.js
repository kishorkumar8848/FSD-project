/**
 * Sanitizes cell values to neutralize spreadsheet formula injection (=, +, -, @, \t, \r)
 */
function sanitizeCsvCell(val) {
  if (val === null || val === undefined) return '""';
  let str = String(val);

  // If starts with risky formula trigger characters, prepend single quote
  if (/^[=\+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape internal double quotes
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Generates CSV export for findings
 */
export function generateFindingsCsv(findings = []) {
  const headers = [
    'Finding ID',
    'Rule ID',
    'Severity',
    'Status',
    'Finding Title',
    'Resource Name',
    'Resource ID',
    'Resource Type',
    'Risk Score',
    'First Detected',
    'Last Detected',
    'Business Impact',
    'Remediation Summary',
  ];

  const rows = [headers.join(',')];

  for (const f of findings) {
    const row = [
      sanitizeCsvCell(f._id),
      sanitizeCsvCell(f.ruleId),
      sanitizeCsvCell(f.severity),
      sanitizeCsvCell(f.status),
      sanitizeCsvCell(f.title),
      sanitizeCsvCell(f.resourceName),
      sanitizeCsvCell(f.resourceId),
      sanitizeCsvCell(f.resourceType),
      sanitizeCsvCell(f.riskScore),
      sanitizeCsvCell(f.firstDetectedAt ? new Date(f.firstDetectedAt).toISOString() : ''),
      sanitizeCsvCell(f.lastDetectedAt ? new Date(f.lastDetectedAt).toISOString() : ''),
      sanitizeCsvCell(f.businessImpact || ''),
      sanitizeCsvCell(f.remediationInstructions?.summary || ''),
    ];
    rows.push(row.join(','));
  }

  return rows.join('\r\n');
}

/**
 * Generates CSV export for cloud resources
 */
export function generateResourcesCsv(resources = []) {
  const headers = [
    'Resource ID',
    'Display Name',
    'Type',
    'Provider',
    'Environment',
    'Criticality',
    'Region',
    'Active Findings Count',
    'First Seen',
    'Last Assessed',
  ];

  const rows = [headers.join(',')];

  for (const r of resources) {
    const row = [
      sanitizeCsvCell(r.resourceId),
      sanitizeCsvCell(r.name),
      sanitizeCsvCell(r.type),
      sanitizeCsvCell(r.provider),
      sanitizeCsvCell(r.environment),
      sanitizeCsvCell(r.criticality),
      sanitizeCsvCell(r.region),
      sanitizeCsvCell(r.activeFindingsCount || 0),
      sanitizeCsvCell(r.firstSeenAt ? new Date(r.firstSeenAt).toISOString() : ''),
      sanitizeCsvCell(r.lastAssessedAt ? new Date(r.lastAssessedAt).toISOString() : ''),
    ];
    rows.push(row.join(','));
  }

  return rows.join('\r\n');
}
