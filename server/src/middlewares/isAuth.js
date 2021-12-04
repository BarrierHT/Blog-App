const jwt = require('jsonwebtoken');
const errorHandler = require('../util/errorHandler').errorHandler;

exports.isAuth = (req, res, next) => {
    const authHeader = req.get('Authorization');
    if (!authHeader) {
        const err = errorHandler('Not Authenticated', 401, {});
        throw err;
    }
    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.SECRET_JWT_AUTHENTICATION);
    } catch (err) {
        throw err;
    }
    if (!decodedToken) {
        const err = errorHandler('Not Authenticated', 401, {});
        throw err;
    }
    req.userId = decodedToken.userId;
    next();
};
