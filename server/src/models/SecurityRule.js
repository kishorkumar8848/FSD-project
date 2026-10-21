import mongoose from 'mongoose';

const securityRuleSchema = new mongoose.Schema(
  {
    ruleId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Storage Security',
        'Database Security',
        'Identity & Access Management',
        'Logging & Monitoring',
        'Network Security',
        'Governance & Metadata',
        'Data Protection',
        'Backup & Recovery',
      ],
      index: true,
    },
    supportedResourceTypes: [
      {
        type: String,
        required: true,
      },
    ],
    severity: {
      type: String,
      required: true,
      enum: ['critical', 'high', 'medium', 'low', 'info'],
      index: true,
    },
    version: {
      type: String,
      default: '1.0.0',
    },
    expectedSecureConfig: {
      type: String,
      required: true,
    },
    detectionRationale: {
      type: String,
      required: true,
    },
    evidenceFields: [
      {
        type: String,
      },
    ],
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
    status: {
      type: String,
      enum: ['enabled', 'disabled'],
      default: 'enabled',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const SecurityRule = mongoose.model('SecurityRule', securityRuleSchema);
