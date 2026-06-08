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
    const { email, password } = req.body; // 'email' field here acts as the generic loginId from the frontend
    
    // Check if it is an existing Admin in db.User (usually has @ in email, but we'll just check)
    const adminUser = await db.User.findOne({ email: email.toLowerCase() });
    
    if (adminUser) {
      const isMatch = await bcrypt.compare(password, adminUser.password);
      if (isMatch) {
        const token = jwt.sign({ id: adminUser._id, role: 'Admin' }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({
          token,
          user: {
            id: adminUser._id,
            name: adminUser.name,
            email: adminUser.email,
            role: 'Admin'
          }
        });
      }
    }

    // If not found in db.User or password didn't match, check db.Employee (Staff or newly created Admins)
    const employee = await db.Employee.findOne({ mobileNumber: email });
    if (employee && employee.password === password) {
      if (employee.loginAccess === false) {
        return res.status(403).json({ message: 'Login disabled by admin' });
      }

      const token = jwt.sign({ id: employee._id, role: employee.role || 'Staff' }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({
        token,
        user: {
          id: employee._id,
          name: employee.fullName,
          email: employee.mobileNumber,
          role: employee.role || 'Staff',
          employeeId: employee.employeeId
        }
      });
    }

    return res.status(400).json({ message: 'Invalid credentials' });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMe = async (req, res) => {
  try {
    // Check if the role in JWT is Staff or if it's an Employee-based Admin
    const emp = await db.Employee.findById(req.user.id);
    if (emp) {
      return res.json({
        id: emp._id,
        name: emp.fullName,
        email: emp.mobileNumber,
        role: emp.role || 'Staff',
        employeeId: emp.employeeId
      });
    }

    // Fallback to db.User for legacy admins
    const user = await db.User.findById(req.user.id).select('-password');
    if (user) {
      return res.json({
        id: user._id,
        name: user.name,
        email: user.email,
        role: 'Admin'
      });
    }

    return res.status(404).json({ message: 'User not found' });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const forgotPassword = async (req, res) => {
  res.status(501).json({ message: 'Forgot password flow requires admin manual reset.' });
};

const resetPassword = async (req, res) => {
  res.status(501).json({ message: 'Reset password flow requires admin manual reset.' });
};

module.exports = {
  login,
  getMe,
  forgotPassword,
  resetPassword
};
