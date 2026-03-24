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
      linkToken
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
    const catalogues = await Catalogue.find().sort({ createdAt: -1 }).populate('products');
    res.json(catalogues);
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
