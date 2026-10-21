import { z } from 'zod';
import { CloudResource } from '../models/CloudResource.js';
import { CloudAccount } from '../models/CloudAccount.js';
import { Finding } from '../models/Finding.js';
import { ConfigurationSnapshot } from '../models/ConfigurationSnapshot.js';
import { AuditLog } from '../models/AuditLog.js';

const validResourceTypes = [
  'storage_bucket',
  'database',
  'iam_user',
  'iam_role',
  'iam_policy',
  'virtual_machine',
  'security_group',
  'audit_log',
];

const singleResourceSchema = z.object({
  resourceId: z.string().min(1, 'resourceId is required').max(100),
  type: z.string().refine((val) => validResourceTypes.includes(val.toLowerCase()), {
    message: `Invalid resource type. Supported: ${validResourceTypes.join(', ')}`,
  }),
  name: z.string().min(1, 'name is required').max(100),
  environment: z.enum(['development', 'staging', 'production']).optional().default('development'),
  criticality: z.enum(['critical', 'high', 'medium', 'low']).optional().default('medium'),
  configuration: z.record(z.any()).default({}),
  tags: z.record(z.string()).optional().default({}),
});

const importPayloadSchema = z.object({
  accountId: z.string().min(1, 'Target accountId is required'),
  provider: z.string().optional().default('simulated'),
  region: z.string().optional().default('us-east-1'),
  resources: z.array(singleResourceSchema).min(1, 'At least 1 resource required').max(100, 'Maximum 100 resources per import batch'),
  previewOnly: z.boolean().optional().default(false),
});

export async function getResources(req, res, next) {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      type,
      environment,
      criticality,
      accountId,
      sortField = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = { organization: req.organizationId };

    if (accountId) query.account = accountId;
    if (type) query.type = type;
    if (environment) query.environment = environment;
    if (criticality) query.criticality = criticality;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { resourceId: { $regex: search, $options: 'i' } },
      ];
    }

    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [resources, total] = await Promise.all([
      CloudResource.find(query)
        .populate('account', 'name provider environment')
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      CloudResource.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        resources,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(total / parseInt(limit, 10)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getResourceById(req, res, next) {
  try {
    const resource = await CloudResource.findOne({
      _id: req.params.id,
      organization: req.organizationId,
    }).populate('account', 'name provider environment region');

    if (!resource) {
      return res.status(404).json({ success: false, error: { message: 'Cloud resource not found.' } });
    }

    // Associated findings
    const findings = await Finding.find({
      organization: req.organizationId,
      resource: resource._id,
    }).sort({ status: 1, severity: 1 });

    res.json({
      success: true,
      data: {
        resource,
        findings,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function importResources(req, res, next) {
  try {
    const data = importPayloadSchema.parse(req.body);

    const account = await CloudAccount.findOne({
      _id: data.accountId,
      organization: req.organizationId,
    });
    if (!account) {
      return res.status(404).json({
        success: false,
        error: { message: 'Target cloud account not found in current organization context.' },
      });
    }

    // If previewOnly is requested, return normalized preview without persisting
    if (data.previewOnly) {
      return res.json({
        success: true,
        preview: true,
        summary: {
          totalToImport: data.resources.length,
          accountName: account.name,
          resourceTypes: [...new Set(data.resources.map((r) => r.type))],
        },
        items: data.resources,
      });
    }

    const imported = [];
    let createdCount = 0;
    let updatedCount = 0;

    for (const r of data.resources) {
      const type = r.type.toLowerCase().trim();
      const existing = await CloudResource.findOne({
        organization: req.organizationId,
        account: account._id,
        resourceId: r.resourceId,
      });

      if (existing) {
        existing.name = r.name;
        existing.type = type;
        existing.environment = r.environment || account.environment;
        existing.criticality = r.criticality || 'medium';
        existing.configuration = r.configuration || {};
        existing.tags = r.tags || {};
        existing.lastSeenAt = new Date();
        await existing.save();
        imported.push(existing);
        updatedCount++;
      } else {
        const newRes = await CloudResource.create({
          organization: req.organizationId,
          account: account._id,
          resourceId: r.resourceId,
          name: r.name,
          type,
          provider: data.provider || account.provider,
          region: data.region || account.region,
          environment: r.environment || account.environment,
          criticality: r.criticality || 'medium',
          configuration: r.configuration || {},
          tags: r.tags || {},
          firstSeenAt: new Date(),
          lastSeenAt: new Date(),
        });
        imported.push(newRes);
        createdCount++;
      }
    }

    // Update account resource count
    account.totalResources = await CloudResource.countDocuments({
      organization: req.organizationId,
      account: account._id,
    });
    await account.save();

    await AuditLog.create({
      organization: req.organizationId,
      actor: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'RESOURCE_IMPORTED',
      targetType: 'account',
      targetId: account._id.toString(),
      details: {
        totalResources: data.resources.length,
        createdCount,
        updatedCount,
      },
    });

    res.status(201).json({
      success: true,
      message: `Successfully imported ${data.resources.length} resource(s) (${createdCount} new, ${updatedCount} updated).`,
      data: {
        createdCount,
        updatedCount,
        resources: imported,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getResourceHistory(req, res, next) {
  try {
    const resource = await CloudResource.findOne({
      _id: req.params.id,
      organization: req.organizationId,
    });
    if (!resource) {
      return res.status(404).json({ success: false, error: { message: 'Resource not found.' } });
    }

    // Historical snapshots containing this resource
    const snapshots = await ConfigurationSnapshot.find({
      organization: req.organizationId,
      'resourceData.resourceId': resource.resourceId,
    })
      .sort({ capturedAt: -1 })
      .limit(10)
      .populate('scan', 'postureScore scanType completedAt');

    res.json({ success: true, data: snapshots });
  } catch (err) {
    next(err);
  }
}
