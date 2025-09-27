class TrackOrderResponse {
  constructor(order) {
    this.id = order._id;
    this.senderID = order.senderID;
    this.vendorID = order.vendorID;
    this.products = order.products;
    this.totalPrice = order.totalPrice;
    this.status = order.status;
    this.trustlessSwapID = order.trustlessSwapID;
    this.proofOfPackaging = order.proofOfPackaging;
    this.createdAt = order.createdAt;
    this.updatedAt = order.updatedAt;
  }
}

module.exports = TrackOrderResponse;
