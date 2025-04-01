import React from 'react';
import '../styles/StatusBadge.css';

/**
 * StatusBadge Component
 * 
 * A reusable component to display game status consistently across the application
 * This ensures visual and text consistency for all game states
 */
const StatusBadge = ({ status }) => {
  const getStatusText = (status) => {
    switch(status) {
      case 'created': return 'Created';
      case 'open': return 'Open for Enrollment';
      case 'enrollment_complete': return 'Enrollment Complete';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'finalized': return 'Finalized';
      default: return 'Unknown';
    }
  };
  
  return (
    <span className={`status-badge status-${status || 'unknown'}`}>
      {getStatusText(status)}
    </span>
  );
};

export default StatusBadge;
