const express = require('express');
const VendorController = require('../controllers/VendorController');

const router = express.Router();

router.post('/products/add', VendorController.addProduct);
router.put('/products/:productId/stock', VendorController.updateProductStock);
router.put('/products/:productId/price', VendorController.updateProductPrice);
router.delete('/products/:productId', VendorController.deleteProduct);
router.get('/products', VendorController.getVendorProducts);
router.post('/orders', VendorController.createOrder);
router.post('/orders/:orderId/receive', VendorController.receiveOrder);
router.post('/orders/:orderId/prepare', VendorController.prepareGoods);
router.post('/orders/:orderId/proof', VendorController.uploadProof);

module.exports = router;
