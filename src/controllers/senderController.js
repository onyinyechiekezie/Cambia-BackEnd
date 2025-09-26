const ConcreteSenderService = require('../services/ConcreteSenderService');
const { OrderRequestDto, OrderResponseDto } = require('../../dto/OrderRequestDto');
const FundOrderRequestDto = require('../../dto/FundOrderRequestDto');
const ConfirmReceiptRequestDto = require('../../dto/ConfirmReceiptRequestDto');
const CancelOrderRequestDto = require('../../dto/CancelOrderRequestDto');
const { TrackOrderRequestDto, TrackOrderResponseDto } = require('../../dto/TrackOrderRequestDto');

class SenderController {
  constructor() {
    this.senderService = new ConcreteSenderService();
  }

  async createOrder(req, res) {
    try {
      const orderRequest = new OrderRequestDto(req.body.products, req.body.trustlessSwapID);
      const order = await this.senderService.placeOrder(orderRequest, req.userId);
      res.status(201).json(new OrderResponseDto(order));
    } catch (error) {
      res.status(400).json({ status: false, message: error.message });
    }
  }

  async fundOrder(req, res) {
    try {
      const fundRequest = new FundOrderRequestDto(req.params.orderId, req.body.amount, req.body.senderWalletPrivateKey);
      const order = await this.senderService.fundOrder(fundRequest, req.userId);
      res.status(200).json(new OrderResponseDto(order));
    } catch (error) {
      res.status(400).json({ status: false, message: error.message });
    }
  }

  async trackOrder(req, res) {
    try {
      const trackRequest = new TrackOrderRequestDto(req.params.orderId);
      const order = await this.senderService.trackOrder(trackRequest, req.userId);
      res.status(200).json(new TrackOrderResponseDto(order));
    } catch (error) {
      res.status(400).json({ status: false, message: error.message });
    }
  }

  async confirmReceipt(req, res) {
    try {
      const confirmRequest = new ConfirmReceiptRequestDto(req.params.orderId, req.body.unlockKey);
      const { order, txDigest } = await this.senderService.confirmReceipt(confirmRequest, req.userId);
      res.status(200).json({ order: new OrderResponseDto(order), txDigest });
    } catch (error) {
      res.status(400).json({ status: false, message: error.message });
    }
  }

  async cancelOrder(req, res) {
    try {
      const cancelRequest = new CancelOrderRequestDto(req.params.orderId, req.body.senderWalletPrivateKey);
      const { order, txDigest } = await this.senderService.cancelOrder(cancelRequest, req.userId);
      res.status(200).json({ order: new OrderResponseDto(order), txDigest });
    } catch (error) {
      res.status(400).json({ status: false, message: error.message });
    }
  }
}

module.exports = SenderController;
