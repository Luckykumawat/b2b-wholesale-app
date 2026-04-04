const express = require('express');
const { createQuotation, createPublicQuotation, getQuotations, generatePDF, updateQuotation, updateQuotationStatus, confirmQuotation, rejectQuotation } = require('../controllers/quotationController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.route('/')
  .post(protect, createQuotation)
  .get(protect, getQuotations);

router.post('/public', createPublicQuotation);

router.route('/:id')
  .put(protect, updateQuotation);

router.route('/:id/status')
  .patch(protect, updateQuotationStatus);

router.route('/:id/confirm')
  .patch(protect, confirmQuotation);

router.route('/:id/reject')
  .patch(protect, rejectQuotation);

router.route('/:id/generate-pdf')
  .get(protect, generatePDF)
  .post(protect, generatePDF);

module.exports = router;
