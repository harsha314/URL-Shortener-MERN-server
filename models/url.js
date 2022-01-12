const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
    longUrl: {
        type: String,
        required: true
    },
    shortUrl: {
        type: String,
        required: true,
        unique: true
    },
    owner: {
        type: mongoose.Types.ObjectId,
        ref: 'user'
    }
});

const Url = new mongoose.model('Url', urlSchema);

module.exports = Url;
