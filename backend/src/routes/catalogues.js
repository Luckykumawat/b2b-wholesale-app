const express = require('express');
const router = express.Router();
const { createCatalogue, getCatalogues, getCatalogueByToken, updateCatalogue, deleteCatalogue } = require('../controllers/catalogueController');
const { protect, admin } = require('../middlewares/auth');

router.route('/').post(protect, createCatalogue).get(protect, getCatalogues);
router.route('/:id')
  .put(protect, admin, updateCatalogue)
  .delete(protect, admin, deleteCatalogue);
router.route('/link/:token').get(getCatalogueByToken);

module.exports = router;
