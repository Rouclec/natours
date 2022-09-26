const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const catchAsync = require('./../utils/errorHandling');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  // 2) create the checkout session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        price: 'price_1LmEU0D9saG3wPxnBThoiOYs',
        quantity: 1,
      },
    ],
  });
  // 3) send to client
  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.fakeProtect = catchAsync(async (req, res, next) => {
  const user = await User.findById('63219f7ad5d899e580b6eb0c');
  req.user = user;
  next();
});
exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.query;

  if (!(tour && user && price)) {
    return next();
  }
  await Booking.create({ tour, user, price });

  next();
});
