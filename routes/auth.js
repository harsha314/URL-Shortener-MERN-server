const express = require('express');
const { check } = require('express-validator');

const {
    signUp,
    signIn,
    signOut,
    resetPassword,
    resendOtp,
    verifyOtp
} = require('../controllers/auth');

const router = express.Router();

router.post(
    '/signup',
    [
        check('fname', 'name is too short').isLength({ min: 3 }),
        check('email', 'Invalid email').isEmail(),
        check('password', 'password is too short').isLength({ min: 6 })
    ],
    signUp
);

router.post(
    '/signin',
    [
        check('email', 'Invalid email').isEmail(),
        check('password', 'password is too short').isLength({ min: 6 })
    ],
    signIn
);

router.get('/signout', signOut);

router.put('/resetpassword', verifyOtp, resetPassword);

// Additional Routes

router.post('/resendotp', resendOtp);

module.exports = router;
