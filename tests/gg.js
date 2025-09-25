const express = require('express');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Middlewares
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

module.exports = app;
