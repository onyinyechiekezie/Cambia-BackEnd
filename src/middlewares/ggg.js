const mongoose = require("mongoose");
const connectDB = require("../../src/config/db");
const SenderServiceImpl = require("../../src/services/SenderServiceImpl");
const Order = require("../../src/models/Order");

describe("SenderServiceImpl tests", () => {
  let senderService;

  const mockOrder = {
    senderId: "sender123",
    receiverName: "John Doe",
    receiverWallet: "0xabcdef1234567890",
    amount: 100,
    currency: "SUI",
  };

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    await connectDB();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    senderService = new SenderServiceImpl();
    await Order.deleteMany({});
  });

  test("should place order successfully", async () => {
    const order = await senderService.placeOrder(mockOrder);

    expect(order).toHaveProperty("orderId");
    expect(order.senderId).toBe(mockOrder.senderId);
    expect(order.status).toBe("pending");
  });

  test("should fund order successfully", async () => {
    const order = await senderService.placeOrder(mockOrder);

    const result = await senderService.fundOrder({
      orderId: order.orderId,
      amount: order.amount,
      walletAddress: mockOrder.receiverWallet,
    });

    expect(result.tx).toHaveProperty("txHash");
    expect(result.order.status).toBe("funded");
  });

  test("should track order successfully", async () => {
    const order = await senderService.placeOrder(mockOrder);

    const tracked = await senderService.trackOrder({ orderId: order.orderId });
    expect(tracked.orderId).toBe(order.orderId);
    expect(tracked.status).toBe("pending");
  });

  test("should confirm receipt successfully", async () => {
    const order = await senderService.placeOrder(mockOrder);

    await senderService.fundOrder({
      orderId: order.orderId,
      amount: order.amount,
      walletAddress: mockOrder.receiverWallet,
    });

    const confirmed = await senderService.confirmReceipt({ orderId: order.orderId });
    expect(confirmed.status).toBe("completed");
  });

  test("should throw error if order not found", async () => {
    await expect(senderService.trackOrder({ orderId: "nonexistent" }))
      .rejects
      .toThrow("Order not found");
  });
});







class BlockchainServiceMock {
  async fundOrderTx(orderId, amount, walletAddress) {
    return {
      txHash: "0xmockedhash_" + orderId,
      status: "success",
      amount,
      walletAddress,
    };
  }
}

module.exports = BlockchainServiceMock;



const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    senderId: { type: String, required: true },
    receiverName: { type: String, required: true },
    receiverWallet: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "SUI" },
    funded: { type: Boolean, default: false },
    status: { type: String, enum: ["pending", "funded", "completed"], default: "pending" },
    txHash: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
