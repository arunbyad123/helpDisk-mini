import express from 'express';
import Ticket from '../models/Ticket.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all tickets
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, priority, category, search } = req.query;
    const filter = {};
    
    // Users can only see their tickets, agents/admins see all
    if (req.user.role === 'user') {
      filter.createdBy = req.user._id;
    }
    
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { ticketNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    const tickets = await Ticket.find(filter)
      .populate('createdBy', 'name email department')
      .populate('assignedTo', 'name email department')
      .populate('comments.user', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tickets', error: error.message });
  }
});

// Get single ticket
router.get('/:id', authenticate, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('createdBy', 'name email department avatar')
      .populate('assignedTo', 'name email department avatar')
      .populate('comments.user', 'name email avatar');
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    // Check access
    if (req.user.role === 'user' && ticket.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching ticket', error: error.message });
  }
});

// Create ticket
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, category, priority, tags } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }
    
    const ticket = new Ticket({
      title,
      description,
      category: category || 'General',
      priority: priority || 'Medium',
      createdBy: req.user._id,
      tags: tags || []
    });
    
    await ticket.save();
    await ticket.populate('createdBy', 'name email department');
    
    // Emit socket event
    req.app.get('io').emit('ticket_created', ticket);
    
    res.status(201).json({
      message: 'Ticket created successfully',
      ticket
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating ticket', error: error.message });
  }
});

// Update ticket
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { status, priority, assignedTo, category } = req.body;
    
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    // Only agents and admins can update tickets
    if (req.user.role === 'user' && ticket.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    if (status) {
      ticket.status = status;
      if (status === 'Resolved' || status === 'Closed') {
        ticket.resolvedAt = new Date();
      }
    }
    if (priority) ticket.priority = priority;
    if (assignedTo) ticket.assignedTo = assignedTo;
    if (category) ticket.category = category;
    
    await ticket.save();
    await ticket.populate(['createdBy', 'assignedTo', 'comments.user']);
    
    // Emit socket event
    req.app.get('io').to(`ticket_${ticket._id}`).emit('ticket_updated', ticket);
    
    res.json({
      message: 'Ticket updated successfully',
      ticket
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating ticket', error: error.message });
  }
});

// Delete ticket (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting ticket', error: error.message });
  }
});

// Add comment
router.post('/:id/comments', authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Comment content is required' });
    }
    
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    ticket.comments.push({
      user: req.user._id,
      content
    });
    
    await ticket.save();
    await ticket.populate('comments.user', 'name email avatar');
    
    const newComment = ticket.comments[ticket.comments.length - 1];
    
    // Emit socket event
    req.app.get('io').to(`ticket_${ticket._id}`).emit('comment_added', {
      ticketId: ticket._id,
      comment: newComment
    });
    
    res.json({
      message: 'Comment added successfully',
      comment: newComment
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
});

// Get analytics
router.get('/analytics/stats', authenticate, authorize('agent', 'admin'), async (req, res) => {
  try {
    const totalTickets = await Ticket.countDocuments();
    const openTickets = await Ticket.countDocuments({ status: 'Open' });
    const inProgressTickets = await Ticket.countDocuments({ status: 'In Progress' });
    const resolvedTickets = await Ticket.countDocuments({ status: 'Resolved' });
    const closedTickets = await Ticket.countDocuments({ status: 'Closed' });
    const breachedSLA = await Ticket.countDocuments({ slaStatus: 'Breached' });
    const atRiskSLA = await Ticket.countDocuments({ slaStatus: 'At-risk' });
    
    const ticketsByCategory = await Ticket.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const ticketsByPriority = await Ticket.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const ticketsByStatus = await Ticket.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Average resolution time
    const resolvedTicketsWithTime = await Ticket.find({
      status: { $in: ['Resolved', 'Closed'] },
      resolvedAt: { $exists: true }
    });
    
    let avgResolutionTime = 0;
    if (resolvedTicketsWithTime.length > 0) {
      const totalTime = resolvedTicketsWithTime.reduce((sum, ticket) => {
        return sum + (ticket.resolvedAt - ticket.createdAt);
      }, 0);
      avgResolutionTime = Math.round(totalTime / resolvedTicketsWithTime.length / (1000 * 60 * 60)); // in hours
    }
    
    res.json({
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      breachedSLA,
      atRiskSLA,
      avgResolutionTime,
      ticketsByCategory,
      ticketsByPriority,
      ticketsByStatus
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
});

export default router;