const path = require('path');

const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const feedController = require('../controllers/feed');
const userValidationRules = require('../middlewares/validator')
    .userValidationRules;

const isAuth = require('../middlewares/isAuth').isAuth;

const router = express.Router();

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) =>
        cb(null, path.join(__dirname, '..', 'data', 'images')),
    filename: (req, file, cb) => cb(null, uuidv4() + '-' + file.originalname),
});

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    )
        cb(null, true);
    else cb(null, false);
};

const upload = multer({
    storage: fileStorage,
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
