const express = require('express');
const router = express.Router();

const feedController = require('../controllers/feed');
const userValidationRules = require('../middlewares/validator')
    .userValidationRules;

router.get('/posts', feedController.getPosts);
router.post(
    '/post',
    userValidationRules('title', 'content'),
    feedController.createPost
);

module.exports = router;
