import React, { useState, useEffect } from 'react';
import { useUser, ROLES } from '../utils/userContext';
import LoginModal from './LoginModal';

const Header = () => {
  const { user, logout, isAuthenticated } = useUser();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuOpen && !event.target.closest('.mobile-menu') && !event.target.closest('.menu-toggle')) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  const handleLoginClick = () => {
    setLoginModalOpen(true);
    setMobileMenuOpen(false);
  };

  const handleLogoutClick = () => {
    logout();
    setMobileMenuOpen(false);
  };

  const getRoleDisplay = () => {
    switch (user.role) {
      case ROLES.ADMIN:
        return 'Administrator';
      case ROLES.PLAYER:
        return 'Player';
      case ROLES.SCOREKEEPER:
        return 'Scorekeeper';
      default:
        return '';
    }
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo">
          <h1>The Skins Game</h1>
        </div>
        
        <div className="menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </div>
        
        <nav className={`user-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          {isAuthenticated() ? (
            <div className="user-info">
              <span className="user-role">{getRoleDisplay()}</span>
              {user.name && <span className="user-name">{user.name}</span>}
              <button className="nav-btn logout-btn" onClick={handleLogoutClick}>
                <i className="fas fa-sign-out-alt"></i> Logout
              </button>
            </div>
          ) : (
            <button className="nav-btn login-btn" onClick={handleLoginClick}>
              <i className="fas fa-sign-in-alt"></i> Login
            </button>
          )}
        </nav>
      </div>
      
      {/* Role-specific navigation for mobile view */}
      {mobileMenuOpen && isAuthenticated() && (
        <div className="mobile-menu">
          {user.role === ROLES.ADMIN && (
            <div className="mobile-nav admin-nav">
              <div className="nav-heading">Administrator Menu</div>
              <a href="#friends" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>Manage Players</a>
              <a href="#games" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>Manage Games</a>
              <a href="#grouping" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>Create Groups</a>
            </div>
          )}
          
          {user.role === ROLES.PLAYER && (
            <div className="mobile-nav player-nav">
              <div className="nav-heading">Player Menu</div>
              <a href="#upcoming" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>Upcoming Games</a>
              <a href="#signup" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>Sign Up</a>
              <a href="#history" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>My Games</a>
            </div>
          )}
          
          {user.role === ROLES.SCOREKEEPER && (
            <div className="mobile-nav scorekeeper-nav">
              <div className="nav-heading">Scorekeeper Menu</div>
              <a href="#score-entry" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>Enter Scores</a>
              <a href="#scorecard" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>View Scorecard</a>
            </div>
          )}
        </div>
      )}
      
      <LoginModal 
        isOpen={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)} 
      />
    </header>
  );
};

export default Header;
