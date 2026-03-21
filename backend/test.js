require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const p = await Product.findOne({});
    if(!p) {
       console.log("No product in DB");
       process.exit(0);
    }
    console.log("Found product:", p._id);
    try {
        const prevProduct = await Product.findOne({ createdAt: { $lt: p.createdAt } }).sort({ createdAt: -1 }).select('_id');
        console.log("prevProduct:", prevProduct);
    } catch(e) {
        console.log("ERROR on prevProduct:", e.message);
    }
    process.exit(0);
});
