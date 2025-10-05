import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const API_URL = 'http://localhost:5000/api';

function Analytics() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'user') {
      // Redirect users to dashboard
      window.location.href = '/';
      return;
    }
    fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API_URL}/tickets/analytics/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </>
    );
  }

  if (!stats) return null;

  return (
    <>
      <Navbar />
      <div className="analytics-container">
        <h1>Analytics Dashboard</h1>
        <p className="subtitle">Overview of support ticket metrics and performance</p>

        {/* Overview Stats */}
        <div className="analytics-grid">
          <div className="analytics-card blue">
            <div className="card-icon">📊</div>
            <h3>{stats.totalTickets}</h3>
            <p>Total Tickets</p>
          </div>
          <div className="analytics-card green">
            <div className="card-icon">✅</div>
            <h3>{stats.resolvedTickets}</h3>
            <p>Resolved</p>
          </div>
          <div className="analytics-card yellow">
            <div className="card-icon">⚡</div>
            <h3>{stats.inProgressTickets}</h3>
            <p>In Progress</p>
          </div>
          <div className="analytics-card red">
            <div className="card-icon">🔴</div>
            <h3>{stats.openTickets}</h3>
            <p>Open</p>
          </div>
        </div>

        {/* SLA Metrics */}
        <div className="analytics-section">
          <h2>SLA Performance</h2>
          <div className="analytics-grid">
            <div className="analytics-card">
              <h3>{stats.breachedSLA}</h3>
              <p>SLA Breached</p>
              <div className="progress-bar">
                <div 
                  className="progress-fill red"
                  style={{ width: `${(stats.breachedSLA / stats.totalTickets * 100).toFixed(1)}%` }}
                />
              </div>
            </div>
            <div className="analytics-card">
              <h3>{stats.atRiskSLA}</h3>
              <p>At Risk</p>
              <div className="progress-bar">
                <div 
                  className="progress-fill yellow"
                  style={{ width: `${(stats.atRiskSLA / stats.totalTickets * 100).toFixed(1)}%` }}
                />
              </div>
            </div>
            <div className="analytics-card">
              <h3>{stats.avgResolutionTime}h</h3>
              <p>Avg Resolution Time</p>
            </div>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="analytics-section">
          <h2>Tickets by Category</h2>
          <div className="chart-container">
            {stats.ticketsByCategory.map((item, index) => (
              <div key={index} className="chart-bar">
                <div className="bar-label">{item._id}</div>
                <div className="bar-wrapper">
                  <div 
                    className="bar-fill"
                    style={{ 
                      width: `${(item.count / stats.totalTickets * 100).toFixed(1)}%`,
                      backgroundColor: `hsl(${index * 50}, 70%, 60%)`
                    }}
                  >
                    <span className="bar-value">{item.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="analytics-section">
          <h2>Tickets by Priority</h2>
          <div className="priority-grid">
            {stats.ticketsByPriority.map((item, index) => {
              const colors = {
                'Critical': '#ef4444',
                'High': '#f59e0b',
                'Medium': '#3b82f6',
                'Low': '#10b981'
              };
              return (
                <div key={index} className="priority-card" style={{ borderColor: colors[item._id] }}>
                  <div className="priority-circle" style={{ backgroundColor: colors[item._id] }}>
                    {item.count}
                  </div>
                  <h4>{item._id}</h4>
                  <p>{((item.count / stats.totalTickets) * 100).toFixed(1)}%</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="analytics-section">
          <h2>Tickets by Status</h2>
          <div className="status-grid">
            {stats.ticketsByStatus.map((item, index) => {
              const colors = {
                'Open': '#ef4444',
                'In Progress': '#f59e0b',
                'Resolved': '#10b981',
                'Closed': '#6b7280',
                'On Hold': '#8b5cf6'
              };
              return (
                <div key={index} className="status-card">
                  <div 
                    className="status-indicator"
                    style={{ backgroundColor: colors[item._id] }}
                  />
                  <div className="status-info">
                    <h4>{item.count}</h4>
                    <p>{item._id}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

export default Analytics;