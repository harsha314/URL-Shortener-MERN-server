require('dotenv').config();

exports.MAIL_ID = process.env.MAIL_ID;
exports.MAIL_PASS = process.env.MAIL_PASS;
exports.DATABASE = process.env.DATABASE;
exports.SECRET = process.env.SECRET;
exports.PORT = process.env.PORT || 8000;
