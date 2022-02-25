const aws = require('aws-sdk');

const { validate } = require('../middlewares/validator');
const { errorHandler } = require('../util/errorHandler');
const io = require('../util/socket');
const User = require('../models/user');
const Post = require('../models/post');

aws.config.update({
    secretAccessKey: process.env.SECRET_KEY_AWS,
    accessKeyId: process.env.ACCESS_KEY_AWS,
    region: process.env.REGION_AWS,
});

const s3 = new aws.S3();

exports.getPost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
        .populate('creator', 'name')
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
        if (req.file) {
            s3.deleteObject(
                {
                    Bucket: 'images-blog-app',
                    Key: decodeURIComponent(
                        req.file.location.split('.com/')[1]
                    ),
                },
                function (err, data) {
                    if (err) console.log(err, err.stack);
                    else console.log(data);
                }
            );
        }
        const err = errorHandler('Validation Error', 422, validationErrors);
        return await Promise.reject(err).catch(err => next(err));
    }

    if (!req.file) throw errorHandler('An image is required', 422, {});

    const { title, content } = req.body;

    const user = await User.findById(req.userId);
    const post = new Post({
        title,
        content,
        creator: req.userId,
        imageUrl: req.file.location,
    });
    return post.save()
        .then(result => {
            user.posts.push(result._id);
            return user.save();
        })
        .then(user => {
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
            return user;
        })
        .catch(err => next(err));
};

exports.updatePost = (req, res, next) => {
    const validationErrors = validate(req);

    if (Object.keys(validationErrors).length > 0) {
        if (req.file) {
            s3.deleteObject(
                {
                    Bucket: 'images-blog-app',
                    Key: decodeURIComponent(
                        req.file.location.split('.com/')[1]
                    ),
                },
                function (err, data) {
                    if (err) console.log(err, err.stack);
                    else console.log(data);
                }
            );
        }
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
                s3.deleteObject(
                    {
                        Bucket: 'images-blog-app',
                        Key: decodeURIComponent(
                            post.imageUrl.split('.com/')[1]
                        ),
                    },
                    function (err, data) {
                        if (err) console.log(err, err.stack);
                        else console.log(data);
                    }
                );
                post.imageUrl = req.file.location;
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
            s3.deleteObject(
                {
                    Bucket: 'images-blog-app',
                    Key: decodeURIComponent(post.imageUrl.split('.com/')[1]),
                },
                function (err, data) {
                    if (err) console.log(err, err.stack);
                    else console.log(data);
                }
            );
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
    return User.findById(req.userId)
        .then(user => {
            if (!user) throw errorHandler(404, 'User not found', {});
            res.status(200).json({
                message: 'Status brought correctly',
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
