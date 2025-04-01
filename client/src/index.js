/**
 * Application Entry Point
 * 
 * Renders the root React component and sets up providers.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import App from './App';
import store from './store';

// Import global styles
import './styles.css';

// Root component with providers
const Root = () => (
  <Provider store={store}>
    <App />
  </Provider>
);

// Render the application
ReactDOM.render(<Root />, document.getElementById('root'));

// Enable hot module replacement for development
if (process.env.NODE_ENV !== 'production' && module.hot) {
  module.hot.accept('./App', () => {
    const NextApp = require('./App').default;
    ReactDOM.render(
      <Provider store={store}>
        <NextApp />
      </Provider>,
      document.getElementById('root')
    );
  });
}
