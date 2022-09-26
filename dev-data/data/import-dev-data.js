const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const fs = require('fs');
const bcrypt = require('bcryptjs');

const Tour = require('./../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DB_PASSWORD);
mongoose.connect(DB).then(() => {
  console.log('Connection successful');
});

//READ JSON FILE

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));

const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));

const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);
//IMPORT DATA INTO DB
const importData = async (model) => {
  try {
    if (model === 'tours') {
      await Tour.create(tours);
    } else if (model === 'users') {
      await User.create(users, { validateBeforeSave: false });
    } else if (model == 'reviews') {
      await Review.create(reviews);
    }
    console.log('Data successfully loaded!');
    process.exit();
  } catch (error) {
    console.log('Error: ', error);
  }
};

//DELETE ALL DATA FROM COLLECTION TOUR

const deleteData = async (model) => {
  try {
    if (model === 'tours') {
      await Tour.deleteMany();
    } else if (model === 'users') {
      await User.deleteMany();
    }
    console.log('Data successfully deleted!');
    process.exit();
  } catch (error) {
    console.log('Error: ', error);
  }
};

if (process.argv[2] === '--import') {
  importData(process.argv[3]);
} else if (process.argv[2] === '--delete') {
  deleteData(process.argv[3]);
}

console.log(process.argv);
