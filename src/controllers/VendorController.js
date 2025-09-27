const vendorService = require('../../services/vendorServiceImpl');

class VendorController {
  async addProduct(req, res) {
    try {
      const vendorId = req.params.vendorId; // or from auth later
      const productData = req.body;
      const product = await vendorService.addProduct(vendorId, productData);
      res.status(201).json(product);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

}

module.exports = new VendorController();