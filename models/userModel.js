const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Include a username'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: [true, 'A user aleady exists with this email'],
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpeg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords do not match!!',
    },
  },
  passwordChangedAt: Date,
  resetToken: String,
  resetTokenExpiration: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  //A pre method runs before the save
  if (!this.isModified('password')) return next(); //Checks if password field has been modified(or created)

  this.password = await bcrypt.hash(this.password, 12); //encrypt the password

  this.passwordConfirm = undefined; //set passwordConfirm to underfined so it is not saved in the DB
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, async function (next) {
  this.find({ active: { $ne: false } });
  next();
});
userSchema.methods.correctPassword = async function (
  password,
  encryptedPassword
) {
  return await bcrypt.compare(password, encryptedPassword);
};

userSchema.methods.changedPassword = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedAt = parseInt(this.passwordChangedAt.getTime() / 1000);
    return JWTTimestamp < changedAt;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.resetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.resetTokenExpiration = Date.now() + 10 * 60 * 1000;

  return resetToken;
};
const User = mongoose.model('User', userSchema);

module.exports = User;
