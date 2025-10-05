import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span className="logo-icon">🎫</span>
          HelpDesk Mini
        </Link>
        
        <div className="nav-menu">
          <Link to="/" className="nav-link">Dashboard</Link>
          {user?.role !== 'user' && (
            <Link to="/analytics" className="nav-link">Analytics</Link>
          )}
          <Link to="/create-ticket" className="nav-link create-ticket-btn">
            + New Ticket
          </Link>
        </div>

        <div className="nav-user">
          <div className="user-info">
            <span className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</span>
            <div className="user-details">
              <span className="user-name">{user?.name}</span>
              <span className="user-role">{user?.role}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;