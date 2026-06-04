const dotenv = require('dotenv');
const mongoose = require('mongoose');
dotenv.config();

let db;

// Attempt MongoDB Connection if URI is provided
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Database initialized: Successfully connected to MongoDB Atlas.'))
    .catch(err => {
      console.error('MongoDB connection error:', err.message);
      console.log('WARNING: Mongoose models are loaded, but connection failed.');
    });

  db = {
    User: require('../models/User'),
    Employee: require('../models/Employee'),
    Event: require('../models/Event'),
    EmployeeLedger: require('../models/EmployeeLedger'),
    Expense: require('../models/Expense'),
    Settings: require('../models/Settings'),
    Bill: require('../models/Bill'),
    Quotation: require('../models/Quotation')
  };
} else {
  console.log('Database initialized: Using local JSON database storage (dbFallback).');
  db = require('./dbFallback');
}

module.exports = db;
