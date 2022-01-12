require('dotenv').config();

const nodemailer = require('nodemailer');

exports.sendOtp = async (userMailAddress, otp, type = 'registration') => {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MAIL_ID,
            pass: process.env.MAIL_PASS
        }
    });

    let mailOptions = {
        from: process.env.MAIL_ID,
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
