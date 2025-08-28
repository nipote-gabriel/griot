# Troubleshooting

## NPM Cache Permission Issue

If you encounter npm cache permission errors, try these solutions:

### Option 1: Fix npm permissions (Recommended)
```bash
sudo chown -R $(whoami) ~/.npm
```

### Option 2: Use alternative package manager
```bash
# Install yarn if you don't have it
npm install -g yarn

# Then install client dependencies with yarn
cd client
yarn install
yarn dev
```

### Option 3: Manual installation
```bash
cd client
npm install --no-optional --no-package-lock --cache=/tmp/npm-cache
```

### Option 4: Use npx to run Vite directly
```bash
cd client
npx vite
```

## Current Status

✅ **Server is running** - WebSocket server on port 3001  
⚠️ **Client needs dependencies** - Use one of the methods above

## Quick Start (if client deps fail)

1. **Server is already running** on `ws://localhost:3001`
2. **Fix client deps** using one of the options above
3. **Start client** with `npm run dev:client` or `yarn dev`
4. **Access game** at `http://localhost:5173`

The game is fully functional once both client and server are running!