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
    const employee = await db.Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Aggregate statistics
    // 1. Payment details
    const payments = await db.EmployeeLedger.find({ employeeId: id });
    
    let totalPaymentsGiven = 0;
    const paymentHistory = [];

    payments.forEach(p => {
      totalPaymentsGiven += p.amount || 0;
      
      paymentHistory.push({
        amount: p.amount,
        date: p.date,
        paymentMethod: p.paymentMethod || '',
        notes: p.notes || ''
      });
    });

    // Sort payment history by date descending
    paymentHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

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
        eventLocation: ev.eventLocation,
        employeeCharge: ev.employeeCharge
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
      notes 
    } = req.body;

    if (!fullName || !mobileNumber) {
      return res.status(400).json({ message: 'Full name and mobile number are required' });
    }

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
      status: 'Active'
    });

    res.status(201).json(employee);
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

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
};
