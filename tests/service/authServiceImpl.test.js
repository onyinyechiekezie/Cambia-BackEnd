const AuthServiceImpl = require('../../src/services/authServiceImpl');

describe('Authentication service tests', () => {
    let authService;

    beforeEach(() => {
        process.env.NODE_ENV = 'test';
        await connectDB();
    });

})