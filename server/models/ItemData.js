const mongoose = require('mongoose');
module.exports = mongoose.model('ItemData', new mongoose.Schema({}, { strict: false }));