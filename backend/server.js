const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const chalk = require('chalk');
require('dotenv').config();

const { connect } = require('./db/dbConnection');
const blogRoutes = require('./routes/blog');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const categoryRoutes = require('./routes/category');
const tagRoutes = require('./routes/tag');
const formRoutes = require('./routes/form');

// connect mongodb
connect();

const app = express();

app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

if (process.env.NODE_ENV === 'development') {
  app.use(cors({ origin: `${process.env.CLIENT_URL}` }));
}

// use routers
app.use('/api', blogRoutes);
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', categoryRoutes);
app.use('/api', tagRoutes);
app.use('/api', formRoutes);

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(chalk.blue.inverse(`Server is up on port ${port}`));
});
