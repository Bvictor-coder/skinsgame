import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { UserProvider, useUser, ROLES } from './utils/userContext';
import store from './store';
import { initializeApp } from './store/actions/syncActions';
import Header from './components/Header';
import PlayersManagement from './components/PlayersManagement';
import NewGameForm from './components/NewGameForm';
import WeeklySignUpManagement from './components/WeeklySignUpManagement';
import GameHistory from './components/GameHistory';
import UpcomingGames from './components/UpcomingGames';
import PairingsAndGroups from './components/PairingsAndGroups';
import PlayerSignUp from './components/PlayerSignUp';
import ScoreCardPage from './components/ScoreCardPage';
import GameManagement from './components/GameManagement';
import dataSync from './utils/dataSync';
import { initializeDebugDashboard } from './utils/debugTools';
import DebugPanel from './components/DebugPanel';
import './styles.css'; // Import our enhanced styles
import './styles/ManualAdjustmentStyles.css'; // Import manual adjustment interface styles
import './styles/ShotgunStartStyles.css'; // Import shotgun start styles
import './styles/ScorecardStyles.css'; // Import scorecard styles
import './styles/GameManagementStyles.css'; // Import game management styles

// Import the simplified component for debugging
import SimplePairingsAndGroups from './components/SimplePairingsAndGroups';

// Import test components regardless of environment
const GameManagementRedux = React.lazy(() => import('./components/examples/GameManagementRedux'));
const GameStateMachineTest = React.lazy(() => import('./components/examples/GameStateMachineTest'));
const DatabaseSyncExample = React.lazy(() => import('./components/examples/DatabaseSyncExample'));
const GameLifecycleTest = React.lazy(() => import('./examples/GameLifecycleTest'));

// Set this to true to use the simplified version for debugging
const USE_SIMPLIFIED_GROUPS = false;

// Main application component that handles role-based views
const AppContent = () => {
  const { user, isAuthenticated } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  
  // Initialize data and debug tools
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        // Initialize data from localStorage and sync with server
        await dataSync.initialize();
        
        // Initialize debug dashboard in development
        if (process.env.NODE_ENV !== 'production') {
          initializeDebugDashboard();
          console.log('%c🏌️‍♂️ Golf Skins Debug Dashboard Available 🏌️‍♀️', 
            'background: #2a9d8f; color: white; padding: 8px; border-radius: 4px; font-size: 14px;');
          console.log('Type GolfSkinsDebug in the console to access debugging tools');
        }
        
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
          setActiveTab('friends'); // Admin starts at Players management tab
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
          tabs.push({ id: 'game-management', label: 'Game Management' });
          tabs.push({ id: 'new-game', label: 'Create New Game' });
          tabs.push({ id: 'admin-sign-up', label: 'Weekly Sign-up' });
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
        <p>Loading The Skins Game...</p>
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
              <UpcomingGames />
            </div>
          )}
          
          {/* Removed duplicate component rendering for 'grouping' tab */}
          
          {activeTab === 'rules' && (
            <div id="rules">
              <h2>Game Rules</h2>
              <p className="empty-state">This tab will display the game rules.</p>
            </div>
          )}
          
          {/* Admin Tabs */}
  {user.role === ROLES.ADMIN && (
    <>
      {activeTab === 'game-management' && (
        <div id="game-management">
          <GameManagement />
        </div>
      )}
      
      {activeTab === 'new-game' && (
        <div id="new-game">
          <NewGameForm />
        </div>
      )}
      
      {activeTab === 'admin-sign-up' && (
        <div id="admin-sign-up">
          <WeeklySignUpManagement />
        </div>
      )}
      
      {activeTab === 'grouping' && (
        <div id="grouping">
          {console.log("Rendering PairingsAndGroups in admin section")}
          {/* Use the simplified component or the full one based on the flag */}
          {USE_SIMPLIFIED_GROUPS ? (
            <SimplePairingsAndGroups />
          ) : (
            <PairingsAndGroups />
          )}
        </div>
      )}
              
              {activeTab === 'friends' && (
                <div id="friends">
                  <PlayersManagement />
                </div>
              )}
              
              {activeTab === 'history' && (
                <div id="history">
                  <GameHistory />
                </div>
              )}
            </>
          )}
          
          {/* Player Tabs */}
          {user.role === ROLES.PLAYER && (
            <>
              {activeTab === 'sign-up' && (
                <div id="sign-up">
                  <PlayerSignUp />
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
        <p>The Skins Game &copy; 2025</p>
      </footer>
    </div>
  );
};

// Define routes-based app
const AppRoutes = () => {
  // Remove unused navigate variable
  return (
    <Routes>
      {/* Main tab-based interface */}
      <Route path="/" element={<AppContent />} />
      
      {/* Scorecard page with gameId and groupId parameters */}
      <Route path="/scorecard/:gameId/:groupId" element={<ScoreCardPage />} />
      
      {/* Test routes for new architecture */}
      {/* Routes are now always available, even in production */}
      <>
        <Route 
          path="/test-redux" 
          element={
            <React.Suspense fallback={<div>Loading...</div>}>
              {GameManagementRedux ? <GameManagementRedux /> : <div>Component not available in production</div>}
            </React.Suspense>
          }
        />
        <Route 
          path="/test-state-machine" 
          element={
            <React.Suspense fallback={<div>Loading...</div>}>
              {GameStateMachineTest ? <GameStateMachineTest /> : <div>Component not available in production</div>}
            </React.Suspense>
          }
        />
        <Route 
          path="/test-db-sync" 
          element={
            <React.Suspense fallback={<div>Loading...</div>}>
              {DatabaseSyncExample ? <DatabaseSyncExample /> : <div>Component not available in production</div>}
            </React.Suspense>
          }
        />
        <Route 
          path="/test-lifecycle" 
          element={
            <React.Suspense fallback={<div>Loading...</div>}>
              {GameLifecycleTest ? <GameLifecycleTest /> : <div>Component not available in production</div>}
            </React.Suspense>
          }
        />
      </>
      
      {/* Redirect all other paths to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Root component that wraps the app with providers and router
const App = () => {
  useEffect(() => {
    // Initialize the Redux store
    store.dispatch(initializeApp());
  }, []);

  return (
    <ReduxProvider store={store}>
      <UserProvider>
        <Router>
          <React.Suspense fallback={<div>Loading...</div>}>
            <AppRoutes />
          </React.Suspense>
          {process.env.NODE_ENV !== 'production' && <DebugPanel />}
        </Router>
      </UserProvider>
    </ReduxProvider>
  );
};

export default App;
