const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        imageUrl: {
            type: String,
            required: true,
        },
        creator: {
            name: {
                type: String,
                required: true,
            },
            userId: {
                type: Schema.Types.ObjectId,
                ref: 'user',
                required: true,
            },
        },
    },
    { timestamps: true, toJSON: { virtuals: true } }
);

module.exports = mongoose.model('post', postSchema);
