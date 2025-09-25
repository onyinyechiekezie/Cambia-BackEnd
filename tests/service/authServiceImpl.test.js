const AuthServiceImpl = require('../../src/services/authServiceImpl');
const User = require('../../src/models/User');
const Sender = require('../../src/models/Sender');
const Vendor = require('../../src/models/Vendor');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid')
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const connectDB = require('../../src/config/db');
const AuthResponse = require('../../src/dtos/response/AuthResponse.js');

jest.mock("bcrypt", ()=> ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

jest.mock('uuid', ()=> ({
    v4: jest.fn(),
}));


describe('Authentication service tests', () => {
    let authService;
    const senderData = {
            email: "1234@gmail.com",
            firstName: "Ibrahim",
            lastName: "Doe",
            password: "password",
            walletAddress: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
            role: "sender",
            phone: "07015366234",
            address: "123 Main St, Lagos"
    };

    const vendorData = {
            email: "bramtech@gmail.com",
            firstName: "Adedeji",
            lastName: "Doe",
            password: "password",
            walletAddress: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
            role: "vendor",
            phone: "08015366234",
            address: "123 Main St, Lagos"
    };

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

        await User.deleteMany({}).exec();
        await Sender.deleteMany({}).exec();
        await Vendor.deleteMany({}).exec();
    });

    describe("register user", () => {
        
        test("test should register sender and return success", async() => {
        const result = await authService.register(senderData);

        expect(result).toBeInstanceOf(AuthResponse);
        expect(result.status).toBe(true);
        expect(senderData.role).toBe("sender");

        const savedUser = await User.findOne({email: senderData.email});
        expect(savedUser).toBeTruthy();
        expect(savedUser.role).toBe("sender");

        const savedSender = await Sender.findOne({ email: senderData.email})
        expect(savedSender).toBeTruthy();
    });

        test("test should register vendor and return success", async() => {
        const result = await authService.register(vendorData);

        expect(result).toBeInstanceOf(AuthResponse);
        expect(result.status).toBe(true);
        expect(vendorData.role).toBe("vendor");

        const savedUser = await User.findOne({email: vendorData.email});
        expect(savedUser).toBeTruthy();
        expect(savedUser.role).toBe("vendor");

        const savedVendor = await Vendor.findOne({ email: vendorData.email})
        expect(savedVendor).toBeTruthy();
    });
    });

});