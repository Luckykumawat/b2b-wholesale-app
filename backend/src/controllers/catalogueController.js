const catalogueService = require('../services/catalogueService');
const userService = require('../services/userService');
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

      const catalogues = await catalogueService.getCatalogues({ createdBy: req.user._id });
      const currentCount = catalogues.filter(c => new Date(c.createdAt) >= startOfMonth).length;

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

    const catalogue = await catalogueService.createCatalogue(payload);

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
    const { status } = req.query;
    const filters = {};

    // Data Isolation
    if (req.user.role === 'admin') {
      const assignedBuyers = await userService.getBuyersByAdmin(req.user._id);
      const buyerIds = assignedBuyers.map(b => b.id);
      filters.createdByList = [req.user._id, ...buyerIds];
    } else if (req.user.role === 'buyer') {
      filters.createdByList = [req.user.assignedAdmin, req.user._id];
    }

    // This is a simplified version of the filtering logic to maintain compatibility
    // In a real scenario, we'd expand catalogueService.getCatalogues to handle all these
    const allCatalogues = await catalogueService.getCatalogues(filters);
    
    // Manual filtering for now to keep it simple and correct
    let filtered = allCatalogues;

    if (status && status !== 'All') {
      const statusValue = status.split(' ')[0];
      filtered = filtered.filter(c => c.status === statusValue);
    }

    const counts = {
      Total: allCatalogues.length,
      Draft: allCatalogues.filter(c => c.status === 'Draft').length,
      Active: allCatalogues.filter(c => c.status === 'Active').length,
      Inactive: allCatalogues.filter(c => c.status === 'Inactive').length,
    };

    res.json({ catalogues: filtered, counts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get catalogue by link token
// @route   GET /api/catalogues/link/:token
// @access  Public
const getCatalogueByToken = async (req, res) => {
  try {
    const catalogue = await catalogueService.getCatalogueByToken(req.params.token);

    if (!catalogue) {
      return res.status(404).json({ message: 'Catalogue not found' });
    }

    if (catalogue.status === 'Inactive') {
      return res.status(403).json({ message: 'This catalogue is currently inactive.' });
    }

    const { linkSettings } = catalogue;

    if (linkSettings && linkSettings.expiresOn) {
      if (new Date() > new Date(linkSettings.expiresOn)) {
        return res.status(403).json({ message: 'This catalogue link has expired.' });
      }
    }

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
      
      // OTP simulation
      if (linkSettings.requireEmailOTP && (!req.body.otp || req.body.otp !== '123456')) {
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
    
    await catalogueService.updateLastAccessed(catalogue.id);
    
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
    const catalogue = await catalogueService.getCatalogueById(req.params.id);
    if (!catalogue) return res.status(404).json({ message: 'Catalogue not found' });

    // Data Isolation Check
    if (req.user.role === 'admin' && catalogue.createdBy && String(catalogue.createdBy) !== String(req.user._id)) {
      const creator = await userService.getById(catalogue.createdBy);
      if (!creator || String(creator.assignedAdmin) !== String(req.user._id)) {
        return res.status(403).json({ message: 'Not authorized to update this catalogue' });
      }
    }

    const updatedCatalogue = await catalogueService.updateCatalogue(req.params.id, req.body);
    await logActivity(
      req.user._id,
      'catalogue_update',
      `Updated catalogue: ${updatedCatalogue.name}`,
      { catalogueId: updatedCatalogue._id }
    );
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
    const catalogue = await catalogueService.getCatalogueById(req.params.id);
    if (!catalogue) return res.status(404).json({ message: 'Catalogue not found' });

    // Data Isolation Check
    if (req.user.role === 'admin' && catalogue.createdBy && String(catalogue.createdBy) !== String(req.user._id)) {
      const creator = await userService.getById(catalogue.createdBy);
      if (!creator || String(creator.assignedAdmin) !== String(req.user._id)) {
        return res.status(403).json({ message: 'Not authorized to delete this catalogue' });
      }
    }

    await catalogueService.deleteCatalogue(req.params.id);
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
    const original = await catalogueService.getCatalogueById(req.params.id);
    if (!original) return res.status(404).json({ message: 'Catalogue not found' });

    // Isolation check
    if (req.user.role === 'admin' && original.createdBy && String(original.createdBy) !== String(req.user._id)) {
      const creator = await userService.getById(original.createdBy);
      if (!creator || String(creator.assignedAdmin) !== String(req.user._id)) {
        return res.status(403).json({ message: 'Not authorized to copy this catalogue' });
      }
    }

    const { name, buyerCompany, buyerEmail } = req.body;
    const linkToken = crypto.randomBytes(4).toString('hex');
    
    const payload = {
      buyerCompany: buyerCompany || original.buyerCompany,
      buyerEmail: buyerEmail !== undefined ? buyerEmail : original.buyerEmail,
      name: name || original.name + ' - Copy',
      products: original.products,
      customColumns: original.customColumns,
      linkToken,
      createdBy: req.user._id,
      linkSettings: original.linkSettings
    };
    
    const newCatalogue = await catalogueService.createCatalogue(payload);
    
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
