const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const feedRoutes = require('./routes/feed');
const User = require('./models/user');
const Post = require('./models/post');

const app = express();
const morganFormat =
    ':body :remote-addr :remote-user :method :url HTTP/:http-version :status :res[content-length] - :response-time ms';

const mongoUser = process.env.MONGO_USER;
const mongoPassword = process.env.MONGO_PASSWORD;
const mongoDatabase = process.env.MONGO_DATABASE;
const mongoCluster = process.env.MONGO_CLUSTER;
const mongoDBUrl = `mongodb+srv://${mongoUser}:${mongoPassword}@${mongoCluster}.msdnf.mongodb.net/${mongoDatabase}?retryWrites=true&w=majority`;

morgan.token('body', req => JSON.stringify(req.body));

const corsOptions = {
    origin: ['https://cdpn.io', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.set('port', process.env.PORT || 8080);

// app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors(corsOptions));
app.use(helmet());

app.use(morgan(morganFormat));

app.use('/feed', feedRoutes);

mongoose
    .connect(mongoDBUrl, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(res => app.listen(app.get('port')))
    .catch(err => console.log(err));
