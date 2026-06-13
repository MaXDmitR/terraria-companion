const mongoose = require('mongoose');
module.exports = mongoose.model('IdReference', new mongoose.Schema({}, { strict: false }));