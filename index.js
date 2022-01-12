const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const urlRoutes = require('./routes/url');
const shortUrlRoutes = require('./routes/shortUrl');

const { PORT, DATABASE } = require('./env');

// DB Connection

mongoose
    .connect(DATABASE, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => {
        console.log('DATABASE connected');
    })
    .catch((err) => {
        console.log('Oh! No ', err);
    });

const app = express();

// Middleware

app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());

// Routes

app.get('/', (req, res) => {
    res.send('<h1>Home Page</h1>');
});

app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/url', urlRoutes);
app.use('/short', shortUrlRoutes);

// Server Connection

app.listen(PORT, (req, res) => {
    console.log(`App is listening on ${PORT}`);
});
