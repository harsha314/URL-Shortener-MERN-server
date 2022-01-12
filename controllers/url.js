const Url = require('../models/url');
const { toBase64, generateRandom } = require('../utils/customMath');

exports.getUrlById = async (req, res, next, id) => {
    try {
        const url = await Url.findById(id);
        if (!url) return res.status(404).json({ msg: 'No url found' });
        req.urlProfile = url;
        next();
    } catch (err) {
        return res.status(500).json({ errors: err.message });
    }
};

exports.getUrl = (req, res) => {
    return res.json(req.urlProfile);
};

exports.createUrl = (req, res) => {
    if (req.body.requestedShortUrl) {
        this.createRequestedUrl(req, res);
    } else {
        this.createRandomUrl(req, res);
    }
};

exports.createRandomUrl = async (req, res) => {
    const { longUrl } = req.body;
    const { user: owner } = req.query;
    try {
        // check if user has already shortened the URL

        const userHasOne = await Url.findOne({ longUrl, owner });
        if (userHasOne) {
            return res.status(405).json({
                cause: 'longUrl',
                error: 'You already have shortened the URL'
            });
        }

        // loop asynchronously to check if random short URL is present

        let match = false;

        while (!match) {
            let shortUrl = toBase64(generateRandom(1, (1 << 60) - 1));
            const dbHasShort = await Url.findOne({ shortUrl });
            if (dbHasShort) continue;

            // create new URL if db has no short URL

            const newUrl = new Url({ longUrl, shortUrl, owner });
            const url = await newUrl.save();
            return res.json(url);
        }
    } catch (err) {
        return res.status(500).json({
            errors: err
        });
    }
};

exports.createRequestedUrl = async (req, res) => {
    const { longUrl, requestedShortUrl: shortUrl } = req.body;
    const { user: owner } = req.query;
    try {
        // check if user has already shortened the URL

        const userHasOne = await Url.findOne({ longUrl, owner });
        if (userHasOne) {
            return res.status(405).json({
                cause: 'longUrl',
                error: 'You already have shortened the URL'
            });
        }

        // check if short URL is in use

        const dbHasShort = await Url.findOne({ shortUrl });
        if (dbHasShort) {
            return res.status(405).json({
                cause: 'shortUrl',
                error: 'Short URL not available'
            });
        }

        // create new URL with long URL & short URL

        const newUrl = new Url({ longUrl, shortUrl, owner });
        await newUrl.save();
        return res.json(newUrl);
    } catch (err) {
        return res.status(500).json({
            errors: err
        });
    }
};

exports.updateUrl = async (req, res) => {
    const { user: owner } = req.query;
    if (!req.urlProfile || owner != req.urlProfile.owner.toString()) {
        return res.status(403).json({
            msg: 'You are not the owner'
        });
    }
    const { longUrl, requestedShortUrl: shortUrl } = req.body;

    // console.log('updateUrl', longUrl, shortUrl);

    try {
        // check if user has already shortened the URL

        const userHasOne = await Url.findOne({ longUrl, owner });
        if (
            userHasOne &&
            userHasOne._id.toString() !== req.urlProfile._id.toString()
        ) {
            return res.status(405).json({
                cause: 'longUrl',
                error: 'You already have shortened the URL'
            });
        }

        // check if short URL is in use

        const dbHasShort = await Url.findOne({ shortUrl });

        if (
            dbHasShort &&
            dbHasShort._id.toString() !== req.urlProfile._id.toString()
        ) {
            return res.status(405).json({
                cause: 'shortUrl',
                error: 'Short URL not available'
            });
        }

        // update with ID

        const url = await Url.findByIdAndUpdate(
            req.urlProfile._id,
            { longUrl, shortUrl },
            { new: true }
        );
        req.urlProfile = url;
        return res.json(url);
    } catch (err) {
        return res.status(500).json({ errors: err.message });
    }
};

exports.deleteUrl = async (req, res) => {
    const { user: owner } = req.query;
    if (!req.urlProfile || owner != req.urlProfile.owner.toString()) {
        return res.status(403).json({
            msg: 'You are not the owner'
        });
    }
    await Url.findByIdAndRemove(req.urlProfile._id);
    return res.json({
        msg: 'URL deleted'
    });
};
