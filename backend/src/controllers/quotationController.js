const Quotation = require('../models/Quotation');
const PDFDocument = require('pdfkit');

// @desc    Create new quotation
// @route   POST /api/quotations
// @access  Private (Buyer or Admin)
const createQuotation = async (req, res) => {
  try {
    const { products, totalAmount } = req.body;
    
    // Default to req.user._id if it's a buyer creating their own quote. 
    // If admin, it could come from req.body.buyerId.
    const buyerId = req.body.buyerId || req.user._id;

    const quotation = new Quotation({
      buyer: buyerId,
      products,
      totalAmount,
    });

    const createdQuotation = await quotation.save();
    res.status(201).json(createdQuotation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get quotations
// @route   GET /api/quotations
// @access  Private
const getQuotations = async (req, res) => {
  try {
    let quotations;
    if (req.user.role === 'admin') {
      quotations = await Quotation.find().populate('buyer', 'name email').populate('products.product', 'name');
    } else {
      quotations = await Quotation.find({ buyer: req.user._id }).populate('products.product', 'name');
    }
    res.json(quotations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate PDF for Quotation
// @route   POST /api/quotations/:id/generate-pdf
// @access  Private
const generatePDF = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('buyer', 'name email companyDetails')
      .populate('products.product', 'name basePrice');

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=quotation-${quotation._id}.pdf`);

    // Create a document
    const doc = new PDFDocument();
    doc.pipe(res);

    doc.fontSize(25).text('B2B Furniture Quotation', { align: 'center' });
    doc.moveDown();

    doc.fontSize(16).text(`Quote ID: ${quotation._id}`);
    doc.fontSize(14).text(`Date: ${new Date(quotation.createdAt).toLocaleDateString()}`);
    doc.moveDown();

    doc.fontSize(16).text('Bill To:');
    doc.fontSize(14).text(`Name: ${quotation.buyer.name}`);
    doc.fontSize(14).text(`Email: ${quotation.buyer.email}`);
    if (quotation.buyer.companyDetails && quotation.buyer.companyDetails.name) {
      doc.fontSize(14).text(`Company: ${quotation.buyer.companyDetails.name}`);
    }
    doc.moveDown();

    doc.fontSize(16).text('Items:');
    let yPosition = doc.y;
    
    quotation.products.forEach(item => {
      doc.fontSize(12).text(`${item.product?.name || 'Unknown Product'} - Qty: ${item.quantity} - Price: $${item.quotedPrice}`);
    });
    
    doc.moveDown();
    doc.fontSize(16).text(`Total Amount: $${quotation.totalAmount}`, { underline: true });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createQuotation,
  getQuotations,
  generatePDF,
};
