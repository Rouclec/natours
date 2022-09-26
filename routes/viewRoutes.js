const express = require('express');
const { protect, restrictTo } = require('../controllers/authController');
const {
  createBookingCheckout,
  fakeProtect,
} = require('../controllers/bookingController');

const router = express.Router();

router.get('/', fakeProtect, createBookingCheckout);

module.exports = router;
