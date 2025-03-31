import React from 'react';

const PrintablePlayersList = ({ game, players, signups }) => {
  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get course name from ID
  const getCourseName = (courseId) => {
    const courses = {
      'monarch-dunes': 'Monarch Dunes',
      'avila-beach': 'Avila Beach Golf Resort',
      'hunter-ranch': 'Hunter Ranch Golf Course',
      'dairy-creek': 'Dairy Creek Golf Course',
      'chalk-mountain': 'Chalk Mountain Golf Course',
      'morro-bay': 'Morro Bay Golf Course',
      'sea-pines': 'Sea Pines Golf Resort',
      'cypress-ridge': 'Cypress Ridge Golf Course',
      'black-lake': 'Blacklake Golf Resort'
    };
    
    return courses[courseId] || courseId;
  };

  // Get player details from ID
  const getPlayerDetails = (playerId) => {
    const player = players.find(p => p.id === playerId);
    return player || { name: 'Unknown Player', handicap: null };
  };

  // Sort players by name
  const sortedSignups = [...signups].sort((a, b) => {
    const playerA = getPlayerDetails(a.playerId);
    const playerB = getPlayerDetails(b.playerId);
    return playerA.name.localeCompare(playerB.name);
  });

  // Calculate total players and wolf game participants
  const totalPlayers = signups.length;
  const wolfPlayers = signups.filter(signup => signup.wolf).length;

  // Group players into foursomes/threesomes as needed
  const createGroups = (signups) => {
    const groups = [];
    let currentGroup = [];

    // First, add all wolf players to ensure they're accounted for
    const wolfSignups = signups.filter(signup => signup.wolf);
    const regularSignups = signups.filter(signup => !signup.wolf);
    
    // Sort each group by handicap
    const sortedWolfs = wolfSignups.sort((a, b) => {
      const handicapA = getPlayerDetails(a.playerId).handicap || 100;
      const handicapB = getPlayerDetails(b.playerId).handicap || 100;
      return handicapA - handicapB;
    });
    
    const sortedRegulars = regularSignups.sort((a, b) => {
      const handicapA = getPlayerDetails(a.playerId).handicap || 100;
      const handicapB = getPlayerDetails(b.playerId).handicap || 100;
      return handicapA - handicapB;
    });

    // Combine them, with wolf players first
    const sortedByTypeAndHandicap = [...sortedWolfs, ...sortedRegulars];
    
    // Create groups of 4 (or 3 if needed for the last group)
    for (let i = 0; i < sortedByTypeAndHandicap.length; i++) {
      currentGroup.push(sortedByTypeAndHandicap[i]);
      
      if (currentGroup.length === 4 || i === sortedByTypeAndHandicap.length - 1) {
        groups.push([...currentGroup]);
        currentGroup = [];
      }
    }
    
    return groups;
  };

  const playerGroups = createGroups(signups);

  return (
    <div className="printable-players-list">
      <div className="print-header">
        <h2>Player List - Central Coast Skins Game</h2>
        <h3>{getCourseName(game.course)}</h3>
        <p className="game-info">
          <strong>Date:</strong> {formatDate(game.date)}<br />
          <strong>Time:</strong> {game.time}<br />
          <strong>Format:</strong> {game.holes} Holes - Skins Game<br />
          <strong>Entry Fee:</strong> ${game.entryFee}
        </p>
        <p className="player-count">
          <strong>Total Players:</strong> {totalPlayers}<br />
          <strong>Wolf Game Participants:</strong> {wolfPlayers}
        </p>
        {game.notes && (
          <p className="game-notes"><strong>Notes:</strong> {game.notes}</p>
        )}
      </div>

      <div className="player-groups">
        <h3>Suggested Groups</h3>
        {playerGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="player-group">
            <h4>Group {groupIndex + 1}</h4>
            <table>
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Handicap</th>
                  <th>Wolf Game</th>
                </tr>
              </thead>
              <tbody>
                {group.map(signup => {
                  const player = getPlayerDetails(signup.playerId);
                  return (
                    <tr key={signup.playerId}>
                      <td>{player.name}</td>
                      <td>{player.handicap || 'N/A'}</td>
                      <td>{signup.wolf ? 'Yes' : 'No'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div className="all-players-list">
        <h3>All Players (Alphabetical)</h3>
        <table>
          <thead>
            <tr>
              <th>Player</th>
              <th>Handicap</th>
              <th>Wolf Game</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {sortedSignups.map(signup => {
              const player = getPlayerDetails(signup.playerId);
              return (
                <tr key={signup.playerId}>
                  <td>{player.name}</td>
                  <td>{player.handicap || 'N/A'}</td>
                  <td>{signup.wolf ? 'Yes' : 'No'}</td>
                  <td>{signup.notes || ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="print-footer">
        <p>Generated on {new Date().toLocaleDateString()} - Central Coast Skins Game Organizer</p>
      </div>
    </div>
  );
};

export default PrintablePlayersList;
