const Tag = require('../models/tag');
const Blog = require('../models/blog');
const { errorHandler } = require('../helpers/dbErrorHandler');
const slugify = require('slugify');

exports.createTag = async (req, res) => {
  const { name } = req.body;
  const slug = slugify(name).toLowerCase();
  try {
    const tag = new Tag({ name, slug });

    await tag.save();
    return res.json(tag);
  } catch (err) {
    return res.status(400).json({ error: errorHandler(err) });
  }
};

exports.listTags = async (req, res) => {
  try {
    const tags = await Tag.find();
    return res.json(tags);
  } catch (err) {
    return res.status(400).json({ error: errorHandler(err) });
  }
};

exports.readTag = async (req, res) => {
  const slug = req.params.slug.toLowerCase();
  try {
    const tag = await Tag.findOne({ slug });
    const blogs = await Blog.find({ tags: tag })
      .populate('categories', '_id name slug')
      .populate('tags', '_id name slug')
      .populate('postedBy', '_id name')
      .select(
        '_id title slug excerpt categories postedBy tags createdAt updatedAt'
      );
    res.json({ tag, blogs });
  } catch (err) {
    return res.status(400).json({ error: errorHandler(err) });
  }
};

exports.deleteTag = async (req, res) => {
  const slug = req.params.slug.toLowerCase();

  try {
    await Tag.findOneAndRemove({ slug });
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    return res.status(400).json({ error: errorHandler(err) });
  }
};
