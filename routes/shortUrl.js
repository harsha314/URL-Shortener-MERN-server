const express = require('express');

const { getShortUrl, getUrlByShortUrl } = require('../controllers/shortUrl');

const router = express.Router();

router.param('shortUrl', getUrlByShortUrl);

router.get('/:shortUrl', getShortUrl);

module.exports = router;
