import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  attachments: [{
    filename: String,
    url: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ticketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    unique: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  category: {
    type: String,
    enum: ['Technical', 'Billing', 'General', 'Network', 'Hardware', 'Software', 'Account'],
    default: 'General'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed', 'On Hold'],
    default: 'Open'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  comments: [commentSchema],
  slaDeadline: {
    type: Date
    // REMOVED required: true - let the pre-save hook set it
  },
  slaStatus: {
    type: String,
    enum: ['On-time', 'At-risk', 'Breached'],
    default: 'On-time'
  },
  resolvedAt: Date,
  tags: [String],
  attachments: [{
    filename: String,
    url: String
  }]
}, { 
  timestamps: true 
});

// Generate ticket number and set SLA deadline BEFORE validation
ticketSchema.pre('validate', async function(next) {
  if (this.isNew) {
    // Generate ticket number
    const count = await mongoose.model('Ticket').countDocuments();
    this.ticketNumber = `TKT-${String(count + 1).padStart(6, '0')}`;
    
    // Set SLA deadline based on priority (4 hours default, 2 hours for critical)
    const hours = this.priority === 'Critical' ? 2 : 4;
    this.slaDeadline = new Date(Date.now() + hours * 60 * 60 * 1000);
  }
  next();
});

// Update SLA status before saving
ticketSchema.pre('save', function(next) {
  // Update SLA status
  const now = new Date();
  const timeLeft = this.slaDeadline - now;
  const oneHour = 60 * 60 * 1000;
  
  if (this.status === 'Resolved' || this.status === 'Closed') {
    if (this.resolvedAt) {
      this.slaStatus = this.resolvedAt <= this.slaDeadline ? 'On-time' : 'Breached';
    }
  } else if (timeLeft < 0) {
    this.slaStatus = 'Breached';
  } else if (timeLeft < oneHour) {
    this.slaStatus = 'At-risk';
  } else {
    this.slaStatus = 'On-time';
  }
  
  next();
});

export default mongoose.model('Ticket', ticketSchema);