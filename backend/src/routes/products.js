const express = require('express');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getRecommendations
} = require('../controllers/productController');
const { protect, admin } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const router = express.Router();

router.route('/')
  .get(protect, getProducts)
  .post(protect, admin, upload.array('images', 5), createProduct);

router.route('/recommendations/:categoryId')
  .get(protect, getRecommendations);

router.route('/:id')
  .get(protect, getProductById)
  .put(protect, admin, upload.array('images', 5), updateProduct)
  .delete(protect, admin, deleteProduct);

module.exports = router;
