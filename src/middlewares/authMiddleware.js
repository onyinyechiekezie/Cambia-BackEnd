const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Roles = require('../models/Roles');

const AuthMiddleware = (requiredRole) => async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error('Authentication token missing');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.role !== requiredRole) throw new Error(`Must be a ${requiredRole}`);

    req.userId = user._id;
    req.walletAddress = user.walletAddress;
    req.role = user.role;
    next();
  } catch (error) {
    res.status(401).json({ status: false, message: 'Authentication failed: ' + error.message });
  }
};

module.exports = AuthMiddleware;