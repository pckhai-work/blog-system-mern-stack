const { check } = require('express-validator');

exports.categoryCreateValidator = [
  check('name').notEmpty().withMessage('Name is required'),
];
