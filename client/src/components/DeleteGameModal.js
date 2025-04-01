import React from 'react';
import './DeleteGameModal.css';

/**
 * DeleteGameModal Component
 * 
 * A modal component for confirming game deletion with warning about irreversible action.
 */
const DeleteGameModal = ({ isOpen, onClose, game, onConfirmDelete }) => {
  if (!isOpen || !game) return null;

  return (
    <div className="delete-game-modal-overlay">
      <div className="delete-game-modal">
        <div className="delete-game-modal-header">
          <h3>Delete Game</h3>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="delete-game-modal-body">
          <div className="warning-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
              <path fill="#dc3545" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
            </svg>
          </div>
          
          <div className="delete-game-warning">
            <p>Are you sure you want to delete this game?</p>
            <p className="game-details">
              <strong>{game.courseName || game.course}</strong> on <strong>{new Date(game.date).toLocaleDateString()}</strong>
            </p>
            <p className="warning-text">This action cannot be undone. All game data including groups, scores, and results will be permanently deleted.</p>
          </div>
          
          <div className="delete-game-modal-actions">
            <button 
              className="btn-cancel" 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              className="btn-delete" 
              onClick={() => {
                onConfirmDelete(game.id);
                onClose();
              }}
            >
              Delete Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteGameModal;
