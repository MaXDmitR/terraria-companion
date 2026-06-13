const express = require('express');
const router = express.Router();

const itemController = require('../controllers/itemController');
router.get('/items/:category', itemController.getItemsByCategory);


const buildController = require('../controllers/buildController');
router.get('/id_references/set.json', buildController.getSets);

const dictionaryController = require('../controllers/dictionaryController');
router.get('/id_references/items.json', dictionaryController.getIdReferences);

const craftingController = require('../controllers/craftingController');
router.get('/id_references/recipes.json', craftingController.getRecipes);
router.get('/crafting/tree/:itemId', craftingController.getCraftTree); 


module.exports = router;