const express = require('express');
const router = express.Router();

const VendorController = require('../controllers/VendorController');
const AuthMiddleware = require('../middlewares/authMiddleware');
const Roles = require('../models/Roles');
const jwtService = require('../services/jwtService');
const User = require('../models/User');

const vendorController = new VendorController();
const auth = new AuthMiddleware(jwtService, User);

// Products
router.post(
  '/products/add',
  auth.authorize(Roles.VENDOR),
  vendorController.addProduct.bind(vendorController)
);

router.put(
  '/products/:productId/stock',
  auth.authorize(Roles.VENDOR),
  vendorController.updateProductStock.bind(vendorController)
);

router.put(
  '/products/:productId/price',
  auth.authorize(Roles.VENDOR),
  vendorController.updateProductPrice.bind(vendorController)
);

router.delete(
  '/products/:productId',
  auth.authorize(Roles.VENDOR),
  vendorController.deleteProduct.bind(vendorController)
);

router.get(
  '/products',
  auth.authorize(Roles.VENDOR),
  vendorController.getVendorProducts.bind(vendorController)
);

// Orders
router.post(
  '/orders/:orderId/receive',
  auth.authorize(Roles.VENDOR),
  vendorController.receiveOrder.bind(vendorController)
);

router.post(
  '/orders/:orderId/prepare',
  auth.authorize(Roles.VENDOR),
  vendorController.prepareGoods.bind(vendorController)
);

router.post(
  '/orders/:orderId/proof',
  auth.authorize(Roles.VENDOR),
  vendorController.uploadProof.bind(vendorController)
);

module.exports = router;
