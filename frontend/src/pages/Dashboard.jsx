import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import TicketCard from '../components/TicketCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function Dashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    search: ''
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [filters, tickets]);

  const fetchTickets = async () => {
    try {
      const response = await axios.get(`${API_URL}/tickets`);
      setTickets(response.data);
      setFilteredTickets(response.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTickets = () => {
    let result = [...tickets];

    if (filters.status) {
      result = result.filter(t => t.status === filters.status);
    }
    if (filters.priority) {
      result = result.filter(t => t.priority === filters.priority);
    }
    if (filters.category) {
      result = result.filter(t => t.category === filters.category);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search) ||
        t.ticketNumber.toLowerCase().includes(search)
      );
    }

    setFilteredTickets(result);
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      category: '',
      search: ''
    });
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'Open').length,
    inProgress: tickets.filter(t => t.status === 'In Progress').length,
    resolved: tickets.filter(t => t.status === 'Resolved').length
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Loading tickets...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Support Tickets Dashboard</h1>
          <Link to="/create-ticket" className="btn-primary">
            + Create New Ticket
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">📊</div>
            <div className="stat-content">
              <h3>{stats.total}</h3>
              <p>Total Tickets</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon red">🔴</div>
            <div className="stat-content">
              <h3>{stats.open}</h3>
              <p>Open</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon yellow">⚡</div>
            <div className="stat-content">
              <h3>{stats.inProgress}</h3>
              <p>In Progress</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">✅</div>
            <div className="stat-content">
              <h3>{stats.resolved}</h3>
              <p>Resolved</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <input
            type="text"
            placeholder="Search tickets..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="search-input"
          />
          
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
            <option value="On Hold">On Hold</option>
          </select>

          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="filter-select"
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>

          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="filter-select"
          >
            <option value="">All Categories</option>
            <option value="Technical">Technical</option>
            <option value="Billing">Billing</option>
            <option value="General">General</option>
            <option value="Network">Network</option>
            <option value="Hardware">Hardware</option>
            <option value="Software">Software</option>
          </select>

          <button onClick={clearFilters} className="btn-secondary">
            Clear Filters
          </button>
        </div>

        {/* Tickets Grid */}
        <div className="tickets-section">
          <h2>Tickets ({filteredTickets.length})</h2>
          {filteredTickets.length === 0 ? (
            <div className="empty-state">
              <p>No tickets found</p>
              <Link to="/create-ticket" className="btn-primary">
                Create your first ticket
              </Link>
            </div>
          ) : (
            <div className="tickets-grid">
              {filteredTickets.map(ticket => (
                <TicketCard key={ticket._id} ticket={ticket} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Dashboard;