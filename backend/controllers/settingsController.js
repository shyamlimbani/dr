const db = require('../db/connection');

const getSettings = async (req, res) => {
  try {
    let settings = await db.Settings.findOne();
    if (!settings) {
      // Auto-create default settings if none exist
      settings = await db.Settings.create({});
    }
    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateSettings = async (req, res) => {
  try {
    const updateData = req.body;
    if (req.file) {
      updateData.companyLogo = '/uploads/' + req.file.filename;
    }
    let settings = await db.Settings.findOne();
    if (!settings) {
      settings = await db.Settings.create(updateData);
    } else {
      settings = await db.Settings.findByIdAndUpdate(settings._id, updateData, { new: true });
    }
    res.json(settings);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getSettings,
  updateSettings
};
