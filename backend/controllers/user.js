const _ = require('lodash');
const formidable = require('formidable');
const fs = require('fs');

const User = require('../models/user');
const Blog = require('../models/blog');
const { errorHandler } = require('../helpers/dbErrorHandler');

// read user profile
exports.read = (req, res) => {
  req.profile.hashed_password = undefined;
  return res.json(req.profile);
};

exports.publicProfile = async (req, res) => {
  const username = req.params.username;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const blogs = await Blog.find({ postedBy: user._id })
      .populate('categories', '_id name slug')
      .populate('tags', '_id name slug')
      .populate('postedBy', '_id name')
      .limit(10)
      .select(
        '_id title slug excerpt categories tags postedBy createdAt updatedAt'
      );

    if (!blogs) {
      return res.status(400).json({ error: errorHandler(err) });
    }

    user.photo = undefined;
    user.hashed_password = undefined;
    user.salt = undefined;

    return res.json({ user, blogs });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ error: 'User not found' });
  }
};

exports.updateUser = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: 'Photo could not be uploaded' });
    }

    let user = req.profile;
    user = _.extend(user, fields);

    if (fields.password && fields.password.length < 6) {
      return res
        .status(400)
        .json({ error: 'Password should be min 6 characters long' });
    }

    if (files.photo) {
      if (files.photo.size > 2500000) {
        return res
          .status(400)
          .json({ error: 'Image should be less than 2.5 mb in size' });
      }

      user.photo.data = fs.readFileSync(files.photo.path);
      user.photo.contentType = files.photo.type;
    }

    try {
      await user.save();

      user.hashed_password = undefined;
      user.salt = undefined;
      user.photo = undefined;

      res.json(user);
    } catch (err) {
      console.log(err);
      return res.status(400).json({ error: errorHandler(err) });
    }
  });
};

exports.photo = async (req, res) => {
  const username = req.params.username;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'user not found' });
    }

    if (user.photo.data) {
      res.set('Content-Type', user.photo.contentType);
      return res.send(user.photo.data);
    }
  } catch (err) {
    console.log(err);
  }
};
