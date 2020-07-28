const Category = require('../models/category');
const Blog = require('../models/blog');
const { errorHandler } = require('../helpers/dbErrorHandler');
const slugify = require('slugify');

exports.createCategory = async (req, res) => {
  const { name } = req.body;
  const slug = slugify(name).toLowerCase();
  try {
    const category = new Category({ name, slug });

    await category.save();
    return res.json(category);
  } catch (err) {
    // console.log('Error creating category', err);
    return res.status(400).json({ error: errorHandler(err) });
  }
};

exports.listCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    return res.json(categories);
  } catch (err) {
    return res.status(400).json({ error: errorHandler(err) });
  }
};

exports.readCategory = async (req, res) => {
  const slug = req.params.slug.toLowerCase();
  try {
    const category = await Category.findOne({ slug });
    const blogs = await Blog.find({ categories: category })
      .populate('categories', '_id name slug')
      .populate('tags', '_id name slug')
      .populate('postedBy', '_id name')
      .select(
        '_id title slug excerpt categories postedBy tags createdAt updatedAt'
      );
    // console.log(blogs);
    res.json({ category, blogs });
  } catch (err) {
    return res.status(400).json({ error: errorHandler(err) });
  }
};

exports.deleteCategory = async (req, res) => {
  const slug = req.params.slug.toLowerCase();

  try {
    await Category.findOneAndRemove({ slug });
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    return res.status(400).json({ error: errorHandler(err) });
  }
};
