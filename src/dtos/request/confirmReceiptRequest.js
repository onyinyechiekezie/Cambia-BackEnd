class ConfirmReceiptRequest {
  constructor(orderId, unlockKey) {
    this.orderId = orderId;
    this.unlockKey = unlockKey;
  }
}

module.exports = ConfirmReceiptRequest;
