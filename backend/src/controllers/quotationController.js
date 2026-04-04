const quotationService = require('../services/quotationService');
const userService = require('../services/userService');
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

    const payload = {
      buyer: buyerId,
      products,
      totalAmount,
      createdBy: req.user._id
    };

    const createdQuotation = await quotationService.createQuotation(payload);
    res.status(201).json(createdQuotation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create public quotation from shared link
// @route   POST /api/quotations/public
// @access  Public
const createPublicQuotation = async (req, res) => {
  try {
    const { products, token, email, name, phone } = req.body;
    
    // 1. Verify token and get catalogue
    const catalogue = await require('../services/catalogueService').getCatalogueByToken(token);
    if (!catalogue) return res.status(404).json({ message: 'Invalid catalogue link' });

    // 2. Find or create a buyer user record for this email
    // We'll use a simplified flow: find user by email, if not exists, create a guest-role user
    let buyer = await userService.getByEmail(email);
    if (!buyer) {
      buyer = await userService.createUser({
        email,
        name: name || email.split('@')[0],
        phone: phone || '',
        role: 'buyer',
        password: crypto.randomBytes(8).toString('hex'), // Random password for guest
        assignedAdmin: catalogue.createdBy
      });
    }

    const payload = {
      buyer: buyer.id,
      products,
      totalAmount: products.reduce((acc, p) => acc + (p.quotedPrice * p.quantity), 0),
      createdBy: catalogue.createdBy, // The admin who created the catalogue
      status: 'pending'
    };

    const createdQuotation = await quotationService.createQuotation(payload);
    res.status(201).json(createdQuotation);
  } catch (error) {
    console.error('[createPublicQuotation] Error:', error);
    res.status(500).json({ message: error.message });
  }
};


// @desc    Get quotations
// @route   GET /api/quotations
// @access  Private
const getQuotations = async (req, res) => {
  try {
    const filters = {};
    
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      if (req.user.role === 'admin') {
        const assignedBuyers = await userService.getBuyersByAdmin(req.user._id);
        const buyerIds = assignedBuyers.map(b => b.id);
        filters.adminId = req.user._id;
        filters.buyerIdList = buyerIds;
      }
    } else {
      filters.buyerId = req.user._id;
    }

    const quotations = await quotationService.getQuotations(filters);
    
    // Populating buyer details (since service only returns IDs for efficiency in lists)
    // However, my service already returns products. I should handle buyer populating if needed.
    // For now, let's keep it simple and just return what service provides.
    // If frontend needs buyer details in the list, I should update the service or fetch them here.
    
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
    const quotation = await quotationService.getQuotationById(req.params.id);

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    // Data Isolation Check
    if (req.user.role === 'admin') {
      const assignedBuyers = await userService.getBuyersByAdmin(req.user._id);
      const buyerIds = assignedBuyers.map(b => b.id);
      
      const isCreator = String(quotation.createdBy) === String(req.user._id);
      const isAssignedBuyer = quotation.buyer && buyerIds.includes(String(quotation.buyer));
      
      if (!isCreator && !isAssignedBuyer) {
        return res.status(403).json({ message: 'Not authorized to access this quotation' });
      }
    }

    // Fetch buyer details for the PDF
    const buyer = await userService.getById(quotation.buyer);

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
    doc.fontSize(14).text(`Name: ${buyer?.name || 'Customer'}`);
    doc.fontSize(14).text(`Email: ${buyer?.email || 'N/A'}`);
    if (buyer?.companyName) {
      doc.fontSize(14).text(`Company: ${buyer.companyName}`);
    }
    doc.moveDown();

    doc.fontSize(16).text('Items:');
    
    quotation.products.forEach(item => {
      doc.fontSize(12).text(`${item.product?.name || 'Unknown Product'} - Qty: ${item.quantity} - Price: $${item.quotedPrice}`);
    });
    
    doc.moveDown();
    doc.fontSize(16).text(`Total Amount: $${quotation.totalAmount}`, { underline: true });

    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update quotation (Admin only)
// @route   PUT /api/quotations/:id
// @access  Private/Admin
const updateQuotation = async (req, res) => {
  try {
    const quotation = await quotationService.getQuotationById(req.params.id);
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });

    // Data Isolation Check
    if (req.user.role === 'admin') {
      const assignedBuyers = await userService.getBuyersByAdmin(req.user._id);
      const buyerIds = assignedBuyers.map(b => b.id);
      
      const isCreator = String(quotation.createdBy) === String(req.user._id);
      const isAssignedBuyer = quotation.buyer && buyerIds.includes(String(quotation.buyer.id || quotation.buyer));
      
      if (!isCreator && !isAssignedBuyer) {
        return res.status(403).json({ message: 'Not authorized to update or change status of this quotation' });
      }
    }

    const updatedQuotation = await quotationService.updateQuotation(req.params.id, req.body);
    res.json(updatedQuotation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update quotation status
// @route   PATCH /api/quotations/:id/status
// @access  Private/Admin
const updateQuotationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const quotation = await quotationService.getQuotationById(req.params.id);
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });

    // Data Isolation Check
    if (req.user.role === 'admin') {
      const assignedBuyers = await userService.getBuyersByAdmin(req.user._id);
      const buyerIds = assignedBuyers.map(b => b.id);
      
      const isCreator = String(quotation.createdBy) === String(req.user._id);
      const isAssignedBuyer = quotation.buyer && buyerIds.includes(String(quotation.buyer.id || quotation.buyer));
      
      console.log('[updateQuotationStatus] Admin Auth Check:', {
        quotationId: req.params.id,
        isCreator,
        isAssignedBuyer,
        statusToSet: status
      });

      if (!isCreator && !isAssignedBuyer) {
        return res.status(403).json({ message: 'Not authorized to update or change status of this quotation' });
      }
    }

    const updatedQuotation = await quotationService.updateQuotationStatus(req.params.id, status);
    res.json(updatedQuotation);
  } catch (error) {
    console.error('[updateQuotationStatus] Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Confirm quotation (Buyer)
// @route   PATCH /api/quotations/:id/confirm
// @access  Private/Buyer
const confirmQuotation = async (req, res) => {
  try {
    const quotation = await quotationService.getQuotationById(req.params.id);
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });

    const quotationBuyerId = quotation.buyer?._id || quotation.buyer?.id || quotation.buyer;
    
    console.log('[confirmQuotation] Checking auth:', {
      quotationId: req.params.id,
      quotationBuyerId,
      sessionUserId: req.user._id,
      match: String(quotationBuyerId) === String(req.user._id)
    });

    // Data Isolation Check: Only the assigned buyer can confirm
    if (String(quotationBuyerId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to confirm this quotation' });
    }

    const updatedQuotation = await quotationService.updateQuotationStatus(req.params.id, 'confirmed_by_buyer');
    res.json(updatedQuotation);
  } catch (error) {
    console.error('[confirmQuotation] Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject quotation (Buyer)
// @route   PATCH /api/quotations/:id/reject
// @access  Private/Buyer
const rejectQuotation = async (req, res) => {
  try {
    const quotation = await quotationService.getQuotationById(req.params.id);
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });

    const quotationBuyerId = quotation.buyer?._id || quotation.buyer?.id || quotation.buyer;

    console.log('[rejectQuotation] Checking auth:', {
      quotationId: req.params.id,
      quotationBuyerId,
      sessionUserId: req.user._id,
      match: String(quotationBuyerId) === String(req.user._id)
    });

    // Data Isolation Check: Only the assigned buyer can reject
    if (String(quotationBuyerId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to reject this quotation' });
    }

    const updatedQuotation = await quotationService.updateQuotationStatus(req.params.id, 'rejected_by_buyer');
    res.json(updatedQuotation);
  } catch (error) {
    console.error('[rejectQuotation] Error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createQuotation,
  createPublicQuotation,
  getQuotations,
  generatePDF,
  updateQuotation,
  updateQuotationStatus,
  confirmQuotation,
  rejectQuotation,
};
