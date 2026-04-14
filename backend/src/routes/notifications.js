const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { getNotifications, markAsRead } = require('../controllers/notificationController');

// All notification routes are protected (must be logged in)
router.use(protect);

router.route('/')
  .get(getNotifications);

router.route('/read')
  .patch(markAsRead);

module.exports = router;
