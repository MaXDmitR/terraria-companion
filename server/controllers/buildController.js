
const ArmorSet = require('../models/ArmorSet');

exports.getSets = async (req, res) => {
    try {
        const sets = await ArmorSet.find();
        res.json(sets);
    } catch (error) {
        res.status(500).json({ message: 'Помилка отримання сетів броні', error: error.message });
    }
};