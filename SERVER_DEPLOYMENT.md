# Server Deployment Instructions

## Deploy WebSocket Server to Render.com

1. Go to [render.com](https://render.com) and create an account
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository: `https://github.com/nipote-gabriel/soothsayer`
4. Configure the service:
   - **Name**: `soothsayer-server`
   - **Region**: US East (or closest to your users)
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free tier is fine for testing

5. Set Environment Variables (optional):
   - `NODE_ENV=production`

6. Deploy the service
7. Once deployed, your WebSocket server will be available at:
   `wss://soothsayer-server.onrender.com`

## Alternative: Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Deploy from the `server` directory
4. The service will automatically detect Node.js and run `npm start`

## Alternative: Deploy to Heroku

1. Install Heroku CLI
2. Run: `heroku create soothsayer-server`
3. Set buildpack: `heroku buildpacks:set heroku/nodejs`
4. Deploy: `git push heroku main`

## Testing the Server

Once deployed, visit the HTTP endpoint to verify it's running:
- `https://soothsayer-server.onrender.com` should show "Soothsayer WebSocket Server is running!"

The WebSocket endpoint will be:
- `wss://soothsayer-server.onrender.com`