import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bodyParser from 'body-parser';

// Routes imports (to be created later)
import friendRoutes from './routes/friends.js';
import gameRoutes from './routes/games.js';
import signupRoutes from './routes/signups.js';

// Initialize environment variables
dotenv.config();

// Create Express app
const app = express();
const port = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  optionsSuccessStatus: 200,
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(express.json());

// API Routes
app.use('/api/friends', friendRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/signups', signupRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Serve static frontend in production (only if SERVE_STATIC is enabled)
if (process.env.NODE_ENV === 'production' && process.env.SERVE_STATIC === 'true') {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  
  app.use(express.static(join(__dirname, '../../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../../client/build/index.html'));
  });
} else {
  // For API-only mode, handle 404s for non-API routes
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api') && req.path !== '/health') {
      return res.status(404).json({ 
        message: 'API endpoint not found',
        availableEndpoints: ['/api/friends', '/api/games', '/api/signups', '/health']
      });
    }
    next();
  });
}

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/golf-skins-organizer', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
  
  // Start the server
  app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
  });
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
});

// Handle server errors
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});

export default app;
