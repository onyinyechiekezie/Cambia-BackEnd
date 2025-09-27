class OrderRequest {
  constructor(products, trustlessSwapID) {
    this.products = products; // Array of { productId, quantity }
    this.trustlessSwapID = trustlessSwapID; // Optional
  }
}

module.exports = OrderRequest;
