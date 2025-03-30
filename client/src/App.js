import React, { useState, useEffect } from 'react';
import { UserProvider, useUser, ROLES } from './utils/userContext';
import Header from './components/Header';
import dataSync from './utils/dataSync';

// Main application component that handles role-based views
const AppContent = () => {
  const { user, isAuthenticated } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  
  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        // Initialize data from localStorage and sync with server
        await dataSync.initialize();
        setLoading(false);
      } catch (err) {
        console.error('Error initializing data:', err);
        setError('Error loading application data. Please refresh the page.');
        setLoading(false);
      }
    };
    
    initializeData();
  }, []);
  
  // Switch tabs when role changes to show appropriate default view
  useEffect(() => {
    if (isAuthenticated()) {
      switch (user.role) {
        case ROLES.ADMIN:
          setActiveTab('upcoming'); // Admin starts at upcoming games
          break;
        case ROLES.PLAYER:
          setActiveTab('signup'); // Players start at sign-up view
          break;
        case ROLES.SCOREKEEPER:
          setActiveTab('score-entry'); // Scorekeepers start at score entry
          break;
        default:
          setActiveTab('upcoming');
      }
    } else {
      setActiveTab('upcoming'); // Default tab for guests
    }
  }, [user, isAuthenticated]);
  
  // Handle tab change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };
  
  // Get available tabs based on user role
  const getTabs = () => {
    const tabs = [];
    
    // Available to all users
    tabs.push({ id: 'upcoming', label: 'Upcoming Games' });
    tabs.push({ id: 'rules', label: 'Game Rules' });
    
    if (isAuthenticated()) {
      switch (user.role) {
        case ROLES.ADMIN:
          // Admin-specific tabs
          tabs.push({ id: 'new-game', label: 'Create New Game' });
          tabs.push({ id: 'sign-up', label: 'Weekly Sign-up' });
          tabs.push({ id: 'grouping', label: 'Pairings & Groups' });
          tabs.push({ id: 'friends', label: 'Players' });
          tabs.push({ id: 'history', label: 'Game History' });
          break;
          
        case ROLES.PLAYER:
          // Player-specific tabs
          tabs.push({ id: 'sign-up', label: 'Sign Up' });
          tabs.push({ id: 'my-games', label: 'My Games' });
          tabs.push({ id: 'results', label: 'Results' });
          break;
          
        case ROLES.SCOREKEEPER:
          // Scorekeeper-specific tabs
          tabs.push({ id: 'score-entry', label: 'Enter Scores' });
          tabs.push({ id: 'scorecard', label: 'Scorecard' });
          break;
          
        default:
          break;
      }
    }
    
    return tabs;
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Golf Skins Organizer...</p>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button 
          className="btn" 
          onClick={() => window.location.reload()}
        >
          Refresh Page
        </button>
      </div>
    );
  }
  
  // Get the appropriate class for the body based on user role
  const getBodyClass = () => {
    if (!isAuthenticated()) return '';
    
    switch (user.role) {
      case ROLES.ADMIN:
        return 'role-admin';
      case ROLES.PLAYER:
        return 'role-player';
      case ROLES.SCOREKEEPER:
        return 'role-scorekeeper';
      default:
        return '';
    }
  };
  
  return (
    <div className={`app-container ${getBodyClass()}`}>
      <Header />
      
      <main>
        {/* Tab Navigation */}
        <div className="tabs">
          {getTabs().map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              data-tab={tab.id}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Tab Content - to be replaced with actual components later */}
        <div className="tab-content active">
          {activeTab === 'upcoming' && (
            <div id="upcoming">
              <h2>Upcoming Games</h2>
              <p className="empty-state">This tab will display upcoming games.</p>
            </div>
          )}
          
          {activeTab === 'rules' && (
            <div id="rules">
              <h2>Game Rules</h2>
              <p className="empty-state">This tab will display the game rules.</p>
            </div>
          )}
          
          {/* Admin Tabs */}
          {user.role === ROLES.ADMIN && (
            <>
              {activeTab === 'new-game' && (
                <div id="new-game">
                  <h2>Create New Game</h2>
                  <p className="empty-state">This tab will allow creating new games.</p>
                </div>
              )}
              
              {activeTab === 'sign-up' && (
                <div id="sign-up">
                  <h2>Weekly Sign-up</h2>
                  <p className="empty-state">This tab will display sign-up management.</p>
                </div>
              )}
              
              {activeTab === 'grouping' && (
                <div id="grouping">
                  <h2>Pairings & Groups</h2>
                  <p className="empty-state">This tab will display grouping interface.</p>
                </div>
              )}
              
              {activeTab === 'friends' && (
                <div id="friends">
                  <h2>Players</h2>
                  <p className="empty-state">This tab will display player management.</p>
                </div>
              )}
              
              {activeTab === 'history' && (
                <div id="history">
                  <h2>Game History</h2>
                  <p className="empty-state">This tab will display game history.</p>
                </div>
              )}
            </>
          )}
          
          {/* Player Tabs */}
          {user.role === ROLES.PLAYER && (
            <>
              {activeTab === 'sign-up' && (
                <div id="sign-up">
                  <h2>Sign Up for Games</h2>
                  <p className="empty-state">This tab will allow signing up for games.</p>
                </div>
              )}
              
              {activeTab === 'my-games' && (
                <div id="my-games">
                  <h2>My Games</h2>
                  <p className="empty-state">This tab will display your games.</p>
                </div>
              )}
              
              {activeTab === 'results' && (
                <div id="results">
                  <h2>Results</h2>
                  <p className="empty-state">This tab will display game results.</p>
                </div>
              )}
            </>
          )}
          
          {/* Scorekeeper Tabs */}
          {user.role === ROLES.SCOREKEEPER && (
            <>
              {activeTab === 'score-entry' && (
                <div id="score-entry">
                  <h2>Enter Scores</h2>
                  <p className="empty-state">This tab will allow entering scores.</p>
                </div>
              )}
              
              {activeTab === 'scorecard' && (
                <div id="scorecard">
                  <h2>Scorecard</h2>
                  <p className="empty-state">This tab will display the scorecard.</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      
      <footer>
        <p>Golf Skins Game Organizer &copy; 2025</p>
      </footer>
    </div>
  );
};

// Root component that wraps the app with providers
const App = () => {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
};

export default App;
