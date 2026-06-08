const db = require('../db/connection');

const getEvents = async (req, res) => {
  try {
    const { employeeId } = req.query;
    const query = {};

    if (employeeId) {
      query.employeeId = employeeId;
    }

    const events = await db.Event.find(query);

    // Sort by eventDate descending
    events.sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));

    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await db.Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    console.error('Get event by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createEvent = async (req, res) => {
  try {
    const {
      employeeId,
      eventDate,
      eventType,
      employeeCharge,
      notes
    } = req.body;

    if (!employeeId || !eventDate || !eventType) {
      return res.status(400).json({ message: 'Employee ID, date, and type are required' });
    }

    const event = await db.Event.create({
      employeeId,
      eventDate,
      eventType,
      employeeCharge: Number(employeeCharge) || 0,
      notes: notes || ''
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await db.Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const updateData = { ...req.body };
    if (updateData.employeeCharge !== undefined) {
      updateData.employeeCharge = Number(updateData.employeeCharge);
    }

    const updatedEvent = await db.Event.findByIdAndUpdate(id, updateData, { new: true });
    res.json(updatedEvent);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.Event.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
};
