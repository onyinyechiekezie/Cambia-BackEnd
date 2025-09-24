const mongoose = require('mongoose');
const { mongodbUri, testDbUri } = require('./env');
const connectDB = async () => {
    try {
        const uri = process.env.NODE_ENV === 'test' ? testDbUri : mongodbUri;
        await mongoose.connect(uri, { 
            useNewUrlParser: true, 
            useUnifiedTopology: true 
        });
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    }
}

module.exports = connectDB;