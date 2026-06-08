const bcrypt = require('bcryptjs');
const db = require('../db/connection');

const seed = async () => {
  console.log('Starting database seeding...');
  
  try {
    // 1. Seed admin
    const passwordHash = await bcrypt.hash('admin123', 10);
    // Clear and reset users
    const users = db.User._read();
    if (users.length === 0) {
      await db.User.create({
        name: 'Vivid Admin',
        email: 'admin@vivid.com',
        password: passwordHash
      });
      console.log('Seeded User: admin@vivid.com / admin123');
    }

    // 2. Seed Employees
    const employeeData = [
      {
        fullName: 'Shyam Sundar',
        mobileNumber: '+91 98765 12345',
        email: 'shyam@vivid.com',
        address: 'B-402, Sunset Heights, Andheri West, Mumbai',
        role: 'Photographer',
        perDayCharge: 5000,
        joiningDate: '2025-01-15',
        notes: 'Senior photographer. Specializes in candid portraits.',
        profilePhoto: '',
        status: 'Active'
      },
      {
        fullName: 'Jay Patel',
        mobileNumber: '+91 98765 23456',
        email: 'jay@vivid.com',
        address: 'Flat 12, Royal Arcade, Bandra East, Mumbai',
        role: 'Drone Operator',
        perDayCharge: 6500,
        joiningDate: '2025-03-10',
        notes: 'Experienced FAA-equivalent certified pilot. Owns DJI Inspire.',
        profilePhoto: '',
        status: 'Active'
      },
      {
        fullName: 'Rahul Sharma',
        mobileNumber: '+91 98765 34567',
        email: 'rahul@vivid.com',
        address: '44, Green Glen layout, Thane, Mumbai',
        role: 'Videographer',
        perDayCharge: 5500,
        joiningDate: '2025-02-20',
        notes: 'Cinematic reel specialist. Fast turnaround.',
        profilePhoto: '',
        status: 'Active'
      },
      {
        fullName: 'Priya Nair',
        mobileNumber: '+91 98765 45678',
        email: 'priya@vivid.com',
        address: 'Studio Row 5, Chembur, Mumbai',
        role: 'Editor',
        perDayCharge: 4000,
        joiningDate: '2025-04-01',
        notes: 'Premiere Pro and DaVinci Resolve colorist expert.',
        profilePhoto: '',
        status: 'Active'
      },
      {
        fullName: 'Rohit Kadam',
        mobileNumber: '+91 98765 56789',
        email: 'rohit@vivid.com',
        address: 'Sector 17, Vashi, Navi Mumbai',
        role: 'Freelancer',
        perDayCharge: 3500,
        joiningDate: '2025-05-18',
        notes: 'Assistant shooter and backup camera operator.',
        profilePhoto: '',
        status: 'Active'
      }
    ];

    // Seed employees if empty
    const currentEmployees = await db.Employee.find();
    let employeesList = currentEmployees;
    if (currentEmployees.length === 0) {
      employeesList = [];
      for (const emp of employeeData) {
        const doc = await db.Employee.create(emp);
        employeesList.push(doc);
      }
      console.log(`Seeded ${employeesList.length} employees.`);
    }

    // Map employees to make it easy to reference
    const empMap = {};
    employeesList.forEach(e => {
      empMap[e.fullName] = e;
    });

    // 3. Seed Events
    const today = new Date();
    const formatDate = (daysOffset) => {
      const d = new Date(today);
      d.setDate(today.getDate() + daysOffset);
      return d.toISOString().split('T')[0];
    };

    const eventData = [
      {
        eventTitle: 'Sharma & Verma Wedding Gala',
        clientName: 'Alok Sharma',
        clientMobileNumber: '+91 91234 56789',
        eventType: 'Wedding',
        eventDate: formatDate(-15),

        description: 'Grand wedding coverage. 500 guests.',
        eventBudget: 150000,
        advanceReceived: 80000,
        remainingAmount: 70000,
        status: 'Completed',
        assignedEmployees: [
          { employeeId: empMap['Shyam Sundar']._id, roleAtEvent: 'Lead Photographer' },
          { employeeId: empMap['Rahul Sharma']._id, roleAtEvent: 'Videographer' },
          { employeeId: empMap['Jay Patel']._id, roleAtEvent: 'Drone Operator' }
        ]
      },
      {
        eventTitle: 'TechCorp Annual Summit 2026',
        clientName: 'Sanjay Kapoor (HR)',
        clientMobileNumber: '+91 99998 88888',
        eventType: 'Corporate',
        eventDate: formatDate(-5),

        description: 'Keynote shoots, group photo, highlights video.',
        eventBudget: 95000,
        advanceReceived: 95000,
        remainingAmount: 0,
        status: 'Completed',
        assignedEmployees: [
          { employeeId: empMap['Shyam Sundar']._id, roleAtEvent: 'Event Photographer' },
          { employeeId: empMap['Rohit Kadam']._id, roleAtEvent: 'Assistant Shooter' }
        ]
      },
      {
        eventTitle: 'Mehta Pre-Wedding Shoot',
        clientName: 'Kunal Mehta',
        clientMobileNumber: '+91 88888 77777',
        eventType: 'Pre-Wedding',
        eventDate: formatDate(2),

        description: 'Outdoor sunrise couple shoot.',
        eventBudget: 50000,
        advanceReceived: 20000,
        remainingAmount: 30000,
        status: 'Upcoming',
        assignedEmployees: [
          { employeeId: empMap['Shyam Sundar']._id, roleAtEvent: 'Candid Photographer' },
          { employeeId: empMap['Jay Patel']._id, roleAtEvent: 'Drone Specialist' }
        ]
      },
      {
        eventTitle: 'Rohan Birthday Bash',
        clientName: 'Deepa Shah',
        clientMobileNumber: '+91 77777 66666',
        eventType: 'Birthday',
        eventDate: formatDate(5),

        description: '1st Birthday coverage and photobooth.',
        eventBudget: 35000,
        advanceReceived: 10000,
        remainingAmount: 25000,
        status: 'Upcoming',
        assignedEmployees: [
          { employeeId: empMap['Rohit Kadam']._id, roleAtEvent: 'Photographer' }
        ]
      }
    ];

    const currentEvents = await db.Event.find();
    let eventsList = currentEvents;
    if (currentEvents.length === 0) {
      eventsList = [];
      for (const ev of eventData) {
        const doc = await db.Event.create(ev);
        eventsList.push(doc);

        // Trigger Ledgers for Completed Events
        if (ev.status === 'Completed') {
          for (const crew of ev.assignedEmployees) {
            const employee = await db.Employee.findById(crew.employeeId);
            if (employee) {
              const dayCharge = employee.perDayCharge;
              // For first completed event: fully paid, for second: pending/unpaid
              const isFirstEvent = ev.eventTitle.includes('Sharma');
              const paid = isFirstEvent ? dayCharge : 0;

              if (paid > 0) {
                await db.EmployeeLedger.create({
                  employeeId: employee._id,
                  employeeName: employee.fullName,
                  mobileNumber: employee.mobileNumber,
                  amountGiven: paid,
                  paymentMethod: 'Bank Transfer',
                  notes: 'Completed Event Payout',
                  paymentDate: formatDate(-14)
                });
              }
            }
          }
        }
      }
      console.log(`Seeded ${eventsList.length} events with ledgers & income statements.`);
    }



    // 5. Seed Expenses
    const expenseData = [
      {
        expenseCategory: 'Petrol',
        amount: 2500,
        date: formatDate(-14),
        description: 'Fuel for transport to Leela Grand Ballroom Wedding.',
        receiptUrl: ''
      },
      {
        expenseCategory: 'Food',
        amount: 1800,
        date: formatDate(-14),
        description: 'Crew snacks and dinner during Wedding shoot.',
        receiptUrl: ''
      },
      {
        expenseCategory: 'Travel',
        amount: 3200,
        date: formatDate(-5),
        description: 'Cab fares for transporting gear to Nesco Goregaon.',
        receiptUrl: ''
      },
      {
        expenseCategory: 'Equipment',
        amount: 15000,
        date: formatDate(-25),
        description: 'Sony A7IV camera cage and battery chargers purchase.',
        receiptUrl: ''
      },
      {
        expenseCategory: 'Salary',
        amount: 17000,
        date: formatDate(-14),
        description: 'Completed wedding payments to Shyam, Rahul, Jay.',
        receiptUrl: ''
      },
      {
        expenseCategory: 'Miscellaneous',
        amount: 900,
        date: formatDate(-8),
        description: 'Hard-drive backup markers and stationery.',
        receiptUrl: ''
      }
    ];

    const currentExpenses = await db.Expense.find();
    if (currentExpenses.length === 0) {
      for (const exp of expenseData) {
        await db.Expense.create(exp);
      }
      console.log(`Seeded ${expenseData.length} expenses.`);
    }

    // Seed Studio bookings
    const studioBookingData = [
      {
        clientName: 'Manish Verma',
        mobileNumber: '9876500111',
        service: 'Photo Shoot',
        amount: 8000,
        bookingDate: formatDate(0),
        notes: 'Family outdoor photoshoot'
      },
      {
        clientName: 'Ritu Sen',
        mobileNumber: '9876500222',
        service: 'Baby Package',
        amount: 15000,
        bookingDate: formatDate(2),
        notes: 'Baby milestone photoshoot'
      },
      {
        clientName: 'Sanjay Jain',
        mobileNumber: '9876500333',
        service: 'Reels',
        amount: 5000,
        bookingDate: formatDate(-3),
        notes: 'Instagram corporate brand reels'
      }
    ];

    const currentBookings = await db.StudioBooking.find();
    if (currentBookings.length === 0) {
      for (const b of studioBookingData) {
        await db.StudioBooking.create(b);
      }
      console.log(`Seeded ${studioBookingData.length} studio bookings.`);
    }

    // Seed Revenues
    const manualRevenueData = [
      {
        clientName: 'Rajesh Mehta',
        mobileNumber: '9876500444',
        totalAmount: 25000,
        pendingAmount: 0,
        revenueDate: formatDate(0),
        notes: 'Commercial corporate product shoot payout'
      },
      {
        clientName: 'Anjali Desai',
        mobileNumber: '9876500555',
        totalAmount: 12000,
        pendingAmount: 4000,
        revenueDate: formatDate(-1),
        notes: 'Album design print charge'
      },
      {
        clientName: 'Karan Malhotra',
        mobileNumber: '9876500666',
        totalAmount: 35000,
        pendingAmount: 0,
        revenueDate: formatDate(-4),
        notes: 'Brand video production invoice payment'
      }
    ];

    const currentRevenues = await db.Revenue.find();
    if (currentRevenues.length === 0) {
      for (const r of manualRevenueData) {
        await db.Revenue.create(r);
      }
      console.log(`Seeded ${manualRevenueData.length} revenue records.`);
    }

    console.log('Database seeding successfully finished!');
  } catch (err) {
    console.error('Error during database seed:', err);
  }
};

// Run seed if called directly
if (require.main === module) {
  seed();
}

module.exports = seed;
