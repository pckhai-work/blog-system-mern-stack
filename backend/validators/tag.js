const { check } = require('express-validator');

exports.tagCreateValidator = [
  check('name').notEmpty().withMessage('Name is required'),
];
