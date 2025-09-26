const express = require('express');
const authRoutes = require('./routes/authRoutes');
const senderRoutes = require('./routes/sender');
const vendorRoutes = require('./routes/vendor');
const app = express();

app.use(express.json());
app.use('/api/sender/orders', senderRoutes);
app.use('/api/vendor/orders', vendorRoutes);
app.use('/api/auth', authRoutes);

module.exports = app;