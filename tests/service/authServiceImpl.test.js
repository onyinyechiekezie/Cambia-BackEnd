const AuthServiceImpl = require('../../src/services/authServiceImpl');
const User = require('../../src/models/User');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const connectDB = require('../../src/config/db');
const ResponseDTO = require('../../src/dtos/response/userRegisterRes.js');
const { describe } = require('yargs');
const test = require('node:test');

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

    beforeEach(async() => {
        authService = new AuthServiceImpl();
        jest.clearAllMocks();
        bcrypt.hash.mockResolvedValue('hashedPassword');
        bcrypt.compare.mockResolvedValue(true);
        uuidv4.mockReturnValue('generated-uuid');

        await User.deleteMany({});
        jest.spyOn(User, 'findOne');
    });

    describe("register user", () => {
        const validData = {
            email: "123#example.com",
            firstName: "Ibrahim",
            lastName: "Doe",
            password: "password",
            walletAddress: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
            role: "sender",
            phone: "07015366234",
            address: "123 Main St, Lagos"
        }
    });

    test("test should register sender and return success", async() => {
        const result = await authService.register(validData);

        expect(result).toBeInstanceOf(ResponseDTO);
        expect(validData.role).toBe("sender");

        const savedUser = await User.findOne({email: validData.email});
        expect(savedUser).toBeTruthy();
        expect(savedUser.id).toBe("generated-uuid");
        expect(savedUser.role).toBe("sender");
       

    });

})