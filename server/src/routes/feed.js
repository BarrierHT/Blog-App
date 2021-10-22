const path = require('path');

const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const feedController = require('../controllers/feed');
const userValidationRules = require('../middlewares/validator')
    .userValidationRules;

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
    limits: { fileSize: 1048576 },
});

router.get('/posts', feedController.getPosts);
router.get('/post/:postId', feedController.getPost);
router.post(
    '/post',
    upload.single('image'),
    userValidationRules(
        'body--title',
        'body--content',
        'body--image?needed=true'
    ),
    feedController.createPost
);

module.exports = router;
