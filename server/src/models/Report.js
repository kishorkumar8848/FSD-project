import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
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
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    reportType: {
      type: String,
      enum: ['executive_summary_pdf', 'detailed_findings_csv', 'resource_inventory_csv'],
      required: true,
    },
    format: {
      type: String,
      enum: ['pdf', 'csv'],
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    fileData: {
      type: Buffer, // Store report binary directly for self-contained, tamper-proof storage
    },
    status: {
      type: String,
      enum: ['generating', 'ready', 'failed'],
      default: 'ready',
    },
    metadata: {
      postureScore: Number,
      complianceScore: Number,
      totalFindings: Number,
      criticalFindings: Number,
      highFindings: Number,
      resourcesAssessed: Number,
    },
  },
  {
    timestamps: true,
  }
);

reportSchema.index({ organization: 1, createdAt: -1 });

export const Report = mongoose.model('Report', reportSchema);
