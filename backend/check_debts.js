const mongoose = require('mongoose');
require('dotenv').config();

const transactionSchema = new mongoose.Schema({
  type: String,
  customerName: String,
  amount: Number,
  occurredAt: Date,
  status: String,
  userId: mongoose.Schema.Types.ObjectId
}, { collection: 'transactions' });

const Transaction = mongoose.model('Transaction', transactionSchema);

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sokotally')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const totalDebts = await Transaction.countDocuments({ type: 'debt' });
    console.log('Total debt transactions:', totalDebts);
    
    const debts = await Transaction.find({ type: 'debt' }).limit(5).lean();
    console.log('\nSample debt transactions:');
    console.log(JSON.stringify(debts, null, 2));
    
    const debtsWithCustomer = await Transaction.countDocuments({ 
      type: 'debt', 
      customerName: { $exists: true, $ne: null, $ne: '' } 
    });
    console.log('\nDebts with customerName:', debtsWithCustomer);
    
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
