const express = require('express');
const router = express.Router();
const { createCatalogue, getCatalogues, getCatalogueByToken, updateCatalogue, deleteCatalogue, copyCatalogue } = require('../controllers/catalogueController');
const { protect, admin } = require('../middlewares/auth');

router.route('/').post(protect, createCatalogue).get(protect, getCatalogues);
router.route('/:id')
  .put(protect, admin, updateCatalogue)
  .delete(protect, admin, deleteCatalogue);
router.route('/:id/copy').post(protect, admin, copyCatalogue);
router.route('/link/:token').get(getCatalogueByToken).post(getCatalogueByToken);

module.exports = router;
