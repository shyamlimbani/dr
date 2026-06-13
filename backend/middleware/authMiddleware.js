const jwt = require('jsonwebtoken');
const db = require('../db/connection');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token missing or invalid' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'employee_event_mgmt_jwt_secret_key_2026_xyz');
    
    // Inject the role into req.user
    req.user = { id: decoded.id, role: decoded.role || 'Admin' };
    
    // For Admin requests, you might still want to fetch the user or just rely on ID
    if (req.user.role === 'Admin') {
      const user = await db.User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ message: 'User no longer exists' });
      }
    } else if (req.user.role === 'Employee' || req.user.role === 'Staff') {
      const emp = await db.Employee.findById(decoded.id);
      if (!emp || emp.loginAccess === false) {
        return res.status(401).json({ message: 'Employee access disabled or not found' });
      }
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ message: 'Session expired or token invalid' });
  }
};

module.exports = authMiddleware;
