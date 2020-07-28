const shortId = require('shortid');
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');
const _ = require('lodash');
const { OAuth2Client } = require('google-auth-library');

const User = require('../models/user');
const Blog = require('../models/blog');
const { errorHandler } = require('../helpers/dbErrorHandler');

// sendgrid
const sgMail = require('@sendgrid/mail');
// SENDGRID_API_KEY
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.preSignup = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      return res.status(400).json({
        error: 'Email is taken',
      });
    }
    const token = jwt.sign(
      { name, email, password },
      process.env.JWT_ACCOUNT_ACTIVATION,
      { expiresIn: '10m' }
    );

    const emailData = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Account activation link`,
      html: `
          <p>Please use the following link to activate your acccount:</p>
          <p>${process.env.CLIENT_URL}/auth/account/activate/${token}</p>
          <hr />
          <p>This email may contain sensetive information</p>
          <p>https://kblog.com</p>
      `,
    };

    sgMail.send(emailData).then((sent) => {
      return res.json({
        message: `Email has been sent to ${email}. Follow the instructions to activate your account.`,
      });
    });
  } catch (err) {
    console.log(err);
  }
};

// sign up a new user
/* exports.signup = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      return res.status(400).json({ error: 'Email is taken.' });
    }

    const { name, email, password } = req.body;
    const username = shortId.generate();
    const profile = `${process.env.CLIENT_URL}/profile/${username}`;

    const newUSer = new User({ name, email, password, profile, username });
    await newUSer.save();
    return res.json({ message: 'Signup success! Please signin.' });
  } catch (err) {
    console.log('Error: signup failed', err);
    return res.status(400).json({ error: err });
  }
}; */

exports.signup = (req, res) => {
  const token = req.body.token;
  if (token) {
    jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION, async function (
      err,
      decoded
    ) {
      if (err) {
        return res.status(401).json({
          error: 'Expired link. Signup again',
        });
      }

      const { name, email, password } = jwt.decode(token);

      let username = shortId.generate();
      let profile = `${process.env.CLIENT_URL}/profile/${username}`;

      const user = new User({ name, email, password, profile, username });

      try {
        await user.save();

        return res.json({
          message: 'Singup success! Please signin',
        });
      } catch (err) {
        return res.status(401).json({
          error: errorHandler(err),
        });
      }
    });
  } else {
    return res.json({
      message: 'Something went wrong. Try again',
    });
  }
};

// sign in existing user
exports.signin = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(400).json({ error: 'Incorrect credentials' });
    }

    if (!user.authenticate(req.body.password)) {
      return res.status(400).json({ error: 'Incorrect credentials' });
    }
    const token = jwt.sign({ _id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.cookie('token', token, { expiresIn: '1d' });
    const { _id, username, name, email, role } = user;
    return res.json({ token, user: { _id, username, name, email, role } });
  } catch (err) {
    console.log('Error: signup failed', err);
    return res.status(400).json({ error: err });
  }
};

// signout logged in user
exports.signout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Signout successfully' });
};

exports.requireSignin = expressJwt({
  secret: process.env.JWT_SECRET,
});

exports.authMiddleware = async (req, res, next) => {
  const authUserId = req.user._id;
  try {
    const user = await User.findById({ _id: authUserId });
    req.profile = user;

    next();
  } catch (err) {
    console.log('authMiddleware Error', err);
    return res.status(400).json({ error: 'User not found' });
  }
};

exports.adminMiddleware = async (req, res, next) => {
  const adminId = req.user._id;
  try {
    const user = await User.findById({ _id: adminId });
    if (user.role !== 1) {
      return res.status(400).json({ error: 'Admin resource. Access denied.' });
    }

    req.profile = user;
    next();
  } catch (err) {
    console.log('adminMiddleware Error', err);
    return res.status(400).json({ error: 'User not found' });
  }
};

exports.canUpdateDeleteBlog = async (req, res, next) => {
  const slug = req.params.slug.toLowerCase();

  try {
    const blog = await Blog.findOne({ slug });

    let authorizedUser =
      blog.postedBy._id.toString() === req.profile._id.toString();

    if (!authorizedUser) {
      return res.status(400).json({ error: 'You are not authorized' });
    }

    next();
  } catch (err) {
    console.log(err);
    return res.status(400).json({ error: errorHandler(err) });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        error: 'User with that email does not exist',
      });
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_RESET_PASSWORD, {
      expiresIn: '10m',
    });

    // email
    const emailData = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Password reset link`,
      html: `
          <p>Please use the following link to reset your password:</p>
          <p>${process.env.CLIENT_URL}/auth/password/reset/${token}</p>
          <hr />
          <p>This email may contain sensetive information</p>
          <p>https://kblog.com</p>
      `,
    };

    // populating the db > user > resetPasswordLink
    await user.updateOne({ resetPasswordLink: token });
    sgMail.send(emailData).then((sent) => {
      return res.json({
        message: `Email has been sent to ${email}. Follow the instructions to reset your password. Link expires in 10min.`,
      });
    });
  } catch (err) {
    console.log(err);
  }
};

exports.resetPassword = (req, res) => {
  const { resetPasswordLink, newPassword } = req.body;

  if (resetPasswordLink) {
    jwt.verify(
      resetPasswordLink,
      process.env.JWT_RESET_PASSWORD,
      async function (err, decoded) {
        if (err) {
          return res.status(401).json({
            error: 'Expired link. Try again',
          });
        }

        try {
          const user = await User.findOne({ resetPasswordLink });
          if (!user) {
            return res.status(401).json({
              error: 'Something went wrong. Try later',
            });
          }

          const updatedFields = {
            password: newPassword,
            resetPasswordLink: '',
          };

          user = _.extend(user, updatedFields);

          await user.save();

          return res.json({
            message: `Great! Now you can login with your new password`,
          });
        } catch (err) {
          console.log(err);
          return res.status(400).json({
            error: errorHandler(err),
          });
        }
      }
    );
  }
};

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
exports.googleLogin = (req, res) => {
  const idToken = req.body.tokenId;
  client
    .verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID })
    .then((response) => {
      // console.log(response)
      const { email_verified, name, email, jti } = response.payload;
      if (email_verified) {
        User.findOne({ email }).exec((err, user) => {
          if (user) {
            // console.log(user)
            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
              expiresIn: '1d',
            });
            res.cookie('token', token, { expiresIn: '1d' });
            const { _id, email, name, role, username } = user;
            return res.json({
              token,
              user: { _id, email, name, role, username },
            });
          } else {
            let username = shortId.generate();
            let profile = `${process.env.CLIENT_URL}/profile/${username}`;
            let password = jti;
            user = new User({ name, email, profile, username, password });
            user.save((err, data) => {
              if (err) {
                return res.status(400).json({
                  error: errorHandler(err),
                });
              }
              const token = jwt.sign(
                { _id: data._id },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
              );
              res.cookie('token', token, { expiresIn: '1d' });
              const { _id, email, name, role, username } = data;
              return res.json({
                token,
                user: { _id, email, name, role, username },
              });
            });
          }
        });
      } else {
        return res.status(400).json({
          error: 'Google login failed. Try again.',
        });
      }
    });
};
