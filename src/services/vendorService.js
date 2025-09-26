// services/vendorService.js
class VendorService {
  async addProduct(vendorId, productData) { throw new Error("Not implemented"); }
  async updateProductStock(vendorId, productId, newQuantity) { throw new Error("Not implemented"); }
  async updateProductPrice(vendorId, productId, newPrice) { throw new Error("Not implemented"); }
  async deleteProduct(vendorId, productId) { throw new Error("Not implemented"); }
  async getVendorProducts(vendorId) { throw new Error("Not implemented"); }

  async receiveOrder(vendorId, orderId) { throw new Error("Not implemented"); }
  async prepareGoods(vendorId, orderId) { throw new Error("Not implemented"); }
  async uploadProof(vendorId, orderId, proofUrl) { throw new Error("Not implemented"); }
}

module.exports = VendorService;
