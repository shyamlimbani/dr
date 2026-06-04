const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/connection');

const JWT_SECRET = process.env.JWT_SECRET || 'employee_event_mgmt_jwt_secret_key_2026_xyz';

// Auto-seed default user if none exists
const seedDefaultAdmin = async () => {
  try {
    const adminCount = await db.User.countDocuments();
    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.User.create({
        name: 'Administrator',
        email: 'admin@vivid.com',
        password: hashedPassword
      });
      console.log('Default Admin user seeded: admin@vivid.com / admin123');
    }
  } catch (error) {
    console.error('Seeding admin user failed:', error);
  }
};

// Trigger seed
seedDefaultAdmin();

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await db.User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMe = async (req, res) => {
  try {
    res.json({
      id: req.user._id,
      name: req.user.name,
      email: req.user.email
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await db.User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    // Generate a simple numeric 6-digit pin for easier manual flow
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenExpiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    await db.User.findByIdAndUpdate(user._id, {
      resetToken,
      resetTokenExpiry
    });

    // In a real application, you would send this token via email.
    // For local dev, we will log it and return it in the response so it is easy to test!
    console.log(`Password reset pin for ${email}: ${resetToken}`);

    res.json({
      message: 'Password reset PIN sent (check console logs for local pin).',
      // Return the pin in response for debugging/demo simplicity
      debugPin: resetToken
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, pin, newPassword } = req.body;
    if (!email || !pin || !newPassword) {
      return res.status(400).json({ message: 'Email, PIN, and new password are required' });
    }

    const user = await db.User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (!user.resetToken || user.resetToken !== pin || new Date(user.resetTokenExpiry) < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired password reset PIN' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  login,
  getMe,
  forgotPassword,
  resetPassword
};
