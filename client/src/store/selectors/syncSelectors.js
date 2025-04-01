/**
 * Sync Selectors
 * 
 * Selector functions for sync-related state.
 */

// Base selector to get the sync state slice
export const getSyncState = (state) => state.sync;

// Selectors for storage mode
export const getStorageMode = (state) => getSyncState(state).storageMode;

// Selectors for API status
export const isApiAvailable = (state) => getSyncState(state).apiAvailable;

// Selectors for sync status
export const isSyncing = (state) => getSyncState(state).syncing;
export const getLastSyncTime = (state) => getSyncState(state).lastSync;

// Selectors for backup status
export const isCreatingBackup = (state) => getSyncState(state).creatingBackup;
export const getLastBackupTime = (state) => getSyncState(state).lastBackup;
export const getBackupData = (state) => getSyncState(state).backupData;

// Selectors for restore status
export const isRestoring = (state) => getSyncState(state).restoring;
export const getLastRestoreTime = (state) => getSyncState(state).lastRestore;

// Selectors for app initialization
export const isInitializing = (state) => getSyncState(state).initializing;
export const isInitialized = (state) => getSyncState(state).initialized;

// Selector for sync error
export const getSyncError = (state) => getSyncState(state).error;
