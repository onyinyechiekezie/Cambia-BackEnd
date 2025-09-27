class CancelOrderRequest {
  constructor(orderId, senderWalletPrivateKey) {
    this.orderId = orderId;
    this.senderWalletPrivateKey = senderWalletPrivateKey;
  }
}

module.exports = CancelOrderRequest;
