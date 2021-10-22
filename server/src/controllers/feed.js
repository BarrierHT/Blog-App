const path = require('path');

const { validate } = require('../middlewares/validator');
const Post = require('../models/post');
const errorHandler = require('../util/errorHandler').errorHandler;
const fileRemove = require('../util/fileHelper').fileRemove;

exports.getPost = async (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
        .then(post => {
            console.log(post);
            if (post)
                return res.status(200).json({ message: 'Post Fetched', post });
            else throw errorHandler('Post Not Found', 404, {});
        })
        .catch(err => next(err));
};

exports.getPosts = (req, res, next) => {
    Post.find()
        .then(posts => {
            res.status(200).json({
                message: 'Posts Fetched',
                posts,
                totalItems: posts.length,
            });
        })
        .catch(err => next(err));
};

exports.createPost = async (req, res, next) => {
    const { title, content } = req.body;
    const validationErrors = validate(req);

    if (Object.keys(validationErrors).length > 0) {
        if (req.file)
            fileRemove(
                path.join(__dirname, '..', 'data', 'images', req.file.filename)
            );
        const err = errorHandler('Validation Error', 422, validationErrors);
        return await Promise.reject(err).catch(err => next(err));
    }

    const imageUrl = 'images/' + (req.file.filename || '');

    const post = new Post({
        title,
        content,
        creator: {
            name: 'test1',
        },
        imageUrl,
    });
    post.save()
        .then(result => {
            console.log(result);
            res.status(201).json({
                message: 'Post created successfully',
                post: result,
            });
        })
        .catch(err => next(err));
};
