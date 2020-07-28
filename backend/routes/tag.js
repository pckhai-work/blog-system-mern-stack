const express = require('express');

const router = express.Router();

const {
  createTag,
  listTags,
  readTag,
  deleteTag,
} = require('../controllers/tag');
const { runValidation } = require('../validators');
const { adminMiddleware, requireSignin } = require('../controllers/auth');
const { tagCreateValidator } = require('../validators/tag');

// @URL     POST /api/tag
// @Desc    Create a new tag
// @Access  private
router.post(
  '/tag',
  tagCreateValidator,
  runValidation,
  requireSignin,
  adminMiddleware,
  createTag
);

// @URL     POST /api/tags
// @Desc    List all tags
// @Access  public
router.get('/tags', listTags);

// @URL     GET /api/tag:slug
// @Desc    Get tag by slug
// @Access  public
router.get('/tag/:slug', readTag);

// @URL     DELETE /api/tag:slug
// @Desc    Delete a tag
// @Access  private
router.delete('/tag/:slug', requireSignin, adminMiddleware, deleteTag);

module.exports = router;
