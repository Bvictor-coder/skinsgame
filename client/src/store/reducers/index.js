/**
 * Root Reducer
 * 
 * Combines all reducers into a single root reducer.
 */

import { combineReducers } from 'redux';
import gameReducer from './gameReducer';
import syncReducer from './syncReducer';

/**
 * Root reducer combines all individual domain reducers
 */
const rootReducer = combineReducers({
  games: gameReducer,
  sync: syncReducer,
  // Add more reducers here as the application grows:
  // friends: friendReducer,
  // signups: signupReducer,
  // auth: authReducer,
  // etc.
});

export default rootReducer;
