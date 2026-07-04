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
const studioExpenseController = require('../controllers/studioExpenseController');
const revenueController = require('../controllers/revenueController');
const pdfController = require('../controllers/pdfController');

// Middleware
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');

const requireAdmin = requireRole(['Admin']);
const requireAdminOrStaff = requireRole(['Admin', 'Staff']);
const requireAdminOrStudio = requireRole(['Admin', 'Studio']);

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
router.get('/employees', requireAdminOrStaff, employeeController.getEmployees);
router.get('/employees/:id', requireAdminOrStaff, employeeController.getEmployeeById);
router.post('/employees', requireAdmin, upload.single('profilePhoto'), employeeController.createEmployee);
router.put('/employees/:id', requireAdmin, upload.single('profilePhoto'), employeeController.updateEmployee);
router.delete('/employees/:id', requireAdmin, employeeController.deleteEmployee);
router.put('/employees/:id/toggle-access', requireAdmin, employeeController.toggleLoginAccess);
router.post('/employees/:id/reset-password', requireAdmin, employeeController.resetEmployeePassword);

// Event Management
router.get('/events', requireAdminOrStaff, eventController.getEvents);
router.get('/events/:id', requireAdminOrStaff, eventController.getEventById);
router.post('/events', requireAdmin, eventController.createEvent);
router.put('/events/:id', requireAdmin, eventController.updateEvent);
router.delete('/events/:id', requireAdmin, eventController.deleteEvent);

// Payments (Employee Payment Ledger)
router.get('/ledger', requireAdminOrStaff, ledgerController.getLedgers);
router.post('/ledger', requireAdmin, ledgerController.createLedger);
router.put('/ledger/:id', requireAdmin, ledgerController.updateLedger);
router.delete('/ledger/:id', requireAdmin, ledgerController.deleteLedger);
router.get('/ledger/pdf', requireAdmin, ledgerController.generateLedgerPdf);

// Expenses
router.get('/expenses', requireAdmin, expenseController.getExpenses);
router.post('/expenses', requireAdmin, upload.single('receipt'), expenseController.createExpense);
router.put('/expenses/:id', requireAdmin, upload.single('receipt'), expenseController.updateExpense);
router.delete('/expenses/:id', requireAdmin, expenseController.deleteExpense);
router.get('/expenses/pdf', requireAdmin, expenseController.generateExpensePdf);

// Settings
router.get('/settings', requireAdmin, settingsController.getSettings);
router.post('/settings', requireAdmin, upload.single('companyLogo'), settingsController.updateSettings);

// Bills
router.get('/bills', requireAdmin, billingController.getBills);
router.post('/bills', requireAdmin, billingController.createBill);
router.put('/bills/:id', requireAdmin, billingController.updateBill);
router.delete('/bills/:id', requireAdmin, billingController.deleteBill);
router.get('/bills/:id/pdf', requireAdmin, billingController.generateBillPdf);
router.get('/revenue/pdf', requireAdmin, revenueController.generateRevenuePdf);

// Quotations
router.get('/quotations', requireAdmin, billingController.getQuotations);
router.post('/quotations', requireAdmin, billingController.createQuotation);
router.put('/quotations/:id', requireAdmin, billingController.updateQuotation);
router.delete('/quotations/:id', requireAdmin, billingController.deleteQuotation);
router.get('/quotations/:id/pdf', requireAdmin, billingController.generateQuotationPdf);

// Studio Bookings
router.get('/studio', requireAdminOrStudio, studioController.getBookings);
router.post('/studio', requireAdminOrStudio, studioController.createBooking);
router.put('/studio/:id', requireAdminOrStudio, studioController.updateBooking);
router.delete('/studio/:id', requireAdminOrStudio, studioController.deleteBooking);

// Studio Expenses
router.get('/studio-expenses', requireAdminOrStudio, studioExpenseController.getExpenses);
router.post('/studio-expenses', requireAdminOrStudio, upload.single('receipt'), studioExpenseController.createExpense);
router.put('/studio-expenses/:id', requireAdminOrStudio, upload.single('receipt'), studioExpenseController.updateExpense);
router.delete('/studio-expenses/:id', requireAdminOrStudio, studioExpenseController.deleteExpense);

// Revenue Module Manual CRUD
router.get('/revenues', requireAdmin, revenueController.getRevenues);
router.post('/revenues', requireAdmin, revenueController.createRevenue);
router.put('/revenues/:id', requireAdmin, revenueController.updateRevenue);
router.delete('/revenues/:id', requireAdmin, revenueController.deleteRevenue);
router.post('/revenues/:id/payments', requireAdmin, revenueController.addPayment);
router.get('/revenues/pdf', requireAdmin, revenueController.generateRevenuePdf);

module.exports = router;
