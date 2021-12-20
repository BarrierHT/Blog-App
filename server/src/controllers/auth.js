const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validate } = require('../middlewares/validator');
const { errorHandler } = require('../util/errorHandler');

exports.signup = (req, res, next) => {
    const validationErrors = validate(req);

    if (Object.keys(validationErrors).length > 0)
        throw errorHandler('Validation Error', 422, validationErrors);

    const { email, name, password } = req.body;
    bcrypt
        .genSalt(12)
        .then(salt => bcrypt.hash(password, salt))
        .then(hashedPassword => {
            const user = new User({
                email,
                password: hashedPassword,
                name,
                posts: [],
            });
            return user.save();
        })
        .then(result => {
            res.status(201).json({
                message: 'User signed up correctly!',
                userId: result._id,
            });
        })
        .catch(err => next(err));
};

exports.login = (req, res, next) => {
    const { email, password } = req.body;
    let loadedUser = null;
    User.findOne({ email })
        .then(user => {
            if (!user)
                throw errorHandler(
                    'A user with this email was not found',
                    401,
                    {}
                );
            loadedUser = user;
            return bcrypt.compare(password, user.password);
        })
        .then(hasMatch => {
            if (!hasMatch)
                throw errorHandler(
                    'A user with this password was not found',
                    401,
                    {}
                );
            const token = jwt.sign(
                { email, userId: loadedUser._id.toString() },
                process.env.SECRET_JWT_AUTHENTICATION,
                { expiresIn: '1h' }
            );
            return res.status(200).json({
                message: 'User logged correctly!',
                token,
                userId: loadedUser._id.toString(),
            });
        })
        .catch(err => next(err));
};
