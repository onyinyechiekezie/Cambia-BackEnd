const vendorService = require('../services/vendorServiceImpl');

class VendorController {
  async addProduct(req, res) {
    try {
<<<<<<< HEAD
      const vendorId = req.params.vendorId; // or from auth later
      const productData = req.body;
      const product = await vendorService.addProduct(vendorId, productData);
      res.status(201).json(product);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

=======
      const vendorId = req.user._id; // assuming auth middleware adds user
      const product = await vendorService.addProduct(vendorId, req.body);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }


>>>>>>> f9aa81cc33535585a0cb14718a4b9e675b079f15
}

module.exports = new VendorController();