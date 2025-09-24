const AuthServiceImpl = require('../../src/services/authServiceImpl');

describe('Authentication service tests', () => {
    let authService;

    beforeAll(async() => {
        process.env.NODE_ENV = 'test';
        await connectDB();
        console.log('Connected to persistent test DB for manual inspection.');
    });

    afterAll(async () => {
        await mongoose.connection.close(); 
    });

})