import React, { useState, useEffect, useRef } from 'react';

/**
 * Enhanced Score Entry Component with mobile-optimized input
 * 
 * This component provides a custom number picker for mobile devices
 * to make score entry easier on small touch screens.
 */
const ScoreEntry = ({ playerId, holeNumber, isCTPHole, value, onChange }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [tempValue, setTempValue] = useState(value || '');
  const inputRef = useRef(null);
  const pickerRef = useRef(null);

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
    buttons.push(
      <button
        key={11}
        type="button"
        className={`picker-button ${tempValue === '11' ? 'active' : ''}`}
        onClick={() => handleNumberClick(11)}
      >
        11
      </button>
    );
    
    buttons.push(
      <button
        key={12}
        type="button"
        className={`picker-button ${tempValue === '12' ? 'active' : ''}`}
        onClick={() => handleNumberClick(12)}
      >
        12
      </button>
    );
    
    buttons.push(
      <button
        key={13}
        type="button"
        className={`picker-button ${tempValue === '13' ? 'active' : ''}`}
        onClick={() => handleNumberClick(13)}
      >
        13
      </button>
    );
    
    buttons.push(
      <button
        key={14}
        type="button"
        className={`picker-button ${tempValue === '14' ? 'active' : ''}`}
        onClick={() => handleNumberClick(14)}
      >
        14
      </button>
    );
    
    buttons.push(
      <button
        key={15}
        type="button"
        className={`picker-button ${tempValue === '15' ? 'active' : ''}`}
        onClick={() => handleNumberClick(15)}
      >
        15
      </button>
    );
    
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

  return (
    <>
      <input
        ref={inputRef}
        type="number"
        className={`score-input ${isCTPHole ? 'ctp-hole' : ''}`}
        min="1"
        max="15"
        value={displayValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        data-player-id={playerId}
        data-hole={holeNumber}
        aria-label={`Score for hole ${holeNumber}`}
      />
      
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
          </div>
          <div className="picker-buttons">
            {renderNumberButtons()}
          </div>
        </div>
      )}
    </>
  );
};

export default ScoreEntry;
