const jwt = require('jsonwebtoken');
const errorHandler = require('../util/errorHandler').errorHandler;

exports.isAuth = (req, res, next) => {
    const authHeader = req.get('Authorization');
    if (!authHeader) throw errorHandler('Not Authenticated', 401, {});

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.SECRET_JWT_AUTHENTICATION);
    } catch (err) {
        throw err;
    }
    if (!decodedToken) throw errorHandler('Not Authenticated', 401, {});

    req.userId = decodedToken.userId;
    next();
};
