const express = require('express');
const router = express.Router();
const { createCatalogue, getCatalogues, getCatalogueByToken } = require('../controllers/catalogueController');
const { protect } = require('../middlewares/auth');

router.route('/').post(protect, createCatalogue).get(protect, getCatalogues);
router.route('/link/:token').get(getCatalogueByToken);

module.exports = router;
