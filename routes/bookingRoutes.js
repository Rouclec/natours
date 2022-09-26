const express = require('express');
const { protect, restrictTo } = require('../controllers/authController');
const { getCheckoutSession, createBookingCheckout } = require('../controllers/bookingController');

const router = express.Router();

router.get(
  '/checkout-session/:tourId',
  protect,
  getCheckoutSession,
  createBookingCheckout
);

module.exports = router;
