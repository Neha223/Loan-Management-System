import * as mongoose from 'mongoose';
 
const loanTransactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    loanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Loan',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    principalComponent: {
        type: Number,
        required: true
    },
    interestComponent: {
        type: Number,
        required: true
    },
    remainingPrincipalComponent: {
        type: Number,
        required: true
    },
    date: {
        type: String,
        required: true
    },
});
 
const loanTansactionModel = mongoose.model('LoanTransaction', loanTransactionSchema);
export default loanTansactionModel;