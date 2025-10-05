import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const API_URL = 'http://localhost:5000/api';
const socket = io('http://localhost:5000');

function TicketDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [agents, setAgents] = useState([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchTicket();
    fetchAgents();

    // Join socket room for this ticket
    socket.emit('join_ticket', id);

    // Listen for real-time updates
    socket.on('ticket_updated', (updatedTicket) => {
      if (updatedTicket._id === id) {
        setTicket(updatedTicket);
      }
    });

    socket.on('comment_added', ({ ticketId, comment: newComment }) => {
      if (ticketId === id) {
        setTicket(prev => ({
          ...prev,
          comments: [...prev.comments, newComment]
        }));
      }
    });

    return () => {
      socket.emit('leave_ticket', id);
      socket.off('ticket_updated');
      socket.off('comment_added');
    };
  }, [id]);

  const fetchTicket = async () => {
    try {
      const response = await axios.get(`${API_URL}/tickets/${id}`);
      setTicket(response.data);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      alert('Failed to load ticket');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await axios.get(`${API_URL}/users/agents`);
      setAgents(response.data);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      await axios.post(`${API_URL}/tickets/${id}/comments`, {
        content: comment
      });
      setComment('');
    } catch (error) {
      alert('Failed to add comment');
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    setUpdating(true);
    try {
      await axios.put(`${API_URL}/tickets/${id}`, { status: newStatus });
      alert('Status updated successfully');
    } catch (error) {
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePriority = async (newPriority) => {
    setUpdating(true);
    try {
      await axios.put(`${API_URL}/tickets/${id}`, { priority: newPriority });
      alert('Priority updated successfully');
    } catch (error) {
      alert('Failed to update priority');
    } finally {
      setUpdating(false);
    }
  };

  const handleAssign = async (agentId) => {
    setUpdating(true);
    try {
      await axios.put(`${API_URL}/tickets/${id}`, { assignedTo: agentId });
      alert('Ticket assigned successfully');
    } catch (error) {
      alert('Failed to assign ticket');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Loading ticket...</p>
        </div>
      </>
    );
  }

  if (!ticket) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSLAColor = (slaStatus) => {
    const colors = {
      'On-time': '#10b981',
      'At-risk': '#f59e0b',
      'Breached': '#ef4444'
    };
    return colors[slaStatus] || '#6b7280';
  };

  return (
    <>
      <Navbar />
      <div className="ticket-details-container">
        <div className="ticket-details-header">
          <button onClick={() => navigate('/')} className="back-btn">
            ← Back to Dashboard
          </button>
          <h1>{ticket.ticketNumber}</h1>
        </div>

        <div className="ticket-details-layout">
          {/* Main Content */}
          <div className="ticket-main">
            <div className="ticket-info-card">
              <div className="ticket-info-header">
                <h2>{ticket.title}</h2>
                <div className="ticket-badges">
                  <span className={`badge priority-${ticket.priority.toLowerCase()}`}>
                    {ticket.priority}
                  </span>
                  <span className={`badge status-${ticket.status.toLowerCase().replace(' ', '-')}`}>
                    {ticket.status}
                  </span>
                </div>
              </div>

              <div className="ticket-description">
                <h3>Description</h3>
                <p>{ticket.description}</p>
              </div>

              <div className="ticket-meta-info">
                <div className="meta-item">
                  <strong>Category:</strong> {ticket.category}
                </div>
                <div className="meta-item">
                  <strong>Created:</strong> {formatDate(ticket.createdAt)}
                </div>
                <div className="meta-item">
                  <strong>Created By:</strong> {ticket.createdBy.name}
                </div>
                {ticket.assignedTo && (
                  <div className="meta-item">
                    <strong>Assigned To:</strong> {ticket.assignedTo.name}
                  </div>
                )}
              </div>

              {ticket.tags && ticket.tags.length > 0 && (
                <div className="ticket-tags">
                  {ticket.tags.map((tag, index) => (
                    <span key={index} className="tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div className="comments-section">
              <h3>Comments ({ticket.comments.length})</h3>
              
              <div className="comments-list">
                {ticket.comments.map((comment) => (
                  <div key={comment._id} className="comment">
                    <div className="comment-header">
                      <div className="comment-user">
                        <span className="user-avatar-small">
                          {comment.user.name.charAt(0).toUpperCase()}
                        </span>
                        <strong>{comment.user.name}</strong>
                      </div>
                      <span className="comment-date">{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className="comment-content">{comment.content}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddComment} className="comment-form">
                <textarea
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />
                <button type="submit" className="btn-primary">
                  Add Comment
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="ticket-sidebar">
            {/* SLA Status */}
            <div className="sidebar-card sla-card">
              <h3>SLA Status</h3>
              <div 
                className="sla-indicator"
                style={{ backgroundColor: getSLAColor(ticket.slaStatus) }}
              >
                {ticket.slaStatus}
              </div>
              <p className="sla-deadline">
                Deadline: {formatDate(ticket.slaDeadline)}
              </p>
            </div>

            {/* Actions (for agents/admins) */}
            {user?.role !== 'user' && (
              <>
                <div className="sidebar-card">
                  <h3>Update Status</h3>
                  <select
                    value={ticket.status}
                    onChange={(e) => handleUpdateStatus(e.target.value)}
                    disabled={updating}
                    className="sidebar-select"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>

                <div className="sidebar-card">
                  <h3>Update Priority</h3>
                  <select
                    value={ticket.priority}
                    onChange={(e) => handleUpdatePriority(e.target.value)}
                    disabled={updating}
                    className="sidebar-select"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div className="sidebar-card">
                  <h3>Assign To</h3>
                  <select
                    value={ticket.assignedTo?._id || ''}
                    onChange={(e) => handleAssign(e.target.value)}
                    disabled={updating}
                    className="sidebar-select"
                  >
                    <option value="">Unassigned</option>
                    {agents.map(agent => (
                      <option key={agent._id} value={agent._id}>
                        {agent.name} ({agent.department})
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default TicketDetails;