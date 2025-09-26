const vendorService = require('../services/vendorServiceImpl');

class VendorController {
  async addProduct(req, res) {
    try {
      const vendorId = req.user._id; // assuming auth middleware adds user
      const product = await vendorService.addProduct(vendorId, req.body);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }


}

module.exports = new VendorController();