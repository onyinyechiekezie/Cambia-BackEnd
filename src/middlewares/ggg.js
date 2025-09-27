
const SenderServiceImpl = require('../services/SenderServiceImpl');

class SenderController {
  constructor(senderService = new SenderServiceImpl()) {
    this.senderService = senderService;
  }

  async createOrder(req, res) {
    try {
      const order = await this.senderService.placeOrder(req.body, req.userId);
      res.status(201).json({
        status: true,
        data: {
          orderId: order._id,
          senderId: order.senderID,
          vendorId: order.vendorID,
          products: order.products,
          totalPrice: order.totalPrice,
          status: order.status,
          trustlessSwapID: order.trustlessSwapID,
        },
      });
    } catch (error) {
      console.error('Error creating order:', error.message);
      const statusCode = error.message.includes('Invalid sender') || error.message.includes('Unauthorized') ? 401 :
                         error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({ status: false, message: error.message });
    }
  }

  async fundOrder(req, res) {
    try {
      const fundRequest = { orderId: req.params.orderId, amount: req.body.amount, senderWalletPrivateKey: req.body.senderWalletPrivateKey };
      const order = await this.senderService.fundOrder(fundRequest, req.userId);
      res.status(200).json({
        status: true,
        data: {
          orderId: order._id,
          senderId: order.senderID,
          vendorId: order.vendorID,
          products: order.products,
          totalPrice: order.totalPrice,
          status: order.status,
          trustlessSwapID: order.trustlessSwapID,
        },
      });
    } catch (error) {
      console.error('Error funding order:', error.message);
      const statusCode = error.message.includes('Unauthorized') ? 401 :
                         error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({ status: false, message: error.message });
    }
  }

  async trackOrder(req, res) {
    try {
      const trackRequest = { orderId: req.params.orderId };
      const order = await this.senderService.trackOrder(trackRequest, req.userId);
      res.status(200).json({
        status: true,
        data: {
          orderId: order._id,
          senderId: order.senderID,
          vendorId: order.vendorID,
          products: order.products,
          totalPrice: order.totalPrice,
          status: order.status,
          trustlessSwapID: order.trustlessSwapID,
          proofOfPackaging: order.proofOfPackaging,
        },
      });
    } catch (error) {
      console.error('Error tracking order:', error.message);
      const statusCode = error.message.includes('Unauthorized') ? 401 :
                         error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({ status: false, message: error.message });
    }
  }

  async confirmReceipt(req, res) {
    try {
      const confirmRequest = { orderId: req.params.orderId, unlockKey: req.body.unlockKey };
      const { order, txDigest } = await this.senderService.confirmReceipt(confirmRequest, req.userId);
      res.status(200).json({
        status: true,
        data: {
          order: {
            orderId: order._id,
            senderId: order.senderID,
            vendorId: order.vendorID,
            products: order.products,
            totalPrice: order.totalPrice,
            status: order.status,
            trustlessSwapID: order.trustlessSwapID,
          },
          txDigest,
        },
      });
    } catch (error) {
      console.error('Error confirming receipt:', error.message);
      const statusCode = error.message.includes('Unauthorized') || error.message.includes('Invalid unlock key') ? 401 :
                         error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({ status: false, message: error.message });
    }
  }

  async cancelOrder(req, res) {
    try {
      const cancelRequest = { orderId: req.params.orderId, senderWalletPrivateKey: req.body.senderWalletPrivateKey };
      const { order, txDigest } = await this.senderService.cancelOrder(cancelRequest, req.userId);
      res.status(200).json({
        status: true,
        data: {
          order: {
            orderId: order._id,
            senderId: order.senderID,
            vendorId: order.vendorID,
            products: order.products,
            totalPrice: order.totalPrice,
            status: order.status,
            trustlessSwapID: order.trustlessSwapID,
          },
          txDigest,
        },
      });
    } catch (error) {
      console.error('Error canceling order:', error.message);
      const statusCode = error.message.includes('Unauthorized') ? 401 :
                         error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({ status: false, message: error.message });
    }
  }
}

module.exports = SenderController;