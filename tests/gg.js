


  const express = require('express');
const AuthController = require('../controllers/authController');

const router = express.Router();
const authController = new AuthController();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/verify', authController.verify);

module.exports = router;
