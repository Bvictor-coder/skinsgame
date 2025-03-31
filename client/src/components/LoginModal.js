import React, { useState } from 'react';
import { useUser } from '../utils/userContext';

/**
 * Login Modal Component
 * 
 * This component handles user login for different roles
 */
const LoginModal = ({ isOpen, onClose, gameId, groupIndex }) => {
  const [role, setRole] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { loginAsAdmin, loginAsPlayer, loginAsScorekeeper } = useUser();
  
  // Don't render if not open
  if (!isOpen) return null;
  
  // Handle login attempt
  const handleLogin = () => {
    setError('');
    
    if (role === 'admin') {
      // For admin, allow access without password in this demo version
      loginAsAdmin();
      onClose();
    } else if (role === 'player') {
      // For player, ensure a player is selected
      if (playerId) {
        loginAsPlayer(playerId);
        onClose();
      } else {
        setError('Please select a player');
      }
    } else if (role === 'scorekeeper') {
      // For scorekeeper, validate password
      // For now, scorekeeper password is either gameId-groupIndex or 'scorekeeper123'
      const validPassword = gameId && groupIndex !== undefined 
        ? `${gameId}-${groupIndex}` 
        : 'scorekeeper123';
        
      // Display the password directly for this demo
      console.log("Valid scorekeeper password:", validPassword);
      
      if (password === validPassword) {
        loginAsScorekeeper(gameId, groupIndex, password);
        onClose();
      } else {
        setError('Invalid scorekeeper password');
      }
    } else {
      setError('Please select a role');
    }
  };
  
  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>Login</h3>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label>Login As:</label>
            <div className="role-options">
              <label>
                <input 
                  type="radio" 
                  name="role" 
                  value="player" 
                  checked={role === 'player'} 
                  onChange={() => {
                    setRole('player');
                    setError('');
                  }}
                />
                Player
              </label>
              
              <label>
                <input 
                  type="radio" 
                  name="role" 
                  value="admin" 
                  checked={role === 'admin'} 
                  onChange={() => {
                    setRole('admin');
                    setError('');
                  }}
                />
                Admin
              </label>
              
              <label>
                <input 
                  type="radio" 
                  name="role" 
                  value="scorekeeper" 
                  checked={role === 'scorekeeper'} 
                  onChange={() => {
                    setRole('scorekeeper');
                    setError('');
                  }}
                />
                Scorekeeper
              </label>
            </div>
          </div>
          
          {/* Show appropriate form based on role */}
          {role === 'player' && (
            <div className="form-group">
              <label>Select Player:</label>
              <select 
                value={playerId} 
                onChange={(e) => setPlayerId(e.target.value)}
              >
                <option value="">-- Select Player --</option>
                {/* Player options would be populated here */}
              </select>
            </div>
          )}
          
          {/* Only show password field for scorekeeper, not for admin */}
          {role === 'scorekeeper' && (
            <div className="form-group">
              <label>Password:</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter scorekeeper code"
              />
              
              {gameId && groupIndex !== undefined && (
                <div className="password-hint">
                  <p>Scorekeeper code format: <strong>{gameId}-{groupIndex}</strong></p>
                </div>
              )}
            </div>
          )}
          
          <div className="form-actions">
            <button className="btn btn-primary" onClick={handleLogin}>Login</button>
            <button className="btn" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
