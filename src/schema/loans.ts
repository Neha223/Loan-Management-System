import * as mongoose from 'mongoose';
 
const loanSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    contact: {
        type: Number,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    tenure: {
        type: Number,
        required: true
    },
    interest: {
        type: Number,
        required: true
    },
    interestInAmount: {
        type: Number,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    remainingAmount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    installment: {
        type: Number,
        required: true
    },
});
 
const loanModel = mongoose.model('Loan', loanSchema);
export default loanModel;