/**
 * Sync Reducer
 * 
 * Handles state updates for sync-related actions.
 */

import * as types from '../actions/types';
import { STORAGE_MODES } from '../../storage/StorageManager';

/**
 * Initial state for the sync reducer
 */
const initialState = {
  // Storage mode (local, api, hybrid)
  storageMode: STORAGE_MODES.HYBRID,
  
  // API availability
  apiAvailable: true,
  
  // Sync status
  syncing: false,
  lastSync: null,
  error: null,
  
  // Backup status
  creatingBackup: false,
  lastBackup: null,
  backupData: null,
  
  // Restore status
  restoring: false,
  lastRestore: null,
  
  // Overall initialization status
  initializing: false,
  initialized: false
};

/**
 * Sync reducer function
 * @param {Object} state - Current state
 * @param {Object} action - Action object
 * @returns {Object} New state
 */
const syncReducer = (state = initialState, action) => {
  switch (action.type) {
    // ====== API AVAILABILITY ======
    case types.API_AVAILABILITY_CHANGE:
      return {
        ...state,
        apiAvailable: action.payload
      };
      
    // ====== STORAGE MODE ======
    case types.SET_STORAGE_MODE:
      return {
        ...state,
        storageMode: action.payload
      };
      
    // ====== SYNC DATA ======
    case types.SYNC_DATA_REQUEST:
      return {
        ...state,
        syncing: true,
        error: null
      };
      
    case types.SYNC_DATA_SUCCESS:
      return {
        ...state,
        syncing: false,
        lastSync: action.payload.timestamp,
        error: null
      };
      
    case types.SYNC_DATA_FAILURE:
      return {
        ...state,
        syncing: false,
        error: action.payload
      };
      
    // ====== BACKUP ======
    case types.CREATE_BACKUP_REQUEST:
      return {
        ...state,
        creatingBackup: true,
        error: null
      };
      
    case types.CREATE_BACKUP_SUCCESS:
      return {
        ...state,
        creatingBackup: false,
        lastBackup: action.payload.timestamp,
        backupData: action.payload.backup,
        error: null
      };
      
    case types.CREATE_BACKUP_FAILURE:
      return {
        ...state,
        creatingBackup: false,
        error: action.payload
      };
      
    // ====== RESTORE ======
    case types.RESTORE_BACKUP_REQUEST:
      return {
        ...state,
        restoring: true,
        error: null
      };
      
    case types.RESTORE_BACKUP_SUCCESS:
      return {
        ...state,
        restoring: false,
        lastRestore: action.payload.timestamp,
        error: null
      };
      
    case types.RESTORE_BACKUP_FAILURE:
      return {
        ...state,
        restoring: false,
        error: action.payload
      };
      
    // ====== INITIALIZE APP ======
    case types.INITIALIZE_APP_REQUEST:
      return {
        ...state,
        initializing: true,
        error: null
      };
      
    case types.INITIALIZE_APP_SUCCESS:
      return {
        ...state,
        initializing: false,
        initialized: true,
        error: null
      };
      
    case types.INITIALIZE_APP_FAILURE:
      return {
        ...state,
        initializing: false,
        error: action.payload
      };
      
    // Default: return current state
    default:
      return state;
  }
};

export default syncReducer;
