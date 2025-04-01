import React from 'react';
import PropTypes from 'prop-types';
import { getStatusLabel } from '../models/GameStatus';
import gameLifecycleManager from '../utils/GameLifecycleManager';
import '../styles/EnhancedStatusBadge.css';

/**
 * EnhancedStatusBadge Component
 * 
 * An improved status badge that provides richer visual feedback about game status
 * and can optionally display additional lifecycle information
 */
const EnhancedStatusBadge = ({ 
  status, 
  game,
  size = 'medium',
  showTimestamp = false,
  showActions = false,
  onActionClick = null,
  className = ''
}) => {
  // Get formatted timestamp if available and requested
  const getFormattedTimestamp = () => {
    if (!showTimestamp || !game) return null;
    
    const timestampEntries = gameLifecycleManager.formatStatusHistory(game);
    const statusEntry = timestampEntries.find(entry => entry.status === status);
    
    if (!statusEntry) return null;
    
    return (
      <div className="status-timestamp">
        <span className="timestamp-date">{statusEntry.formattedDate}</span>
        <span className="timestamp-time">{statusEntry.formattedTime}</span>
      </div>
    );
  };
  
  // Get available actions for this status
  const getActions = () => {
    if (!showActions || !game || !onActionClick) return null;
    
    const availableActions = gameLifecycleManager.getAvailableActions(game);
    
    if (availableActions.length === 0) return null;
    
    return (
      <div className="status-actions">
        {availableActions.map(action => (
          <button 
            key={action.id}
            className="status-action-button"
            onClick={() => onActionClick(action.nextStatus)}
            title={`Transition to ${getStatusLabel(action.nextStatus)}`}
          >
            {action.label}
          </button>
        ))}
      </div>
    );
  };
  
  // Get phase info (setup, registration, play, completed)
  const getPhaseIcon = () => {
    if (!game) return null;
    
    const phase = gameLifecycleManager.getGamePhase(game);
    
    let iconClass = '';
    let tooltip = '';
    
    switch (phase) {
      case 'setup':
        iconClass = 'fas fa-cog';
        tooltip = 'Setup Phase';
        break;
      case 'registration':
        iconClass = 'fas fa-user-plus';
        tooltip = 'Registration Phase';
        break;
      case 'play':
        iconClass = 'fas fa-golf-ball';
        tooltip = 'Play Phase';
        break;
      case 'completed':
        iconClass = 'fas fa-flag-checkered';
        tooltip = 'Completed Phase';
        break;
      default:
        return null;
    }
    
    return (
      <span className={`phase-icon ${phase}`} title={tooltip}>
        <i className={iconClass}></i>
      </span>
    );
  };
  
  // Get progress indicator based on the game's position in its lifecycle
  const getProgressIndicator = () => {
    if (!game) return null;
    
    const statusOrder = [
      'created',
      'open',
      'enrollment_complete',
      'in_progress',
      'completed',
      'finalized'
    ];
    
    const currentIndex = statusOrder.indexOf(status);
    const totalSteps = statusOrder.length;
    const progress = Math.round((currentIndex / (totalSteps - 1)) * 100);
    
    return (
      <div className="status-progress-container" title={`${progress}% Complete`}>
        <div 
          className="status-progress-bar" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    );
  };
  
  return (
    <div className={`enhanced-status-badge size-${size} ${className}`}>
      <div className={`status-indicator status-${status || 'unknown'}`}>
        <span className="status-text">{getStatusLabel(status)}</span>
        {game && getPhaseIcon()}
      </div>
      
      {showTimestamp && getFormattedTimestamp()}
      {game && getProgressIndicator()}
      {showActions && getActions()}
    </div>
  );
};

EnhancedStatusBadge.propTypes = {
  // Game status string (required)
  status: PropTypes.string.isRequired,
  
  // Complete game object (optional - enables advanced features)
  game: PropTypes.object,
  
  // Badge size: 'small', 'medium', or 'large'
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  
  // Whether to show the timestamp for when this status was achieved
  showTimestamp: PropTypes.bool,
  
  // Whether to show available actions for this status
  showActions: PropTypes.bool,
  
  // Callback for when an action button is clicked
  onActionClick: PropTypes.func,
  
  // Additional CSS class name
  className: PropTypes.string
};

export default EnhancedStatusBadge;
