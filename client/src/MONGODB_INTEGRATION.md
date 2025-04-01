# MongoDB Integration with Redux State Machine

This document provides an overview of the Redux state machine integration with MongoDB for the Golf Skins Game Organizer application. This architecture enables seamless data persistence between the client-side state and the MongoDB database.

## Architecture Overview

The integration follows a layered architecture:

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│                 │       │                 │       │                 │
│  React          │       │  Redux          │       │  Storage        │
│  Components     │◄─────►│  Store          │◄─────►│  Manager        │
│                 │       │                 │       │                 │
└─────────────────┘       └─────────────────┘       └────────┬────────┘
                                                             │
                              ┌───────────────────────┐      │
                              │                       │      │
                              │  MongoDB              │      │
                              │  Backend              │◄─────┘
                              │                       │
                              └───────────────────────┘
```

### Key Components

1. **Storage Manager**: Coordinates between local storage and API storage, with three modes:
   - `LOCAL`: Uses only local storage (useful for offline operation)
   - `API`: Uses only API storage (requires network connection)
   - `HYBRID`: Uses both, with API as primary and local as backup

2. **API Game Storage Adapter**: Connects Redux actions to the MongoDB backend via API endpoints

3. **Sync Actions**: Redux actions for synchronization operations:
   - Check API availability
   - Sync data between local and API storage
   - Create/restore backups
   - Initialize the application

4. **Game State Machine**: Ensures game transitions follow a valid flow, maintaining data integrity

## Setup Instructions

### Prerequisites

- Node.js and npm installed
- MongoDB Atlas account (for production deployment)

### Local Development Setup

1. Install dependencies from the project root:
   ```
   cd client && npm install redux react-redux redux-thunk
   ```

2. Configure environment variables:
   - For local MongoDB, use the default MongoDB URI in `.env` file
   - For MongoDB Atlas, update the connection string in the server's `.env` file

3. Start the development server:
   ```
   cd server && npm run dev
   ```

4. In a separate terminal, start the client:
   ```
   cd client && npm start
   ```

### Testing the Integration

1. Visit the database sync test page at:
   ```
   http://localhost:3000/test-db-sync
   ```

2. On this page, you can:
   - Create, read, update, and delete games
   - Toggle between different storage modes
   - Manually sync data between local storage and the API
   - Create and restore backups

### Production Setup

For production deployment, follow these steps:

1. Configure MongoDB Atlas:
   - Create a cluster in MongoDB Atlas
   - Set up database access user
   - Whitelist IP addresses
   - Get the connection string

2. Update the server's `.env` file with the MongoDB Atlas connection string

3. Deploy the server to Render.com (see DEPLOYMENT.md for detailed instructions)

4. Update the client's API endpoint in `.env.production`

5. Deploy the client to Netlify

## Offline-Online Sync

The application implements a sophisticated offline-online synchronization mechanism:

1. When online, all changes are sent to the API and stored locally
2. When offline, changes are stored locally
3. When reconnecting, the storage manager syncs local changes to the API
4. Conflict resolution prioritizes the most recently updated data

This provides seamless operation regardless of network connectivity.

## State Machine Integration

The MongoDB-Redux integration preserves the state machine logic:

1. Client-side game states are mapped to server-side states (with more detail retained client-side)
2. Game transitions are validated before persistence
3. Game history is maintained for audit purposes

## Demo Component

The `/test-db-sync` route provides a demonstration of the MongoDB-Redux integration, showing:

- Storage mode switching (Local, API, Hybrid)
- API connectivity detection
- CRUD operations with real-time feedback
- Manual and automatic sync operations

## Troubleshooting

### API Connection Issues

If you encounter API connection issues:

1. Check that the server is running
2. Verify the MongoDB connection string in server/.env
3. Check for CORS issues in the browser console
4. Try toggling to LOCAL mode to continue working offline

### Sync Conflicts

If you encounter sync conflicts:

1. The system automatically resolves conflicts based on timestamps
2. You can manually create a backup before syncing as a safety measure
3. In worst-case scenarios, you can restore from a previous backup

## Further Development

Potential enhancements to this integration:

1. Implement more sophisticated conflict resolution
2. Add diff-based syncing to minimize data transfer
3. Add push notifications for multi-user scenarios
4. Implement real-time updates with WebSockets
