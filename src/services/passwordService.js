const bcrypt = require('bcrypt');

class PasswordService {
  constructor(saltRounds = 10) {
    this.saltRounds = saltRounds;
  }

  async hash(password) {
    return bcrypt.hash(password, this.saltRounds);
  }

  async compare(plainText, hashedPassword) {
    return bcrypt.compare(plainText, hashedPassword);
  }
}

module.exports = PasswordService;
