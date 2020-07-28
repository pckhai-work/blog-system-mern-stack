const formidable = require('formidable');
const slugify = require('slugify');
const stripHtml = require('string-strip-html');
const fs = require('fs');
const _ = require('lodash');

const Blog = require('../models/blog');
const Category = require('../models/category');
const Tag = require('../models/tag');
const User = require('../models/user');
const { errorHandler } = require('../helpers/dbErrorHandler');
const { smartTrim } = require('../helpers/blog');

exports.createBlog = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        error: 'Image could not be uploaded',
      });
    }

    const { title, body, categories, tags } = fields;

    if (!title || !title.length) {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (!body || body.length < 200) {
      return res.status(400).json({ error: 'Content is too short' });
    }

    if (!categories || categories.length === 0) {
      return res
        .status(400)
        .json({ error: 'At least one category is required' });
    }

    if (!tags || tags.length === 0) {
      return res.status(400).json({ error: 'At least one tag is required' });
    }

    let blog = new Blog();
    blog.title = title;
    blog.body = body;
    blog.excerpt = smartTrim(body, 320, ' ', '...');
    blog.slug = slugify(title).toLowerCase();
    blog.mtitle = `${title} | ${process.env.APP_NAME}`;
    blog.mdesc = stripHtml(body.substring(0, 160));
    blog.postedBy = req.user._id;

    // categories and tags
    let arrayofCategories = categories && categories.split(',');
    let arrayofTags = tags && tags.split(',');
    blog.categories.push(...arrayofCategories);
    blog.tags.push(...arrayofTags);

    if (files.photo) {
      if (files.photo.size > 25000000) {
        return res
          .status(400)
          .json({ error: 'Image should be less than 2.5mb in size' });
      }

      blog.photo.data = fs.readFileSync(files.photo.path);
      blog.photo.contentType = files.photo.type;
    }

    try {
      const result = await blog.save();
      result.photo = undefined;
      return res.json(result);
      // return res.json({ message: 'New post successfully published' });
    } catch (err) {
      return res.status(400).json({ error: errorHandler(err) });
    }
  });
};

exports.listBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({})
      .populate('categories', '_id name slug')
      .populate('tags', '_id name slug')
      .populate('postedBy', '_id name username')
      .select(
        '_id title slug excerpt categories tags postedBy createdAt updatedAt'
      );

    return res.json(blogs);
  } catch (err) {
    console.log({ error: errorHandler(err) });
  }
};

exports.listAllBlogsCategoriesTags = async (req, res) => {
  let limit = req.body.limit ? parseInt(req.body.limit) : 10;
  let skip = req.body.skip ? parseInt(req.body.skip) : 0;

  try {
    const blogs = await Blog.find()
      .populate('categories', '_id name slug')
      .populate('tags', '_id name slug')
      .populate('postedBy', '_id name username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select(
        '_id title slug excerpt categories tags postedBy createdAt updatedAt'
      );

    const categories = await Category.find();
    const tags = await Tag.find();
    return res.json({ blogs, categories, tags, size: blogs.length });
  } catch (err) {
    console.log({ error: errorHandler(err) });
  }
};

exports.readBlog = async (req, res) => {
  const slug = req.params.slug.toLowerCase();

  try {
    const blog = await Blog.findOne({ slug })
      .populate('categories', '_id name slug')
      .populate('tags', '_id name slug')
      .populate('postedBy', '_id name username')
      .select(
        '_id title body slug mtitle mdesc categories tags postedBy createdAt updatedAt'
      );
    blog.photo = undefined;
    // console.log(blog);
    return res.json(blog);
  } catch (err) {
    console.log({ error: errorHandler(err) });
  }
};

exports.removeBlog = async (req, res) => {
  const slug = req.params.slug.toLowerCase();

  try {
    await Blog.findOneAndRemove({ slug });
    return res.json({ message: 'Blog deleted successfully' });
  } catch (err) {
    console.log({ error: errorHandler(err) });
  }
};

exports.updateBlog = async (req, res) => {
  const slug = req.params.slug.toLowerCase();

  try {
    let oldBlog = await Blog.findOne({ slug });

    let form = new formidable.IncomingForm();
    form.keepExtensions = true;

    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(400).json({
          error: 'Image could not be uploaded',
        });
      }

      let slugBeforeMerge = oldBlog.slug;
      oldBlog = _.merge(oldBlog, fields);
      oldBlog.slug = slugBeforeMerge;

      const { body, desc, categories, tags } = fields;

      if (body) {
        oldBlog.excerpt = smartTrim(body, 320, ' ', ' ...');
        oldBlog.desc = stripHtml(body.substring(0, 160));
      }

      if (categories) {
        oldBlog.categories = categories.split(',');
      }

      if (tags) {
        oldBlog.tags = tags.split(',');
      }

      if (files.photo) {
        if (files.photo.size > 10000000) {
          return res.status(400).json({
            error: 'Image should be less then 1mb in size',
          });
        }
        oldBlog.photo.data = fs.readFileSync(files.photo.path);
        oldBlog.photo.contentType = files.photo.type;
      }

      const result = await oldBlog.save();
      result.photo = undefined;
      return res.json(result);
    });
  } catch (err) {
    return res.status(400).json({ error: errorHandler(err) });
  }
};

exports.photo = async (req, res) => {
  const slug = req.params.slug.toLowerCase();
  try {
    const blog = await Blog.findOne({ slug }).select('photo');

    res.set('Content-Type', blog.photo.contentType);
    return res.send(blog.photo.data);
  } catch (err) {
    return res.status(400).json({ error: errorHandler(err) });
  }
};

exports.listRelated = async (req, res) => {
  let limit = req.body.limit ? parseInt(req.body.limit) : 4;
  const { _id, categories } = req.body.blog;

  try {
    const blogs = await Blog.find({
      _id: { $ne: _id },
      categories: { $in: categories },
    })
      .limit(limit)
      .populate('postedBy', '_id name username profile')
      .select('title slug excerpt postedBy createdAt updatedAt');
    return res.json(blogs);
  } catch (err) {
    return res.status(400).json({ error: 'Blogs not found' });
  }
};

exports.listSearch = async (req, res) => {
  const { search } = req.query;
  // console.log(req.query);
  if (search) {
    try {
      const blogs = await Blog.find({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { body: { $regex: search, $options: 'i' } },
        ],
      }).select('-photo -body');
      return res.json(blogs);
    } catch (err) {
      console.log(err);
      return res.status(400).json({ error: errorHandler(err) });
    }
  }
};

exports.listBlogsByUser = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status.json({ error: 'User not found' });
    }

    const blogs = await Blog.find({ postedBy: user._id })
      .populate('categories', '_id name slug')
      .populate('tags', '_id name slug')
      .populate('postedBy', '_id name username')
      .select('_id title slug postedBy createdAt updatedAt');

    res.json(blogs);
  } catch (err) {
    console.log(err);
    return res.status.json({ error: errorHandler(err) });
  }
};
