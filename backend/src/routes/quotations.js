const express = require('express');
const { createQuotation, getQuotations, generatePDF } = require('../controllers/quotationController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.route('/')
  .post(protect, createQuotation)
  .get(protect, getQuotations);

router.route('/:id/generate-pdf')
  .post(protect, generatePDF);

module.exports = router;
