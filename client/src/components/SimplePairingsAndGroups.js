import React, { useState, useEffect } from 'react';

/**
 * SimplePairingsAndGroups - A simplified version of the PairingsAndGroups component
 * that focuses only on rendering a minimal interface for debugging purposes.
 */
const SimplePairingsAndGroups = () => {
  const [localStorageStatus, setLocalStorageStatus] = useState('Not checked');
  const [storageData, setStorageData] = useState(null);
  
  useEffect(() => {
    // Test localStorage availability
    try {
      console.log("SimplePairingsAndGroups: Testing localStorage");
      
      // Test basic localStorage functionality
      localStorage.setItem('testSimpleStorage', 'working');
      const testResult = localStorage.getItem('testSimpleStorage');
      localStorage.removeItem('testSimpleStorage');
      
      if (testResult === 'working') {
        setLocalStorageStatus('Working');
        
        // Try to read the actual app data
        const golfData = localStorage.getItem('golfSkinsOrganizer');
        if (golfData) {
          try {
            const parsedData = JSON.parse(golfData);
            setStorageData({
              games: parsedData.games?.length || 0,
              friends: parsedData.friends?.length || 0,
              hasSignups: !!parsedData.signups && Object.keys(parsedData.signups).length > 0
            });
          } catch (e) {
            console.error("Error parsing golfSkinsOrganizer data:", e);
            setStorageData({ error: "Invalid JSON data in storage" });
          }
        } else {
          setStorageData({ error: "No golf data found in localStorage" });
        }
      } else {
        setLocalStorageStatus(`Error: test value mismatch (${testResult})`);
      }
    } catch (err) {
      console.error("Error testing localStorage:", err);
      setLocalStorageStatus(`Error: ${err.message}`);
    }
  }, []);
  
  return (
    <div className="simple-pairings-groups">
      <h2>Simple Pairings & Groups (Debug Version)</h2>
      
      <div className="debug-info">
        <h3>Component Status</h3>
        <ul>
          <li><strong>Component Mount Time:</strong> {new Date().toLocaleTimeString()}</li>
          <li><strong>localStorage Status:</strong> {localStorageStatus}</li>
        </ul>
        
        {storageData && (
          <div>
            <h3>Storage Data Summary</h3>
            {storageData.error ? (
              <p className="error">{storageData.error}</p>
            ) : (
              <ul>
                <li><strong>Games Count:</strong> {storageData.games}</li>
                <li><strong>Friends Count:</strong> {storageData.friends}</li>
                <li><strong>Has Signups:</strong> {storageData.hasSignups ? 'Yes' : 'No'}</li>
              </ul>
            )}
          </div>
        )}
        
        <div className="buttons">
          <button 
            className="btn"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
          <button 
            className="btn"
            onClick={() => {
              localStorage.clear();
              alert('LocalStorage cleared. Refresh to see effects.');
            }}
            style={{ marginLeft: '10px' }}
          >
            Clear localStorage
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimplePairingsAndGroups;
