const express = require('express');

const { isSignedIn, isVerified } = require('../controllers/auth');
const {
    createUrl,
    updateUrl,
    deleteUrl,
    getUrlById,
    getUrl
} = require('../controllers/url');

const router = express.Router();

router.param('urlId', getUrlById);

// create new URL

router.post('/', isSignedIn, isVerified, createUrl);

// read URL

router.get('/:urlId', isSignedIn, isVerified, getUrl);

// update URL

router.put('/:urlId', isSignedIn, isVerified, updateUrl);

// delete URL

router.delete('/:urlId', isSignedIn, isVerified, deleteUrl);

module.exports = router;
