import mongoose from 'mongoose';

const driftEventSchema = new mongoose.Schema(
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
    currentScan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scan',
      required: true,
      index: true,
    },
    previousScan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scan',
    },
    driftType: {
      type: String,
      enum: ['security_regression', 'security_improvement', 'configuration_change'],
      required: true,
      index: true,
    },
    severityImpact: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low', 'neutral', 'improved'],
      default: 'neutral',
    },
    changedFields: [
      {
        fieldPath: String,
        previousValue: mongoose.Schema.Types.Mixed,
        currentValue: mongoose.Schema.Types.Mixed,
        isSecurityRelevant: Boolean,
      },
    ],
    newFindingsTriggered: [
      {
        type: String, // ruleIds
      },
    ],
    findingsResolved: [
      {
        type: String, // ruleIds
      },
    ],
    description: {
      type: String,
      required: true,
    },
    detectedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const DriftEvent = mongoose.model('DriftEvent', driftEventSchema);
