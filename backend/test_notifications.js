const mongoose = require('mongoose');
const Notification = require('./src/models/Notification');
require('dotenv').config();

async function checkNotifications() {
  await mongoose.connect(process.env.MONGO_URI);
  const n = await Notification.find();
  console.log('Total notifications:', n.length);
  if (n.length > 0) {
    console.log(n[0]);
  }
  process.exit();
}
checkNotifications();
