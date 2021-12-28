const validator = require('validator').default;
const User = require('../models/user');

module.exports = async fields => {
    const errors = [];

    for (const field of fields) {
        if (field.name == 'title') {
            field.value = field.value.trim();
            if (
                validator.isEmpty(field.value) ||
                !validator.isLength(field.value, { min: 5, max: 70 }) ||
                !new RegExp(/^[a-zA-Z0-9_ñÑ\s]+$/).test(field.value)
            ) {
                errors.push({
                    param: field.name,
                    msg: 'Title Format is not valid',
                });
            }
        } else if (field.name == 'content') {
            field.value = field.value.trim();
            if (
                validator.isEmpty(field.value) ||
                !validator.isLength(field.value, { min: 2, max: 300 })
            ) {
                errors.push({
                    param: field.name,
                    msg: 'Content Format is not valid',
                });
            }
        } else if (field.name == 'status') {
            field.value = field.value.trim();
            if (
                validator.isEmpty(field.value) ||
                !validator.isLength(field.value, { min: 5, max: 150 })
            ) {
                errors.push({
                    param: field.name,
                    msg: 'Status Format is not valid',
                });
            }
        } else if (field.name == 'email') {
            field.value = validator.normalizeEmail(field.value).trim();

            const existingUser = await User.findOne({
                email: field.value,
            }).then(user => user);

            if (existingUser) {
                errors.push({
                    param: field.name,
                    msg: 'A user with this email already exists!',
                });
                continue;
            }

            if (
                validator.isEmpty(field.value) ||
                !validator.isEmail(field.value) ||
                !validator.isLength(field.value, { min: 2, max: 100 })
            ) {
                errors.push({
                    param: field.name,
                    msg: 'Email Format is not valid',
                });
            }
        } else if (field.name == 'name') {
            field.value = field.value.trim();
            if (
                validator.isEmpty(field.value) ||
                !validator.isLength(field.value, { min: 2, max: 70 }) ||
                !new RegExp(/^[a-zA-Z0-9_ñÑ\s]+$/).test(field.value)
            ) {
                errors.push({
                    param: field.name,
                    msg: 'Name Format is not valid',
                });
            }
        } else if (field.name == 'password') {
            field.value = field.value.trim();
            if (
                validator.isEmpty(field.value) ||
                !validator.isLength(field.value, { min: 5, max: 100 }) ||
                !new RegExp(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/g).test(field.value)
            ) {
                errors.push({
                    param: field.name,
                    msg: 'Password Format is not valid',
                });
            }
        }
    }

    const extractedErrors = {};
    errors.map(err => (extractedErrors[err.param] = err.msg));
    return extractedErrors;
};
