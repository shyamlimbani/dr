const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Controllers
const authController = require('../controllers/authController');
const employeeController = require('../controllers/employeeController');
const eventController = require('../controllers/eventController');
const ledgerController = require('../controllers/ledgerController');
const expenseController = require('../controllers/expenseController');
const billingController = require('../controllers/billingController');
const settingsController = require('../controllers/settingsController');
const studioController = require('../controllers/studioController');
const revenueController = require('../controllers/revenueController');
const pdfController = require('../controllers/pdfController');

// Middleware
const authMiddleware = require('../middleware/authMiddleware');

// Configure Multer for local file storage (uploads)
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// ==========================================
// PUBLIC ROUTES
// ==========================================
router.post('/auth/login', authController.login);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);
router.get('/pdf/temp-download/:downloadId', pdfController.tempDownload);

// ==========================================
// PROTECTED ROUTES (Requires JWT)
// ==========================================
router.use(authMiddleware);

// Auth Validation
router.get('/auth/me', authController.getMe);
router.post('/pdf/temp-upload', pdfController.tempUpload);

// Employee Management (Integrated within Events module)
router.get('/employees', employeeController.getEmployees);
router.get('/employees/:id', employeeController.getEmployeeById);
router.post('/employees', upload.single('profilePhoto'), employeeController.createEmployee);
router.put('/employees/:id', upload.single('profilePhoto'), employeeController.updateEmployee);
router.delete('/employees/:id', employeeController.deleteEmployee);
router.put('/employees/:id/toggle-access', employeeController.toggleLoginAccess);
router.post('/employees/:id/reset-password', employeeController.resetEmployeePassword);

// Event Management
router.get('/events', eventController.getEvents);
router.get('/events/:id', eventController.getEventById);
router.post('/events', eventController.createEvent);
router.put('/events/:id', eventController.updateEvent);
router.delete('/events/:id', eventController.deleteEvent);

// Payments (Employee Payment Ledger)
router.get('/ledger', ledgerController.getLedgers);
router.post('/ledger', ledgerController.createLedger);
router.put('/ledger/:id', ledgerController.updateLedger);
router.delete('/ledger/:id', ledgerController.deleteLedger);
router.get('/ledger/pdf', ledgerController.generateLedgerPdf);

// Expenses
router.get('/expenses', expenseController.getExpenses);
router.post('/expenses', upload.single('receipt'), expenseController.createExpense);
router.put('/expenses/:id', upload.single('receipt'), expenseController.updateExpense);
router.delete('/expenses/:id', expenseController.deleteExpense);
router.get('/expenses/pdf', expenseController.generateExpensePdf);

// Settings
router.get('/settings', settingsController.getSettings);
router.post('/settings', upload.single('companyLogo'), settingsController.updateSettings);

// Bills
router.get('/bills', billingController.getBills);
router.post('/bills', billingController.createBill);
router.put('/bills/:id', billingController.updateBill);
router.delete('/bills/:id', billingController.deleteBill);
router.get('/bills/:id/pdf', billingController.generateBillPdf);
router.get('/revenue/pdf', revenueController.generateRevenuePdf);

// Quotations
router.get('/quotations', billingController.getQuotations);
router.post('/quotations', billingController.createQuotation);
router.put('/quotations/:id', billingController.updateQuotation);
router.delete('/quotations/:id', billingController.deleteQuotation);
router.get('/quotations/:id/pdf', billingController.generateQuotationPdf);

// Studio Bookings
router.get('/studio', studioController.getBookings);
router.post('/studio', studioController.createBooking);
router.put('/studio/:id', studioController.updateBooking);
router.delete('/studio/:id', studioController.deleteBooking);

// Revenue Module Manual CRUD
router.get('/revenues', revenueController.getRevenues);
router.post('/revenues', revenueController.createRevenue);
router.put('/revenues/:id', revenueController.updateRevenue);
router.delete('/revenues/:id', revenueController.deleteRevenue);
router.get('/revenues/pdf', revenueController.generateRevenuePdf);

module.exports = router;
