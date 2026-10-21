import mongoose from 'mongoose';

const cloudAccountSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    accountId: {
      type: String,
      required: true,
      trim: true,
    },
    provider: {
      type: String,
      enum: ['simulated', 'aws', 'azure', 'gcp'],
      default: 'simulated',
    },
    environment: {
      type: String,
      enum: ['development', 'staging', 'production'],
      default: 'development',
    },
    region: {
      type: String,
      default: 'us-east-1',
    },
    description: {
      type: String,
      default: '',
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    connectionMode: {
      type: String,
      enum: ['simulated_local', 'read_only_role', 'json_import'],
      default: 'simulated_local',
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'error'],
      default: 'active',
    },
    lastScanAt: {
      type: Date,
    },
    lastScanStatus: {
      type: String,
      enum: ['never_scanned', 'completed', 'failed', 'running'],
      default: 'never_scanned',
    },
    postureScore: {
      type: Number,
      default: 100,
    },
    totalResources: {
      type: Number,
      default: 0,
    },
    totalFindings: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

cloudAccountSchema.index({ organization: 1, accountId: 1 }, { unique: true });

export const CloudAccount = mongoose.model('CloudAccount', cloudAccountSchema);
