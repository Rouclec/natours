//DEPENDENCIES
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression')

const userRouter = require('./routes/userRoutes');
const tourRouter = require('./routes/tourRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express(); //APP DECLARATION

//MIDDLEWARES
app.use(helmet()); //security http header
app.use(mongoSanitize()); //sanitize all mongoDB query strings in request
app.use(xss()); //clean user input from malatious html code
app.use(hpp()); //prevents parameter pollution
app.use(express.json({ limit: '10kb' })); //Body parser, reading json data from body (limited to 10kb)
app.use(express.static(`${__dirname}/public`)); //serving static files
app.use(compression()) //compress all the text responses sent to client

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  max: 100, //maximum of 100 requests from same IP,
  windowMs: 60 * 60 * 1000, //in 1 hour (60*60*1000)ms,
  message: 'Too many requests from this IP, please try again in an hour!',
});

app.use('/api', limiter); //limiting all requests to /api

app.use('/api/v1/users', userRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/api/v1/routes', viewRouter);

module.exports = app;
