import React from 'react';
import PropTypes from 'prop-types';
import { getStatusLabel } from '../models/GameStatus';
import gameLifecycleManager from '../utils/GameLifecycleManager';
import '../styles/GameStatusTimeline.css';

/**
 * GameStatusTimeline Component
 * 
 * A visual timeline showing the progression of a game through its different statuses.
 * Displays transitions with dates/times and highlights the current status.
 */
const GameStatusTimeline = ({ game, className = '' }) => {
  if (!game) return null;
  
  // Get formatted status history
  const statusHistory = gameLifecycleManager.formatStatusHistory(game);
  
  // Define the expected status flow for reference
  const standardFlow = [
    'created',
    'open',
    'enrollment_complete',
    'in_progress',
    'completed',
    'finalized'
  ];
  
  // Check if a status has been reached (ever)
  const isStatusReached = (status) => {
    return statusHistory.some(entry => entry.status === status);
  };
  
  // Get the timestamp for a specific status
  const getStatusTimestamp = (status) => {
    const entry = statusHistory.find(entry => entry.status === status);
    return entry ? entry.timestamp : null;
  };
  
  // Format a timestamp in a human-readable format
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Get time elapsed between two statuses
  const getElapsedTime = (startStatus, endStatus) => {
    const startTime = getStatusTimestamp(startStatus);
    const endTime = getStatusTimestamp(endStatus);
    
    if (!startTime || !endTime) return null;
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    
    // Return based on duration
    if (diffMs < 60000) {
      // Less than a minute
      return 'Just now';
    } else if (diffMs < 3600000) {
      // Less than an hour
      return `${Math.round(diffMs / 60000)} min`;
    } else if (diffMs < 86400000) {
      // Less than a day
      return `${Math.round(diffMs / 3600000)} hr`;
    } else {
      // Days
      return `${Math.round(diffMs / 86400000)} days`;
    }
  };
  
  // Check if a status is the current one
  const isCurrentStatus = (status) => {
    return game.status === status;
  };
  
  return (
    <div className={`game-status-timeline ${className}`}>
      <h3 className="timeline-title">Game Lifecycle</h3>
      
      <div className="timeline-container">
        {/* Timeline Track */}
        <div className="timeline-track"></div>
        
        {/* Status Points */}
        {standardFlow.map((status, index) => {
          const reached = isStatusReached(status);
          const isCurrent = isCurrentStatus(status);
          const timestamp = getStatusTimestamp(status);
          
          // Get elapsed time from previous status if applicable
          let elapsedTime = null;
          if (index > 0 && reached) {
            elapsedTime = getElapsedTime(standardFlow[index - 1], status);
          }
          
          return (
            <div 
              key={status}
              className={`timeline-point ${reached ? 'reached' : ''} ${isCurrent ? 'current' : ''}`}
              style={{ left: `${(index / (standardFlow.length - 1)) * 100}%` }}
            >
              <div className="timeline-marker"></div>
              
              <div className="timeline-label">
                <div className="status-name">{getStatusLabel(status)}</div>
                {timestamp && (
                  <div className="status-time">{formatTimestamp(timestamp)}</div>
                )}
                {elapsedTime && (
                  <div className="elapsed-time">
                    <i className="fas fa-clock"></i> {elapsedTime}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {/* Progress Bar */}
        <div 
          className="timeline-progress" 
          style={{ 
            width: `${(standardFlow.indexOf(game.status) / (standardFlow.length - 1)) * 100}%`
          }}
        ></div>
      </div>
      
      {/* Detailed History */}
      {statusHistory.length > 0 && (
        <div className="timeline-history">
          <h4 className="history-title">Status Changes</h4>
          <div className="history-entries">
            {statusHistory.map((entry, index) => (
              <div key={index} className="history-entry">
                <div className="history-time">
                  {new Date(entry.timestamp).toLocaleString()}
                </div>
                <div className="history-change">
                  {entry.previousStatusLabel && (
                    <>
                      <span className="previous-status">{entry.previousStatusLabel}</span>
                      <i className="fas fa-arrow-right change-arrow"></i>
                    </>
                  )}
                  <span className="new-status">{entry.statusLabel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

GameStatusTimeline.propTypes = {
  // Game object with status and history
  game: PropTypes.object.isRequired,
  
  // Additional CSS class
  className: PropTypes.string
};

export default GameStatusTimeline;
