const mongoose = require('mongoose');
require('dotenv').config();
const Catalogue = require('./src/models/Catalogue');
async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const cat = await Catalogue.findOne();
    if (!cat) return console.log('No catalogue');
    cat.linkSettings = { requireEmail: true };
    await cat.save();
    console.log('Catalogue updated successfully');
  } catch (e) {
    console.error('Save error:', e);
  }
  process.exit();
}
run();
