const mongoose = require('mongoose');
const { v1: uuidv1 } = require('uuid');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
    fname: {
        type: String,
        required: true,
        trim: true
    },
    lname: {
        type: String,
        trim: true,
        default: ''
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    salt: {
        type: String
    },
    encry_password: {
        type: String
    },
    otp: {
        type: Number,
        default: 0
    },
    otpVerified: {
        type: Boolean,
        default: false
    },
    otpAttempts: {
        type: Number,
        default: 4
    },
    otpLock: {
        type: Number,
        default: Date.now()
    }
});

UserSchema.virtual('fullName').get(function () {
    return `${this.fname} ${this.lname}`;
});

UserSchema.virtual('password')
    .set(function (password) {
        this.salt = uuidv1();
        this._password = password;
        this.encry_password = this.securePassword(password);
    })
    .get(function () {
        return this._password;
    });

UserSchema.methods = {
    authenticate: function (plainPassword) {
        return this.securePassword(plainPassword) == this.encry_password;
    },
    securePassword: function (plainPassword) {
        if (!plainPassword) return '';
        return crypto
            .createHmac('sha256', this.salt)
            .update(plainPassword)
            .digest('hex');
    }
};

const User = new mongoose.model('User', UserSchema);

module.exports = User;
