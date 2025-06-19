const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:admin123@mongo:27017/';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));
