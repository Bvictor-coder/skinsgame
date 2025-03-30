# Local Development Guide

This guide will help you set up and run the Golf Skins Game Organizer on your local machine.

## Prerequisites

Before you begin, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (version 14 or newer)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [MongoDB Community Edition](https://www.mongodb.com/try/download/community) (for local database)

## Step 1: Install MongoDB Locally

### For Windows:
1. Download the MongoDB Community Server from the [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Run the installer and follow the installation wizard
3. Choose "Complete" setup type
4. You can opt to install MongoDB Compass (a GUI for MongoDB) when prompted
5. Complete the installation

### For macOS:
Using Homebrew (recommended):
```bash
brew tap mongodb/brew
brew install mongodb-community
```

### For Linux:
Follow the instructions for your specific distribution on the [MongoDB documentation](https://docs.mongodb.com/manual/administration/install-on-linux/)

### Start MongoDB:
- Windows: MongoDB should run as a service by default
- macOS: `brew services start mongodb-community`
- Linux: `sudo systemctl start mongod`

## Step 2: Clone the Repository

If you haven't already, clone the repository:

```bash
git clone <your-repository-url>
cd golf-skins-game-organizer
```

## Step 3: Install Dependencies

Install server dependencies:
```bash
cd server
npm install
```

Install client dependencies:
```bash
cd ../client
npm install
```

## Step 4: Configure Environment Variables

The environment files are already set up in the project:

- `server/.env` - Contains environment variables for the server
- `client/.env.development` - Contains environment variables for the client in development mode

Make sure these files exist and have the correct values. If they're missing, you can copy them from the example files:

```bash
# For server
cp server/.env.example server/.env

# For client
cp client/.env.development.example client/.env.development
```

## Step 5: Start the Development Servers

### Start the Backend Server:

```bash
cd server
npm run dev
```

This will start the server on port 5000 with live reloading enabled.

### Start the Frontend Server:

Open a new terminal and run:

```bash
cd client
npm start
```

This will start the React development server on port 3000 and open a browser window automatically.

## Step 6: Access the Application

Open your browser and navigate to:

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

You can test that the API is working by visiting http://localhost:5000/health, which should show a success message.

## Developing the Application

### Backend Development

The backend structure follows the MVC pattern:

- `server/src/models/` - MongoDB schemas
- `server/src/controllers/` - Business logic
- `server/src/routes/` - API routes
- `server/src/index.js` - Server entry point

To add a new API endpoint:
1. Create a new controller function in the appropriate controller file
2. Add a new route in the corresponding routes file
3. If needed, create or modify the relevant model

### Frontend Development

The frontend is built with React:

- `client/src/components/` - Reusable UI components
- `client/src/utils/` - Utility functions and services
- `client/src/App.js` - Main application component

### Database Access

You can interact with your local MongoDB database using:

- **MongoDB Compass**: A GUI tool for MongoDB
- **MongoDB Shell**: Run `mongosh` in your terminal

## Testing Your Changes

### Manual Testing

1. Make changes to the code
2. Test the changes in the browser or using tools like Postman for API testing
3. Check the console and server logs for any errors

### Code Quality

Before committing your changes, make sure:

1. Your code follows the project's style and conventions
2. There are no linting errors or warnings
3. All features work as expected

## Common Development Tasks

### Adding a New Feature

1. Determine if the feature requires backend changes, frontend changes, or both
2. Implement backend changes first if needed (models, controllers, routes)
3. Implement frontend changes (components, services, etc.)
4. Test the feature thoroughly

### Fixing Bugs

1. Identify the source of the bug (backend, frontend, or both)
2. Fix the issue in the relevant code
3. Test to ensure the bug is resolved and no new issues are introduced

### Working with Data

The application uses a data synchronization service that bridges local storage and the server API. When developing:

1. Set `REACT_APP_USE_API=true` in your client .env file to use the API
2. Use the browser's developer tools to inspect local storage data
3. Use MongoDB Compass to inspect the database directly

## Troubleshooting

### Server Won't Start

1. Check if MongoDB is running
2. Check if port 5000 is already in use
3. Check for errors in the terminal output
4. Verify environment variables are set correctly

### Client Won't Start

1. Check if port 3000 is already in use
2. Check for errors in the terminal output
3. Verify environment variables are set correctly

### API Connection Issues

1. Ensure the server is running
2. Check the API URL in the client's environment variables
3. Look for CORS errors in the browser console

### Database Connection Issues

1. Ensure MongoDB is running
2. Check the MongoDB connection string in the server's environment variables
3. Check for authentication errors in the server logs

## Next Steps

Once you've successfully set up the local development environment and tested the application, you can proceed to deployment using the instructions in `DEPLOYMENT.md`.

Happy coding!
