const SenderServiceImpl = require('../services/senderServiceImpl');
const OrderRequest = require('../../dto/request/OrderRequest');
const OrderResponse = require('../../dto/response/OrderResponse');
const FundOrderRequest = require('../../dto/request/FundOrderRequest');
const ConfirmReceiptRequest = require('../../dto/request/ConfirmReceiptRequest');
const CancelOrderRequest = require('../../dto/request/CancelOrderRequest');
const TrackOrderRequest = require('../../dto/request/TrackOrderRequest');
const TrackOrderResponse = require('../../dto/response/TrackOrderResponse');

class SenderController {
  constructor() {
    this.senderService = new SenderServiceImpl();
  }

  async createOrder(req, res) {
    try {
      const orderRequest = new OrderRequest(req.body.products, req.body.trustlessSwapID);
      const order = await this.senderService.placeOrder(orderRequest, req.userId);
      res.status(201).json(new OrderResponse(order));
    } catch (error) {
      console.error('Create order error:', error.message);
      res.status(400).json({ status: false, message: error.message });
    }
  }

  async fundOrder(req, res) {
    try {
      const fundRequest = new FundOrderRequest(req.params.orderId, req.body.amount, req.body.senderWalletPrivateKey);
      const order = await this.senderService.fundOrder(fundRequest, req.userId);
      res.status(200).json(new OrderResponse(order));
    } catch (error) {
      console.error('Fund order error:', error.message);
      res.status(400).json({ status: false, message: error.message });
    }
  }

  async trackOrder(req, res) {
    try {
      const trackRequest = new TrackOrderRequest(req.params.orderId);
      const order = await this.senderService.trackOrder(trackRequest, req.userId);
      res.status(200).json(new TrackOrderResponse(order));
    } catch (error) {
      console.error('Track order error:', error.message);
      res.status(400).json({ status: false, message: error.message });
    }
  }

  async confirmReceipt(req, res) {
    try {
      const confirmRequest = new ConfirmReceiptRequest(req.params.orderId, req.body.unlockKey);
      const { order, txDigest } = await this.senderService.confirmReceipt(confirmRequest, req.userId);
      res.status(200).json({ order: new OrderResponse(order), txDigest });
    } catch (error) {
      console.error("Conform receipt error: ", error.message)
      res.status(400).json({ status: false, message: error.message });
    }
  }

  async cancelOrder(req, res) {
    try {
      const cancelRequest = new CancelOrderRequest(req.params.orderId, req.body.senderWalletPrivateKey);
      const { order, txDigest } = await this.senderService.cancelOrder(cancelRequest, req.userId);
      res.status(200).json({ order: new OrderResponse(order), txDigest });
    } catch (error) {
      console.error("Cancel order error: ", error.message)
      res.status(400).json({ status: false, message: error.message });
    }
  }
}

module.exports = SenderController;
