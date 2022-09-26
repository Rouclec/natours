const User = require('../models/userModel');
const catchAsync = require('../utils/errorHandling');
const sharp = require('sharp');
const { deleteOne, updateOne, getOne, getAll } = require('./handlerFactory');
exports.getAllUsers = getAll(User);
exports.getUser = getOne(User);
exports.updateUser = updateOne(User);
exports.deleteUser = deleteOne(User);

//multer for file uploads
const multer = require('multer');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cbFxn) => {
//     cbFxn(null, 'public/img/users');
//   },
//   filename: (req, file, cbFxn) => {
//     //user-userId-timestamp.extension
//     const extension = file.mimetype.split('/')[1];
//     cbFxn(null, `user-${req.user.id}-${Date.now()}.${extension}`);
//   },
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cbFxn) => {
  if (file.mimetype.startsWith('image')) {
    cbFxn(null, true);
  } else {
    cbFxn('Error: Not an image! Please upload only images', false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});
exports.uploadFile = upload.single('photo');

exports.resizePhoto = catchAsync(async (req, res, next) => {
  if(!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500) //reizes the image to 500x500
    .toFormat('jpeg') //converts the image to a jpeg format
    .jpeg({ quality: 90 }) //sets the quality to 90% of the original quality
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.file) req.body.photo = req.file.filename;
  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      email: req.body.email,
      username: req.body.username,
      photo: req.body.photo,
    },
    { new: true, runValidators: true }
  );

  next(
    res.status(200).json({
      status: 'Updated',
      data: user,
    })
  );
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  next(
    res.status(204).json({
      status: 'Deleted',
      data: null,
    })
  );
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
