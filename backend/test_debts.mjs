import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const transactionSchema = new mongoose.Schema({
  type: String,
  customerName: String,
  amount: Number,
  occurredAt: Date,
  status: String,
  userId: mongoose.Schema.Types.ObjectId
});

const Transaction = mongoose.model('Transaction', transactionSchema);

async function checkDebts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const allTransactions = await Transaction.find({}).limit(5).lean();
    console.log('\n=== Sample Transactions ===');
    console.log(JSON.stringify(allTransactions, null, 2));
    
    const debtCount = await Transaction.countDocuments({ type: 'debt' });
    console.log('\n=== Debt Transactions Count ===');
    console.log('Total debt transactions:', debtCount);
    
    const debts = await Transaction.find({ type: 'debt' }).limit(5).lean();
    console.log('\n=== Sample Debt Transactions ===');
    console.log(JSON.stringify(debts, null, 2));
    
    const debtsWithCustomer = await Transaction.find({ 
      type: 'debt', 
      customerName: { $exists: true, $ne: null, $ne: '' } 
    }).limit(5).lean();
    console.log('\n=== Debts with customerName ===');
    console.log('Count:', debtsWithCustomer.length);
    console.log(JSON.stringify(debtsWithCustomer, null, 2));
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkDebts();
