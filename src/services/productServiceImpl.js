const ProductService = require('./productService');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');

class ProductServiceImpl extends ProductService {
  async createProduct(vendorId, productData) {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) throw new Error("Vendor not found");

    const product = new Product({ ...productData, vendor: vendorId });
    return await product.save();
  }

  async updateStock(productId, newQuantity) {
    const product = await Product.findById(productId);
    if (!product) throw new Error("Product not found");

    product.quantityAvailable = newQuantity;
    return await product.save();
  }

  async updatePrice(productId, newPrice) {
    const product = await Product.findById(productId);
    if (!product) throw new Error("Product not found");

    product.price = newPrice;
    return await product.save();
  }

  async getVendorProducts(vendorId) {
    return await Product.find({ vendor: vendorId }).populate('category');
  }

  async deleteProduct(productId, vendorId) {
    const product = await Product.findOneAndDelete({ _id: productId, vendor: vendorId });
    if (!product) throw new Error("Product not found or not owned by vendor");

    return product;
  }
}

module.exports = new ProductServiceImpl();
