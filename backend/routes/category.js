const express = require('express');

const router = express.Router();

const {
  createCategory,
  listCategories,
  readCategory,
  deleteCategory,
} = require('../controllers/category');
const { runValidation } = require('../validators');
const { adminMiddleware, requireSignin } = require('../controllers/auth');
const { categoryCreateValidator } = require('../validators/category');

// @URL     POST /api/category
// @Desc    Create a new category
// @Access  private
router.post(
  '/category',
  categoryCreateValidator,
  runValidation,
  requireSignin,
  adminMiddleware,
  createCategory
);

// @URL     POST /api/categories
// @Desc    List all categories
// @Access  public
router.get('/categories', listCategories);

// @URL     GET /api/category:slug
// @Desc    Get category by slug
// @Access  public
router.get('/category/:slug', readCategory);

// @URL     DELETE /api/category:slug
// @Desc    Delete a category
// @Access  private
router.delete(
  '/category/:slug',
  requireSignin,
  adminMiddleware,
  deleteCategory
);

module.exports = router;
