const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth');
const { userValidationRules } = require('../middlewares/validator');

router.put(
    '/signup',
    userValidationRules('body--email', 'body--name', 'body--password'),
    authController.signup
);

router.post('/login', authController.login);

module.exports = router;
