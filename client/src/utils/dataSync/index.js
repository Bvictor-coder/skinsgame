/**
 * DataSync Entry Point
 * 
 * This file exports the dataSync adapter that provides backwards compatibility
 * with the old dataSync API while using the new Redux store and Game model underneath.
 * 
 * This allows for a gradual migration of components to use Redux directly.
 */

import adapter from './adapter';

// Export the adapter as the default export
export default adapter;
