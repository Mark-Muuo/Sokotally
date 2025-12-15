import mongoose from 'mongoose';

const AuditSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  action: { type: String, required: true },
  entity: { type: String, required: true },
  entityId: { type: String },
  ip: { type: String },
  meta: { type: Object },
}, { timestamps: true });

export default mongoose.model('Audit', AuditSchema);


