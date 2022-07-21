import express from 'express';
import bodyParser, {json} from 'body-parser';
import mongoose , {ConnectOptions} from 'mongoose';
import * as  userController from './controllers/UserController';
import cluster from 'cluster';
const totalCPUs = require('os').cpus().length;
import { verifyToken } from './middleware';
import session from 'express-session';


if (cluster.isPrimary) {
    for (let i = 0; i < totalCPUs; i++) {
      cluster.fork();
    }
  
    cluster.on('exit', (worker, code, signal) => {
      cluster.fork();
    });
  
} else {
    const app = express();
    app.use(json());

    app.use(session({
        secret: '2C44-4D44-WppQ38S',
        resave: true,
        saveUninitialized: true
    }));
    
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(express.static(__dirname + '/public'));
    
    app.set('views', __dirname + '/views');
    app.set('view-engine', 'ejs')
    
    const url = 'mongodb://localhost:27017/loan-system';
    
    mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true, autoIndex: true} as ConnectOptions)
    .then(() => console.log('connected to database'))
    .catch(err => console.log(err))
    
    
    app.get('/', (req , res) => {
        res.render('index.ejs')
    })
    
    app.get('/register',(req, res) => {
        res.render('register.ejs')
    })

    app.get('/login',(req, res) => {
        res.render('login.ejs')
    
    })
    
    // request from the register page handle and sending to database
    app.post('/register', userController.register);

    app.post('/login', userController.login);

    app.get('/borrower-view/:id', verifyToken, userController.getLoanListByUser)

    app.get('/apply-loan', verifyToken,(req, res) => {
        res.render('apply-loan.ejs')   
    })

    app.post('/apply-loan', verifyToken, userController.saveUserLoan);

    app.get('/pay-installment/:id', verifyToken,userController.getInstallmentByLoan)

    app.post('/installment', verifyToken,userController.saveLoanInstallment);

    app.get('/loan-info/:id', verifyToken,userController.getLoanTransactionInfo);
    
    
    app.listen(3002, () => {
        console.log('server is listening on port 3002');
    })
}

