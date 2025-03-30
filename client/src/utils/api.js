import axios from 'axios';

// Create an axios instance with default config
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
API.interceptors.request.use(
  (config) => {
    // Add auth token to headers if it exists (for future implementation)
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific error status codes
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', error.response.data);
      
      // Handle authentication errors (for future implementation)
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        // Future: redirect to login page
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Request Error:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Setup Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// API endpoints for friends
const friendsAPI = {
  getAll: () => API.get('/friends'),
  getById: (id) => API.get(`/friends/${id}`),
  create: (friendData) => API.post('/friends', friendData),
  update: (id, friendData) => API.put(`/friends/${id}`, friendData),
  delete: (id) => API.delete(`/friends/${id}`),
};

// API endpoints for games
const gamesAPI = {
  getAll: () => API.get('/games'),
  getUpcoming: () => API.get('/games/upcoming'),
  getPast: () => API.get('/games/past'),
  getById: (id) => API.get(`/games/${id}`),
  create: (gameData) => API.post('/games', gameData),
  update: (id, gameData) => API.put(`/games/${id}`, gameData),
  delete: (id) => API.delete(`/games/${id}`),
  updateStatus: (id, status) => API.patch(`/games/${id}/status`, { status }),
  updateGroups: (id, groups) => API.patch(`/games/${id}/groups`, { groups }),
  updateScores: (id, scores) => API.patch(`/games/${id}/scores`, { scores }),
};

// API endpoints for signups
const signupsAPI = {
  getAll: () => API.get('/signups'),
  getByGameId: (gameId) => API.get(`/signups/game/${gameId}`),
  getByPlayerId: (playerId) => API.get(`/signups/player/${playerId}`),
  getByPlayerAndGame: (playerId, gameId) => 
    API.get(`/signups/player/${playerId}/game/${gameId}`),
  create: (signupData) => API.post('/signups', signupData),
  update: (id, signupData) => API.put(`/signups/${id}`, signupData),
  delete: (id) => API.delete(`/signups/${id}`),
};

// Combined API object
const api = {
  friends: friendsAPI,
  games: gamesAPI,
  signups: signupsAPI,
  
  // For adding any custom functionality or combined API operations
  custom: {
    // Example: get a game with all its signups
    getGameWithSignups: async (gameId) => {
      const [gameRes, signupsRes] = await Promise.all([
        gamesAPI.getById(gameId),
        signupsAPI.getByGameId(gameId),
      ]);
      
      return {
        game: gameRes.data,
        signups: signupsRes.data,
      };
    },
  },
};

export default api;
