const mongoose = require('mongoose');
require('dotenv').config();
const Catalogue = require('./src/models/Catalogue');
async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const cat = await Catalogue.findOne();
    if (!cat) return console.log('No catalogue');
    cat.linkSettings = { requireEmail: true, requirePhone: false, expiresOn: null, passcodeProtect: false, passcode: '' };
    await cat.save();
    console.log('Update success');
  } catch (e) {
    console.error('Save error:', e.message, e.stack);
  }
  process.exit();
}
run();
