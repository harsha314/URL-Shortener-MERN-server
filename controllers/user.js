const User = require('../models/user');
const Url = require('../models/url');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

//          CREATE

exports.verifyUser = (req, res) => {
    return res.json({ msg: 'Account created successfully' });
};

//          READ

exports.getUserById = async (req, res, next, id) => {
    try {
        id = mongoose.Types.ObjectId(id);

        const user = await User.findById(id);

        if (!user) return res.json({ msg: 'No user found' });

        const urls = await Url.find({ owner: id });

        req.userProfile = user;
        req.ownedUrls = urls.map((url) => ({
            _id: url._id.toString(),
            longUrl: url.longUrl,
            shortUrl: url.shortUrl
        }));

        next();
    } catch (err) {
        console.log('getUserById', err);
        return res.status(500).json({ errors: err.message });
    }
};

exports.getUser = (req, res) => {
    req.userProfile.otp = undefined;
    req.userProfile.otpAttempts = undefined;
    req.userProfile.otpLock = undefined;
    req.userProfile.encry_password = undefined;
    req.userProfile.salt = undefined;
    return res.json({
        user: req.userProfile,
        ownedUrls: req.ownedUrls
    });
};

//          UPDATE

exports.changeName = async (req, res) => {
    const user = req.userProfile;
    const { fname, lname } = req.body;

    try {
        user.fname = fname;
        user.lname = lname;
        await user.save();
        return res.json({ msg: 'Name Changed' });
    } catch (e) {
        console.log(e.message);
    }
};

exports.changePassword = async (req, res) => {
    const user = req.userProfile;
    const { oldPassword, newPassword } = req.body;

    if (!user.authenticate(oldPassword))
        return res.status(401).json({ errors: 'Incorrect password' });

    try {
        user.password = newPassword;
        const updated = await user.save();
        const { _id, encry_password } = user;
        const token = jwt.sign({ _id, encry_password }, process.env.SECRET);

        return res.json({ msg: 'Password Changed', token });
    } catch (error) {
        return res.status(500).json({ errors: error.message });
    }
};

exports.changeEmail = async (req, res) => {
    const user = req.userProfile;
    const { otp, newEmail } = req.body;

    try {
        if (user.email == newEmail) return res.json({ msg: 'Same old Email' });
        if (user.otp != otp)
            return res.status(401).json({ error: 'Incorrect OTP' });

        const another = await User.findOne({ email: newEmail });

        if (another)
            return res.status(403).json({ error: 'Email is already used' });

        user.otp = -1;
        user.email = newEmail;

        const updated = await user.save();
        return res.json({ msg: 'Email Changed' });
    } catch (e) {
        console.log(e.message);
        return res.status(500).json({ error: 'Dont Know' });
    }
};

//          DELETE

exports.deleteUser = async (req, res) => {
    const { _id } = req.userProfile;
    try {
        const deletedUrls = await Url.deleteMany({ owner: _id });
        const deletedUser = await User.findByIdAndDelete(_id);
        // console.log(deletedUser, deletedUrls);
        res.clearCookie('token');
        return res.json({ msg: 'Account deleted' });
    } catch (error) {
        console.log(error.message);
    }
};
