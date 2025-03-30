# Golf Skins Game Organizer

A comprehensive web application for organizing and managing golf skins games, handling player management, game creation, signups, groupings, scoring, and results calculation.

## Features

- **User Roles**: Administrator, Player, and Scorekeeper views with role-specific interfaces
- **Game Management**: Create, view, and manage golf games
- **Player Roster**: Maintain a database of players with handicaps
- **Signup System**: Allow players to sign up for games
- **Wolf Game Support**: Special handling for Wolf game variants
- **Group Formation**: Create balanced player groups
- **Score Entry**: Mobile-optimized score entry with custom number pad for scorekeepers
- **Skins Calculation**: Automatically determine skins and payouts
- **Mobile Optimized**: Fully responsive design for on-course use
- **Data Synchronization**: Smooth transition between localStorage and server storage

## Technology Stack

- **Frontend**: React.js, responsive CSS
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **API**: RESTful API architecture
- **Authentication**: Simple role-based authentication system

## Project Structure

The project follows a full-stack MERN architecture:

```
/
├── client/                # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── utils/         # Utility functions including API client
│   │   └── ...
│   └── public/            # Static assets
├── server/                # Backend Node.js application
│   ├── src/
│   │   ├── controllers/   # Business logic
│   │   ├── models/        # MongoDB schemas
│   │   ├── routes/        # API routes
│   │   └── ...
│   └── ...
└── ...
```

## Quick Start

For a quick start with the application, use:

```bash
# Install all dependencies (root, client, and server)
npm run install-all

# Start both client and server in development mode
npm run dev
```

For more detailed instructions, see:

- [Local Development Guide](LOCAL_DEVELOPMENT.md) - Instructions for setting up and developing locally
- [Deployment Guide](DEPLOYMENT.md) - Step-by-step instructions for deploying to production

## Environment Files

The project uses several environment files:

- `server/.env` - Server configuration variables
- `client/.env.development` - Client dev environment variables
- `client/.env.production` - Client production environment variables (created during deployment)

## Available Scripts

- `npm run install-all` - Install dependencies for root, client, and server
- `npm run dev` - Start both client and server in development mode
- `npm run server` - Start only the backend server
- `npm run client` - Start only the frontend client
- `npm run build` - Build both client and server for production

## Data Migration

The application includes a DataSync service that handles the transition from localStorage to server storage. When running with `REACT_APP_USE_API=true`, it will:

1. Load existing data from localStorage
2. Sync it with the server
3. Continue using the server API for data operations, with localStorage as a backup

This ensures a smooth transition without data loss for existing users.

## License

This project is proprietary and not licensed for public distribution.
