const express = require('express');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getRecommendations,
  bulkImportProducts,
  bulkDeleteProducts,
} = require('../controllers/productController');
const { protect, admin } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const router = express.Router();

router.route('/')
  .get(protect, getProducts)
  .post(protect, admin, upload.any(), createProduct);

router.route('/recommendations/:categoryId')
  .get(protect, getRecommendations);

router.route('/bulk-import')
  .post(protect, admin, bulkImportProducts);

router.route('/bulk-delete')
  .post(protect, admin, bulkDeleteProducts);

router.route('/:id')
  .get(protect, getProductById)
  .put(protect, admin, upload.any(), updateProduct)
  .delete(protect, admin, deleteProduct);

module.exports = router;
