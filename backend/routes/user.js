const express = require('express');

const router = express.Router();

const {
  requireSignin,
  authMiddleware,
  adminMiddleware,
} = require('../controllers/auth');
const {
  read,
  publicProfile,
  updateUser,
  photo,
} = require('../controllers/user');

// @URL     GET /api/profile
// @Desc    Get user profile
// @Access  private
router.get('/user/profile', requireSignin, authMiddleware, read);

// @URL     GET /api/user/profile
// @Desc    Get user public profile
// @Access  private
router.get('/user/:username', publicProfile);

// @URL     PUT /api/user/update
// @Desc    Update user profile
// @Access  private
router.put('/user/update', requireSignin, authMiddleware, updateUser);

// @URL     GET /api/user/photo
// @Desc    Get user profile photo
// @Access  public
router.get('/user/photo/:username', photo);

module.exports = router;
