const mongoose = require('mongoose');
module.exports = mongoose.model('ArmorSet', new mongoose.Schema({}, { strict: false }));