// services/JwtService.js
const jwt = require('jsonwebtoken');

class JwtService {
  constructor(secret, expiresIn = '1h') {
    if (!secret) throw new Error('JWT secret must be provided');
    this.secret = secret;
    this.expiresIn = expiresIn;
  }

  sign(payload, options = {}) {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn,
      ...options,
    });
  }

  verify(token) {
    try {
      return jwt.verify(token, this.secret);
    } catch (err) {
      throw new Error('Invalid or expired token');
    }
  }
}

module.exports = JwtService;
