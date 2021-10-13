const { body, validationResult } = require('express-validator');

exports.userValidationRules = (...fields) => {
    const errors = [];

    fields.forEach(field => {
        if (field == 'title') {
            errors.push(
                body('title', 'Title format is not valid')
                    .exists()
                    .bail()
                    .trim()
                    .isLength({ min: 5, max: 100 })
                    .bail()
                    .custom(value =>
                        new RegExp(/^[a-zA-Z0-9_ñÑ\s]+$/).test(value)
                    )
                    .escape()
            );
        } else if (field == 'content') {
            errors.push(
                body('content', 'content format is not valid')
                    .exists()
                    .bail()
                    .trim()
                    .isLength({ min: 5, max: 300 })
                    .bail()
                    .escape()
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
