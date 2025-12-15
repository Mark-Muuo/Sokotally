import mongoose from 'mongoose';

const DebtSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['unpaid', 'paid', 'partial'], default: 'unpaid' },
  dueDate: { type: Date },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  notes: { type: String }
}, { timestamps: true });

export default mongoose.model('Debt', DebtSchema);


