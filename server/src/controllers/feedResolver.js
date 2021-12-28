const path = require('path');

const User = require('../models/user');
const Post = require('../models/post');
const errorHandler = require('../util/errorHandler').errorHandler;
const validator = require('../middlewares/validator');
const fileHelper = require('../util/fileHelper');

exports.createPost = async (args, req) => {
    if (!req.isAuth) throw errorHandler('Not Authenticated', 401, {});

    const { title, content, imageUrl } = args;

    const validationErrors = await validator([
        { name: 'title', value: title },
        { name: 'content', value: content },
    ]);

    if (Object.keys(validationErrors).length > 0) {
        if (imageUrl)
            fileHelper.fileRemove(path.join(__dirname, '..', 'data', imageUrl));
        throw errorHandler('Validation Error', 422, validationErrors);
    }

    const user = await User.findById(req.userId);

    if (!user) throw errorHandler('User error', 400, {});

    let post = new Post({
        title,
        content,
        creator: user._id,
        imageUrl,
    });
    return post
        .save()
        .then(result => {
            user.posts.push(result._id);
            return user.save();
        })
        .then(result => {
            post = post.toJSON();
            return {
                ...post,
                createdAt: post.createdAt.toISOString(),
                creator: { _id: user._id, name: user.name },
            };
        })
        .catch(err => {
            throw err;
        });
};

exports.editPost = async (args, req) => {
    if (!req.isAuth) throw errorHandler('Not Authenticated', 401, {});

    let { title, content, postId, imageUrl } = args;

    if (imageUrl === 'undefined') imageUrl = undefined;

    const validationErrors = await validator([
        { name: 'title', value: title },
        { name: 'content', value: content },
    ]);

    if (Object.keys(validationErrors).length > 0) {
        if (imageUrl)
            fileHelper.fileRemove(path.join(__dirname, '..', 'data', imageUrl));
        throw errorHandler('Validation Error', 422, validationErrors);
    }

    return Post.findById({ _id: postId })
        .populate('creator', 'name')
        .then(post => {
            if (!post) throw errorHandler('Post Not Found', 404, {});
            if (post.creator._id.toString() !== req.userId)
                throw errorHandler('Not authorized', 403, {});
            post.title = title;
            post.content = content;
            if (imageUrl) {
                // console.log('IMAGEURL: ', imageUrl, typeof imageUrl);
                fileHelper.fileRemove(
                    path.join(__dirname, '..', 'data', post.imageUrl)
                );
                post.imageUrl = imageUrl;
            }
            return post.save();
        })
        .then(result => {
            result = result.toJSON();
            return {
                ...result,
                createdAt: result.createdAt.toISOString(),
            };
        })
        .catch(err => {
            throw err;
        });
};

exports.deletePost = (args, req) => {
    if (!req.isAuth) throw errorHandler('Not authenticated', 401, {});
    const { postId } = args;

    return Post.findById({ _id: postId })
        .then(post => {
            if (!post) throw errorHandler('Post Not Found', 404, {});
            if (post.creator.toString() !== req.userId)
                throw errorHandler('Not authorized', 403, {});
            fileHelper.fileRemove(
                path.join(__dirname, '..', 'data', post.imageUrl)
            );
            return Post.findByIdAndRemove(postId);
        })
        .then(result => User.findById(req.userId))
        .then(user => {
            user.posts.pull({ _id: postId });
            return user.save();
        })
        .then(result => true)
        .catch(err => {
            throw err;
        });
};

exports.getPost = (args, req) => {
    if (!req.isAuth) throw errorHandler('Not Authenticated', 401, {});

    const { postId } = args;
    return Post.findById(postId)
        .populate('creator', 'name _id')
        .then(post => {
            if (!post) throw errorHandler('Post Not Found', 404, {});
            return { ...post.toJSON() };
        })
        .catch(err => {
            throw err;
        });
};

exports.getPosts = async (args, req) => {
    if (!req.isAuth) throw errorHandler('Not Authenticated', 401, {});

    const currentPage = args.page || 1;
    const itemsPerPage = 2;
    const qtyPosts = await Post.countDocuments().catch(err => {
        throw err;
    });

    return Post.find()
        .populate('creator', 'name -_id')
        .sort({ createdAt: -1 })
        .skip(itemsPerPage * (currentPage - 1))
        .limit(itemsPerPage)
        .then(posts => {
            return {
                posts,
                totalItems: qtyPosts,
            };
        })
        .catch(err => {
            throw err;
        });
};

exports.updateStatus = async (args, req) => {
    if (!req.isAuth) throw errorHandler('Not Authenticated', 401, {});

    const { status } = args;

    const validationErrors = await validator([
        { name: 'status', value: status },
    ]);

    if (Object.keys(validationErrors).length > 0)
        throw errorHandler('Validation Error', 422, validationErrors);

    return User.findById(req.userId)
        .then(user => {
            if (!user) throw errorHandler(404, 'User not found', {});
            user.status = status;
            return user.save();
        })
        .then(result => true)
        .catch(err => next(err));
};
