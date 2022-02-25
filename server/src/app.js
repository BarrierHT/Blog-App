const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config({ path: `.env` });

const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');
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
    origin: [
        'https://master.d32vp8t9wfhq83.amplifyapp.com',
        'http://localhost:3000',
        'https://barrier-blog-server.herokuapp.com/',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
};

app.set('port', process.env.PORT || 8080);

app.use(express.json());
app.use(cors(corsOptions));
app.use(helmet());
app.use(compression());

app.use(morgan(morganFormat));

app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);

app.use((err, req, res, next) => {
    console.log('Error(middleware): ', err);
    const status = err.statusCode || 500;
    const message = err.message || 'Server error';
    const data = err.data || {};
    return res.status(status).json({ message, data });
});

mongoose
    .connect(mongoDBUrl, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(res => {
        const httpServer = app.listen(app.get('port'));
        const io = require('./util/socket').init(httpServer);
        io.on('connection', socket => {
            // console.log(socket);
            console.log('User connected', socket.id);
        });
    })
    .catch(err => console.log(err));
