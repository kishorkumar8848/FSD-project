import mongoose from 'mongoose';

const complianceControlSchema = new mongoose.Schema(
  {
    framework: {
      type: String,
      required: true,
      default: 'NIST CSF 2.0',
      index: true,
    },
    frameworkVersion: {
      type: String,
      default: '2.0',
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Governance & Asset Inventory',
        'Identity & Access Management',
        'Data Protection',
        'Infrastructure Security',
        'Logging & Monitoring',
        'Incident Response',
        'Backup & Recovery',
      ],
      index: true,
    },
    controlId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
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
    applicableResourceTypes: [
      {
        type: String,
      },
    ],
    mappedRuleIds: [
      {
        type: String,
      },
    ],
    assessmentMethod: {
      type: String,
      default: 'Automated Rule Evaluation',
    },
    evidenceRequirements: {
      type: String,
      default: 'Verification of resource configuration flags against control baseline.',
    },
    nistFunction: {
      type: String,
      enum: ['GOVERN', 'IDENTIFY', 'PROTECT', 'DETECT', 'RESPOND', 'RECOVER'],
      default: 'PROTECT',
    },
  },
  {
    timestamps: true,
  }
);

export const ComplianceControl = mongoose.model('ComplianceControl', complianceControlSchema);
