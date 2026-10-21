import mongoose from 'mongoose';

const configurationSnapshotSchema = new mongoose.Schema(
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
    resourcesCount: {
      type: Number,
      default: 0,
    },
    resourceData: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    capturedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const ConfigurationSnapshot = mongoose.model('ConfigurationSnapshot', configurationSnapshotSchema);
