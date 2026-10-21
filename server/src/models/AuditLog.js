import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    actorEmail: {
      type: String,
      required: true,
    },
    actorRole: {
      type: String,
      default: 'analyst',
    },
    action: {
      type: String,
      required: true,
      enum: [
        'AUTH_LOGIN',
        'AUTH_LOGOUT',
        'AUTH_REGISTER',
        'ACCOUNT_CREATED',
        'ACCOUNT_UPDATED',
        'ACCOUNT_DELETED',
        'RESOURCE_IMPORTED',
        'SCAN_INITIATED',
        'SCAN_COMPLETED',
        'FINDING_STATUS_CHANGED',
        'RISK_ACCEPTED',
        'FALSE_POSITIVE_MARKED',
        'RULE_UPDATED',
        'REPORT_GENERATED',
        'SETTINGS_UPDATED',
      ],
      index: true,
    },
    targetType: {
      type: String,
      enum: ['user', 'account', 'resource', 'scan', 'finding', 'rule', 'report', 'setting'],
      required: true,
    },
    targetId: {
      type: String,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    userAgent: {
      type: String,
      default: 'CloudGuard Client',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Append-only!
  }
);

auditLogSchema.index({ organization: 1, createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
