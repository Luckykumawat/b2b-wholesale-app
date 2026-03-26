const Catalogue = require('../models/Catalogue');
const crypto = require('crypto');

// @desc    Create a new catalogue
// @route   POST /api/catalogues
// @access  Private
const createCatalogue = async (req, res) => {
  try {
    const { buyerCompany, buyerEmail, name, products, customColumns } = req.body;
    
    // Generate unique link token
    const linkToken = crypto.randomBytes(4).toString('hex');

    const catalogue = await Catalogue.create({
      buyerCompany,
      buyerEmail,
      name,
      products,
      customColumns,
      linkToken,
      createdBy: req.user?._id
    });

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
    const catalogue = await Catalogue.findOne({ linkToken: req.params.token }).populate('products');
    if (!catalogue) return res.status(404).json({ message: 'Catalogue not found' });
    
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

    const { buyerCompany, buyerEmail, name, products, customColumns } = req.body;
    
    if (buyerCompany) catalogue.buyerCompany = buyerCompany;
    if (buyerEmail !== undefined) catalogue.buyerEmail = buyerEmail;
    if (name) catalogue.name = name;
    if (products) catalogue.products = products;
    if (customColumns) catalogue.customColumns = customColumns;

    const updatedCatalogue = await catalogue.save();
    res.json(updatedCatalogue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createCatalogue,
  getCatalogues,
  getCatalogueByToken,
  updateCatalogue
};
