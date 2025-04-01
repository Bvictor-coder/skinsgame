import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the roles available in the application
export const ROLES = {
  ADMIN: 'admin',
  PLAYER: 'player',
  SCOREKEEPER: 'scorekeeper',
  GUEST: 'guest'
};

// Create the user context
const UserContext = createContext();

// Custom hook to use the user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// User provider component
export const UserProvider = ({ children }) => {
  // Initialize state from localStorage if available, with safety checks for SSR
  const [user, setUser] = useState(() => {
    // Default user state
    const defaultUser = {
      role: ROLES.GUEST,
      id: null,
      name: null,
      email: null,
    };
    
    // Check if we're in a browser environment before accessing localStorage
    if (typeof window === 'undefined' || !window.localStorage) {
      return defaultUser;
    }
    
    try {
      const savedUser = localStorage.getItem('golfSkinsUser');
      return savedUser ? JSON.parse(savedUser) : defaultUser;
    } catch (error) {
      console.error('Error reading user from localStorage:', error);
      return defaultUser;
    }
  });

  // Save user state to localStorage whenever it changes, with safety checks for SSR
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('golfSkinsUser', JSON.stringify(user));
      } catch (error) {
        console.error('Error saving user to localStorage:', error);
      }
    }
  }, [user]);

  // Login as administrator - no password required for this app
  const loginAsAdmin = () => {
    setUser({
      role: ROLES.ADMIN,
      id: 'admin',
      name: 'Administrator',
      email: null
    });
    return true;
  };

  // Login as player
  const loginAsPlayer = (playerId) => {
    // In a real app, this would validate the user's identity
    // For now, we just set the role based on the provided ID
    if (playerId) {
      setUser({
        role: ROLES.PLAYER,
        id: playerId,
        name: null, // Will be populated when friend data is loaded
        email: null
      });
      return true;
    }
    return false;
  };

  // Login as scorekeeper for a specific game and group
  const loginAsScorekeeper = (gameId, groupIndex, playerId, playerName = null) => {
    // Allow admin override with special codes
    if (playerId === 'ADMIN' || playerId === 'admin') {
      console.log('Using admin override for scorekeeper');
      setUser({
        role: ROLES.SCOREKEEPER,
        id: 'admin',
        gameId,
        groupIndex,
        isAdminOverride: true,
        name: `Scorekeeper (Admin) - Game ${gameId}, Group ${parseInt(groupIndex) + 1}`,
        email: null
      });
      return true;
    }
    
    // For legacy support - accept codes
    if (playerId === '0000' || playerId === '1234') {
      console.warn('Using deprecated access code authentication');
      setUser({
        role: ROLES.SCOREKEEPER,
        id: 'legacy-' + playerId,
        gameId,
        groupIndex,
        isLegacyAuth: true,
        name: `Scorekeeper - Game ${gameId}, Group ${parseInt(groupIndex) + 1}`,
        email: null
      });
      return true;
    }
    
    // Player-based authentication (primary method)
    if (playerId) {
      setUser({
        role: ROLES.SCOREKEEPER,
        id: playerId,
        gameId,
        groupIndex,
        name: playerName || `Scorekeeper - Game ${gameId}, Group ${parseInt(groupIndex) + 1}`,
        email: null
      });
      return true;
    }
    
    return false;
  };

  // Update user profile data
  const updateUserProfile = (profileData) => {
    setUser(prevUser => ({
      ...prevUser,
      ...profileData
    }));
  };

  // Logout
  const logout = () => {
    setUser({
      role: ROLES.GUEST,
      id: null,
      name: null,
      email: null
    });
  };

  // Check if the user has a specific role
  const hasRole = (role) => user.role === role;

  // Check if the user is authenticated
  const isAuthenticated = () => user.role !== ROLES.GUEST;

  return (
    <UserContext.Provider
      value={{
        user,
        loginAsAdmin,
        loginAsPlayer,
        loginAsScorekeeper,
        updateUserProfile,
        logout,
        hasRole,
        isAuthenticated
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;
