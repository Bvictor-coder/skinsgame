# Golf Skins Game Architecture

This document explains the architecture of the Golf Skins Game application, focusing on the data management and state machine for game lifecycle.

## Overview

The application uses a Redux-based architecture with a Game model that implements state machine pattern for game lifecycle management. This ensures that game status transitions follow valid paths and that game data remains consistent throughout the application.

## Key Components

### Models

- **Game**: Core model class for game data with state machine functionality (`models/Game.js`)
- **GameStatus**: Constants and utilities for game status management (`models/GameStatus.js`)
- **GameValidator**: Validation rules for game data (`models/GameValidator.js`)

### Redux Store

- **Actions**: Action creators for game operations (`store/actions/gameActions.js`)
- **Reducers**: State update logic for game data (`store/reducers/gameReducer.js`)
- **Selectors**: Functions to extract and derive data from state (`store/selectors/gameSelectors.js`)

### Storage

- **GameStorage**: Interface for localStorage persistence (`storage/GameStorage.js`)

### Compatibility

- **dataSync Adapter**: Backwards compatibility layer (`utils/dataSync/adapter.js`)

## Game Lifecycle

The game follows a state machine with the following statuses:

1. **Created**: Initial state, game is created but not open for enrollment
2. **Open**: Game is open for player sign-ups
3. **Enrollment Complete**: Sign-ups are closed, preparing for game start
4. **In Progress**: Game is being played, scores can be entered
5. **Completed**: All scores are entered, but results are not yet finalized
6. **Finalized**: Game is complete with final results, no further modifications allowed

Valid transitions are defined in `GameStatus.js` and enforced by the Game model.

## Using the Architecture

### Legacy Components

Legacy components can continue to use the `dataSync` API as before:

```javascript
import dataSync from '../utils/dataSync';

// Example usage in a component
async function loadGames() {
  const games = await dataSync.getGames();
  // Process games...
}
```

The adapter will route these calls through the Redux store, so the data stays consistent.

### New or Migrated Components

New components should use Redux directly:

```javascript
import { useDispatch, useSelector } from 'react-redux';
import { fetchGames, updateGame } from '../store/actions/gameActions';
import { selectAllGames, selectGameById } from '../store/selectors/gameSelectors';

// In your component:
const dispatch = useDispatch();
const games = useSelector(selectAllGames);

// Load games
useEffect(() => {
  dispatch(fetchGames());
}, [dispatch]);

// Update a game
const handleUpdate = (gameId, updates) => {
  dispatch(updateGame(gameId, updates));
};
```

See `components/examples/GameManagementRedux.js` for a complete example.

## Migration Strategy

To migrate components from the old dataSync API to Redux:

1. Import the required actions and selectors
2. Replace dataSync method calls with Redux dispatch calls
3. Replace local component state with useSelector hooks

## Advantages of the New Architecture

- **Predictable State Transitions**: Game status can only change in valid ways
- **Centralized State Management**: All components work with the same data
- **Type Safety**: Validation at every level prevents invalid data
- **Time Travel Debugging**: Redux DevTools allow inspecting state history
- **Calculated Results Preservation**: Special handling for calculated scores prevents data loss during transitions
- **Improved Testability**: Pure functions for reducers and selectors are easy to test

## Best Practices

- Use selectors to access state, not direct store access
- Perform complex state derivations in selectors, not components
- Use the Game model for status transitions, don't update status directly
- Always validate data before persistence
- Dispatch actions instead of directly modifying the store
