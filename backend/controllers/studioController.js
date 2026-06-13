const db = require('../db/connection');

const getBookings = async (req, res) => {
  try {
    const { startDate, endDate, search } = req.query;
    const query = {};

    let bookings = await db.StudioBooking.find(query);

    // Date range filter
    if (startDate || endDate) {
      bookings = bookings.filter(b => {
        const bDate = new Date(b.bookingDate);
        if (startDate && bDate < new Date(startDate)) return false;
        if (endDate && bDate > new Date(endDate)) return false;
        return true;
      });
    }

    // Search filter
    if (search) {
      const regex = new RegExp(search, 'i');
      bookings = bookings.filter(b => 
        regex.test(b.clientName || '') ||
        regex.test(b.service || '') ||
        regex.test(b.mobileNumber || '')
      );
    }

    // Sort by bookingDate descending
    bookings.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));

    res.json(bookings);
  } catch (error) {
    console.error('Get studio bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createBooking = async (req, res) => {
  try {
    const { clientName, mobileNumber, service, amount, bookingDate, notes } = req.body;

    if (!clientName || !mobileNumber || !service || amount === undefined || !bookingDate) {
      return res.status(400).json({ message: 'Client Name, Mobile Number, Service, Amount, and Booking Date are required' });
    }

    const booking = await db.StudioBooking.create({
      clientName,
      mobileNumber,
      service,
      amount: Number(amount),
      bookingDate,
      notes: notes || ''
    });

    res.status(201).json(booking);
  } catch (error) {
    console.error('Create studio booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.amount !== undefined) {
      updateData.amount = Number(updateData.amount);
    }

    const updated = await db.StudioBooking.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) {
      return res.status(404).json({ message: 'Studio booking not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Update studio booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.StudioBooking.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Studio booking not found' });
    }

    res.json({ message: 'Studio booking deleted successfully' });
  } catch (error) {
    console.error('Delete studio booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getBookings,
  createBooking,
  updateBooking,
  deleteBooking
};
