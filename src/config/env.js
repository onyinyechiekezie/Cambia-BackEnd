require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3100,
    suiNetwork: process.env.SUI_NETWORK || 'testnet',
    databaseUrl: process.env.DATABASE_URL || 'mongodb://localhost:27017/myapp',
    jwtSecret: process.env.JWT
}