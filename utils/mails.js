const nodemailer = require('nodemailer');

const { MAIL_ID, MAIL_PASS } = require('../env');

exports.sendOtp = async (userMailAddress, otp, type = 'registration') => {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: MAIL_ID, pass: MAIL_PASS }
    });

    let mailOptions = {
        from: MAIL_ID,
        to: userMailAddress,
        subject: 'No Reply',
        text: `${otp} is OTP for ${type}`
    };

    try {
        const res = await transporter.sendMail(mailOptions);
        // console.log(res);
    } catch (e) {
        console.log(e.message);
    }
};
