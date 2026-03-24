const express = require('express');
const router = express.Router();
const { createCatalogue, getCatalogues, getCatalogueByToken, updateCatalogue } = require('../controllers/catalogueController');
const { protect } = require('../middlewares/auth');

router.route('/').post(protect, createCatalogue).get(protect, getCatalogues);
router.route('/:id').put(protect, updateCatalogue);
router.route('/link/:token').get(getCatalogueByToken);

module.exports = router;
