// server/controllers/craftingController.js
const Recipe = require('../models/Recipe');
const IdReference = require('../models/IdReference');


exports.getRecipes = async (req, res) => {
    try {
        const recipes = await Recipe.find();
        res.json(recipes);
    } catch (error) {
        res.status(500).json({ message: 'Помилка отримання рецептів', error: error.message });
    }
};

exports.getCraftTree = async (req, res) => {
    try {
        const { itemId } = req.params;

       
        const allRecipes = await Recipe.find();
        const allItems = await IdReference.find();
        
       
        const itemsDictionary = {};
        allItems.forEach(item => {
            const id = String(item["Item ID"] || item["ID"] || item["id"]).trim();
            const name = String(item["Name"] || item["name"]).trim();
            if (id && name) itemsDictionary[id] = name;
        });

       
        function buildTree(currentId, quantity = 1, visited = new Set()) {
            const safeId = String(currentId).trim();
            const name = itemsDictionary[safeId] || `Невідомий предмет (${safeId})`;
            
            const node = {
                id: safeId,
                name: name,
                quantity: quantity,
                children: []
            };

            if (visited.has(safeId)) {
                node.cycle = true;
                return node;
            }

            const newVisited = new Set(visited);
            newVisited.add(safeId);

           
            const recipe = allRecipes.find(r => String(r["Result ID"]).trim() === safeId);
            
            if (recipe && recipe["Recipe"]) {
                recipe["Recipe"].forEach(ing => {
                    const childNode = buildTree(ing["Ingredient ID"], ing["Quantity"], newVisited);
                    node.children.push(childNode);
                });
            }

            return node;
        }

        const fullCraftTree = buildTree(itemId, 1);
        res.json(fullCraftTree);

    } catch (error) {
        res.status(500).json({ message: 'Помилка генерації дерева крафту', error: error.message });
    }
};