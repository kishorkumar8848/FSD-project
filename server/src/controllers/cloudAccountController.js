import { z } from 'zod';
import { CloudAccount } from '../models/CloudAccount.js';
import { CloudResource } from '../models/CloudResource.js';
import { Finding } from '../models/Finding.js';
import { AuditLog } from '../models/AuditLog.js';

const accountSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  accountId: z.string().min(2, 'Account ID is required'),
  provider: z.enum(['simulated', 'aws', 'azure', 'gcp']).default('simulated'),
  environment: z.enum(['development', 'staging', 'production']).default('development'),
  region: z.string().default('us-east-1'),
  description: z.string().optional().default(''),
  connectionMode: z.enum(['simulated_local', 'read_only_role', 'json_import']).default('simulated_local'),
});

export async function getCloudAccounts(req, res, next) {
  try {
    const accounts = await CloudAccount.find({ organization: req.organizationId }).sort({ createdAt: -1 });
    res.json({ success: true, data: accounts });
  } catch (err) {
    next(err);
  }
}

export async function getCloudAccountById(req, res, next) {
  try {
    const account = await CloudAccount.findOne({
      _id: req.params.id,
      organization: req.organizationId,
    });
    if (!account) {
      return res.status(404).json({ success: false, error: { message: 'Cloud account not found.' } });
    }
    res.json({ success: true, data: account });
  } catch (err) {
    next(err);
  }
}

export async function createCloudAccount(req, res, next) {
  try {
    const data = accountSchema.parse(req.body);

    const existing = await CloudAccount.findOne({
      organization: req.organizationId,
      accountId: data.accountId,
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { message: `Account with ID '${data.accountId}' already exists in your organization.` },
      });
    }

    const account = await CloudAccount.create({
      ...data,
      organization: req.organizationId,
    });

    await AuditLog.create({
      organization: req.organizationId,
      actor: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'ACCOUNT_CREATED',
      targetType: 'account',
      targetId: account._id.toString(),
      details: { name: account.name, provider: account.provider },
    });

    res.status(201).json({ success: true, data: account });
  } catch (err) {
    next(err);
  }
}

export async function updateCloudAccount(req, res, next) {
  try {
    const account = await CloudAccount.findOne({
      _id: req.params.id,
      organization: req.organizationId,
    });
    if (!account) {
      return res.status(404).json({ success: false, error: { message: 'Cloud account not found.' } });
    }

    const allowed = ['name', 'environment', 'region', 'description', 'status'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        account[key] = req.body[key];
      }
    }

    await account.save();

    await AuditLog.create({
      organization: req.organizationId,
      actor: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'ACCOUNT_UPDATED',
      targetType: 'account',
      targetId: account._id.toString(),
      details: req.body,
    });

    res.json({ success: true, data: account });
  } catch (err) {
    next(err);
  }
}

export async function deleteCloudAccount(req, res, next) {
  try {
    const account = await CloudAccount.findOne({
      _id: req.params.id,
      organization: req.organizationId,
    });
    if (!account) {
      return res.status(404).json({ success: false, error: { message: 'Cloud account not found.' } });
    }

    // Cascade delete associated resources and findings
    await CloudResource.deleteMany({ account: account._id, organization: req.organizationId });
    await Finding.deleteMany({ account: account._id, organization: req.organizationId });
    await account.deleteOne();

    await AuditLog.create({
      organization: req.organizationId,
      actor: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'ACCOUNT_DELETED',
      targetType: 'account',
      targetId: account._id.toString(),
      details: { name: account.name },
    });

    res.json({ success: true, message: 'Cloud account and associated assets successfully removed.' });
  } catch (err) {
    next(err);
  }
}
