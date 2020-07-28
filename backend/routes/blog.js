const express = require('express');

const router = express.Router();

const {
  createBlog,
  listBlogs,
  readBlog,
  listAllBlogsCategoriesTags,
  removeBlog,
  updateBlog,
  photo,
  listRelated,
  listSearch,
  listBlogsByUser,
} = require('../controllers/blog');
const {
  requireSignin,
  adminMiddleware,
  authMiddleware,
  canUpdateDeleteBlog,
} = require('../controllers/auth');

// @URL     POST /api/blog
// @Desc    create a new post
// @Access  private
router.post('/blog', requireSignin, adminMiddleware, createBlog);

// @URL     GET /api/blog
// @Desc    Get all posts
// @Access  public
router.get('/blogs', listBlogs);

// @URL     GET /api/blog/:slug
// @Desc    Get a single  post
// @Access  public
router.get('/blog/:slug', readBlog);

// @URL     POST /api/blogs-categories-tags
// @Desc    list al categories tags
// @Access  public
router.post('/blogs-categories-tags', listAllBlogsCategoriesTags);

// @URL     DELETE /api/blog/:slug
// @Desc    delete a post
// @Access  private
router.delete('/blog/:slug', requireSignin, adminMiddleware, removeBlog);

// @URL     PUT /api/blog/:slug
// @Desc    create a new post
// @Access  private
router.put('/blog/:slug', requireSignin, adminMiddleware, updateBlog);

// @URL     GET /api/blog/photo/:slug
// @Desc    Get a single  post
// @Access  public
router.get('/blog/photo/:slug', photo);

// @URL     POST /api/blogs/related
// @Desc    List related posts
// @Access  public
router.post('/blogs/related', listRelated);

// @URL     GET /api/blogs/search
// @Desc    Search blogs
// @Access  public
router.get('/blogs/search', listSearch);

// auth user blog crud

// @URL     POST /api/blog
// @Desc    create a new post
// @Access  private
router.post('/user/blog', requireSignin, authMiddleware, createBlog);

// @URL     DELETE /api/blog/:slug
// @Desc    delete a post
// @Access  private
router.delete(
  '/user/blog/:slug',
  requireSignin,
  authMiddleware,
  canUpdateDeleteBlog,
  removeBlog
);

// @URL     PUT /api/blog/:slug
// @Desc    create a new post
// @Access  private
router.put(
  '/user/blog/:slug',
  requireSignin,
  authMiddleware,
  canUpdateDeleteBlog,
  updateBlog
);

// @URL     GET /api/blog
// @Desc    Get all posts by a user
// @Access  public
router.get('/:username/blogs', listBlogsByUser);

module.exports = router;
