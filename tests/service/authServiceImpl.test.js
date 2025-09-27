const AuthServiceImpl = require('../../src/services/authServiceImpl');
const User = require('../../src/models/User');
const Sender = require('../../src/models/Sender');
const Vendor = require('../../src/models/Vendor');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const connectDB = require('../../src/config/db');
const AuthResponse = require('../../src/dtos/response/AuthResponse.js');

jest.mock("bcrypt", ()=> ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

jest.mock('jsonwebtoken', ()=> ({
    sign: jest.fn(),
    verify: jest.fn(,)
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

    const loginData = {
        email: "bramtech@gmail.com",
        password: "password",
    }

    beforeAll(async() => {
        process.env.NODE_ENV = 'test';
        process.env.JWT_SECRET = "test-secret"
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
        jwt.sign.mockReturnValue('mocked-jwt-token');

        await User.deleteMany({}).exec();
        await Sender.deleteMany({}).exec();
        await Vendor.deleteMany({}).exec();
    });

    afterEach(async () => {
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

    test('should throw error for duplicate email', async () => {
        await Sender.create({
            email: senderData.email,
            password: 'hashedPassword',
            walletAddress: senderData.walletAddress,
            role: senderData.role,
            firstName: senderData.firstName,
            lastName: senderData.lastName,
            phone: senderData.phone,
            address: senderData.address,
          });
    
          await expect(authService.register(senderData)).rejects.toThrow('Email already exists');
        });
    });

    describe("login user", ()=> {
        test("test can login sender returns success and token ", async ()=> {
            const hashedPassword = await bcrypt.hash(senderData.password, 10);
            await Sender.create({ ...senderData, password: hashedPassword });

            const result = await authService.login({
                email: senderData.email,
                password: senderData.password
            });

            expect(result).toHaveProperty("token");
            expect(typeof result.token).toBe("string");

            expect(result.user).toBeInstanceOf(AuthResponse);
            expect(result.user.status).toBe(true);
            expect(result.user.message).toBe("Login successful")
        });

        test("test can login sender returns success and token", async()=>{
            const hashedPassword = await bcrypt.hash(vendorData.password, 10);
            await Vendor.create({ ...vendorData, password: hashedPassword });

            const result = await authService.login({
                email: vendorData.email,
                password: vendorData.password
            });

            expect(result).toHaveProperty("token");
            expect(typeof result.token).toBe("string");

            expect(result.user).toBeInstanceOf(AuthResponse);
            expect(result.user.status).toBe(true);
            expect(result.user.message).toBe("Login successful") 
        });

        test("test should throw error for invalid email", async ()=> {
            await expect(
                authService.login({ email: "lolad3@gmail.com", password: "password"})
            ).rejects.toThrow("Invalid email");
        });

        test("should throw error for invalid input data", async()=> {
            const invalidData = { email: "", pasword: "" };
            await expect(authService.login(invalidData)).rejects.toThrow();
        });
    })
});