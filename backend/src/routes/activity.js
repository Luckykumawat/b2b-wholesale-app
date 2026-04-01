const express = require('express');
const { getActivityLogs, createActivityLog } = require('../controllers/activityController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.route('/')
  .get(protect, getActivityLogs)
  .post(protect, createActivityLog);

module.exports = router;
