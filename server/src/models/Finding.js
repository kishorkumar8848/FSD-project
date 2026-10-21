import mongoose from 'mongoose';

const findingSchema = new mongoose.Schema(
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
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CloudResource',
      required: true,
      index: true,
    },
    resourceId: {
      type: String,
      required: true,
      index: true,
    },
    resourceName: {
      type: String,
      required: true,
    },
    resourceType: {
      type: String,
      required: true,
    },
    ruleId: {
      type: String,
      required: true,
      index: true,
    },
    ruleName: {
      type: String,
      required: true,
    },
    ruleVersion: {
      type: String,
      default: '1.0.0',
    },
    fingerprint: {
      type: String,
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low', 'info'],
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'accepted_risk', 'false_positive'],
      default: 'open',
      index: true,
    },
    riskScore: {
      type: Number,
      default: 0,
    },
    evidence: {
      evaluatedFields: mongoose.Schema.Types.Mixed,
      actualValue: mongoose.Schema.Types.Mixed,
      expectedValue: mongoose.Schema.Types.Mixed,
      message: String,
    },
    businessImpact: {
      type: String,
      default: '',
    },
    remediationInstructions: {
      summary: String,
      whyItMatters: String,
      recommendedSecureState: String,
      stepByStep: [String],
      operationalImpact: String,
      verificationProcedure: String,
    },
    complianceMappings: [
      {
        framework: String,
        controlId: String,
        controlTitle: String,
      },
    ],
    firstSeenScanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scan',
    },
    lastSeenScanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scan',
    },
    firstDetectedAt: {
      type: Date,
      default: Date.now,
    },
    lastDetectedAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
    },
    resolvedByScanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scan',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    riskAcceptance: {
      justification: String,
      acceptedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      acceptedAt: Date,
      expiresAt: Date,
    },
    falsePositiveReason: {
      justification: String,
      markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      markedAt: Date,
    },
    statusHistory: [
      {
        fromStatus: String,
        toStatus: String,
        actor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        actorName: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        reason: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

findingSchema.index({ organization: 1, fingerprint: 1, status: 1 });

export const Finding = mongoose.model('Finding', findingSchema);
