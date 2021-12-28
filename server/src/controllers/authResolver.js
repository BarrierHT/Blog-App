const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const errorHandler = require('../util/errorHandler').errorHandler;
const validator = require('../middlewares/validator');

exports.login = (args, req) => {
    const { email, password } = args;

    let loadedUser = null;
    return User.findOne({ email })
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
            return { token, userId: loadedUser._id.toString() };
        })
        .catch(err => {
            throw err;
        });
};

exports.signup = async (args, req) => {
    const { email, name, password } = args.userInput;

    const validationErrors = await validator([
        { name: 'email', value: email },
        { name: 'name', value: name },
        { name: 'password', value: password },
    ]);

    if (Object.keys(validationErrors).length > 0)
        throw errorHandler('Validation Error', 422, validationErrors);

    return bcrypt
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
            return {
                ...result.toJSON(),
                _id: result._id.toString(),
                password: null,
            };
        })
        .catch(err => {
            throw err;
        });
};

exports.getUser = (args, req) => {
    if (!req.isAuth) throw errorHandler('Not Authenticated', 401, {});

    return User.findById(req.userId)
        .then(user => {
            if (!user) throw errorHandler(404, 'User not found', {});
            return { ...user.toJSON(), password: null };
        })
        .catch(err => {
            throw err;
        });
};

exports.hello = () => {
    return 'hello world!';
};
