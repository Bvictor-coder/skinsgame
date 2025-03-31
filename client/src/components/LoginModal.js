import React, { useState, useEffect } from 'react';
import { useUser } from '../utils/userContext';
import dataSync from '../utils/dataSync';

const LoginModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('admin');
  // We don't need password for admin login in this simplified version
  const [adminPassword] = useState('');
  const [playerEmail, setPlayerEmail] = useState('');
  const [scorekeeperCode, setScorekeeperCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState([]);

  const { loginAsAdmin, loginAsPlayer, loginAsScorekeeper } = useUser();

  // Load players for dropdown
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        const players = await dataSync.getFriends();
        setPlayers(players);
      } catch (err) {
        console.error('Error loading players:', err);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'player') {
      fetchPlayers();
    }
  }, [activeTab]);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const success = loginAsAdmin(adminPassword);
      if (success) {
        onClose();
      } else {
        setError('Invalid administrator password');
      }
    } catch (err) {
      setError('Error during login. Please try again.');
      console.error(err);
    }
  };

  const handlePlayerLogin = (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // Find player by email
      const player = players.find(p => p.email.toLowerCase() === playerEmail.toLowerCase());
      
      if (player) {
        const success = loginAsPlayer(player.id);
        if (success) {
          onClose();
        } else {
          setError('Error during login. Please try again.');
        }
      } else {
        setError('Player not found with that email');
      }
    } catch (err) {
      setError('Error during login. Please try again.');
      console.error(err);
    }
  };

  const handleScorekeeperLogin = (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // For simplicity, we'll just check if the code follows the pattern gameId-groupIndex
      const codeParts = scorekeeperCode.split('-');
      
      if (codeParts.length === 2) {
        const gameId = codeParts[0];
        const groupIndex = parseInt(codeParts[1], 10);
        
        if (!isNaN(groupIndex)) {
          const success = loginAsScorekeeper(gameId, groupIndex, scorekeeperCode);
          if (success) {
            onClose();
          } else {
            setError('Invalid scorekeeper code');
          }
        } else {
          setError('Invalid scorekeeper code format');
        }
      } else {
        setError('Invalid scorekeeper code format. Should be: gameId-groupIndex');
      }
    } catch (err) {
      setError('Error during login. Please try again.');
      console.error(err);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal" style={{ display: 'block' }}>
      <div className="modal-content">
        <span className="close-modal" onClick={onClose}>&times;</span>
        <h2>Login</h2>
        
        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => { setActiveTab('admin'); setError(''); }}
          >
            Administrator
          </button>
          <button 
            className={`tab-btn ${activeTab === 'player' ? 'active' : ''}`}
            onClick={() => { setActiveTab('player'); setError(''); }}
          >
            Player
          </button>
          <button 
            className={`tab-btn ${activeTab === 'scorekeeper' ? 'active' : ''}`}
            onClick={() => { setActiveTab('scorekeeper'); setError(''); }}
          >
            Scorekeeper
          </button>
        </div>
        
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}
        
        {/* Administrator Login */}
        <div className={`tab-content ${activeTab === 'admin' ? 'active' : ''}`}>
          <div className="form-actions" style={{ marginTop: '20px' }}>
            <button onClick={handleAdminLogin} className="btn">Login as Administrator</button>
          </div>
        </div>
        
        {/* Player Login */}
        <div className={`tab-content ${activeTab === 'player' ? 'active' : ''}`}>
          <form onSubmit={handlePlayerLogin}>
            <div className="form-group">
              <label htmlFor="player-email">Your Email</label>
              <input 
                type="email" 
                id="player-email"
                value={playerEmail}
                onChange={(e) => setPlayerEmail(e.target.value)}
                required
                placeholder="Enter your registered email"
              />
              <p className="hint">Enter the email you used when signing up with the organizer</p>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Loading...' : 'Login as Player'}
              </button>
            </div>
          </form>
        </div>
        
        {/* Scorekeeper Login */}
        <div className={`tab-content ${activeTab === 'scorekeeper' ? 'active' : ''}`}>
          <form onSubmit={handleScorekeeperLogin}>
            <div className="form-group">
              <label htmlFor="scorekeeper-code">Scorekeeper Access Code</label>
              <input 
                type="text" 
                id="scorekeeper-code"
                value={scorekeeperCode}
                onChange={(e) => setScorekeeperCode(e.target.value)}
                required
                placeholder="Game-Group format (e.g., 123456-0)"
              />
              <p className="hint">Enter the access code provided by the game organizer</p>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn">Login as Scorekeeper</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
