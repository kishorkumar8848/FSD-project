import mongoose from 'mongoose';

const complianceResultSchema = new mongoose.Schema(
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
    scan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scan',
      required: true,
      index: true,
    },
    framework: {
      type: String,
      default: 'NIST CSF 2.0',
    },
    controlId: {
      type: String,
      required: true,
      index: true,
    },
    controlTitle: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pass', 'fail', 'not_assessed', 'not_applicable'],
      required: true,
      index: true,
    },
    applicableResourcesCount: {
      type: Number,
      default: 0,
    },
    failingResourcesCount: {
      type: Number,
      default: 0,
    },
    passingResourcesCount: {
      type: Number,
      default: 0,
    },
    evidence: [
      {
        resourceId: String,
        resourceName: String,
        status: String,
        findingId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Finding',
        },
        detail: String,
      },
    ],
    remediationGuidance: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

complianceResultSchema.index({ scan: 1, controlId: 1 }, { unique: true });

export const ComplianceResult = mongoose.model('ComplianceResult', complianceResultSchema);
