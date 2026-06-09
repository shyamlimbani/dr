const mongoose = require('mongoose');
const db = require('../db/connection');

const getEmployees = async (req, res) => {
  try {
    const { search, role, status } = req.query;
    const query = {};

    if (role) {
      query.role = role;
    }

    if (status) {
      query.status = status;
    }

    let employees = await db.Employee.find(query);

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      employees = employees.filter(emp => 
        searchRegex.test(emp.fullName || '') || 
        searchRegex.test(emp.email || '') || 
        searchRegex.test(emp.mobileNumber || '')
      );
    }

    res.json(employees);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    // Security check: Employees can only view their own profile
    if (req.user && (req.user.role === 'Employee' || req.user.role === 'Staff') && req.user.id !== id) {
      return res.status(403).json({ message: 'Forbidden: You can only access your own profile' });
    }

    // 1. Basic details & Payment History
    const employee = await db.Employee.findById(id).select('-password');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Aggregate statistics
    // 1. Payment details
    const payments = await db.EmployeeLedger.find({ employeeId: id });
    
    let totalPaymentsGiven = 0;
    const paymentHistory = [];

    payments.forEach(p => {
      totalPaymentsGiven += p.amountGiven || 0;
      
      paymentHistory.push({
        amountGiven: p.amountGiven,
        paymentDate: p.paymentDate,
        paymentMethod: p.paymentMethod || '',
        notes: p.notes || ''
      });
    });

    // Sort payment history by date descending
    paymentHistory.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

    // 2. Event History
    const assignedEvents = await db.Event.find({ employeeId: id });

    res.json({
      employee,
      stats: {
        totalEvents: assignedEvents.length,
        totalPaymentsGiven
      },
      events: assignedEvents.map(ev => ({
        _id: ev._id,
        eventDate: ev.eventDate,
        eventType: ev.eventType,
        employeeCharge: ev.employeeCharge,
        location: ev.location || '',
        notes: ev.notes || ''
      })),
      paymentHistory
    });
  } catch (error) {
    console.error('Get employee details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createEmployee = async (req, res) => {
  try {
    const { 
      fullName, 
      mobileNumber, 
      email, 
      address, 
      role, 
      perDayCharge, 
      joiningDate, 
      notes,
      password
    } = req.body;

    // 1. Validate required fields (Synchronous)
    const trimmedName = typeof fullName === 'string' ? fullName.trim() : '';
    const trimmedMobile = typeof mobileNumber === 'string' ? mobileNumber.trim() : '';

    if (!trimmedName) {
      return res.status(400).json({ message: 'Full name is required' });
    }
    if (!trimmedMobile) {
      return res.status(400).json({ message: 'Mobile number is required' });
    }

    // 2. Validate mobile number format (Synchronous)
    const mobileRegex = /^\+?[0-9\s-]{10,15}$/;
    if (!mobileRegex.test(trimmedMobile)) {
      return res.status(400).json({ message: 'Mobile number must be a valid 10 to 15 digit number' });
    }

    // 3. Validate role (Synchronous)
    const validRoles = ['Staff', 'Admin'];
    const finalRole = role || 'Staff';
    if (!validRoles.includes(finalRole)) {
      return res.status(400).json({ message: `Role must be one of: ${validRoles.join(', ')}` });
    }

    // 4. Validate password if provided (Synchronous)
    if (password !== undefined) {
      const trimmedPassword = typeof password === 'string' ? password.trim() : '';
      if (!trimmedPassword) {
        return res.status(400).json({ message: 'Password cannot be empty or only whitespace' });
      }
      if (trimmedPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
      }
    }

    // 5. Check database connection if Mongoose model is used
    const isMongoose = db.Employee && db.Employee.prototype instanceof mongoose.Model;
    if (isMongoose && mongoose.connection && mongoose.connection.readyState === 0) {
      return res.status(500).json({ message: 'Database connection failed. Please contact your administrator.' });
    }

    // 6. Check if mobile number is already registered (Database query)
    const existingEmployee = await db.Employee.findOne({ mobileNumber: trimmedMobile });
    if (existingEmployee) {
      return res.status(400).json({ message: 'Mobile number is already registered' });
    }

    // 7. Generate unique employee ID (avoiding duplicate key conflict when employees are deleted)
    const count = await db.Employee.countDocuments();
    let employeeId;
    let isUnique = false;
    let nextNum = count + 1;
    while (!isUnique) {
      employeeId = `EMP-${String(nextNum).padStart(3, '0')}`;
      const existing = await db.Employee.findOne({ employeeId });
      if (!existing) {
        isUnique = true;
      } else {
        nextNum++;
      }
    }

    // Profile photo upload configuration
    let profilePhoto = '';
    if (req.file) {
      profilePhoto = `/uploads/${req.file.filename}`;
    }

    const employee = await db.Employee.create({
      fullName: trimmedName,
      mobileNumber: trimmedMobile,
      email: email || '',
      address: address || '',
      role: finalRole,
      perDayCharge: Number(perDayCharge) || 0,
      joiningDate: joiningDate || new Date().toISOString().split('T')[0],
      notes: notes || '',
      profilePhoto,
      status: 'Active',
      employeeId,
      password: password || '123456', // default fallback, though frontend requires it
      loginAccess: true
    });

    // Handle toObject compatibility for mongoose vs local JSON database fallback
    const returnEmployee = typeof employee.toObject === 'function' ? employee.toObject() : { ...employee };
    delete returnEmployee.password;

    res.status(201).json(returnEmployee);
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    const employee = await db.Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Protection: If changing role from Admin to something else
    if (employee.role === 'Admin' && updateData.role && updateData.role !== 'Admin') {
      const adminUsersCount = await db.User.countDocuments();
      const adminEmployeesCount = await db.Employee.countDocuments({ role: 'Admin' });
      if (adminUsersCount + adminEmployeesCount <= 1) {
        return res.status(400).json({ message: 'Cannot demote the final Admin account. At least one Admin must exist.' });
      }
    }

    // If new file was uploaded
    if (req.file) {
      updateData.profilePhoto = `/uploads/${req.file.filename}`;
    }

    // Cast perDayCharge to Number if present
    if (updateData.perDayCharge !== undefined) {
      updateData.perDayCharge = Number(updateData.perDayCharge);
    }

    const updatedEmployee = await db.Employee.findByIdAndUpdate(id, updateData, { new: true });
    res.json(updatedEmployee);
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await db.Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Protection: If deleting an Admin
    if (employee.role === 'Admin') {
      const adminUsersCount = await db.User.countDocuments();
      const adminEmployeesCount = await db.Employee.countDocuments({ role: 'Admin' });
      if (adminUsersCount + adminEmployeesCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the final Admin. At least one Admin account must exist.' });
      }
    }

    await db.Employee.findByIdAndDelete(id);
    
    // Cleanup associated dashboard data (generic checks for MongoDB vs fallback)
    if (typeof db.Event.deleteMany === 'function') {
      await db.Event.deleteMany({ employeeId: id });
    } else {
      const allEvents = await db.Event.find({ employeeId: id });
      for (const ev of allEvents) {
        await db.Event.findByIdAndDelete(ev._id);
      }
    }

    if (typeof db.EmployeeLedger.deleteMany === 'function') {
      await db.EmployeeLedger.deleteMany({ employeeId: id });
    } else {
      const allLedgers = await db.EmployeeLedger.find({ employeeId: id });
      for (const ledger of allLedgers) {
        await db.EmployeeLedger.findByIdAndDelete(ledger._id);
      }
    }

    res.json({ message: 'Employee and associated dashboard data deleted successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const toggleLoginAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await db.Employee.findById(id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    
    employee.loginAccess = employee.loginAccess === false ? true : false;
    await employee.save();
    
    res.json({ message: 'Access toggled successfully', loginAccess: employee.loginAccess });
  } catch (error) {
    console.error('Toggle access error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const resetEmployeePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword) return res.status(400).json({ message: 'New password is required' });
    
    const employee = await db.Employee.findById(id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    
    employee.password = newPassword;
    await employee.save();
    
    res.json({ message: 'Password reset successful', newPassword });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  toggleLoginAccess,
  resetEmployeePassword
};
