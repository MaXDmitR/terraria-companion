const ItemData = require('../models/ItemData');

exports.getItemsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const items = await ItemData.find({ category: category });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: 'Помилка каталогу предметів', error: error.message });
    }
};