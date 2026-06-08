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
    if (req.user && req.user.role === 'Employee' && req.user.id !== id) {
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

    if (!fullName || !mobileNumber) {
      return res.status(400).json({ message: 'Full name and mobile number are required' });
    }

    // Generate unique employee ID
    const count = await db.Employee.countDocuments();
    const employeeId = `EMP-${String(count + 1).padStart(3, '0')}`;

    // Profile photo upload configuration
    let profilePhoto = '';
    if (req.file) {
      profilePhoto = `/uploads/${req.file.filename}`;
    }

    const employee = await db.Employee.create({
      fullName,
      mobileNumber,
      email: email || '',
      address: address || '',
      role,
      perDayCharge: Number(perDayCharge) || 0,
      joiningDate: joiningDate || new Date().toISOString().split('T')[0],
      notes: notes || '',
      profilePhoto,
      status: 'Active',
      employeeId,
      password: password || '123456', // default fallback, though frontend requires it
      loginAccess: true
    });

    // Don't send back the password in plain text typically, but since it's manual, we can omit it
    const returnEmployee = employee.toObject();
    delete returnEmployee.password;

    res.status(201).json(returnEmployee);
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // If new file was uploaded
    if (req.file) {
      updateData.profilePhoto = `/uploads/${req.file.filename}`;
    }

    // Cast perDayCharge to Number if present
    if (updateData.perDayCharge !== undefined) {
      updateData.perDayCharge = Number(updateData.perDayCharge);
    }

    const updatedEmployee = await db.Employee.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedEmployee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json(updatedEmployee);
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.Employee.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Cleanup any pending ledger entries
    // For simplicity, we can keep the payment records or delete them. We will keep them for ledger integrity, but could mark employee as deleted.
    res.json({ message: 'Employee deleted successfully' });
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
