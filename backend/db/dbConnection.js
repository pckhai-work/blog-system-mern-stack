const mongoose = require('mongoose');
const chalk = require('chalk');

exports.connect = async (uri = process.env.DB_URI) => {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: true,
    });
    console.log(chalk.blueBright.inverse('MongoDb Connected successfully!!!'));
  } catch (error) {
    console.log(chalk.red.inverse('Database connection failed'), error);
  }
};
