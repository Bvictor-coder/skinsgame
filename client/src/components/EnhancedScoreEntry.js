import React, { useState, useEffect, useRef } from 'react';
import { MONARCH_DUNES_DATA } from '../utils/skinsCalculator';

/**
 * Enhanced Score Entry Component with half-stroke handicap display
 * 
 * This component provides a custom number picker for mobile devices
 * and shows the player's half-stroke handicap for the current hole.
 */
const EnhancedScoreEntry = ({ 
  playerId, 
  holeNumber, 
  isCTPHole, 
  playerHandicap, 
  value, 
  onChange,
  monarchFormat = true // Default to Monarch Dunes half-stroke format
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [tempValue, setTempValue] = useState(value || '');
  const [handicapStroke, setHandicapStroke] = useState(0);
  const inputRef = useRef(null);
  const pickerRef = useRef(null);

  // Calculate handicap stroke for the current hole
  useEffect(() => {
    if (playerHandicap === undefined || holeNumber === undefined) return;

    // Get the stroke index (difficulty) of the current hole (1-indexed)
    const holeIndex = holeNumber - 1;
    const strokeIndex = MONARCH_DUNES_DATA.handicaps[holeIndex];
    
    if (monarchFormat) {
      // Calculate half-stroke handicap
      if (strokeIndex <= playerHandicap && strokeIndex <= 18) {
        // Player gets at least a half stroke on this hole
        if (strokeIndex <= (playerHandicap - 18) && strokeIndex <= 18) {
          // Player gets a full stroke if handicap is at least 18 more than the stroke index
          setHandicapStroke(1);
        } else {
          // Otherwise, just a half stroke
          setHandicapStroke(0.5);
        }
      } else {
        // No strokes on this hole
        setHandicapStroke(0);
      }
    } else {
      // Standard handicap calculation (whole strokes)
      // If player's handicap is higher than the hole's stroke index, they get a stroke
      if (strokeIndex <= playerHandicap) {
        setHandicapStroke(1);
        
        // Check for second stroke (for very high handicaps)
        if (strokeIndex <= (playerHandicap - 18)) {
          setHandicapStroke(2);
        }
      } else {
        setHandicapStroke(0);
      }
    }
  }, [playerHandicap, holeNumber, monarchFormat]);

  // Handle outside clicks to close the picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target) && 
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Detect if running on mobile device
  const isMobile = () => {
    return window.innerWidth <= 768 || 
           /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Handle changes from the standard input
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    if (newValue === '' || (parseInt(newValue) >= 1 && parseInt(newValue) <= 15)) {
      setTempValue(newValue);
      if (newValue !== '') {
        onChange(parseInt(newValue));
      }
    }
  };

  // Handle focus on the input
  const handleFocus = () => {
    if (isMobile()) {
      // Prevent keyboard from showing on mobile
      inputRef.current.blur();
      setShowPicker(true);
    }
  };

  // Handle number button click in the custom picker
  const handleNumberClick = (num) => {
    if (num === 'clear') {
      setTempValue('');
      onChange('');
    } else {
      setTempValue(String(num));
      onChange(num);
    }
  };

  // Handle done button click
  const handleDone = () => {
    setShowPicker(false);
  };

  // Generate number buttons 1-15
  const renderNumberButtons = () => {
    const buttons = [];
    
    // Add numbers 1-10 in a grid
    for (let i = 1; i <= 10; i++) {
      buttons.push(
        <button
          key={i}
          type="button"
          className={`picker-button ${tempValue === String(i) ? 'active' : ''}`}
          onClick={() => handleNumberClick(i)}
        >
          {i}
        </button>
      );
    }
    
    // Add remaining numbers and clear button
    for (let i = 11; i <= 15; i++) {
      buttons.push(
        <button
          key={i}
          type="button"
          className={`picker-button ${tempValue === String(i) ? 'active' : ''}`}
          onClick={() => handleNumberClick(i)}
        >
          {i}
        </button>
      );
    }
    
    buttons.push(
      <button
        key="clear"
        type="button"
        className="picker-button clear"
        onClick={() => handleNumberClick('clear')}
      >
        Clear
      </button>
    );
    
    buttons.push(
      <button
        key="done"
        type="button"
        className="picker-button done"
        onClick={handleDone}
      >
        Done
      </button>
    );
    
    return buttons;
  };
  
  const displayValue = tempValue === '' ? '' : tempValue;

  // Calculate net score if we have both a raw score and handicap stroke
  const netScore = tempValue !== '' && handicapStroke > 0 
    ? Math.max(1, parseInt(tempValue) - handicapStroke) 
    : null;

  return (
    <div className="enhanced-score-entry">
      {/* Handicap stroke indicator */}
      {handicapStroke > 0 && (
        <div className={`handicap-stroke-indicator ${handicapStroke === 0.5 ? 'half-stroke' : 'full-stroke'}`}>
          {handicapStroke === 0.5 ? '½' : handicapStroke}
        </div>
      )}
      
      <input
        ref={inputRef}
        type="number"
        className={`score-input ${isCTPHole ? 'ctp-hole' : ''} ${handicapStroke > 0 ? 'has-handicap' : ''}`}
        min="1"
        max="15"
        value={displayValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        data-player-id={playerId}
        data-hole={holeNumber}
        aria-label={`Score for hole ${holeNumber}`}
      />
      
      {/* Net score display when handicap is applied */}
      {netScore !== null && (
        <div className="net-score-display">
          Net: {netScore}
        </div>
      )}
      
      {showPicker && (
        <div className="mobile-number-picker" ref={pickerRef}>
          <div className="picker-header">
            <h3>Enter Score - Hole {holeNumber}</h3>
            <button 
              type="button" 
              className="close-picker" 
              onClick={() => setShowPicker(false)}
            >
              &times;
            </button>
          </div>
          <div className="picker-value">
            Selected: <strong>{displayValue || 'None'}</strong>
            {handicapStroke > 0 && (
              <span className="picker-handicap">
                (Handicap: {handicapStroke === 0.5 ? '½' : handicapStroke})
              </span>
            )}
            {netScore !== null && (
              <span className="picker-net">
                Net: <strong>{netScore}</strong>
              </span>
            )}
          </div>
          <div className="picker-buttons">
            {renderNumberButtons()}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedScoreEntry;
