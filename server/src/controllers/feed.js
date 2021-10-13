const { validate } = require('../middlewares/validator');

exports.getPosts = (req, res, next) => {
    res.status(200).json({
        posts: [
            {
                _id: new Date().getTime(),
                title: 'First',
                content: 'First content',
                creator: {
                    name: 'test1',
                },
                imageUrl: 'data/images/TheForest.png',
                createdAt: new Date(),
            },
        ],
        totalItems: 1,
    });
};

exports.createPost = (req, res, next) => {
    const { title, content } = req.body;
    const validationErrors = validate(req);

    console.log(title, ' ', content);

    if (Object.keys(validationErrors).length > 0)
        return res
            .status(422)
            .json({ message: 'Validation-failed', errors: validationErrors });

    res.status(201).json({
        message: 'Post created successfully',
        post: {
            _id: new Date().getTime(),
            title,
            content,
            creator: { name: 'test1' },
            createdAt: new Date(),
        },
    });
};
