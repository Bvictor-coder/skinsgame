# Deployment Guide for Golf Skins Game Organizer

This guide will walk you through deploying your application to cloud services using free tiers. The process involves three parts:

1. Setting up a MongoDB Atlas database
2. Deploying the Node.js backend to Render.com
3. Deploying the React frontend to Netlify

## Prerequisites

- GitHub account (to store your code)
- Credit card (for verification only - we'll use free tiers)
- Your project code pushed to a GitHub repository

## Part 1: Setting Up MongoDB Atlas

MongoDB Atlas provides a free tier that's perfect for small applications.

### Step 1: Create a MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account (you can use GitHub or Google to sign in)
3. Follow the initial setup, selecting the free tier when prompted

### Step 2: Create a Cluster

1. After signing up, you'll be prompted to create a cluster
2. Choose the "Free Shared Cluster" option
3. Select your preferred cloud provider (AWS, Google Cloud, or Azure)
4. Choose a region close to your target audience (e.g., US for North American users)
5. Click "Create Cluster" (cluster creation can take a few minutes)

### Step 3: Configure Database Access

1. While your cluster is being created, go to the "Database Access" section in the left sidebar
2. Click "Add New Database User"
3. Create a username and a secure password (save these securely, you'll need them later)
4. Set privileges to "Read and Write to Any Database"
5. Click "Add User"

### Step 4: Configure Network Access

1. Go to the "Network Access" section in the left sidebar
2. Click "Add IP Address"
3. For development purposes, you can click "Allow Access from Anywhere" (not ideal for production but simpler for getting started)
4. Click "Confirm"

### Step 5: Get Connection String

1. Once your cluster is created, click on "Connect"
2. Choose "Connect your application"
3. Copy the connection string provided
4. Replace `<password>` in the string with your database user's password
5. Save this connection string for later use in your backend deployment

## Part 2: Deploying the Backend to Render.com

Render provides a free tier for web services that's easy to set up.

### Step 1: Create a Render Account

1. Go to [Render](https://render.com/)
2. Sign up for a free account (you can use GitHub to sign in)

### Step 2: Connect Your GitHub Repository

1. After signing in, click "New" and select "Web Service"
2. Connect your GitHub account if prompted
3. Select the repository that contains your project

### Step 3: Configure the Web Service

1. In the configuration screen:
   - Give your service a name (e.g., "golf-skins-api")
   - Make sure the Environment is set to "Node"
   - Set the Build Command to `cd server && npm install && npm run build`
   - Set the Start Command to `cd server && node build/index.js` (adjust if your build output directory is different)
   - Select the Free plan
   - Click "Advanced" and add the following environment variables:
     - `MONGODB_URI`: Paste your MongoDB Atlas connection string
     - `PORT`: Set to `8080` (Render uses this port by default)
     - `NODE_ENV`: Set to `production`
     - Any other environment variables your app needs (check your `.env.example` file)

2. Click "Create Web Service"

### Step 4: Verify Deployment

1. Render will start building and deploying your app (this may take a few minutes)
2. Once deployed, you'll see a URL like `https://your-app-name.onrender.com`
3. Test your API by visiting `https://your-app-name.onrender.com/health`
4. If you see a success message, your backend is deployed correctly!

## Part 3: Deploying the Frontend to Netlify

Netlify makes frontend deployment straightforward and offers a generous free tier.

### Step 1: Prepare Your Frontend for Deployment

Before deploying, you need to configure your frontend to connect to your deployed backend:

1. Create a `.env.production` file in your client directory with:
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com/api
   REACT_APP_USE_API=true
   ```

2. Commit this change to your repository

### Step 2: Create a Netlify Account

1. Go to [Netlify](https://app.netlify.com/signup)
2. Sign up for a free account (you can use GitHub to sign in)

### Step 3: Deploy from GitHub

1. Click "New site from Git"
2. Select GitHub as your Git provider
3. Authorize Netlify if prompted
4. Select your repository

### Step 4: Configure Build Settings

1. In the deploy settings:
   - Set the Base directory to `client` (if your React app is in a client folder)
   - Set the Build command to `npm run build`
   - Set the Publish directory to `build` (or wherever your React build output goes)

2. Click "Advanced" and add the environment variables from your `.env.production` file:
   - `REACT_APP_API_URL`: Your backend URL with `/api` at the end
   - `REACT_APP_USE_API`: Set to `true`

3. Click "Deploy site"

### Step 5: Verify Deployment

1. Netlify will build and deploy your frontend (this may take a few minutes)
2. Once deployed, you'll be given a URL like `https://your-app.netlify.app`
3. Visit this URL to see your deployed application!

## Post-Deployment Steps

1. **Custom Domain**: Both Render and Netlify allow you to configure custom domains if you own one.

2. **Environment Variables**: If you need to change any environment variables after deployment, you can do so in the respective dashboards.

3. **Continuous Deployment**: Both services support automatic deployments whenever you push to your GitHub repository.

## Troubleshooting

### Common Issues and Solutions

1. **CORS Errors**: If your frontend can't communicate with your backend, you may need to update your CORS configuration in the backend to allow your Netlify domain.

2. **Build Failures**: Check the build logs in Netlify or Render to see detailed error messages.

3. **Database Connection Issues**: Verify your MongoDB connection string and make sure your IP whitelist in MongoDB Atlas includes `0.0.0.0/0` (allow from anywhere) or the specific IPs of your Render service.

4. **Environment Variables**: Double-check that all required environment variables are set correctly.

If you encounter any issues during deployment, consult the documentation for the respective services or feel free to ask for help in the project repository.

## Next Steps After Deployment

Once your application is deployed:

1. **Test thoroughly** - Make sure all features work as expected in the production environment.

2. **Set up monitoring** - Consider adding basic monitoring to be notified of outages.

3. **Plan for future updates** - Establish a workflow for testing and deploying updates.

4. **Security review** - Regularly check for security best practices and updates.

Congratulations! Your Golf Skins Game Organizer is now live on the internet! 🎉
