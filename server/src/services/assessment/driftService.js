import crypto from 'crypto';
import { ConfigurationSnapshot } from '../../models/ConfigurationSnapshot.js';
import { DriftEvent } from '../../models/DriftEvent.js';

/**
 * Normalizes configuration object to eliminate cosmetic noise (key ordering, nulls/undefined)
 */
function normalizeConfig(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(normalizeConfig);

  const clean = {};
  const sortedKeys = Object.keys(obj).sort();
  for (const key of sortedKeys) {
    // Ignore internal timestamp or scan-volatile noise
    if (['updatedAt', 'lastSeenAt', 'createdAt', '__v'].includes(key)) continue;
    clean[key] = normalizeConfig(obj[key]);
  }
  return clean;
}

function hashConfig(normalizedObj) {
  return crypto.createHash('sha256').update(JSON.stringify(normalizedObj)).digest('hex');
}

/**
 * Captures snapshot and computes drift against the immediate prior snapshot
 */
export async function detectDriftAndCaptureSnapshot({
  organizationId,
  accountId,
  scanId,
  resources,
  newFindingRuleIdsByResource = {},
  resolvedFindingRuleIdsByResource = {},
}) {
  // 1. Fetch the most recent prior snapshot for this account
  const previousSnapshot = await ConfigurationSnapshot.findOne({
    organization: organizationId,
    account: accountId,
  }).sort({ capturedAt: -1 });

  // 2. Prepare current normalized data
  const currentResourceData = resources.map((r) => {
    const rawTags = r.tags instanceof Map ? Object.fromEntries(r.tags) : (r.tags || {});
    const normConfig = normalizeConfig(r.configuration || {});
    const normTags = normalizeConfig(rawTags);
    const hash = hashConfig({ normConfig, normTags, criticality: r.criticality, environment: r.environment });

    return {
      resourceId: r.resourceId,
      name: r.name,
      type: r.type,
      environment: r.environment,
      criticality: r.criticality,
      configuration: normConfig,
      tags: normTags,
      hash,
    };
  });

  // 3. Persist new snapshot
  const snapshot = await ConfigurationSnapshot.create({
    organization: organizationId,
    account: accountId,
    scan: scanId,
    resourcesCount: resources.length,
    resourceData: currentResourceData,
    capturedAt: new Date(),
  });

  // 4. If no prior snapshot exists, this is baseline; no drift event recorded
  if (!previousSnapshot) {
    return { snapshot, driftEvents: [] };
  }

  const prevResourceMap = new Map(
    previousSnapshot.resourceData.map((d) => [d.resourceId, d])
  );

  const driftEvents = [];

  for (const current of currentResourceData) {
    const prev = prevResourceMap.get(current.resourceId);

    // If resource didn't exist before, or hash is identical, skip
    if (!prev) continue;
    if (prev.hash === current.hash) continue;

    // Diff configuration fields
    const changedFields = [];
    const allKeys = new Set([
      ...Object.keys(prev.configuration || {}),
      ...Object.keys(current.configuration || {}),
    ]);

    for (const key of allKeys) {
      const prevVal = prev.configuration?.[key];
      const curVal = current.configuration?.[key];
      if (JSON.stringify(prevVal) !== JSON.stringify(curVal)) {
        const isSecurityRelevant = [
          'publicAccess',
          'encryptionEnabled',
          'mfaEnabled',
          'inboundRules',
          'backupEnabled',
          'tlsRequired',
          'enforceHttps',
          'auditLoggingEnabled',
        ].includes(key);

        changedFields.push({
          fieldPath: `configuration.${key}`,
          previousValue: prevVal,
          currentValue: curVal,
          isSecurityRelevant,
        });
      }
    }

    // Check tag changes
    const allTagKeys = new Set([
      ...Object.keys(prev.tags || {}),
      ...Object.keys(current.tags || {}),
    ]);
    for (const key of allTagKeys) {
      const prevVal = prev.tags?.[key];
      const curVal = current.tags?.[key];
      if (prevVal !== curVal) {
        changedFields.push({
          fieldPath: `tags.${key}`,
          previousValue: prevVal,
          currentValue: curVal,
          isSecurityRelevant: ['owner', 'environment', 'dataClassification'].includes(key),
        });
      }
    }

    // Determine drift type & impact
    const newFindings = newFindingRuleIdsByResource[current.resourceId] || [];
    const resolvedFindings = resolvedFindingRuleIdsByResource[current.resourceId] || [];

    let driftType = 'configuration_change';
    let severityImpact = 'neutral';
    let description = `Configuration updated for ${current.name} (${changedFields.length} field(s) modified).`;

    if (newFindings.length > 0) {
      driftType = 'security_regression';
      severityImpact = 'high';
      description = `Security regression detected: ${current.name} modified, introducing new violations [${newFindings.join(', ')}].`;
    } else if (resolvedFindings.length > 0) {
      driftType = 'security_improvement';
      severityImpact = 'improved';
      description = `Security remediation confirmed: ${current.name} updated, resolving violations [${resolvedFindings.join(', ')}].`;
    }

    // Find the mongo CloudResource document reference
    const resourceDoc = resources.find((r) => r.resourceId === current.resourceId);

    const driftRecord = {
      organization: organizationId,
      account: accountId,
      resource: resourceDoc ? resourceDoc._id : null,
      resourceId: current.resourceId,
      resourceName: current.name,
      resourceType: current.type,
      currentScan: scanId,
      previousScan: previousSnapshot.scan,
      driftType,
      severityImpact,
      changedFields,
      newFindingsTriggered: newFindings,
      findingsResolved: resolvedFindings,
      description,
      detectedAt: new Date(),
    };

    driftEvents.push(driftRecord);
  }

  if (driftEvents.length > 0) {
    await DriftEvent.insertMany(driftEvents);
  }

  return { snapshot, driftEvents };
}
