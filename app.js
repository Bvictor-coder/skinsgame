// Golf Skins Game Organizer with Monarch Dunes Integration
// Import Monarch Dunes course data
import { getMonarchDunesData, calculateHandicapStrokes as calculateMonarchDunesHandicapStrokes } from './monarch-dunes.js';

// Helper functions for DOM manipulation
function getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Element with id '${id}' not found in the DOM`);
    }
    return element;
}

function getElementValue(id, defaultValue = '') {
    const element = getElement(id);
    return element ? element.value.trim() : defaultValue;
}

function addEventIfExists(element, event, handler) {
    if (element) {
        element.addEventListener(event, handler);
    }
}

// Data structure for the application
let appData = {
    friends: [],
    games: [],
    signups: {}
};

// Global error handler
window.addEventListener('error', function(event) {
    console.error('Global error caught:', event.error || event.message);
    alert('An error occurred. Please check the console for details.');
});

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log("Golf Skins Game Organizer loaded");
    
    try {
        // Set up tab navigation
        setupTabs();
        
        // Set up form handlers
        setupForms();
        
        // Set up modal handlers
        setupModals();
        
        // Load data and render initial state
        loadData();
        renderApp();
        
        console.log("Application initialized successfully");
    } catch (error) {
        console.error("Error during initialization:", error);
        alert("There was a problem initializing the application. Please try refreshing the page.");
    }
});

// Setup tab navigation
function setupTabs() {
    try {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        if (tabButtons.length === 0) {
            console.warn("No tab buttons found on the page");
            return;
        }
        
        console.log(`Found ${tabButtons.length} tab buttons and ${tabContents.length} tab contents`);
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                try {
                    // Get tab ID before manipulating DOM
                    const tabId = button.getAttribute('data-tab');
                    if (!tabId) {
                        console.error("Tab button missing data-tab attribute:", button);
                        return;
                    }
                    
                    const targetTab = document.getElementById(tabId);
                    if (!targetTab) {
                        console.error(`Tab content with ID '${tabId}' not found`);
                        return;
                    }
                    
                    console.log(`Switching to tab: ${tabId}`);
                    
                    // Remove active class from all tabs
                    tabButtons.forEach(btn => btn.classList.remove('active'));
                    tabContents.forEach(content => content.classList.remove('active'));
                    
                    // Add active class to clicked tab
                    button.classList.add('active');
                    targetTab.classList.add('active');
                } catch (error) {
                    console.error("Error in tab click handler:", error);
                }
            });
        });
        
        // Ensure first tab is active by default if none are active
        const activeButton = document.querySelector('.tab-btn.active');
        if (!activeButton && tabButtons.length > 0) {
            tabButtons[0].click();
        }
    } catch (error) {
        console.error("Error setting up tabs:", error);
    }
}

// Setup form handlers
function setupForms() {
    // Add friend form
    const addFriendForm = document.getElementById('add-friend-form');
    if (addFriendForm) {
        addFriendForm.addEventListener('submit', e => {
            e.preventDefault();
            addFriend();
        });
    }
    
    // New game form
    const newGameForm = document.getElementById('new-game-form');
    if (newGameForm) {
        newGameForm.addEventListener('submit', e => {
            e.preventDefault();
            createNewGame();
        });
    }
    
    // Signup form (will be initialized when modal opens)
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', e => {
            e.preventDefault();
            submitSignup();
        });
    }
}

// Setup modal handlers
function setupModals() {
    // Close buttons for all modals
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) modal.style.display = 'none';
        });
    });
    
    // Click outside to close
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
    
    // Setup auto-group button if it exists
    const autoGroupButton = document.getElementById('auto-group');
    if (autoGroupButton) {
        autoGroupButton.addEventListener('click', function() {
            const gameId = this.getAttribute('data-game-id');
            if (gameId) {
                autoCreateGroups(gameId);
            }
        });
    }
    
    // Setup save groups button if it exists
    const saveGroupsButton = document.getElementById('save-groups');
    if (saveGroupsButton) {
        saveGroupsButton.addEventListener('click', function() {
            const gameId = this.getAttribute('data-game-id');
            if (gameId) {
                saveGroups(gameId);
            }
        });
    }
}

// Load data from localStorage
function loadData() {
    const savedData = localStorage.getItem('golfSkinsOrganizer');
    if (savedData) {
        try {
            appData = JSON.parse(savedData);
            if (!appData.signups) appData.signups = {};
            console.log("Data loaded:", appData);
        } catch (error) {
            console.error("Error loading data:", error);
            appData = { friends: [], games: [], signups: {} };
        }
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('golfSkinsOrganizer', JSON.stringify(appData));
    console.log("Data saved");
}

// Render the entire app (all sections)
function renderApp() {
    renderFriendsList();
    renderGames();
}

// Add a new friend
function addFriend() {
    try {
        const nameInput = getElement('friend-name');
        const emailInput = getElement('friend-email');
        const handicapInput = getElement('friend-handicap');
        
        if (!nameInput || !emailInput) {
            console.error("Name or email input elements not found");
            return;
        }
        
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        
        console.log("Adding friend - Name:", name, "Email:", email);
        
        if (!name || !email) {
            alert('Name and email are required');
            return;
        }
        
        const handicap = handicapInput && handicapInput.value ? 
            parseFloat(handicapInput.value) : null;
        
        const newFriend = {
            id: Date.now().toString(),
            name: name,
            email: email,
            handicap: handicap
        };
        
        // Add to data structure
        appData.friends.push(newFriend);
        console.log("Friend added:", newFriend);
        
        // Save to localStorage
        saveData();
        
        // Clear form
        nameInput.value = '';
        emailInput.value = '';
        if (handicapInput) handicapInput.value = '';
        
        // Update UI
        renderFriendsList();
    } catch (error) {
        console.error("Error adding friend:", error);
        alert("Error adding friend. Please check console for details.");
    }
}

// Create a new game
function createNewGame() {
    const dateInput = getElement('game-date');
    const timeInput = getElement('game-time');
    const courseInput = getElement('game-course');
    const holesInput = getElement('game-holes');
    const ctpHoleInput = getElement('game-ctp-hole');
    const entryFeeInput = getElement('game-entry-fee');
    const deadlineInput = getElement('game-signup-deadline');
    const wolfEnabledInput = getElement('game-wolf-enabled');
    const notesInput = getElement('game-notes');
    
    if (!dateInput || !courseInput) return;
    
    const course = courseInput.value.trim();
    const date = dateInput.value;
    
    if (!course || !date) {
        alert('Course and date are required');
        return;
    }
    
    const gameId = Date.now().toString();
    
    const newGame = {
        id: gameId,
        date: date,
        time: timeInput ? timeInput.value : '',
        course: course,
        holes: holesInput ? parseInt(holesInput.value) || 18 : 18,
        ctpHole: ctpHoleInput ? parseInt(ctpHoleInput.value) || 2 : 2,
        entryFee: entryFeeInput ? parseInt(entryFeeInput.value) || 10 : 10,
        signupDeadline: deadlineInput ? deadlineInput.value : '',
        wolfEnabled: wolfEnabledInput ? wolfEnabledInput.checked : false,
        notes: notesInput ? notesInput.value.trim() : '',
        status: 'upcoming',
        groups: []
    };
    
    appData.games.push(newGame);
    appData.signups[gameId] = [];
    saveData();
    
    // Reset form
    const newGameForm = getElement('new-game-form');
    if (newGameForm) newGameForm.reset();
    
    // Switch to upcoming games tab
    const upcomingTab = document.querySelector('.tab-btn[data-tab="upcoming"]');
    if (upcomingTab) upcomingTab.click();
    
    // Update UI
    renderGames();
}

// Render friends list
function renderFriendsList() {
    const friendsList = document.getElementById('friends-list');
    if (!friendsList) return;
    
    if (appData.friends.length === 0) {
        friendsList.innerHTML = '<p class="empty-state">No friends added yet. Add friends to invite them to games!</p>';
        return;
    }
    
    friendsList.innerHTML = '';
    appData.friends.forEach(friend => {
        const friendCard = document.createElement('div');
        friendCard.className = 'friend-card';
        friendCard.innerHTML = `
            <div class="friend-info">
                <span>${friend.name}</span>
                <span class="email">${friend.email}</span>
                ${friend.handicap !== null ? `<span class="handicap">Handicap: ${friend.handicap}</span>` : ''}
            </div>
            <div class="friend-actions">
                <button class="icon-btn edit" data-id="${friend.id}"><i class="fas fa-edit"></i></button>
                <button class="icon-btn delete" data-id="${friend.id}"><i class="fas fa-trash"></i></button>
            </div>
        `;
        
        // Set up delete button
        const deleteButton = friendCard.querySelector('.delete');
        deleteButton.addEventListener('click', () => {
            if (confirm(`Are you sure you want to remove ${friend.name}?`)) {
                removeFriend(friend.id);
            }
        });
        
        // Set up edit button
        const editButton = friendCard.querySelector('.edit');
        editButton.addEventListener('click', () => {
            editFriend(friend);
        });
        
        friendsList.appendChild(friendCard);
    });
}

// Remove a friend
function removeFriend(friendId) {
    appData.friends = appData.friends.filter(f => f.id !== friendId);
    saveData();
    renderFriendsList();
    renderGames();
}

// Edit a friend
function editFriend(friend) {
    const newName = prompt('Enter new name:', friend.name);
    if (!newName) return;
    
    const newEmail = prompt('Enter new email:', friend.email);
    if (!newEmail) return;
    
    const newHandicap = prompt('Enter new handicap (leave empty for none):', 
        friend.handicap !== null ? friend.handicap : '');
    
    friend.name = newName.trim();
    friend.email = newEmail.trim();
    friend.handicap = newHandicap ? parseFloat(newHandicap) : null;
    
    saveData();
    renderFriendsList();
    renderGames();
}

// Format time (24h to 12h)
function formatTime(time) {
    if (!time) return '';
    
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    
    return `${hour12}:${minutes} ${ampm}`;
}

// Render games (upcoming and past)
function renderGames() {
    const upcomingList = document.getElementById('upcoming-games-list');
    const historyList = document.getElementById('game-history-list');
    const signupList = document.getElementById('signup-games-list');
    const groupingList = document.getElementById('grouping-games-list');
    
    // Sort games by date
    const sortedGames = [...appData.games].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA; // Most recent first
    });
    
    // Divide into upcoming and past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcomingGames = sortedGames.filter(game => {
        const gameDate = new Date(game.date);
        return gameDate >= today && game.status !== 'canceled';
    });
    
    const pastGames = sortedGames.filter(game => {
        const gameDate = new Date(game.date);
        return gameDate < today || game.status === 'completed' || game.status === 'canceled';
    });
    
    // Render upcoming games
    if (upcomingList) {
        if (upcomingGames.length === 0) {
            upcomingList.innerHTML = '<p class="empty-state">No upcoming games. Create a new game to get started!</p>';
        } else {
            upcomingList.innerHTML = '';
            upcomingGames.forEach(game => {
                renderGameCard(game, upcomingList);
            });
        }
    }
    
    // Render game history
    if (historyList) {
        if (pastGames.length === 0) {
            historyList.innerHTML = '<p class="empty-state">No previous games found.</p>';
        } else {
            historyList.innerHTML = '';
            pastGames.forEach(game => {
                renderGameCard(game, historyList);
            });
        }
    }
    
    // Render signup list
    if (signupList) {
        if (upcomingGames.length === 0) {
            signupList.innerHTML = '<p class="empty-state">No upcoming games available for sign-up.</p>';
        } else {
            signupList.innerHTML = '';
            upcomingGames.forEach(game => {
                renderSignupCard(game, signupList);
            });
        }
    }
    
    // Render grouping list
    if (groupingList) {
        const gamesNeedingGroups = upcomingGames.filter(game => {
            // Games with wolf players that need grouping
            const signups = appData.signups[game.id] || [];
            const wolfPlayers = signups.filter(s => s.wolf);
            return wolfPlayers.length > 0 && (!game.groups || game.groups.length === 0);
        });
        
        if (gamesNeedingGroups.length === 0) {
            groupingList.innerHTML = '<p class="empty-state">No games ready for grouping.</p>';
        } else {
            groupingList.innerHTML = '';
            gamesNeedingGroups.forEach(game => {
                renderGroupingCard(game, groupingList);
            });
        }
    }
}

// Render a game card
function renderGameCard(game, container) {
    const gameCard = document.createElement('div');
    gameCard.className = 'game-card';
    
    const gameDate = new Date(game.date);
    const formattedDate = gameDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Status display
    let statusClass = 'status-upcoming';
    let statusText = 'Upcoming';
    
    if (game.status === 'completed') {
        statusClass = 'status-completed';
        statusText = 'Completed';
    } else if (game.status === 'canceled') {
        statusClass = 'status-canceled';
        statusText = 'Canceled';
    }
    
    // Player count and pot
    const signups = appData.signups[game.id] || [];
    const playerCount = signups.length;
    const totalPot = playerCount * game.entryFee;
    
    // Wolf player count
    const wolfCount = signups.filter(s => s.wolf).length;
    const wolfBadge = wolfCount > 0 ? `<span class="badge">${wolfCount} Wolf</span>` : '';
    
    // Deadline info
    let deadlineDisplay = '';
    if (game.signupDeadline) {
        const deadlineDate = new Date(game.signupDeadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (deadlineDate < today) {
            deadlineDisplay = `<div><i class="far fa-calendar-check"></i> Sign-up closed</div>`;
        } else {
            const formattedDeadline = deadlineDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
            deadlineDisplay = `<div><i class="far fa-calendar-alt"></i> Sign-up by: ${formattedDeadline}</div>`;
        }
    }
    
    gameCard.innerHTML = `
        <div class="game-details-header">
            <h3>${game.course}</h3>
            <span class="game-status ${statusClass}">${statusText}</span>
        </div>
        <div class="game-meta">
            <div><i class="far fa-calendar"></i> ${formattedDate}</div>
            <div><i class="far fa-clock"></i> ${formatTime(game.time)}</div>
            <div><i class="fas fa-golf-ball"></i> ${game.holes} Holes</div>
            <div><i class="fas fa-users"></i> Players: ${playerCount} ${wolfBadge}</div>
            <div><i class="fas fa-dollar-sign"></i> Entry: $${game.entryFee} / Pot: $${totalPot}</div>
            ${deadlineDisplay}
        </div>
        <div class="game-actions">
            <button class="btn view-details" data-id="${game.id}">View Details</button>
            ${game.status === 'upcoming' ? `<button class="btn sign-up" data-id="${game.id}">Sign Up</button>` : ''}
            ${game.status === 'upcoming' && wolfCount > 0 ? `<button class="btn create-groups" data-id="${game.id}">Create Groups</button>` : ''}
        </div>
    `;
    
    // Setup buttons
    const viewDetailsBtn = gameCard.querySelector('.view-details');
    viewDetailsBtn.addEventListener('click', () => {
        openGameDetails(game);
    });
    
    const signUpBtn = gameCard.querySelector('.sign-up');
    if (signUpBtn) {
        signUpBtn.addEventListener('click', () => {
            openSignupModal(game);
        });
    }
    
    const createGroupsBtn = gameCard.querySelector('.create-groups');
    if (createGroupsBtn) {
        createGroupsBtn.addEventListener('click', () => {
            openGroupingModal(game);
        });
    }
    
    container.appendChild(gameCard);
}

// Render signup card
function renderSignupCard(game, container) {
    const card = document.createElement('div');
    card.className = 'game-card';
    
    const gameDate = new Date(game.date);
    const formattedDate = gameDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
    });
    
    // Player count
    const signups = appData.signups[game.id] || [];
    const playerCount = signups.length;
    
    card.innerHTML = `
        <div class="game-details-header">
            <h3>${game.course}</h3>
            <span class="game-status status-upcoming">Sign Up Open</span>
        </div>
        <div class="game-meta">
            <div><i class="far fa-calendar"></i> ${formattedDate}</div>
            <div><i class="far fa-clock"></i> ${formatTime(game.time)}</div>
            <div><i class="fas fa-users"></i> Current Players: ${playerCount}</div>
            ${game.wolfEnabled ? '<div><i class="fas fa-users"></i> Wolf Game Available</div>' : ''}
        </div>
        <div class="game-actions">
            <button class="btn sign-up" data-id="${game.id}">Sign Up</button>
        </div>
    `;
    
    // Setup sign-up button
    const signUpBtn = card.querySelector('.sign-up');
    signUpBtn.addEventListener('click', () => {
        openSignupModal(game);
    });
    
    container.appendChild(card);
}

// Render grouping card
function renderGroupingCard(game, container) {
    const card = document.createElement('div');
    card.className = 'game-card';
    
    const gameDate = new Date(game.date);
    const formattedDate = gameDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Player counts
    const signups = appData.signups[game.id] || [];
    const playerCount = signups.length;
    const wolfCount = signups.filter(s => s.wolf).length;
    
    card.innerHTML = `
        <div class="game-details-header">
            <h3>${game.course}</h3>
            <span class="game-status status-upcoming">Ready for Grouping</span>
        </div>
        <div class="game-meta">
            <div><i class="far fa-calendar"></i> ${formattedDate}</div>
            <div><i class="fas fa-users"></i> Players: ${playerCount} (${wolfCount} Wolf)</div>
        </div>
        <div class="game-actions">
            <button class="btn create-groups" data-id="${game.id}">Create Groups</button>
        </div>
    `;
    
    // Setup create groups button
    const createGroupsBtn = card.querySelector('.create-groups');
    createGroupsBtn.addEventListener('click', () => {
        openGroupingModal(game);
    });
    
    container.appendChild(card);
}

// Open game details modal
function openGameDetails(game) {
    const modal = getElement('game-details-modal');
    const content = getElement('game-details-content');
    
    if (!modal || !content) return;
    
    const gameDate = new Date(game.date);
    const formattedDate = gameDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Status display
    let statusClass = 'status-upcoming';
    let statusText = 'Upcoming';
    
    if (game.status === 'completed') {
        statusClass = 'status-completed';
        statusText = 'Completed';
    } else if (game.status === 'canceled') {
        statusClass = 'status-canceled';
        statusText = 'Canceled';
    }
    
    // Participants
    const signups = appData.signups[game.id] || [];
    const wolfCount = signups.filter(s => s.wolf).length;
    const totalPot = signups.length * game.entryFee;
    
    let participantsHtml = '';
    if (signups.length > 0) {
        participantsHtml = '<div class="participants-list">';
        signups.forEach(signup => {
            const friend = appData.friends.find(f => f.id === signup.playerId);
            if (friend) {
                const wolfBadge = signup.wolf ? '<span class="wolf-badge">Wolf</span>' : '';
                const handicapHtml = friend.handicap !== null ? 
                    `<span>Handicap: ${friend.handicap}</span>` : '';
                
                participantsHtml += `
                    <div class="participant-card ${signup.wolf ? 'wolf-player' : ''}">
                        <strong>${friend.name}</strong> ${wolfBadge}
                        ${handicapHtml}
                        ${signup.notes ? `<div class="notes"><em>Notes: ${signup.notes}</em></div>` : ''}
                    </div>
                `;
            }
        });
        participantsHtml += '</div>';
        
        if (wolfCount > 0) {
            participantsHtml += `
                <div class="wolf-stats">
                    <p><i class="fas fa-info-circle"></i> <strong>${wolfCount}</strong> player${wolfCount !== 1 ? 's' : ''} registered for Wolf</p>
                </div>
            `;
        }
    } else {
        participantsHtml = '<p>No participants signed up yet.</p>';
    }
    
    // Groups
    let groupsHtml = '';
    if (game.groups && game.groups.length > 0) {
        groupsHtml = '<h3>Playing Groups</h3><div class="groups-container">';
        
        game.groups.forEach((group, index) => {
            groupsHtml += `
                <div class="group-container">
                    <div class="group-header">
                        <h4>Group ${index + 1} ${group.isWolfGroup ? '<span class="wolf-badge">Wolf Group</span>' : ''}</h4>
                    </div>
                    <div class="group-members">
            `;
            
            group.playerIds.forEach(playerId => {
                const friend = appData.friends.find(f => f.id === playerId);
                if (friend) {
                    const signup = signups.find(s => s.playerId === playerId);
                    const isWolfPlayer = signup && signup.wolf;
                    const isScorekeeper = group.scorekeeperId === playerId;
                    
                    groupsHtml += `
                        <div class="group-member ${isWolfPlayer ? 'wolf-player' : ''} ${isScorekeeper ? 'scorekeeper' : ''}">
                            ${friend.name}
                            ${isWolfPlayer ? '<span class="wolf-badge small">Wolf</span>' : ''}
                            ${isScorekeeper ? '<span class="scorekeeper-badge">Scorekeeper</span>' : ''}
                        </div>
                    `;
                }
            });
            
            groupsHtml += `</div></div>`;
        });
        
        groupsHtml += '</div>';
    }
    
    content.innerHTML = `
        <div class="game-details-header">
            <h3>${game.course}</h3>
            <span class="game-status ${statusClass}">${statusText}</span>
        </div>
        <div class="game-meta">
            <div><i class="far fa-calendar"></i> ${formattedDate}</div>
            <div><i class="far fa-clock"></i> ${formatTime(game.time)}</div>
            <div><i class="fas fa-golf-ball"></i> ${game.holes} Holes</div>
            <div><i class="fas fa-flag"></i> CTP Hole: #${game.ctpHole}</div>
            <div><i class="fas fa-dollar-sign"></i> Entry: $${game.entryFee} / Pot: $${totalPot}</div>
            ${game.wolfEnabled ? '<div><i class="fas fa-users"></i> Wolf Game Enabled</div>' : ''}
        </div>
        ${game.notes ? `<div class="game-notes"><p>${game.notes}</p></div>` : ''}
        <h3>Participants</h3>
        <div class="game-participants-details">
            ${participantsHtml}
        </div>
        ${groupsHtml}
        ${game.status === 'upcoming' ? `
            <div class="game-actions">
                <button id="mark-completed" class="btn" data-id="${game.id}">Mark as Completed</button>
                <button id="cancel-game" class="btn" data-id="${game.id}">Cancel Game</button>
            </div>
        ` : ''}
    `;
    
    // Setup action buttons
    if (game.status === 'upcoming') {
        const markCompletedBtn = content.querySelector('#mark-completed');
        const cancelGameBtn = content.querySelector('#cancel-game');
        
        if (markCompletedBtn) {
            markCompletedBtn.addEventListener('click', () => {
                game.status = 'completed';
                saveData();
                if (modal) modal.style.display = 'none';
                renderGames();
            });
        }
        
        if (cancelGameBtn) {
            cancelGameBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to cancel this game?')) {
                    game.status = 'canceled';
                    saveData();
                    if (modal) modal.style.display = 'none';
                    renderGames();
                }
            });
        }
    }
    
    // Show score entry if game is completed
    if (game.status === 'completed') {
        const scoreSection = getElement('record-scores-section');
        const scoreInputs = getElement('score-inputs');
        const ctpHoleSpan = getElement('ctp-hole-num');
        const ctpWinnerSelect = getElement('ctp-winner');
        const saveScoresBtn = getElement('save-scores');
        const skinsResults = getElement('skins-results');
        
        if (scoreSection && scoreInputs && ctpHoleSpan && ctpWinnerSelect && saveScoresBtn && skinsResults) {
            // Setup CTP hole number
            ctpHoleSpan.textContent = game.ctpHole;
            
            // Generate score input table
            scoreInputs.innerHTML = generateScoreTable(game, signups);
            
            // Set up event handlers for score inputs
            setupScoreInputHandlers();
            
            // Populate CTP dropdown
            populateCtpDropdown(game, signups, ctpWinnerSelect);
            
            // Show saved scores if they exist
            if (game.scores) {
                populateSavedScores(game, signups);
                
                // Show skins results if they exist
                if (game.scores.skins && game.scores.skins.length > 0) {
                    displaySkinsResults(game, signups);
                    scoreSection.style.display = 'none';
                    skinsResults.style.display = 'block';
                } else {
                    scoreSection.style.display = 'block';
                    skinsResults.style.display = 'none';
                }
            } else {
                scoreSection.style.display = 'block';
                skinsResults.style.display = 'none';
            }
            
            // Setup save scores button
            if (saveScoresBtn) {
                saveScoresBtn.onclick = () => saveScoresAndCalculateSkins(game, signups);
            }
        }
    } else {
        // Hide score section for non-completed games
        const scoreSection = getElement('record-scores-section');
        const skinsResults = getElement('skins-results');
        if (scoreSection) scoreSection.style.display = 'none';
        if (skinsResults) skinsResults.style.display = 'none';
    }
    
    modal.style.display = 'block';
}

// Open signup modal for a game
function openSignupModal(game) {
    const modal = getElement('signup-modal');
    const gameTitle = getElement('signup-game-title');
    const playerSelect = getElement('signup-player');
    const wolfOption = getElement('signup-wolf-opt');
    const wolfOptionContainer = document.querySelector('.wolf-option');
    
    if (!modal || !gameTitle || !playerSelect) return;
    
    // Set game title
    gameTitle.textContent = `${game.course} - ${new Date(game.date).toLocaleDateString()}`;
    
    // Clear previous options
    playerSelect.innerHTML = '<option value="">-- Select your name --</option>';
    
    // Get existing signups for this game
    const existingSignups = appData.signups[game.id] || [];
    const signedUpPlayerIds = existingSignups.map(s => s.playerId);
    
    // Add friends to dropdown, excluding those already signed up
    appData.friends.forEach(friend => {
        if (!signedUpPlayerIds.includes(friend.id)) {
            const option = document.createElement('option');
            option.value = friend.id;
            option.textContent = friend.name;
            playerSelect.appendChild(option);
        }
    });
    
    // Show/hide wolf option based on game settings
    if (wolfOptionContainer) {
        if (game.wolfEnabled) {
            wolfOptionContainer.style.display = 'block';
            // Reset wolf checkbox
            if (wolfOption) wolfOption.checked = false;
        } else {
            wolfOptionContainer.style.display = 'none';
        }
    }
    
    // Set gameId attribute for the form submission
    const signupForm = getElement('signup-form');
    if (signupForm) {
        signupForm.setAttribute('data-game-id', game.id);
    }
    
    // Show the modal
    modal.style.display = 'block';
}

// Submit signup form
function submitSignup() {
    const form = getElement('signup-form');
    if (!form) return;
    
    const gameId = form.getAttribute('data-game-id');
    if (!gameId) {
        alert('Game not specified');
        return;
    }
    
    const playerSelect = getElement('signup-player');
    const wolfOption = getElement('signup-wolf-opt');
    const notesInput = getElement('signup-notes');
    
    if (!playerSelect) return;
    
    const playerId = playerSelect.value;
    if (!playerId) {
        alert('Please select a player');
        return;
    }
    
    // Create signup object
    const signup = {
        playerId: playerId,
        wolf: wolfOption ? wolfOption.checked : false,
        notes: notesInput ? notesInput.value.trim() : ''
    };
    
    // Initialize signups array if it doesn't exist
    if (!appData.signups[gameId]) {
        appData.signups[gameId] = [];
    }
    
    // Add signup
    appData.signups[gameId].push(signup);
    saveData();
    
    // Close modal
    const modal = getElement('signup-modal');
    if (modal) modal.style.display = 'none';
    
    // Update UI
    renderGames();
}

// Open grouping modal for a game
function openGroupingModal(game) {
    const modal = getElement('grouping-modal');
    const gameTitle = getElement('grouping-game-title');
    const signedPlayersList = getElement('signed-players-list');
    const groupsContainer = getElement('groups-container');
    const autoGroupBtn = getElement('auto-group');
    const saveGroupsBtn = getElement('save-groups');
    
    if (!modal || !gameTitle || !signedPlayersList || !groupsContainer) return;
    
    // Set game title
    gameTitle.textContent = `${game.course} - ${new Date(game.date).toLocaleDateString()}`;
    
    // Set game ID for buttons
    if (autoGroupBtn) autoGroupBtn.setAttribute('data-game-id', game.id);
    if (saveGroupsBtn) saveGroupsBtn.setAttribute('data-game-id', game.id);
    
    // Get signups for this game
    const signups = appData.signups[game.id] || [];
    
    // Render signed up players list
    renderSignedPlayersList(game, signups, signedPlayersList);
    
    // Render groups if they exist
    if (game.groups && game.groups.length > 0) {
        renderGroups(game.id);
    } else {
        groupsContainer.innerHTML = '<p class="empty-state">Click "Auto-Create Groups" or drag players to create groups.</p>';
    }
    
    // Show the modal
    modal.style.display = 'block';
}

// Render signed players list in the grouping modal
function renderSignedPlayersList(game, signups, container) {
    if (!container) return;
    
    if (signups.length === 0) {
        container.innerHTML = '<p class="empty-state">No players signed up yet.</p>';
        return;
    }
    
    container.innerHTML = '';
    
    // Sort by wolf status (wolf players first)
    const sortedSignups = [...signups].sort((a, b) => {
        if (a.wolf && !b.wolf) return -1;
        if (!a.wolf && b.wolf) return 1;
        return 0;
    });
    
    sortedSignups.forEach(signup => {
        const friend = appData.friends.find(f => f.id === signup.playerId);
        if (friend) {
            const playerCard = document.createElement('div');
            playerCard.className = `signup-card ${signup.wolf ? 'wolf-player' : ''}`;
            playerCard.setAttribute('data-player-id', friend.id);
            playerCard.setAttribute('draggable', 'true');
            
            playerCard.innerHTML = `
                <strong>${friend.name}</strong>
                ${signup.wolf ? '<span class="wolf-badge">Wolf</span>' : ''}
                ${friend.handicap !== null ? `<span>HCP: ${friend.handicap}</span>` : ''}
            `;
            
            // Setup drag events
            playerCard.addEventListener('dragstart', handleDragStart);
            
            container.appendChild(playerCard);
        }
    });
}

// Auto-create groups for a game
function autoCreateGroups(gameId) {
    const game = appData.games.find(g => g.id === gameId);
    if (!game) return;
    
    const signups = appData.signups[gameId] || [];
    if (signups.length === 0) {
        alert('No players signed up for this game');
        return;
    }
    
    // Create groups
    const groups = [];
    
    // Step 1: Create Wolf group if needed
    const wolfPlayers = signups.filter(s => s.wolf);
    if (wolfPlayers.length > 0) {
        const wolfGroup = {
            isWolfGroup: true,
            playerIds: wolfPlayers.map(p => p.playerId),
            scorekeeperId: wolfPlayers[0].playerId // Default first wolf player as scorekeeper
        };
        groups.push(wolfGroup);
    }
    
    // Step 2: Create regular groups from remaining players
    const regularPlayers = signups.filter(s => !s.wolf);
    const playerChunks = chunkArray(regularPlayers.map(p => p.playerId), 4); // Split into chunks of 4
    
    playerChunks.forEach((chunk, index) => {
        groups.push({
            isWolfGroup: false,
            playerIds: chunk,
            scorekeeperId: chunk[0] // Default first player as scorekeeper
        });
    });
    
    // Save groups to game
    game.groups = groups;
    saveData();
    
    // Render the groups
    renderGroups(gameId);
}

// Helper function to split array into chunks
function chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
}

// Drag and drop event handlers
function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.getAttribute('data-player-id'));
    e.dataTransfer.effectAllowed = 'move';
}

// Render groups in the grouping modal
function renderGroups(gameId) {
    const game = appData.games.find(g => g.id === gameId);
    if (!game || !game.groups) return;
    
    const container = getElement('groups-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    game.groups.forEach((group, index) => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'group-container';
        groupDiv.setAttribute('data-group-index', index);
        
        let groupHtml = `
            <div class="group-header">
                <h4>Group ${index + 1} ${group.isWolfGroup ? '<span class="wolf-badge">Wolf Group</span>' : ''}</h4>
            </div>
            <div class="group-members" data-group-index="${index}">
        `;
        
        // Add members
        group.playerIds.forEach(playerId => {
            const friend = appData.friends.find(f => f.id === playerId);
            if (friend) {
                // Check if player is wolf
                const signup = (appData.signups[gameId] || []).find(s => s.playerId === playerId);
                const isWolf = signup && signup.wolf;
                const isScorekeeper = group.scorekeeperId === playerId;
                
                groupHtml += `
                    <div class="group-member ${isWolf ? 'wolf-player' : ''} ${isScorekeeper ? 'scorekeeper' : ''}" 
                         data-player-id="${playerId}">
                        ${friend.name}
                        ${isWolf ? '<span class="wolf-badge small">Wolf</span>' : ''}
                        ${isScorekeeper ? '<span class="scorekeeper-badge">Scorekeeper</span>' : ''}
                    </div>
                `;
            }
        });
        
        // Add scorekeeper selection
        groupHtml += `
            </div>
            <div class="scorekeeper-selection">
                <p>Select Scorekeeper: <span class="hint">(This player will receive a link to input scores)</span></p>
        `;
        
        group.playerIds.forEach(playerId => {
            const friend = appData.friends.find(f => f.id === playerId);
            if (friend) {
                groupHtml += `
                    <label class="scorekeeper-label">
                        <input type="radio" name="scorekeeper-group-${index}" class="scorekeeper-radio" 
                               value="${playerId}" ${group.scorekeeperId === playerId ? 'checked' : ''}>
                        <span class="member-name">${friend.name}</span>
                    </label>
                `;
            }
        });
        
        groupHtml += `
            </div>
        `;
        
        groupDiv.innerHTML = groupHtml;
        
        // Setup scorekeeper selection
        const radios = groupDiv.querySelectorAll('.scorekeeper-radio');
        radios.forEach(radio => {
            radio.addEventListener('change', function() {
                group.scorekeeperId = this.value;
                saveData();
                renderGroups(gameId);
            });
        });
        
        container.appendChild(groupDiv);
    });
    
    // Setup drop zones for drag and drop between groups
    setupDropZones();
}

// Set up drop zones for group members
function setupDropZones() {
    const dropZones = document.querySelectorAll('.group-members');
    
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            this.classList.add('drag-over');
        });
        
        zone.addEventListener('dragleave', function() {
            this.classList.remove('drag-over');
        });
        
        zone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
            
            const playerId = e.dataTransfer.getData('text/plain');
            const groupIndex = parseInt(this.getAttribute('data-group-index'));
            
            // Get game from current modal
            const gameTitle = getElement('grouping-game-title');
            if (!gameTitle) return;
            
            const titleParts = gameTitle.textContent.split(' - ');
            if (titleParts.length < 2) return;
            
            const courseName = titleParts[0];
            const game = appData.games.find(g => g.course === courseName);
            if (!game || !game.groups) return;
            
            // Remove player from current group
            let playerFound = false;
            game.groups.forEach(group => {
                const playerIndex = group.playerIds.indexOf(playerId);
                if (playerIndex !== -1) {
                    group.playerIds.splice(playerIndex, 1);
                    playerFound = true;
                    
                    // If player was scorekeeper, reset it
                    if (group.scorekeeperId === playerId && group.playerIds.length > 0) {
                        group.scorekeeperId = group.playerIds[0];
                    }
                }
            });
            
            if (!playerFound) return;
            
            // Add player to new group
            if (game.groups[groupIndex]) {
                game.groups[groupIndex].playerIds.push(playerId);
            }
            
            // Save changes
            saveData();
            
            // Render groups again
            renderGroups(game.id);
        });
    });
}

// Save groups configuration
function saveGroups(gameId) {
    const game = appData.games.find(g => g.id === gameId);
    if (!game) return;
    
    // Check if all groups have at least one player
    const hasEmptyGroups = game.groups.some(group => group.playerIds.length === 0);
    if (hasEmptyGroups) {
        // Remove empty groups
        game.groups = game.groups.filter(group => group.playerIds.length > 0);
    }
    
    // Save data
    saveData();
    
    // Close modal
    const modal = getElement('grouping-modal');
    if (modal) modal.style.display = 'none';
    
    // Update UI
    renderGames();
    
    // Show success message
    alert('Groups saved successfully!');
}

// Generate score input table for a game
function generateScoreTable(game, signups) {
    // If no players signed up, show message
    if (!signups || signups.length === 0) {
        return '<p>No players signed up for this game.</p>';
    }
    
    const holeCount = game.holes || 18;
    const courseData = getCourseData();
    
    let html = `
        <div class="score-table-container">
            <table class="score-table">
                <thead>
                    <tr>
                        <th class="player-header">Player</th>
    `;
    
    // Add hole numbers
    for (let i = 1; i <= holeCount; i++) {
        const isCTPHole = i === game.ctpHole;
        html += `<th class="${isCTPHole ? 'ctp-hole' : ''}">${i}</th>`;
    }
    
    html += `<th>Total</th></tr></thead><tbody>`;
    
    // Add rows for each player
    signups.forEach(signup => {
        const friend = appData.friends.find(f => f.id === signup.playerId);
        if (friend) {
            const isWolfPlayer = signup.wolf;
            html += `
                <tr class="${isWolfPlayer ? 'wolf-player' : ''}">
                    <td class="player-name">${friend.name}${isWolfPlayer ? ' <span class="wolf-badge small">Wolf</span>' : ''}</td>
            `;
            
            // Add input cells for each hole
            for (let i = 1; i <= holeCount; i++) {
                const isCTPHole = i === game.ctpHole;
                html += `
                    <td>
                        <input type="number" class="score-input ${isCTPHole ? 'ctp-hole' : ''}" 
                               min="1" max="15" data-player-id="${friend.id}" data-hole="${i}">
                    </td>
                `;
            }
            
            // Add total cell
            html += `<td class="total-score" data-player-id="${friend.id}">-</td></tr>`;
        }
    });
    
    html += `</tbody></table></div>`;
    return html;
}

// Set up score input handlers
function setupScoreInputHandlers() {
    const inputs = document.querySelectorAll('.score-input');
    inputs.forEach(input => {
        input.addEventListener('change', function() {
            // Update total when scores change
            updatePlayerTotal(this.getAttribute('data-player-id'));
        });
    });
}

// Update player total score
function updatePlayerTotal(playerId) {
    const inputs = document.querySelectorAll(`.score-input[data-player-id="${playerId}"]`);
    const totalCell = document.querySelector(`.total-score[data-player-id="${playerId}"]`);
    
    if (!totalCell || inputs.length === 0) return;
    
    let total = 0;
    let validScores = 0;
    
    inputs.forEach(input => {
        if (input.value && !isNaN(input.value)) {
            total += parseInt(input.value);
            validScores++;
        }
    });
    
    totalCell.textContent = validScores === inputs.length ? total : '-';
}

// Populate CTP dropdown
function populateCtpDropdown(game, signups, ctpSelect) {
    if (!ctpSelect) return;
    
    // Clear previous options
    ctpSelect.innerHTML = '<option value="">-- Select Player --</option>';
    
    // Add each player as an option
    signups.forEach(signup => {
        const friend = appData.friends.find(f => f.id === signup.playerId);
        if (friend) {
            const option = document.createElement('option');
            option.value = friend.id;
            option.textContent = friend.name;
            
            // Set as selected if already chosen
            if (game.scores && game.scores.ctpWinner === friend.id) {
                option.selected = true;
            }
            
            ctpSelect.appendChild(option);
        }
    });
}

// Populate saved scores
function populateSavedScores(game, signups) {
    if (!game.scores || !game.scores.raw) return;
    
    // Fill in scores from saved data
    game.scores.raw.forEach(playerScore => {
        const playerId = playerScore.playerId;
        
        // For each hole, fill in the score
        for (const hole in playerScore.holes) {
            const input = document.querySelector(`.score-input[data-player-id="${playerId}"][data-hole="${hole}"]`);
            if (input) {
                input.value = playerScore.holes[hole];
            }
        }
        
        // Update total
        updatePlayerTotal(playerId);
    });
    
    // Set CTP winner if it exists
    if (game.scores.ctpWinner) {
        const ctpSelect = getElement('ctp-winner');
        if (ctpSelect) {
            ctpSelect.value = game.scores.ctpWinner;
        }
    }
}

// Save scores and calculate skins
function saveScoresAndCalculateSkins(game, signups) {
    // Initialize scores object if it doesn't exist
    if (!game.scores) {
        game.scores = {
            raw: [],
            ctpWinner: null,
            skins: []
        };
    }
    
    // Clear previous raw scores
    game.scores.raw = [];
    
    // Get CTP winner
    const ctpSelect = getElement('ctp-winner');
    game.scores.ctpWinner = ctpSelect ? ctpSelect.value : null;
    
    // Collect scores for each player
    signups.forEach(signup => {
        const playerId = signup.playerId;
        const playerScores = {};
        let allHolesHaveScores = true;
        
        // Get scores for each hole
        for (let i = 1; i <= game.holes; i++) {
            const input = document.querySelector(`.score-input[data-player-id="${playerId}"][data-hole="${i}"]`);
            if (input && input.value) {
                playerScores[i] = parseInt(input.value);
            } else {
                allHolesHaveScores = false;
            }
        }
        
        // Add player scores to raw data
        game.scores.raw.push({
            playerId: playerId,
            holes: playerScores
        });
    });
    
    // Calculate skins
    calculateSkins(game, signups);
    
    // Save data
    saveData();
    
    // Display skins results
    displaySkinsResults(game, signups);
    
    // Hide score section, show results
    const scoreSection = getElement('record-scores-section');
    const skinsResults = getElement('skins-results');
    
    if (scoreSection) scoreSection.style.display = 'none';
    if (skinsResults) skinsResults.style.display = 'block';
}

// Calculate net scores and skins
function calculateSkins(game, signups) {
    if (!game.scores || !game.scores.raw) return;
    
    // Clear previous skins results
    game.scores.skins = [];
    
    // Calculate net score for each player on each hole
    const netScores = {};
    const courseData = getCourseData();
    
    // Initialize netScores object
    for (let hole = 1; hole <= game.holes; hole++) {
        netScores[hole] = [];
    }
    
    // Calculate net scores for each player on each hole
    game.scores.raw.forEach(playerScore => {
        const playerId = playerScore.playerId;
        const friend = appData.friends.find(f => f.id === playerId);
        
        if (friend) {
            const playerHandicap = friend.handicap;
            
            for (let hole = 1; hole <= game.holes; hole++) {
                const grossScore = playerScore.holes[hole];
                
                // Skip holes with no score
                if (!grossScore) continue;
                
                // Get handicap strokes for this hole (half pop system)
                const handicapStrokes = calculateHandicapStrokes(playerHandicap, hole, game.holes);
                
                // Calculate net score (gross - handicap strokes)
                const netScore = grossScore - handicapStrokes;
                
                // Add to netScores object
                netScores[hole].push({
                    playerId,
                    grossScore,
                    netScore
                });
            }
        }
    });
    
    // Determine skins for each hole
    for (let hole = 1; hole <= game.holes; hole++) {
        const holeScores = netScores[hole];
        
        // Skip holes with no scores or only one player
        if (holeScores.length <= 1) continue;
        
        // Sort by net score
        holeScores.sort((a, b) => a.netScore - b.netScore);
        
        // Check if lowest score is unique
        if (holeScores.length >= 2 && holeScores[0].netScore < holeScores[1].netScore) {
            // Skin awarded!
            game.scores.skins.push({
                hole,
                playerId: holeScores[0].playerId,
                netScore: holeScores[0].netScore,
                grossScore: holeScores[0].grossScore
            });
        }
    }
    
    // Add CTP skin if a winner was selected
    if (game.scores.ctpWinner) {
        game.scores.skins.push({
            hole: game.ctpHole,
            playerId: game.scores.ctpWinner,
            isCTP: true
        });
    }
}

// Display skins results
function displaySkinsResults(game, signups) {
    if (!game.scores || !game.scores.skins) return;
    
    const totalPotDisplay = getElement('total-pot');
    const totalSkinsDisplay = getElement('total-skins');
    const skinValueDisplay = getElement('skin-value');
    const skinsByHoleContainer = getElement('skins-by-hole');
    const playerPayoutsContainer = getElement('player-payouts');
    
    if (!totalPotDisplay || !totalSkinsDisplay || !skinValueDisplay || 
        !skinsByHoleContainer || !playerPayoutsContainer) return;
    
    // Calculate totals
    const totalPot = signups.length * game.entryFee;
    const totalSkins = game.scores.skins.length;
    
    // Calculate skin value with precision
    let skinValue = 0;
    if (totalSkins > 0) {
        // Get exact value per skin (might have decimal)
        skinValue = totalPot / totalSkins;
        // Round to nearest dollar for display
        const roundedSkinValue = Math.round(skinValue);
        // Update display with rounded value
        skinValueDisplay.textContent = roundedSkinValue;
    }
    
    // Display totals
    totalPotDisplay.textContent = totalPot;
    totalSkinsDisplay.textContent = totalSkins;
    
    // Display skins by hole
    skinsByHoleContainer.innerHTML = '';
    if (totalSkins > 0) {
        const skinsList = document.createElement('ul');
        skinsList.className = 'skins-list';
        
        // Sort skins by hole number
        const sortedSkins = [...game.scores.skins].sort((a, b) => {
            // Sort CTP to the end
            if (a.isCTP && !b.isCTP) return 1;
            if (!a.isCTP && b.isCTP) return -1;
            return a.hole - b.hole;
        });
        
        // For each hole, show skin winner
        for (let hole = 1; hole <= game.holes; hole++) {
            const skin = sortedSkins.find(s => s.hole === hole && !s.isCTP);
            
            const li = document.createElement('li');
            
            if (skin) {
                const winner = appData.friends.find(f => f.id === skin.playerId);
                if (winner) {
                    li.innerHTML = `<strong>Hole ${hole}:</strong> ${winner.name} (${skin.grossScore} gross, ${skin.netScore.toFixed(1)} net)`;
                }
            } else {
                li.innerHTML = `<strong>Hole ${hole}:</strong> <span class="no-skin">No skin awarded</span>`;
            }
            
            skinsList.appendChild(li);
        }
        
        // Add CTP winner if applicable
        const ctpSkin = sortedSkins.find(s => s.isCTP);
        if (ctpSkin) {
            const ctpWinner = appData.friends.find(f => f.id === ctpSkin.playerId);
            if (ctpWinner) {
                const li = document.createElement('li');
                li.innerHTML = `<strong>Closest to Pin (Hole ${game.ctpHole}):</strong> <span class="ctp-skin">${ctpWinner.name}</span>`;
                skinsList.appendChild(li);
            }
        }
        
        skinsByHoleContainer.appendChild(skinsList);
    } else {
        skinsByHoleContainer.innerHTML = '<p>No skins were awarded.</p>';
    }
    
    // Display player payouts
    playerPayoutsContainer.innerHTML = '';
    if (totalSkins > 0) {
        // Calculate payouts by player
        const payouts = {};
        let totalCalculatedPayout = 0;
        
        // First pass: count skins per player
        game.scores.skins.forEach(skin => {
            if (!payouts[skin.playerId]) {
                payouts[skin.playerId] = {
                    count: 0,
                    amount: 0
                };
            }
            payouts[skin.playerId].count++;
        });
        
        // Second pass: calculate exact amounts
        Object.entries(payouts).forEach(([playerId, payout]) => {
            // Calculate exact amount (not rounded yet)
            payout.amount = payout.count * skinValue;
            // Track total calculated payout
            totalCalculatedPayout += payout.amount;
        });
        
        // Adjust if total exceeds pot (due to rounding)
        if (totalCalculatedPayout > totalPot) {
            // Proportionally reduce each player's payout
            const adjustment = totalPot / totalCalculatedPayout;
            Object.values(payouts).forEach(payout => {
                payout.amount = Math.floor(payout.amount * adjustment);
            });
            
            // Distribute any remaining cents to players with most skins
            const sortedPlayers = Object.entries(payouts)
                .sort((a, b) => b[1].count - a[1].count);
            
            // Recalculate actual total after flooring values
            const actualTotal = Object.values(payouts)
                .reduce((sum, payout) => sum + payout.amount, 0);
            
            // Distribute remaining amount (if any)
            let remaining = totalPot - actualTotal;
            let index = 0;
            
            while (remaining > 0 && index < sortedPlayers.length) {
                sortedPlayers[index][1].amount += 1;
                remaining -= 1;
                index = (index + 1) % sortedPlayers.length;
            }
        }
        
        // Create payouts list
        const payoutsList = document.createElement('ul');
        payoutsList.className = 'payout-list';
        
        // Sort payouts by amount (highest first)
        const sortedPayouts = Object.entries(payouts).sort((a, b) => b[1].amount - a[1].amount);
        
        sortedPayouts.forEach(([playerId, payout]) => {
            const player = appData.friends.find(f => f.id === playerId);
            if (player) {
                const li = document.createElement('li');
                li.innerHTML = `
                    <strong>${player.name}:</strong> $${payout.amount} 
                    (${payout.count} skin${payout.count !== 1 ? 's' : ''})
                `;
                payoutsList.appendChild(li);
            }
        });
        
        playerPayoutsContainer.appendChild(payoutsList);
    } else {
        playerPayoutsContainer.innerHTML = '<p>No payouts to display.</p>';
    }
}

// Calculate handicap strokes for a player on a hole (half pop system)
function calculateHandicapStrokes(playerHandicap, holeIndex, gender = 'men') {
    if (playerHandicap === null) return 0;
    
    try {
        // For Monarch Dunes course, use the proper handicap indexes
        // The course parameter is not available everywhere yet, so for now we'll 
        // assume Monarch Dunes as the default course
        return calculateMonarchDunesHandicapStrokes(playerHandicap, holeIndex, gender);
    } catch (error) {
        console.error("Error calculating handicap strokes:", error);
        return 0; // Default to 0 if there's an error
    }
}

// Get course data - returns Monarch Dunes by default
function getCourseData() {
    return getMonarchDunesData();
}
