import * as mongoose from 'mongoose';
import {User} from '../models/users';
import bcrypt from 'bcrypt';
 
const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    address: {
        type: String,
        required: true
    },
    lastName: String,
    contactNo: {
        type: Number,
        required: true
    },
    customerType: {
        type: String,
        required: true
    },
});
 
const userModel = mongoose.model<User & mongoose.Document>('User', userSchema);

userSchema.methods.comparePassword = function(password: string) {
    return bcrypt.compareSync(password, this.hash_password);
};
 
export default userModel;