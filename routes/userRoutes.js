const express = require('express');
const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  protect,
  updatePasswword,
  restrictTo,
} = require('../controllers/authController');
const {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe,
  uploadFile,
  resizePhoto,
} = require('../controllers/userController');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);

router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

router.use(protect); //All routers below this use the protect middleware

router.patch('/updatePassword', updatePasswword);
router.patch('/updateMe', uploadFile, resizePhoto, updateMe);
router.patch('/deleteMe', deleteMe);
router.get('/me', getMe, getUser);

router.use(restrictTo('admin')); //All routers below this are restricted to admins only
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

router.use(restrictTo('guide', 'lead-guide', 'admin'));
router.route('/').get(getAllUsers);

module.exports = router;
