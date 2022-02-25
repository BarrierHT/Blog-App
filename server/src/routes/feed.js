const express = require('express');
const multer = require('multer');
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');

const { v4: uuidv4 } = require('uuid');

const feedController = require('../controllers/feed');
const userValidationRules = require('../middlewares/validator')
    .userValidationRules;
const isAuth = require('../middlewares/isAuth').isAuth;

const router = express.Router();

aws.config.update({
    secretAccessKey: process.env.SECRET_KEY_AWS,
    accessKeyId: process.env.ACCESS_KEY_AWS,
    region: process.env.REGION_AWS,
});

const s3 = new aws.S3();

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg' ||
        file.mimetype === 'image/jfif'
    )
        cb(null, true);
    else cb(new Error('mimetype not allowed'), false);
};

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'images-blog-app',
        acl: 'public-read',
        metadata: function(req, file, cb) {
            cb(null, { fieldName: 'uploading_of_images_blog_app' });
        },
        key: function(req, file, cb) {
            cb(null, uuidv4() + '-' + file.originalname);
        },
    }),
    fileFilter,
    limits: { fileSize: 3145728 },
});

router.get('/posts', isAuth, feedController.getPosts);
router.get('/post/:postId', isAuth, feedController.getPost);

router.get('/status', isAuth, feedController.getStatus);
router.post(
    '/post',
    isAuth,
    upload.single('image'),
    userValidationRules(
        'body--title',
        'body--content',
        'body--image?needed=true'
    ),
    feedController.createPost
);

router.put(
    '/post/:postId',
    isAuth,
    upload.single('image'),
    userValidationRules(
        'body--title',
        'body--content',
        'body--image?needed=false'
    ),
    feedController.updatePost
);

router.patch(
    '/update-status',
    userValidationRules('body--status'),
    isAuth,
    feedController.updateStatus
);

router.delete('/post/:postId', isAuth, feedController.deletePost);

module.exports = router;
