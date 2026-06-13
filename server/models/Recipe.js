const mongoose = require('mongoose');
module.exports = mongoose.model('Recipe', new mongoose.Schema({}, { strict: false }));