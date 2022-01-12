require('dotenv').config();

const mongoose = require('mongoose');
const expressJwt = require('express-jwt');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const mailAddressParser = require('email-addresses');

const User = require('../models/user');
const { generateRandom } = require('../utils/customMath');
const { sendOtp } = require('../utils/mails');

//             CREATE

exports.signUp = async (req, res) => {
    const { errors } = validationResult(req);

    if (errors.length) {
        return res.status(422).json({
            errors: errors
        });
    }

    const mailId = req.body.email;
    const mailDetails = mailAddressParser(mailId).addresses[0];

    if (!mailDetails)
        return res.status(422).json({
            msg: 'Invalid Email',
            errors: 'email-address is not parsed properly'
        });

    const otp = generateRandom(1, 999999);
    const { fname, lname = '', email, password } = req.body;

    try {
        const user = new User({
            fname,
            lname,
            email,
            password,
            otp,
            otpExpiry: Date.now() + 10 * 1000
        });
        const updated = await user.save();
        const { _id, encry_password, otpVerified } = updated;
        const token = jwt.sign({ _id, encry_password }, process.env.SECRET);

        sendOtp(email, otp, 'Sign-Up');

        return res.json({
            token,
            user: { _id, email, otpVerified, fname, lname }
        });
    } catch (error) {
        console.log('sign up', error.message);
        return res
            .status(405)
            .json({ cause: 'email', error: 'Email is already used' });
    }
};

//             READ

exports.signIn = async (req, res) => {
    const { errors } = validationResult(req);
    if (errors.length)
        return res.status(422).json({
            errors: errors
        });

    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user)
            return res
                .status(404)
                .json({ cause: 'email', error: 'No user found' });

        if (!user.authenticate(password))
            return res
                .status(401)
                .json({ cause: 'password', error: 'Invalid Credentials' });

        const { _id, encry_password, fname, lname, otpVerified } = user;
        const token = jwt.sign({ _id, encry_password }, process.env.SECRET);

        return res.json({
            user: { _id, fname, lname, email, otpVerified },
            token
        });
    } catch (e) {
        console.log(e.message);
        return res
            .status(500)
            .json({ cause: 'Dont know', error: 'User not created' });
    }
};

exports.signOut = (req, res) => {
    res.clearCookie('token');
    return res.json({
        msg: 'user sign-out'
    });
};

exports.resetPassword = async (req, res) => {
    const { _id, password } = req.body;
    try {
        const user = await User.findById(_id);
        if (!user) return res.status(404).json({ error: 'No user found' });
        user.password = password;
        const updated = await user.save();
        return res.json({ msg: 'Password changed' });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ error: 'Dont Know' });
    }
};

exports.resendOtp = async (req, res) => {
    const { email, _id } = req.body;
    const otp = generateRandom(1, 999999);

    if (!email) return res.status(405).json({ error: 'Email cant be empty' });

    try {
        let user = await User.findOne({ email });

        if (!user && _id) user = await User.findById(_id);

        if (!user) return res.status(404).json({ error: 'No user found' });

        if (user && _id && user._id.toString() != _id.toString())
            return res.status(405).json({ error: 'Email is in use' });

        // console.log(user);

        if (user.otpLock > Date.now())
            return res.status(429).json({ error: 'OTP locked for a while' });

        // If no OTP has sent during the five minutes after first OTP
        // set OTP attempts to 5
        if (user.otpLock + 5 * 60 * 1000 < Date.now()) user.otpAttempts = 5;
        if (user.otpAttempts == 5) user.otpLock = Date.now();

        user.otpAttempts -= 1;
        user.otp = otp;

        // If otp Attempts is 0 , then lock the otps for 5 minutes
        if (user.otpAttempts == 0) user.otpLock = Date.now() + 5 * 60 * 1000;

        await sendOtp(
            email,
            otp,
            user.otpVerified ? 'Reset Password' : 'Registration'
        );

        const updated = await user.save();
        // console.log(updated);

        return res.json({ msg: 'OTP sent', _id: user._id });
    } catch (e) {
        console.log(e.message, e);
        return res.status(500).json({ errors: e.message });
    }
};

// Middleware

exports.isSignedIn = expressJwt({
    secret: process.env.SECRET,
    algorithms: ['HS256'],
    requestProperty: 'auth'
});

exports.isAuthenticated = async (req, res, next) => {
    const { user: owner } = req.query;
    if (owner) {
        const user = await User.findById(owner);
        if (user) req.userProfile = user;
    }
    // console.log(req.auth, req.userProfile);
    const checker =
        req.auth &&
        req.userProfile &&
        req.auth._id == req.userProfile._id &&
        req.auth.encry_password == req.userProfile.encry_password;
    if (!checker) {
        return res.status(401).json({
            errors: 'Access Denied'
        });
    }
    next();
};

exports.isVerified = async (req, res, next) => {
    const { user: owner } = req.query;
    if (owner) {
        const user = await User.findById(owner);
        if (user) req.userProfile = user;
    }
    // console.log(req.userProfile);
    const checker =
        req.auth &&
        req.userProfile &&
        req.auth._id == req.userProfile._id &&
        req.auth.encry_password == req.userProfile.encry_password;
    // console.log(req.auth);
    if (!checker) {
        return res.status(401).json({
            error: 'Access Denied'
        });
    }
    if (!req.userProfile.otpVerified)
        return res.status(403).json({
            error: 'Email not verified'
        });
    next();
};

exports.verifyOtp = async (req, res, next) => {
    const { _id = req.params.userId, otp } = req.body;

    if (!_id)
        return res.status(422).json({
            error: 'ID cant be empty'
        });
    if (!otp)
        return res.status(422).json({
            error: 'OTP cant be empty'
        });
    try {
        const user = await User.findById(_id);

        if (!user) return res.status(404).json({ error: 'No user found' });

        if (user.otp == -1)
            return res.status(422).json({ error: 'Try resending an OTP' });

        if (user.otp != otp)
            return res.status(401).json({ error: 'Incorrect OTP' });

        user.otpVerified = true;
        user.otp = -1;

        const updated = await user.save();
        req.userProfile = updated;
        next();
    } catch (e) {
        return res.status(500).json({ msg: 'OTP not verified' });
    }
};
