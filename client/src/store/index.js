/**
 * Redux Store Configuration
 * 
 * Configures and exports the Redux store with middleware.
 */

import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import rootReducer from './reducers';

/**
 * Configure Redux DevTools Extension if available
 */
const configureDevTools = () => {
  // Check if we're in development and if Redux DevTools are available
  if (
    process.env.NODE_ENV === 'development' &&
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
  ) {
    return window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
      trace: true, // Enable action stack trace tracking for debugging
      traceLimit: 25 // Limit for stack trace lines
    });
  }
  
  // Fall back to regular compose if DevTools not available
  return compose;
};

/**
 * Configure middleware for the Redux store
 */
const configureMiddleware = () => {
  const middleware = [thunk];
  
  // Add development middlewares if appropriate
  if (process.env.NODE_ENV === 'development') {
    // We could add more development middlewares here in the future:
    // - redux-logger for detailed logging
    // - redux-immutable-state-invariant to catch mutations
  }
  
  return applyMiddleware(...middleware);
};

// Create enhancer with DevTools and middleware
const composeEnhancers = configureDevTools();
const enhancer = composeEnhancers(configureMiddleware());

/**
 * Create the Redux store
 */
const store = createStore(rootReducer, enhancer);

/**
 * Hot module replacement for Redux reducers in development
 */
if (process.env.NODE_ENV === 'development' && module.hot) {
  module.hot.accept('./reducers', () => {
    const nextRootReducer = require('./reducers').default;
    store.replaceReducer(nextRootReducer);
  });
}

export default store;
