const path = require('path');

const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const isAuth = require('./middlewares/isAuth').isAuth;
const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');
const fileHelper = require('./util/fileHelper');
const errorHandler = require('./util/errorHandler').errorHandler;

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
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
};

app.set('port', process.env.PORT || 8080);

app.use(express.json());

app.use('/images', express.static(path.join(__dirname, 'data', 'images')));

app.use(cors(corsOptions), (req, res, next) => {
    if (req.method == 'OPTIONS') return res.sendStatus(200);
    next();
});

app.use(
    helmet(),
    helmet.contentSecurityPolicy({
        useDefaults: true,
        directives: {
            'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        },
    })
);

app.use(morgan(morganFormat));

app.use(fileHelper.uploadFile().single('image'));

app.use(isAuth); //*Protection of Routes (Only save the answer in the req to handle in the appropiate resolver)

app.put('/upload-image', (req, res, next) => {
    // console.log('req.file:', req.file);
    if (!req.isAuth) throw errorHandler('Not authenticated', 401, {});
    if (!req.file)
        return res.status(200).json({ message: 'Image was not provided' });

    if (req.body.oldPath) fileHelper.fileRemove(req.body.oldPath);

    return res.status(200).json({
        message: 'Image uploaded correctly',
        filePath: 'images/' + req.file.filename,
    });
});

app.use(
    '/graphql',
    graphqlHTTP({
        schema: graphqlSchema,
        rootValue: graphqlResolver,
        graphiql: true,
        customFormatErrorFn(err) {
            //*Handle errors in Graphql (Status in the body)
            if (!err.originalError) return err;
            const status = err.originalError.statusCode || 500;
            const message = err.originalError.message || 'Server error';
            const data = err.originalError.data || {};
            return { message, status, data };
        },
    })
);

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
        app.listen(app.get('port'));
    })
    .catch(err => console.log(err));
