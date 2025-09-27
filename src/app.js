const express = require('express');
const authRoutes = require('./routes/authRoutes');
const senderRoutes = require('./routes/sender');
const vendorRoutes = require('./routes/vendor');

const app = express();

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/sender/orders', senderRoutes);  // middleware handled inside sender routes
app.use('/api/vendor', vendorRoutes);         // middleware handled inside vendor routes

module.exports = app;
