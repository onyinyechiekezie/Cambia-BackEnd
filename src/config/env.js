const test = require('node:test');

require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    suiNetwork: process.env.SUI_NETWORK || 'testnet',
    jwtSecret: process.env.JWT,
    mongodbUri: process.env.MONGODB_URI,
    testDbUri: process.env.MONGODB_TEST_URI
}
