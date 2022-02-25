const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            required: true,
            default: 'I am new!',
        },
        posts: [
            {
                type: Schema.Types.ObjectId,
                ref: 'post',
                required: true,
            },
        ],
    },
    { timestamps: true, toJSON: { virtuals: true } }
);

module.exports = mongoose.model('user', userSchema);
