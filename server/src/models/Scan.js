import mongoose from 'mongoose';

const scanSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CloudAccount',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['queued', 'running', 'completed', 'failed', 'cancelled'],
      default: 'queued',
      index: true,
    },
    scanType: {
      type: String,
      enum: ['manual', 'scheduled', 'verification', 'import_scan'],
      default: 'manual',
    },
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    durationMs: {
      type: Number,
      default: 0,
    },
    resourcesEvaluatedCount: {
      type: Number,
      default: 0,
    },
    rulesEvaluatedCount: {
      type: Number,
      default: 0,
    },
    findingsSummary: {
      critical: { type: Number, default: 0 },
      high: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      low: { type: Number, default: 0 },
      totalActive: { type: Number, default: 0 },
      newFindings: { type: Number, default: 0 },
      resolvedFindings: { type: Number, default: 0 },
      unchangedFindings: { type: Number, default: 0 },
    },
    postureScore: {
      type: Number,
      default: 100,
    },
    complianceScore: {
      type: Number,
      default: 100,
    },
    complianceCoverage: {
      type: Number,
      default: 100,
    },
    errorMessage: {
      type: String,
    },
    snapshot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ConfigurationSnapshot',
    },
  },
  {
    timestamps: true,
  }
);

export const Scan = mongoose.model('Scan', scanSchema);
