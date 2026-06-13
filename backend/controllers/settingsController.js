const db = require('../db/connection');

let cachedSettings = null;

const getSettings = async (req, res) => {
  try {
    if (cachedSettings) {
      return res.json(cachedSettings);
    }
    let settings = await db.Settings.findOne();
    if (!settings) {
      // Auto-create default settings if none exist
      settings = await db.Settings.create({});
    }
    cachedSettings = settings;
    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const fs = require('fs');

const updateSettings = async (req, res) => {
  try {
    const updateData = req.body;
    if (req.file) {
      try {
        const fileData = fs.readFileSync(req.file.path);
        const base64Str = fileData.toString('base64');
        updateData.companyLogo = `data:${req.file.mimetype};base64,${base64Str}`;
        fs.unlinkSync(req.file.path); // remove temp file
      } catch (err) {
        console.error('Error converting file to base64:', err);
      }
    }
    let settings = await db.Settings.findOne();
    if (!settings) {
      settings = await db.Settings.create(updateData);
    } else {
      settings = await db.Settings.findByIdAndUpdate(settings._id, updateData, { new: true });
    }
    cachedSettings = settings;
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
