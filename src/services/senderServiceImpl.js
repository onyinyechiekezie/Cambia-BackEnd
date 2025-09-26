const BlockchainServiceMock = require("./blockChainServiceMock");
const SenderService = require("./senderService");
const Order = require("../models/Order"); // MongoDB Order model
const { v4: uuidv4 } = require("uuid");
class SenderServiceImpl extends SenderService{
    constructor() {
        super();
        this.blockChainService = new BlockchainServiceMock();
    }

    async placeOrder(orderRequest) {
        // Strict DTO validation
        if (typeof orderRequest !== 'object' || orderRequest === null) {
            throw new Error('Order request must be an object');
        }
        const requiredFields = ['senderId', 'receiverName', 'receiverWallet', 'amount', 'products'];
        for (const field of requiredFields) {
            if (!(field in orderRequest)) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
        const { senderId, receiverName, receiverWallet, amount, currency, products } = orderRequest;

        if (typeof senderId !== 'string' || senderId.trim() === '') {
            throw new Error('senderId must be a non-empty string');
        }
        if (typeof receiverName !== 'string' || receiverName.trim() === '') {
            throw new Error('receiverName must be a non-empty string');
        }
        if (typeof receiverWallet !== 'string' || receiverWallet.trim() === '') {
            throw new Error('receiverWallet must be a non-empty string');
        }
        if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
            throw new Error('amount must be a positive number');
        }
        if (!Array.isArray(products) || products.length === 0) {
            throw new Error('products must be a non-empty array');
        }

        return await Order.create({
            orderId: uuidv4(),
            senderId,
            receiverName,
            receiverWallet,
            amount,
            currency: typeof currency === 'string' && currency.trim() ? currency : 'SUI',
            products,
            status: 'pending',
            funded: false,
        });
    }

    async fundOrder(fundRequest) {
        const { orderID, amount, walletAddress} = fundRequest;

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
