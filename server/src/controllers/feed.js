const path = require('path');

const { validate } = require('../middlewares/validator');
const { errorHandler } = require('../util/errorHandler');
const fileRemove = require('../util/fileHelper').fileRemove;
const io = require('../util/socket');
const User = require('../models/user');
const Post = require('../models/post');

exports.getPost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
        .then(post => {
            if (!post) throw errorHandler('Post Not Found', 404, {});
            return res.status(200).json({ message: 'Post Fetched', post });
        })
        .catch(err => next(err));
};

exports.getPosts = async (req, res, next) => {
    const currentPage = req.query.page || 1;
    const itemsPerPage = 2;
    const qtyPosts = await Post.countDocuments().catch(err => next(err));

    Post.find()
        .populate('creator', 'name -_id')
        .sort({ createdAt: -1 })
        .skip(itemsPerPage * (currentPage - 1))
        .limit(itemsPerPage)
        .then(posts => {
            res.status(200).json({
                message: 'Posts Fetched',
                posts,
                totalItems: qtyPosts,
            });
        })
        .catch(err => next(err));
};

exports.createPost = async (req, res, next) => {
    const validationErrors = validate(req);

    if (Object.keys(validationErrors).length > 0) {
        if (req.file)
            fileRemove(
                path.join(__dirname, '..', 'data', 'images', req.file.filename)
            );
        const err = errorHandler('Validation Error', 422, validationErrors);
        return await Promise.reject(err).catch(err => next(err));
    }

    const { title, content } = req.body;
    const imageUrl = 'images/' + (req.file.filename || '');

    const user = await User.findById(req.userId);

    const post = new Post({
        title,
        content,
        creator: req.userId,
        imageUrl,
    });
    post.save()
        .then(result => {
            user.posts.push(result._id);
            return user.save();
        })
        .then(result => {
            io.getIO().emit('posts', {
                //*Emit the channel posts, with the data inside it
                action: 'create',
                post: {
                    ...post.toJSON(),
                    creator: { _id: user._id, name: user.name },
                },
            });
            res.status(201).json({
                message: 'Post created successfully',
                post,
                creator: { _id: user._id, name: user.name },
            });
        })
        .catch(err => next(err));
};

exports.updatePost = (req, res, next) => {
    const validationErrors = validate(req);

    if (Object.keys(validationErrors).length > 0) {
        if (req.file)
            fileRemove(
                path.join(__dirname, '..', 'data', 'images', req.file.filename)
            );
        throw errorHandler('Validation Error', 422, validationErrors);
    }

    const { title, content } = req.body;
    const { postId } = req.params;

    Post.findById({ _id: postId })
        .populate('creator', 'name')
        .then(post => {
            if (!post) throw errorHandler('Post Not Found', 404, {});
            if (post.creator._id.toString() !== req.userId)
                throw errorHandler('Not authorized', 403, {});
            post.title = title;
            post.content = content;
            if (req.file) {
                fileRemove(path.join(__dirname, '..', 'data', post.imageUrl));
                post.imageUrl = 'images/' + req.file.filename;
            }
            return post.save();
        })
        .then(result => {
            io.getIO().emit('posts', {
                action: 'update',
                post: result.toJSON(),
            });

            res.status(200).json({
                message: 'Post edited succesfully',
                post: result,
            });
        })
        .catch(err => next(err));
};

exports.deletePost = (req, res, next) => {
    const { postId } = req.params;
    Post.findById({ _id: postId })
        .populate('creator', 'name')
        .then(post => {
            if (!post) throw errorHandler('Post Not Found', 404, {});
            if (post.creator._id.toString() !== req.userId)
                throw errorHandler('Not authorized', 403, {});
            fileRemove(path.join(__dirname, '..', 'data', post.imageUrl));
            return Post.findByIdAndRemove(postId);
        })
        .then(result => User.findById(req.userId))
        .then(user => {
            user.posts.pull({ _id: postId });
            return user.save();
        })
        .then(result => {
            io.getIO().emit('posts', {
                action: 'delete',
                post: postId,
            });
            res.status(200).json({ message: 'Post deleted succesfully' });
        })
        .catch(err => next(err));
};

exports.getStatus = (req, res, next) => {
    User.findById(req.userId)
        .then(user => {
            if (!user) throw errorHandler(404, 'User not found', {});
            res.status(200).json({
                message: 'Status bring correctly',
                status: user.status,
            });
        })
        .catch(err => next(err));
};

exports.updateStatus = (req, res, next) => {
    const validationErrors = validate(req);

    if (Object.keys(validationErrors).length > 0)
        throw errorHandler('Validation Error', 422, validationErrors);

    const { status } = req.body;

    User.findById(req.userId)
        .then(user => {
            if (!user) throw errorHandler(404, 'User not found', {});
            user.status = status;
            return user.save();
        })
        .then(result => {
            res.status(200).json({
                message: 'Status updated correctly',
            });
        })
        .catch(err => next(err));
};
