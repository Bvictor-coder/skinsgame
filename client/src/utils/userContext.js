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
  // Initialize state from localStorage if available
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('golfSkinsUser');
    return savedUser ? JSON.parse(savedUser) : { 
      role: ROLES.GUEST,
      id: null,
      name: null,
      email: null,
    };
  });

  // Save user state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('golfSkinsUser', JSON.stringify(user));
  }, [user]);

  // Login as administrator
  const loginAsAdmin = (password) => {
    // In a real app, this would validate against a proper auth system
    // For now, we use a simple password check
    if (password === process.env.REACT_APP_ADMIN_PASSWORD || password === 'admin123') {
      setUser({
        role: ROLES.ADMIN,
        id: 'admin',
        name: 'Administrator',
        email: null
      });
      return true;
    }
    return false;
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
  const loginAsScorekeeper = (gameId, groupIndex, password) => {
    // In a production app, this would validate a proper token or credential
    // For now, we use a simple check
    if (password === `${gameId}-${groupIndex}` || password === 'scorekeeper123') {
      setUser({
        role: ROLES.SCOREKEEPER,
        id: null,
        gameId,
        groupIndex,
        name: `Scorekeeper - Game ${gameId}, Group ${groupIndex + 1}`,
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
