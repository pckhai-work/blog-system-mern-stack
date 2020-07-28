const express = require('express');

const router = express.Router();

const {
  signup,
  signin,
  signout,
  requireSignin,
  forgotPassword,
  resetPassword,
  preSignup,
  googleLogin,
} = require('../controllers/auth');

// validators
const { runValidation } = require('../validators');
const {
  userSignupValidator,
  userSigninValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require('../validators/auth');

// @URL     POST /api/signup
// @Desc    Pr-signup a user (send user activation link)
// @Access  public
router.post('/pre-signup', userSignupValidator, runValidation, preSignup);

// @URL     POST /api/signup
// @Desc    Signup a user, using token
// @Access  public
router.post('/signup', signup);

// @URL     POST /api/signin
// @Desc    Signin a user
// @Access  public
router.post('/signin', userSigninValidator, runValidation, signin);

// @URL     POST /api/signout
// @Desc    Signout current user
// @Access  public
router.get('/signout', signout);

// @URL     PUT /api/forgot-password
// @Desc    Email reset password link to user
// @Access  public
router.put(
  '/forgot-password',
  forgotPasswordValidator,
  runValidation,
  forgotPassword
);

// @URL     PUT /api/reset-password
// @Desc    Reset password after user click on reset password link
// @Access  public
router.put(
  '/reset-password',
  resetPasswordValidator,
  runValidation,
  resetPassword
);

// @URL     POST /api/google-login
// @Desc    Sign in a user, using google
// @Access  public
router.post('/google-login', googleLogin);

module.exports = router;
