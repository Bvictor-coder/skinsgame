/**
 * Synchronization Actions
 * 
 * Redux action creators for data synchronization operations.
 */

import * as types from './types';
import storageManager from '../../storage/StorageManager';
import { fetchGames } from './gameActions';

/**
 * Check API availability and update storage mode accordingly
 * @returns {Function} Thunk action
 */
export const checkApiAvailability = () => async (dispatch) => {
  try {
    const isAvailable = await storageManager.checkApiAvailability();
    
    dispatch({
      type: types.API_AVAILABILITY_CHANGE,
      payload: isAvailable
    });
    
    return isAvailable;
  } catch (error) {
    console.error('Error checking API availability:', error);
    return false;
  }
};

/**
 * Set storage mode (local, api, hybrid)
 * @param {string} mode - Storage mode
 * @returns {Object} Action object
 */
export const setStorageMode = (mode) => {
  storageManager.setMode(mode);
  
  return {
    type: types.SET_STORAGE_MODE,
    payload: mode
  };
};

/**
 * Synchronize data between local storage and API
 * @returns {Function} Thunk action
 */
export const syncData = () => async (dispatch) => {
  dispatch({ type: types.SYNC_DATA_REQUEST });
  
  try {
    const success = await storageManager.syncData();
    
    // If sync was successful, refresh games from current storage
    if (success) {
      await dispatch(fetchGames());
    }
    
    dispatch({
      type: types.SYNC_DATA_SUCCESS,
      payload: {
        success,
        timestamp: new Date().toISOString()
      }
    });
    
    return success;
  } catch (error) {
    console.error('Error syncing data:', error);
    
    dispatch({
      type: types.SYNC_DATA_FAILURE,
      payload: error.message
    });
    
    return false;
  }
};

/**
 * Create backup of all data
 * @returns {Function} Thunk action
 */
export const createBackup = () => async (dispatch) => {
  dispatch({ type: types.CREATE_BACKUP_REQUEST });
  
  try {
    const backupData = await storageManager.createBackup();
    
    dispatch({
      type: types.CREATE_BACKUP_SUCCESS,
      payload: {
        backup: backupData,
        timestamp: new Date().toISOString()
      }
    });
    
    return backupData;
  } catch (error) {
    console.error('Error creating backup:', error);
    
    dispatch({
      type: types.CREATE_BACKUP_FAILURE,
      payload: error.message
    });
    
    throw error;
  }
};

/**
 * Restore from backup
 * @param {Object} backupData - Backup data
 * @returns {Function} Thunk action
 */
export const restoreFromBackup = (backupData) => async (dispatch) => {
  dispatch({ type: types.RESTORE_BACKUP_REQUEST });
  
  try {
    const success = await storageManager.restoreFromBackup(backupData);
    
    if (success) {
      // Refresh games from storage after restore
      await dispatch(fetchGames());
      
      dispatch({
        type: types.RESTORE_BACKUP_SUCCESS,
        payload: {
          success,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      throw new Error('Failed to restore from backup');
    }
    
    return success;
  } catch (error) {
    console.error('Error restoring from backup:', error);
    
    dispatch({
      type: types.RESTORE_BACKUP_FAILURE,
      payload: error.message
    });
    
    throw error;
  }
};

/**
 * Initialize the application
 * @returns {Function} Thunk action
 */
export const initializeApp = () => async (dispatch) => {
  dispatch({ type: types.INITIALIZE_APP_REQUEST });
  
  try {
    // First check API availability
    await dispatch(checkApiAvailability());
    
    // Then load games
    await dispatch(fetchGames());
    
    dispatch({
      type: types.INITIALIZE_APP_SUCCESS
    });
  } catch (error) {
    console.error('Error initializing application:', error);
    
    dispatch({
      type: types.INITIALIZE_APP_FAILURE,
      payload: error.message
    });
    
    throw error;
  }
};
