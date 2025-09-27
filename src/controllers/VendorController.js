const VendorServiceImpl = require('../services/VendorServiceImpl');

class VendorController {
  constructor(vendorService = new VendorServiceImpl()) {
    this.vendorService = vendorService;
  }

  async addProduct(req, res) {
    try {
      const product = await this.vendorService.addProduct(req.userId, req.body);
      res.status(201).json({
        status: true,
        data: {
          productId: product._id,
          name: product.name,
          description: product.description,
          price: product.price,
          quantityAvailable: product.quantityAvailable,
          unit: product.unit,
          vendorId: product.vendor,
        },
      });
    } catch (error) {
      console.error('Error adding product:', error.message);
      const statusCode = error.message.includes('Invalid vendor') ? 401 :
                         error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({ status: false, message: error.message });
    }
  }

  async updateProductStock(req, res) {
    try {
      const { productId } = req.params;
      const { quantity } = req.body;
      const product = await this.vendorService.updateProductStock(req.userId, productId, quantity);
      res.status(200).json({
        status: true,
        data: {
          productId: product._id,
          name: product.name,
          description: product.description,
          price: product.price,
          quantityAvailable: product.quantityAvailable,
          unit: product.unit,
          vendorId: product.vendor,
        },
      });
    } catch (error) {
      console.error('Error updating product stock:', error.message);
      const statusCode = error.message.includes('Invalid vendor') || error.message.includes('not owned') ? 401 :
                         error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({ status: false, message: error.message });
    }
  }

  async updateProductPrice(req, res) {
    try {
      const { productId } = req.params;
      const { price } = req.body;
      const product = await this.vendorService.updateProductPrice(req.userId, productId, price);
      res.status(200).json({
        status: true,
        data: {
          productId: product._id,
          name: product.name,
          description: product.description,
          price: product.price,
          quantityAvailable: product.quantityAvailable,
          unit: product.unit,
          vendorId: product.vendor,
        },
      });
    } catch (error) {
      console.error('Error updating product price:', error.message);
      const statusCode = error.message.includes('Invalid vendor') || error.message.includes('not owned') ? 401 :
                         error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({ status: false, message: error.message });
    }
  }

  async deleteProduct(req, res) {
    try {
      const { productId } = req.params;
      const product = await this.vendorService.deleteProduct(req.userId, productId);
      res.status(200).json({
        status: true,
        data: {
          productId: product._id,
          name: product.name,
          description: product.description,
          price: product.price,
          quantityAvailable: product.quantityAvailable,
          unit: product.unit,
          vendorId: product.vendor,
        },
      });
    } catch (error) {
      console.error('Error deleting product:', error.message);
      const statusCode = error.message.includes('Invalid vendor') || error.message.includes('not owned') ? 401 :
                         error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({ status: false, message: error.message });
    }
  }

  async getVendorProducts(req, res) {
    try {
      const products = await this.vendorService.getVendorProducts(req.userId);
      res.status(200).json({
        status: true,
        data: products.map(product => ({
          productId: product._id,
          name: product.name,
          description: product.description,
          price: product.price,
          quantityAvailable: product.quantityAvailable,
          unit: product.unit,
          vendorId: product.vendor,
        })),
      });
    } catch (error) {
      console.error('Error getting vendor products:', error.message);
      const statusCode = error.message.includes('Invalid vendor') ? 401 :
                         error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({ status: false, message: error.message });
    }
  }

  
  async receiveOrder(req, res) {
    try {
      const { orderId } = req.params;
      const order = await this.vendorService.receiveOrder(req.userId, orderId);
      res.status(200).json({
        status: true,
        data: {
          orderId: order._id,
          vendorId: order.vendorID,
          products: order.products,
          totalPrice: order.totalPrice,
          status: order.status,
          trustlessSwapID: order.trustlessSwapID,
        },
      });
    } catch (error) {
      console.error('Error receiving order:', error.message);
      const statusCode = error.message.includes('Invalid vendor') || error.message.includes('not assigned') ? 401 :
                         error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({ status: false, message: error.message });
    }
  }

  async prepareGoods(req, res) {
    try {
      const { orderId } = req.params;
      const order = await this.vendorService.prepareGoods(req.userId, orderId);
      res.status(200).json({
        status: true,
        data: {
          orderId: order._id,
          vendorId: order.vendorID,
          products: order.products,
          totalPrice: order.totalPrice,
          status: order.status,
          trustlessSwapID: order.trustlessSwapID,
        },
      });
    } catch (error) {
      console.error('Error preparing goods:', error.message);
      const statusCode = error.message.includes('Invalid vendor') || error.message.includes('not assigned') ? 401 :
                         error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({ status: false, message: error.message });
    }
  }

  async uploadProof(req, res) {
    try {
      const { orderId } = req.params;
      const { proofUrl } = req.body;
      const order = await this.vendorService.uploadProof(req.userId, orderId, proofUrl);
      res.status(200).json({
        status: true,
        data: {
          orderId: order._id,
          vendorId: order.vendorID,
          products: order.products,
          totalPrice: order.totalPrice,
          status: order.status,
          trustlessSwapID: order.trustlessSwapID,
          proofOfPackaging: order.proofOfPackaging,
        },
      });
    } catch (error) {
      console.error('Error uploading proof:', error.message);
      const statusCode = error.message.includes('Invalid vendor') || error.message.includes('not assigned') ? 401 :
                         error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({ status: false, message: error.message });
    }
  }
}

module.exports = VendorController;
