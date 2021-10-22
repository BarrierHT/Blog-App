const { body, validationResult } = require('express-validator');

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
                    .bail()
                    .custom(value =>
                        new RegExp(/^[a-zA-Z0-9_ñÑ\s]+$/).test(value)
                    )
                    .escape()
            );
        } else if (field == 'body--content') {
            errors.push(
                body('content', 'Content format is not valid')
                    .exists()
                    .bail()
                    .trim()
                    .isLength({ min: 5, max: 300 })
                    .bail()
                    .escape()
            );
        } else if (field.split('?')[0] == 'body--image') {
            errors.push(
                body('image', 'Image format is not valid').custom(
                    (value, { req }) => {
                        const needed =
                            field.split('?')[1].split('=')[1] === 'true'
                                ? true
                                : false;
                        if (!req.file) return needed ? false : true;
                        else if (
                            req.file.size > 0 &&
                            req.file.size <= 1048576 &&
                            (req.file.mimetype === 'image/png' ||
                                req.file.mimetype === 'image/jpg' ||
                                req.file.mimetype === 'image/jpeg')
                        )
                            return true;
                        else return false;
                    }
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
