const { body, validationResult } = require('express-validator');
const User = require('../models/user');

exports.userValidationRules = (...fields) => {
    const errors = [];

    fields.forEach(field => {
        if (field == 'body--title') {
            errors.push(
                body('title', 'Title format is not valid')
                    .exists()
                    .bail()
                    .trim()
                    .isLength({ min: 5, max: 100 })
                    .custom(value =>
                        new RegExp(/^[a-zA-Z0-9_\-ñÑ\s]+$/).test(value)
                    )
            );
        } else if (field == 'body--status') {
            errors.push(
                body('status', 'Status format is not valid')
                    .exists()
                    .bail()
                    .trim()
                    .isLength({ min: 1, max: 40 })
            );
        } else if (field == 'body--content') {
            errors.push(
                body('content', 'Content format is not valid')
                    .exists()
                    .bail()
                    .trim()
                    .isLength({ min: 5, max: 300 })
            );
        } else if (field == 'body--email') {
            errors.push(
                body('email', 'Email format is not valid')
                    .exists()
                    .bail()
                    .trim()
                    .normalizeEmail()
                    .isEmail()
                    .isLength({ min: 2, max: 100 })
                    .custom(async value => {
                        return await User.findOne({ email: value }).then(
                            user => {
                                //Validate if a user with the email already exists (Control Validation)
                                if (user)
                                    return Promise.reject(
                                        'A user with this email already exists!'
                                    );
                            }
                        );
                    })
            );
        } else if (field == 'body--name') {
            errors.push(
                body('name', 'Name format is not valid')
                    .exists()
                    .bail()
                    .trim()
                    .isLength({ min: 2, max: 70 })
                    .custom(value =>
                        new RegExp(/^[a-zA-Z0-9_ñÑ\s]+$/).test(value)
                    )
            );
        } else if (field == 'body--password') {
            errors.push(
                body('password', 'Password format is not valid, [5-100] length')
                    .exists()
                    .bail()
                    .trim()
                    .isLength({ min: 5, max: 100 })
                    .custom(value =>
                        new RegExp(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/g).test(
                            value
                        )
                    )
            );
        }
    });

    return errors;
};

exports.validate = req => {
    const errors = validationResult(req);
    const extractedErrors = {};
    errors.array().map(err => (extractedErrors[err.param] = err.msg));
    return extractedErrors;
};
