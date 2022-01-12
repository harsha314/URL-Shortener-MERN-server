const Url = require('../models/url');

exports.getUrlByShortUrl = async (req, res, next, shortUrl) => {
    try {
        const url = await Url.findOne({ shortUrl });
        if (!url) return res.json({ msg: 'No URL found' });
        req.shortUrlProfile = url.longUrl;
        next();
    } catch (err) {
        return res.json({ errors: err });
    }
};

exports.getShortUrl = (req, res) => {
    return res.json({ longUrl: req.shortUrlProfile });
};
