const SenderService = require("./SenderService");
const Order = require("../models/Order"); // MongoDB Order model
const BlockchainServiceMock = require("../services/blockchainServiceMock");
const { v4: uuidv4 } = require("uuid");

class SenderServiceImpl extends SenderService {
  constructor() {
    super();
    this.blockchainService = new BlockchainServiceMock(); // mocked until smart contract is ready
  }

  async placeOrder(orderRequest) {
  const { senderId, receiverName, receiverWallet, amount, currency, products } = orderRequest;

  if (!senderId || !receiverName || !receiverWallet || !amount || !products || products.length === 0) {
    throw new Error("Missing required fields or products");
  }

  return await Order.create({
    orderId: uuidv4(),
    senderId,
    receiverName,
    receiverWallet,
    amount,
    currency: currency || "SUI",
    products, // array of Product IDs
    status: "pending",
    funded: false,
  });
}

  async fundOrder(fundRequest) {
    const { orderId, amount, walletAddress } = fundRequest;

    const order = await Order.findOne({ orderId });
    if (!order) throw new Error("Order not found");
    if (order.funded) throw new Error("Order already funded");

    // call mocked blockchain service
    const tx = await this.blockchainService.fundOrderTx(orderId, amount, walletAddress);

    order.funded = true;
    order.status = "funded";
    order.txHash = tx.txHash;
    await order.save();

    return { order, tx };
  }

  async trackOrder(trackRequest) {
    const { orderId } = trackRequest;

    const order = await Order.findOne({ orderId });
    if (!order) throw new Error("Order not found");

    return order;
  }

  async confirmReceipt(confirmRequest) {
    const { orderId } = confirmRequest;

    const order = await Order.findOne({ orderId });
    if (!order) throw new Error("Order not found");
    if (order.status !== "funded") throw new Error("Order not yet funded");

    order.status = "completed";
    await order.save();

    return order;
  }
}

module.exports = SenderServiceImpl;
