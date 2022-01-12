const express = require('express');
const { check } = require('express-validator');
const {
    isSignedIn,
    isAuthenticated,
    verifyOtp
} = require('../controllers/auth');
const {
    getUserById,
    getUser,
    verifyUser,
    changeName,
    changePassword,
    changeEmail,
    deleteUser
} = require('../controllers/user');

const router = express.Router();

router.param('userId', getUserById);

//          CREATE

router.post('/:userId/verify', verifyOtp, verifyUser);

//          READ

router.get('/:userId', isSignedIn, isAuthenticated, getUser);

//          UPDATE

router.put(
    '/:userId/changename',
    isSignedIn,
    isAuthenticated,
    [check('fname', 'First Name is too short').isLength({ min: 3 })],
    changeName
);

router.put(
    '/:userId/changepassword',
    isSignedIn,
    isAuthenticated,
    [
        check('oldPassword').isLength({ min: 6 }),
        check('newPassword', 'Password is too short').isLength({ min: 6 })
    ],
    changePassword
);

router.put(
    '/:userId/changeemail',
    isSignedIn,
    isAuthenticated,
    [
        check('newEmail', 'Invalid Email').isEmail(),
        check('otp', 'OTP cant be empty').isLength({ min: 1 })
    ],
    changeEmail
);

//          DELETE

router.delete('/:userId', isSignedIn, isAuthenticated, deleteUser);

module.exports = router;
