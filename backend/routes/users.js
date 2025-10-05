import express from 'express';
import User from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all agents (for ticket assignment)
router.get('/agents', authenticate, async (req, res) => {
  try {
    const agents = await User.find({ 
      role: { $in: ['agent', 'admin'] },
      isActive: true
    }).select('name email department role');
    
    res.json(agents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching agents', error: error.message });
  }
});

// Get all users (admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Update user role (admin only)
router.put('/:id/role', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'agent', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user role', error: error.message });
  }
});

// Deactivate user (admin only)
router.patch('/:id/deactivate', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: 'User deactivated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deactivating user', error: error.message });
  }
});

export default router;