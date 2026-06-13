// server/controllers/dictionaryController.js
const IdReference = require('../models/IdReference');

exports.getIdReferences = async (req, res) => {
    try {
        const references = await IdReference.find();
        res.json(references);
    } catch (error) {
        res.status(500).json({ message: 'Помилка довідника ідентифікаторів', error: error.message });
    }
};