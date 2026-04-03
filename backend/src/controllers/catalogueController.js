const Catalogue = require('../models/Catalogue');
const crypto = require('crypto');
const { logActivity } = require('./activityController');

// @desc    Create a new catalogue
// @route   POST /api/catalogues
// @access  Private
const createCatalogue = async (req, res) => {
  try {
    const { buyerCompany, buyerEmail, name, products, customColumns } = req.body;
    
    // Generate unique link token
    const linkToken = crypto.randomBytes(4).toString('hex');

    if (req.user && req.user.role === 'admin') {
      const planLimits = { free: 3, base: 5, premium: 7, gold: Infinity };
      const userPlan = req.user.plan || 'free';
      const limit = planLimits[userPlan];
      
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const currentCount = await Catalogue.countDocuments({ 
        createdBy: req.user._id, 
        createdAt: { $gte: startOfMonth }
      });

      if (currentCount >= limit) {
        return res.status(403).json({ message: `Monthly limit reached. Your ${userPlan} plan allows a maximum of ${limit} catalogues per month.` });
      }
    }

    let payload = {
      buyerCompany,
      buyerEmail,
      name,
      products,
      customColumns,
      linkToken,
      createdBy: req.user?._id
    };

    if (req.user && req.user.role === 'buyer') {
      payload.buyerCompany = req.user.companyName || req.user.name || 'Buyer';
      payload.buyerEmail = req.user.email;
      if (Array.isArray(payload.customColumns)) {
        payload.customColumns = payload.customColumns.filter(c => c !== 'Selling Price' && c !== 'Base Price');
      } else {
        payload.customColumns = ['Image', 'Product ID', 'Category', 'Material', 'Size (CM)', 'Product Name'];
      }
    }

    const catalogue = await Catalogue.create(payload);

    await logActivity(req.user._id, 'catalogue_create', `Created catalogue: ${catalogue.name} for ${catalogue.buyerCompany || 'N/A'}`, { catalogueId: catalogue._id });
    res.status(201).json(catalogue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all catalogues
// @route   GET /api/catalogues
// @access  Private
const getCatalogues = async (req, res) => {
  try {
    const { buyer, user, status, createdOn, sortBy, search } = req.query;
    let query = {};

    // Data Isolation
    if (req.user.role === 'admin') {
      const User = require('../models/User');
      const assignedBuyers = await User.find({ assignedAdmin: req.user._id }).select('_id');
      const buyerIds = assignedBuyers.map(b => b._id);
      
      query.$or = [
        { createdBy: req.user._id },
        { createdBy: { $in: buyerIds } }
      ];
    } else if (req.user.role === 'buyer') {
      query.$or = [
        { createdBy: req.user.assignedAdmin },
        { createdBy: req.user._id }
      ];
    }
    // superadmin sees all, so no query restriction

    // Buyer Filter (Multi-select)
    if (buyer) {
      const buyers = Array.isArray(buyer) ? buyer : [buyer];
      query.buyerCompany = { $in: buyers };
    }

    // User/Creator Filter (Multi-select)
    if (user) {
      const users = Array.isArray(user) ? user : [user];
      // Check if they look like ObjectIDs
      const isObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
      
      if (users.every(isObjectId)) {
        query.createdBy = { $in: users };
      } else {
        // Filter by name using aggregation or by finding user IDs first
        const User = require('../models/User');
        const userDocs = await User.find({ name: { $in: users } }).select('_id');
        const userIds = userDocs.map(u => u._id);
        query.createdBy = { $in: userIds };
      }
    }

    // Status Filter (Single-select)
    if (status && status !== 'All') {
      // Expecting status labels like "Active (2)" or just "Active"
      const statusValue = status.split(' ')[0];
      if (['Draft', 'Active', 'Inactive'].includes(statusValue)) {
        query.status = statusValue;
      }
    }

    // Created On (Time Ranges)
    if (createdOn && createdOn !== 'All Time') {
      const now = new Date();
      let startDate = new Date();
      
      switch (createdOn) {
        case 'Today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'Yesterday':
          startDate.setDate(startDate.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          const endDateY = new Date(startDate);
          endDateY.setHours(23, 59, 59, 999);
          query.createdAt = { $gte: startDate, $lte: endDateY };
          break;
        case 'This Week':
          startDate.setDate(now.getDate() - now.getDay());
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'Past week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'This month':
          startDate.setMonth(now.getMonth(), 1);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'Past month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'Past 6 months':
          startDate.setMonth(now.getMonth() - 6);
          break;
        case 'This Year':
          startDate.setMonth(0, 1);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'Last Years':
          startDate.setFullYear(now.getFullYear() - 1, 0, 1);
          break;
        case 'Last 2 Years':
          startDate.setFullYear(now.getFullYear() - 2, 0, 1);
          break;
      }
      
      if (createdOn !== 'Yesterday') {
        query.createdAt = { $gte: startDate };
      }
    }

    // Search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { buyerCompany: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort Logic
    let sortOptions = { createdAt: -1 };
    if (sortBy) {
      const sortLower = sortBy.toLowerCase();
      switch (sortLower) {
        case 'recently access':
          sortOptions = { lastAccessed: -1 };
          break;
        case 'recently created':
          sortOptions = { createdAt: -1 };
          break;
        case 'name of buyer':
          sortOptions = { buyerCompany: 1 };
          break;
      }
    }

    const catalogues = await Catalogue.find(query)
      .sort(sortOptions)
      .populate('createdBy', 'name email')
      .populate('products');

    // Get Counts for Statuses (based on current filters except status itself)
    const countQuery = { ...query };
    delete countQuery.status;

    const allFilteredCatalogues = await Catalogue.find(countQuery);
    const counts = {
      Total: allFilteredCatalogues.length,
      Draft: allFilteredCatalogues.filter(c => c.status === 'Draft').length,
      Active: allFilteredCatalogues.filter(c => c.status === 'Active').length,
      Inactive: allFilteredCatalogues.filter(c => c.status === 'Inactive').length,
    };

    res.json({ catalogues, counts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get catalogue by link token
// @route   GET /api/catalogues/link/:token
// @access  Public
const getCatalogueByToken = async (req, res) => {
  try {
    const catalogue = await Catalogue.findOne({ linkToken: req.params.token })
      .populate('createdBy', 'name email')
      .populate('products');

    if (!catalogue) {
      return res.status(404).json({ message: 'Catalogue not found' });
    }

    if (catalogue.status === 'Inactive') {
      return res.status(403).json({ message: 'This catalogue is currently inactive.' });
    }

    if (catalogue.linkSettings && catalogue.linkSettings.expiresOn) {
      if (new Date() > new Date(catalogue.linkSettings.expiresOn)) {
        return res.status(403).json({ message: 'This catalogue link has expired.' });
      }
    }

    const { linkSettings } = catalogue;

    // Check passcode protection
    if (linkSettings && linkSettings.passcodeProtect) {
      const providedPasscode = req.body && req.body.passcode;
      if (!providedPasscode || providedPasscode !== linkSettings.passcode) {
         return res.status(401).json({ 
           requirePasscode: true, 
           message: providedPasscode ? 'Incorrect passcode.' : 'Passcode required to view this catalogue.',
           name: catalogue.name
         });
      }
    }

    // Check Email protection
    if (linkSettings && linkSettings.requireEmail) {
      const providedEmail = req.body && req.body.email;
      if (!providedEmail) {
         return res.status(401).json({
            requireEmail: true,
            requireEmailOTP: linkSettings.requireEmailOTP,
            message: 'Email verification required.',
            name: catalogue.name
         });
      }
      if (linkSettings.emailAccessListMode === 'allow' && !linkSettings.emailAccessList.includes(providedEmail)) {
         return res.status(403).json({ message: 'Your email is not authorized to view this catalogue.' });
      }
      if (linkSettings.emailAccessListMode === 'block' && linkSettings.emailAccessList.includes(providedEmail)) {
         return res.status(403).json({ message: 'Your email has been blocked from viewing this catalogue.' });
      }
      
      // If OTP is required and wasn't provided/matched
      if (linkSettings.requireEmailOTP && (!req.body.otp || req.body.otp !== '123456')) { // Hardcoded OTP for demo simulation
         if (!req.body.requestOTP) {
            return res.status(401).json({
              requireEmail: true,
              requireEmailOTP: true,
              message: 'OTP Sent.',
              name: catalogue.name
            });
         }
      }
    }

    // Check Phone protection
    if (linkSettings && linkSettings.requirePhone) {
      const providedPhone = req.body && req.body.phone;
      if (!providedPhone) {
         return res.status(401).json({
            requirePhone: true,
            requirePhoneOTP: linkSettings.requirePhoneOTP,
            message: 'Phone verification required.',
            name: catalogue.name
         });
      }
    }
    
    // Update lastAccessed
    catalogue.lastAccessed = new Date();
    await catalogue.save();
    
    res.json(catalogue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a catalogue
// @route   PUT /api/catalogues/:id
// @access  Private
const updateCatalogue = async (req, res) => {
  try {
    const catalogue = await Catalogue.findById(req.params.id);
    if (!catalogue) return res.status(404).json({ message: 'Catalogue not found' });

    // Data Isolation Check
    if (req.user.role === 'admin' && catalogue.createdBy && !catalogue.createdBy.equals(req.user._id)) {
      const User = require('../models/User');
      const creator = await User.findById(catalogue.createdBy);
      if (!creator || !creator.assignedAdmin || !creator.assignedAdmin.equals(req.user._id)) {
        return res.status(403).json({ message: 'Not authorized to update this catalogue' });
      }
    }

    const { buyerCompany, buyerEmail, name, products, customColumns, linkSettings } = req.body;
    
    if (buyerCompany) catalogue.buyerCompany = buyerCompany;
    if (buyerEmail !== undefined) catalogue.buyerEmail = buyerEmail;
    if (name) catalogue.name = name;
    if (products) catalogue.products = products;
    if (customColumns) catalogue.customColumns = customColumns;
    if (linkSettings) catalogue.linkSettings = linkSettings;

    const updatedCatalogue = await catalogue.save();
    res.json(updatedCatalogue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a catalogue
// @route   DELETE /api/catalogues/:id
// @access  Private
const deleteCatalogue = async (req, res) => {
  try {
    const catalogue = await Catalogue.findById(req.params.id);
    if (!catalogue) return res.status(404).json({ message: 'Catalogue not found' });

    // Data Isolation Check
    if (req.user.role === 'admin' && catalogue.createdBy && !catalogue.createdBy.equals(req.user._id)) {
      const User = require('../models/User');
      const creator = await User.findById(catalogue.createdBy);
      if (!creator || !creator.assignedAdmin || !creator.assignedAdmin.equals(req.user._id)) {
        return res.status(403).json({ message: 'Not authorized to delete this catalogue' });
      }
    }

    await catalogue.deleteOne();
    await logActivity(req.user._id, 'catalogue_delete', `Deleted catalogue: ${catalogue.name}`, { catalogueId: catalogue._id });
    res.json({ message: 'Catalogue removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Copy an existing catalogue
// @route   POST /api/catalogues/:id/copy
// @access  Private
const copyCatalogue = async (req, res) => {
  try {
    const originalCatalogue = await Catalogue.findById(req.params.id);
    if (!originalCatalogue) return res.status(404).json({ message: 'Catalogue not found' });

    // Isolation check
    if (req.user.role === 'admin' && originalCatalogue.createdBy && !originalCatalogue.createdBy.equals(req.user._id)) {
      const User = require('../models/User');
      const creator = await User.findById(originalCatalogue.createdBy);
      if (!creator || !creator.assignedAdmin || !creator.assignedAdmin.equals(req.user._id)) {
        return res.status(403).json({ message: 'Not authorized to copy this catalogue' });
      }
    }

    const { name, buyerCompany, buyerEmail } = req.body;
    
    const linkToken = crypto.randomBytes(4).toString('hex');
    
    const newCatalogue = await Catalogue.create({
      buyerCompany: buyerCompany || originalCatalogue.buyerCompany,
      buyerEmail: buyerEmail !== undefined ? buyerEmail : originalCatalogue.buyerEmail,
      name: name || originalCatalogue.name + ' - Copy',
      products: originalCatalogue.products,
      customColumns: originalCatalogue.customColumns,
      linkToken,
      createdBy: req.user._id
    });
    
    await logActivity(req.user._id, 'catalogue_copy', `Copied catalogue: ${newCatalogue.name}`, { catalogueId: newCatalogue._id });
    res.status(201).json(newCatalogue);
  } catch(error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createCatalogue,
  getCatalogues,
  getCatalogueByToken,
  updateCatalogue,
  deleteCatalogue,
  copyCatalogue
};
