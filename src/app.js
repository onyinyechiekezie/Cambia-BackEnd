const express = require('express');
const authRoutes = require('./routes/authRoutes');
const senderRoutes = require('./routes/sender');
const vendorRoutes = require('./routes/vendor');
const { verifyToken } = require('./middleware/authMiddleware'); // Assuming middleware exists

const app = express();

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/sender/orders', verifyToken, senderRoutes);
app.use('/api/vendor', verifyToken, vendorRoutes); // Updated to include all vendor routes

module.exports = app;
