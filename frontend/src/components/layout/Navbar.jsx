import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconButton } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          Revision History
        </Link>

        <div className="navbar-menu">
          {isAuthenticated && (
            <>
              <Link to="/stories" className="navbar-link">
                My Stories
              </Link>
              <span className="navbar-user">{user?.email}</span>
            </>
          )}
          <IconButton 
            onClick={toggleDarkMode} 
            color="inherit"
            size="small"
            aria-label="toggle dark mode"
          >
            {darkMode ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
          {isAuthenticated && (
            <button onClick={handleLogout} className="btn btn-secondary btn-sm">
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

