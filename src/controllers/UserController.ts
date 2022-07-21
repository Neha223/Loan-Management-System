import mongoose from  'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import userModel from '../schema/users';
import {User, CUSTOMERTYPE} from '../models/users';
import loanModel from '../schema/loans';
import loanTansactionModel from '../schema/loan-transactions';

const config = {
    secret: "bezkoder-secret-key"
};

export const register = async (req: any, res: any)  => {
    const reqBody : User = req.body;
    let newUser = new userModel(reqBody);
    newUser.password = bcrypt.hashSync(reqBody.password, 10);
    newUser.save(function (err, user) {
        if (err) {
            return res.status(400).send({
                message: err
            });
        } else {
            const token = jwt.sign({ id: newUser._id }, config.secret, {
                expiresIn: 86400 // 24 hours
            });

            req.session.user = newUser._id;
            req.session.token = token;
            req.session.type = newUser.customerType;

            if (newUser.customerType === CUSTOMERTYPE.LENDER) {
                res.redirect('/lender-view/' + user._id);
            }else {
                res.redirect('/borrower-view/' + user._id);
            }
            
        }
    });
};

export const login = async (req: any, res: any) => {
    userModel.findOne({
      email: req.body.email
    })
    .exec(async (err, user) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }
        if (!user) {
          return res.status(404).send({ message: "User Not found." });
        }
        var passwordIsValid = await bcrypt.compare(
          req.body.password,
          user.password
        );
        if (!passwordIsValid) {
          return res.status(401).send({
            accessToken: null,
            message: "Invalid Password!"
          });
        }
        var token = jwt.sign({ id: user._id }, config.secret, {
          expiresIn: 86400 // 24 hours
        });

        req.session.user = user._id;
        req.session.token = token;
        req.session.type = user.customerType;

        if (user.customerType === CUSTOMERTYPE.LENDER) {
            res.redirect('/lender-view/' + user._id);
        }else {
            res.redirect('/borrower-view/' + user._id);
        }
      });
    }

export const getLoanListByUser = async (req: any, res: any) => {

    const id = req.params.id;

    loanModel.find({userId: id}).exec((err, data) => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }
        res.render('borrower-view.ejs', {data: data});
    });
    
}

export const saveUserLoan = async (req: any, res: any) => {
    const data = req.body;

    let loan = new loanModel({
        userId: req.session.user,
        name: data.name,
        contact: data.contactNo,
        amount: data.amount,
        tenure: data.tenure,
        interest: data.interest,
        type: data.type,
        installment: calculateInstallment(data),
        totalAmount: calculateAmount(data),
        interestInAmount: calculateInterest(data),
        remainingAmount: calculateAmount(data)
    });

    loan.save(function (err, user) {
        if (err) {
            return res.status(400).send({
                message: err
            });
        } else {
            res.redirect('/borrower-view/' + loan.userId);
        }
    });
    
}

export const getInstallmentByLoan = async (req: any, res: any) => {

    const id = req.params.id;

    loanModel.findById({_id: id}).exec((err, data) => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }
        res.render('installment-view.ejs', {data: data});
    });
    
}

export const saveLoanInstallment = async (req: any, res: any) => {
    const data = req.body;

    const date = new Date(data.date);

    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    const dateStr = ('0' +day).slice(-2) + '-'
             + ('0' + (month)).slice(-2) + '-'
             + year;

    let loanTransaction = new loanTansactionModel({
        userId: data.userId,
        loanId: data.loanId,
        amount: Math.round(data.amount),    
        interestComponent: await calculateInterestComponent(data),
        principalComponent: await calculatePrincipalComponent(data),
        remainingPrincipalComponent: await calculateRemainingPrincipalComponent(data),
        date: dateStr,
    });

    const loanDetails: any = await loanModel.findById({_id: data.loanId});

    const remainingAmount = loanDetails.remainingAmount - Math.round(data.amount);

    loanTransaction.save(function (err, user) {
        if (err) {
            return res.status(400).send({
                message: err
            });
        } else {
            loanModel.updateOne( {_id: data.loanId}, {$set : {remainingAmount: remainingAmount}}).exec((err, data) => {
                if (err) {
                    res.status(500).send({ message: err });
                    return;
                }
                res.redirect('/loan-info/' + loanTransaction.loanId);
            });
            
        }
    });
}

export const getLoanTransactionInfo = async (req: any, res: any) => {

    const id = req.params.id;

    var objectId = new mongoose.Types.ObjectId(id);

    loanModel.aggregate([
        { "$match": { _id: objectId } },
        {
            $lookup: {
                from: 'loantransactions',
                localField: '_id',
                foreignField: 'loanId',
                as: 'transactions'
            }
        }
    ]).exec((err, data: any) => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }
        res.render('loan-info.ejs', {data: data});
    });
    
}



const calculateInstallment = (data: any) => {
    const interest = data.interest / 1200;
    return Math.round((data.amount * interest * Math.pow((1 + interest), data.tenure) / (Math.pow((1 + interest), data.tenure) - 1)) * 100 + Number.EPSILON) / 100;
}

const calculateAmount = (data: any) => {
    return Math.round((calculateInstallment(data) * data.tenure) * 100 + Number.EPSILON) /100;
}

const calculateInterest = (data: any) => {
    return Math.round((calculateAmount(data) - data.amount) * 100 + Number.EPSILON) /100;
}

const calculateInterestComponent = async (data: any) => {
    const allTransactions: any = await loanTansactionModel.find({loanId : data.loanId}).sort({remainingPrincipalComponent: 1}).limit(1);

    const loanDetails: any = await loanModel.findById({_id: data.loanId});

    if (allTransactions.length > 0) {
        return Math.round(allTransactions[0].remainingPrincipalComponent * (loanDetails.interest / 1200));
    } else {
        return Math.round(loanDetails.amount * (loanDetails.interest / 1200));
    }
}

const calculatePrincipalComponent = async (data: any) => {
    return Math.round((data.amount - await calculateInterestComponent(data)));
}

const calculateRemainingPrincipalComponent = async (data: any) => {
    const allTransactions: any = await loanTansactionModel.find({loanId : data.loanId}).sort({remainingPrincipalComponent: 1}).limit(1);

    const loanDetails: any = await loanModel.findById({_id: data.loanId});

    let amount;
    if (allTransactions.length > 0) {
        amount = allTransactions[0].remainingPrincipalComponent;
    } else {
        amount = loanDetails.amount;
    }
    return Math.round(amount - await calculatePrincipalComponent(data));
    
}