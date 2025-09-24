require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    suiNetwork: process.env.SUI_NETWORK || 'testnet',
    jwtSecret: process.env.JWT,
    mongodUri: process.env.MONGODB_URI,

}
