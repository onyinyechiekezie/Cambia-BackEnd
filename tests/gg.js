const mongoose = require('mongoose');
const connectDB = require('./config/db');
const app = require('./app');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

// Connect DB and start server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.error("DB connection failed:", err));


  const express = require('express');
const AuthController = require('../controllers/authController');

const router = express.Router();
const authController = new AuthController();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/verify', authController.verify);

module.exports = router;
