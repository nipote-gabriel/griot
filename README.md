# Griot

A super-minimal, mobile-optimized web app for playing the bluffing party game Griot (inspired by Wise & Otherwise) with friends on their phones.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Start both client and server:**
   ```bash
   npm run dev
   ```

3. **Open the game:**
   - Client runs on `http://localhost:5173`
   - Server runs on `ws://localhost:3001`

## How to Play

### Setup
- Players join by entering a nickname and picking an emoji avatar
- Create or join a lobby using a 3-digit code (000-999)
- Supports 2-8 players per lobby
- Choose between "Local" or "Remote" mode

### Game Flow
1. **Phrase Selection**: Reader picks from random phrase options
2. **Reading** (Local mode only): Reader reads the first half aloud
3. **Writing**: All writers submit creative endings for the phrase
4. **Reorder**: Reader arranges all answers (including the true one)
5. **Selections**: Players take turns picking what they think is the true answer
6. **Reveal**: Results are shown with scoring

### Scoring
- **+2 points**: Pick the true answer
- **+1 point per vote**: Someone picks your bluff
- **First to 10 points wins**

## Features

✅ **No authentication** - Just nickname + emoji  
✅ **3-digit lobby codes** for easy joining  
✅ **Mobile-optimized UI** with touch-friendly controls  
✅ **Real-time gameplay** via WebSocket  
✅ **150 hardcoded phrases** - no AI needed  
✅ **Complete game flow** with all phases  
✅ **Automatic timers** and turn management  
✅ **Host controls** for managing lobbies  

## Technical Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + WebSocket (ws)
- **Storage**: In-memory (no database)
- **Styling**: Pure CSS with mobile-first design

## Game Modes

- **Local**: Includes a "Reader reads aloud" pause for in-person play
- **Remote**: Skips reading phase for online play

## Development

- `npm run dev` - Start both client and server
- `npm run dev:client` - Start only client (port 5173)  
- `npm run dev:server` - Start only server (port 3001)
- `npm run build` - Build client for production

## Project Structure

```
├── client/          # React frontend
│   ├── src/
│   │   ├── App.jsx  # Main game component
│   │   └── App.css  # Mobile-first styles
│   └── package.json
├── server/          # Node.js WebSocket server  
│   ├── server.js    # Main server logic
│   ├── phrases.js   # 150 hardcoded phrases
│   └── package.json
└── package.json     # Root scripts
```

That's it! Ready to play Wise & Otherwise with friends! 🎉