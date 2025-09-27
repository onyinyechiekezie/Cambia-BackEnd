const express = require('express');
const router = express.Router();
const SenderController = require('../controllers/senderController');
const AuthMiddleware = require('../middlewares/authMiddleware');
const Roles = require('../models/Roles');
const jwtService = require("../services/jwtService");
const User = require("./")

const senderController = new SenderController();
const auth = new AuthMiddleware(jwtService, User);


router.post('/', auth.authorize(Roles.SENDER), senderController.createOrder.bind(senderController));
router.post('/:orderId/fund', authMiddleware(Roles.SENDER), senderController.fundOrder.bind(senderController));
router.get('/:orderId/track', authMiddleware(Roles.SENDER), senderController.trackOrder.bind(senderController));
router.post('/:orderId/confirm', authMiddleware(Roles.SENDER), senderController.confirmReceipt.bind(senderController));
router.post('/:orderId/cancel', authMiddleware(Roles.SENDER), senderController.cancelOrder.bind(senderController));

module.exports = router;
