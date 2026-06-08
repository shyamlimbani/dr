const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/connection');

const JWT_SECRET = process.env.JWT_SECRET || 'employee_event_mgmt_jwt_secret_key_2026_xyz';

// Auto-seed default user if none exists
const seedDefaultAdmin = async () => {
  try {
    const adminCount = await db.Employee.countDocuments({ role: 'Admin' });
    if (adminCount === 0) {
      await db.Employee.create({
        fullName: 'Administrator',
        mobileNumber: '9999999999',
        password: 'admin',
        role: 'Admin',
        status: 'Active',
        loginAccess: true,
        employeeId: 'ADM-001'
      });
      console.log('Default Admin user seeded: Mobile 9999999999 / Pass admin');
    }
  } catch (error) {
    console.error('Seeding admin user failed:', error);
  }
};

// Trigger seed
seedDefaultAdmin();

const login = async (req, res) => {
  try {
    const { email: mobileNumber, password } = req.body;
    
    // Unified Login using db.Employee
    const employee = await db.Employee.findOne({ mobileNumber });
    if (!employee || employee.password !== password) {
      return res.status(400).json({ message: 'Invalid mobile number or password' });
    }

    if (employee.loginAccess === false) {
      return res.status(403).json({ message: 'Login disabled by admin' });
    }

    const token = jwt.sign({ id: employee._id, role: employee.role }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      token,
      user: {
        id: employee._id,
        name: employee.fullName,
        email: employee.mobileNumber, // mapped for frontend compatibility
        role: employee.role, // 'Admin' or 'Staff'
        employeeId: employee.employeeId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMe = async (req, res) => {
  try {
    const emp = await db.Employee.findById(req.user.id);
    if (!emp) return res.status(404).json({ message: 'User not found' });
    
    return res.json({
      id: emp._id,
      name: emp.fullName,
      email: emp.mobileNumber,
      role: emp.role,
      employeeId: emp.employeeId
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Forgot Password flows disabled for unified role login without emails.
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
