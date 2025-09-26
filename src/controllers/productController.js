const productService = require('../services/productServiceImpl');


exports.createProduct = async (req, res) => {
  try {
    const vendorId = req.user.id; // assuming auth middleware sets this
    const product = await productService.createProduct(vendorId, req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
