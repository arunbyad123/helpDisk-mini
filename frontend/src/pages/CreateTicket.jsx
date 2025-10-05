import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function CreateTicket() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General',
    priority: 'Medium',
    tags: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    const tagsArray = formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [];
    
    console.log('Sending ticket data:', { ...formData, tags: tagsArray }); // Debug log
    
    const response = await axios.post(`${API_URL}/tickets`, {
      ...formData,
      tags: tagsArray
    });

    alert('Ticket created successfully!');
    navigate(`/tickets/${response.data.ticket._id}`);
  } catch (err) {
    console.error('Full error:', err); // Detailed error
    console.error('Error response:', err.response?.data); // Backend error
    setError(err.response?.data?.message || err.message || 'Failed to create ticket');
  } finally {
    setLoading(false);
  }
};
  return (
    <>
      <Navbar />
      <div className="create-ticket-container">
        <div className="create-ticket-card">
          <h1>Create New Support Ticket</h1>
          <p className="subtitle">Fill out the form below to submit a new support request</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="ticket-form">
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                id="title"
                type="text"
                name="title"
                placeholder="Brief description of your issue"
                value={formData.title}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                placeholder="Provide detailed information about your issue..."
                value={formData.description}
                onChange={handleChange}
                required
                disabled={loading}
                rows={6}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="General">General</option>
                  <option value="Technical">Technical</option>
                  <option value="Billing">Billing</option>
                  <option value="Network">Network</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Software">Software</option>
                  <option value="Account">Account</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="tags">Tags (comma-separated)</label>
              <input
                id="tags"
                type="text"
                name="tags"
                placeholder="e.g., urgent, payment, login"
                value={formData.tags}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => navigate('/')}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Ticket'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default CreateTicket;