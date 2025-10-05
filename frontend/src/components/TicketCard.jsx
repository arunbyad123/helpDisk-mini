import { Link } from 'react-router-dom';

function TicketCard({ ticket }) {
  const getPriorityClass = (priority) => {
    const classes = {
      'Low': 'priority-low',
      'Medium': 'priority-medium',
      'High': 'priority-high',
      'Critical': 'priority-critical'
    };
    return classes[priority] || 'priority-medium';
  };

  const getStatusClass = (status) => {
    const classes = {
      'Open': 'status-open',
      'In Progress': 'status-progress',
      'Resolved': 'status-resolved',
      'Closed': 'status-closed',
      'On Hold': 'status-hold'
    };
    return classes[status] || 'status-open';
  };

  const getSLAClass = (slaStatus) => {
    const classes = {
      'On-time': 'sla-ontime',
      'At-risk': 'sla-atrisk',
      'Breached': 'sla-breached'
    };
    return classes[slaStatus] || 'sla-ontime';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Link to={`/tickets/${ticket._id}`} className="ticket-card">
      <div className="ticket-header">
        <div className="ticket-number">{ticket.ticketNumber}</div>
        <div className="ticket-badges">
          <span className={`badge ${getPriorityClass(ticket.priority)}`}>
            {ticket.priority}
          </span>
          <span className={`badge ${getSLAClass(ticket.slaStatus)}`}>
            SLA: {ticket.slaStatus}
          </span>
        </div>
      </div>
      
      <h3 className="ticket-title">{ticket.title}</h3>
      <p className="ticket-description">{ticket.description.substring(0, 100)}...</p>
      
      <div className="ticket-meta">
        <span className="ticket-category">{ticket.category}</span>
        <span className={`ticket-status ${getStatusClass(ticket.status)}`}>
          {ticket.status}
        </span>
      </div>
      
      <div className="ticket-footer">
        <div className="ticket-user">
          <span className="user-avatar-small">
            {ticket.createdBy?.name?.charAt(0).toUpperCase()}
          </span>
          <span>{ticket.createdBy?.name}</span>
        </div>
        <span className="ticket-date">{formatDate(ticket.createdAt)}</span>
      </div>
      
      {ticket.assignedTo && (
        <div className="ticket-assigned">
          Assigned to: {ticket.assignedTo.name}
        </div>
      )}
    </Link>
  );
}

export default TicketCard;