import { z } from 'zod';
import { allRules, getRuleById } from '../services/assessment/rules/index.js';
import { SecurityRule } from '../models/SecurityRule.js';
import { AuditLog } from '../models/AuditLog.js';

const updateRuleSchema = z.object({
  status: z.enum(['enabled', 'disabled']).optional(),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'info']).optional(),
});

export async function getRules(req, res, next) {
  try {
    const dbRules = await SecurityRule.find();
    const dbMap = new Map(dbRules.map((r) => [r.ruleId, r]));

    const rules = allRules.map((codeRule) => {
      const dbRule = dbMap.get(codeRule.ruleId);
      return {
        ...codeRule,
        status: dbRule ? dbRule.status : codeRule.status || 'enabled',
        severity: dbRule ? dbRule.severity : codeRule.severity,
      };
    });

    res.json({ success: true, data: rules });
  } catch (err) {
    next(err);
  }
}

export async function getRuleDetails(req, res, next) {
  try {
    const rule = getRuleById(req.params.id);
    if (!rule) {
      return res.status(404).json({ success: false, error: { message: 'Rule not found.' } });
    }

    const dbRule = await SecurityRule.findOne({ ruleId: rule.ruleId });

    res.json({
      success: true,
      data: {
        ...rule,
        status: dbRule ? dbRule.status : rule.status || 'enabled',
        severity: dbRule ? dbRule.severity : rule.severity,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateRule(req, res, next) {
  try {
    const data = updateRuleSchema.parse(req.body);
    const codeRule = getRuleById(req.params.id);

    if (!codeRule) {
      return res.status(404).json({ success: false, error: { message: 'Rule not found.' } });
    }

    let ruleDoc = await SecurityRule.findOne({ ruleId: codeRule.ruleId });
    if (!ruleDoc) {
      ruleDoc = new SecurityRule({
        ruleId: codeRule.ruleId,
        name: codeRule.name,
        description: codeRule.description,
        category: codeRule.category,
        supportedResourceTypes: codeRule.supportedResourceTypes,
        severity: codeRule.severity,
        version: codeRule.version,
        expectedSecureConfig: codeRule.expectedSecureConfig,
        detectionRationale: codeRule.detectionRationale,
        evidenceFields: codeRule.evidenceFields,
        remediationInstructions: codeRule.remediationInstructions,
        complianceMappings: codeRule.complianceMappings,
        status: 'enabled',
      });
    }

    if (data.status) ruleDoc.status = data.status;
    if (data.severity) ruleDoc.severity = data.severity;

    await ruleDoc.save();

    await AuditLog.create({
      organization: req.organizationId,
      actor: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'RULE_UPDATED',
      targetType: 'rule',
      targetId: codeRule.ruleId,
      details: data,
    });

    res.json({
      success: true,
      message: `Security rule '${codeRule.ruleId}' updated successfully.`,
      data: ruleDoc,
    });
  } catch (err) {
    next(err);
  }
}
