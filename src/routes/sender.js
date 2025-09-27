const express = require('express');
const router = express.Router();
const SenderController = require('../controllers/senderController');
const AuthMiddleware = require('../middlewares/authMiddleware');
const Roles = require('../models/Roles');
const JwtService = require("../services/jwtService");
const User = require("../models/User");

const senderController = new SenderController();
const jwtService = new JwtService(process.env.JWT_SECRET)
const auth = new AuthMiddleware(jwtService, User);


router.post('/', auth.authorize(Roles.SENDER), senderController.createOrder.bind(senderController));
router.post('/:orderId/fund', auth.authorize(Roles.SENDER), senderController.fundOrder.bind(senderController));
router.get('/:orderId/track', auth.authorize(Roles.SENDER), senderController.trackOrder.bind(senderController));
router.post('/:orderId/confirm', auth.authorize(Roles.SENDER), senderController.confirmReceipt.bind(senderController));
router.post('/:orderId/cancel', auth.authorize(Roles.SENDER), senderController.cancelOrder.bind(senderController));

module.exports = router;
