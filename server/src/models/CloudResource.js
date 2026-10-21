import mongoose from 'mongoose';

const cloudResourceSchema = new mongoose.Schema(
  {
    resourceId: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'storage_bucket',
        'database',
        'iam_user',
        'iam_role',
        'iam_policy',
        'virtual_machine',
        'security_group',
        'audit_log',
      ],
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    provider: {
      type: String,
      enum: ['simulated', 'aws', 'azure', 'gcp'],
      default: 'simulated',
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CloudAccount',
      required: true,
      index: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    region: {
      type: String,
      default: 'us-east-1',
    },
    environment: {
      type: String,
      enum: ['development', 'staging', 'production'],
      default: 'development',
      index: true,
    },
    criticality: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'medium',
      index: true,
    },
    configuration: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {},
    },
    tags: {
      type: Map,
      of: String,
      default: {},
    },
    firstSeenAt: {
      type: Date,
      default: Date.now,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
    lastAssessedAt: {
      type: Date,
    },
    activeFindingsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

cloudResourceSchema.index({ organization: 1, account: 1, resourceId: 1 }, { unique: true });

export const CloudResource = mongoose.model('CloudResource', cloudResourceSchema);
