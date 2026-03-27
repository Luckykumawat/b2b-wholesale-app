const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars from the backend folder
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const User = require('../backend/src/models/User');
const Product = require('../backend/src/models/Product');
const Catalogue = require('../backend/src/models/Catalogue');
const Order = require('../backend/src/models/Order');
const Quotation = require('../backend/src/models/Quotation');

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const firstAdmin = await User.findOne({ role: 'admin' });
    if (!firstAdmin) {
      console.log('No admin user found to assign data to. Please create one first.');
      process.exit(1);
    }

    console.log(`Assigning legacy data to admin: ${firstAdmin.email} (${firstAdmin._id})`);

    const pResult = await Product.updateMany({ createdBy: { $exists: false } }, { createdBy: firstAdmin._id });
    console.log(`Updated ${pResult.modifiedCount} products`);

    const cResult = await Catalogue.updateMany({ createdBy: { $exists: false } }, { createdBy: firstAdmin._id });
    console.log(`Updated ${cResult.modifiedCount} catalogues`);

    const oResult = await Order.updateMany({ createdBy: { $exists: false } }, { createdBy: firstAdmin._id });
    console.log(`Updated ${oResult.modifiedCount} orders`);

    const qResult = await Quotation.updateMany({ createdBy: { $exists: false } }, { createdBy: firstAdmin._id });
    console.log(`Updated ${qResult.modifiedCount} quotations`);

    // Assign buyers to admin too
    const bResult = await User.updateMany({ role: 'buyer', assignedAdmin: { $exists: false } }, { assignedAdmin: firstAdmin._id });
    console.log(`Updated ${bResult.modifiedCount} buyers`);

    console.log('Migration complete');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
