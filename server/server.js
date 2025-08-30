import { WebSocketServer } from 'ws'
import { createServer } from 'http'
import { getRandomSaying } from './phrases.js'

const PORT = process.env.PORT || 3001

// Create HTTP server
const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('Soothsayer WebSocket Server is running!')
})

// Create WebSocket server attached to HTTP server
const wss = new WebSocketServer({ server })

const lobbies = new Map()
const games = new Map()
const clients = new Map()

function generateLobbyCode() {
  let code
  do {
    code = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  } while (lobbies.has(code))
  return code
}

function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

function broadcast(lobbyCode, message) {
  const lobby = lobbies.get(lobbyCode)
  if (!lobby) return
  
  lobby.players.forEach(player => {
    const client = clients.get(player.id)
    if (client && client.ws.readyState === 1) {
      client.ws.send(JSON.stringify(message))
    }
  })
}

function sendToPlayer(playerId, message) {
  const client = clients.get(playerId)
  if (client && client.ws.readyState === 1) {
    client.ws.send(JSON.stringify(message))
  }
}

function rollDieForSeating(players) {
  return players.map(player => ({
    ...player,
    dieRoll: Math.floor(Math.random() * 6) + 1
  })).sort((a, b) => a.dieRoll - b.dieRoll)
}

function initializeGame(lobby) {
  const seatedPlayers = rollDieForSeating(lobby.players)
  const game = {
    id: generateId(),
    lobbyCode: lobby.code,
    players: seatedPlayers.map(p => ({ ...p, score: 0 })),
    round: 1,
    currentReader: seatedPlayers[0].id,
    phase: 'saying_selection',
    candidateSaying: null,
    selectedSaying: null,
    submissions: [],
    orderedAnswers: [],
    selections: [],
    currentChooser: null,
    phaseStartTime: Date.now(),
    usedSayingIds: [],
    revealResults: [],
    roundScoring: [],
    winner: null,
    nextReader: null
  }
  
  games.set(lobby.code, game)
  return game
}

function getNextSaying(game) {
  return getRandomSaying(game.usedSayingIds)
}

function advanceToNextPhase(game) {
  const { phase, lobbyCode } = game
  
  switch (phase) {
    case 'saying_selection':
      game.phase = game.mode === 'Local' ? 'reading' : 'writing'
      game.phaseStartTime = Date.now()
      break
    
    case 'reading':
      game.phase = 'writing'
      game.phaseStartTime = Date.now()
      break
    
    case 'writing':
      game.phase = 'reorder'
      game.phaseStartTime = Date.now()
      shuffleAnswersForReorder(game)
      break
    
    case 'reorder':
      game.phase = 'selections'
      game.phaseStartTime = Date.now()
      setupSelections(game)
      break
    
    case 'selections':
      game.phase = 'reveal'
      game.phaseStartTime = Date.now()
      calculateResults(game)
      break
    
    case 'reveal':
      if (game.winner) {
        return
      }
      advanceToNextRound(game)
      break
  }
  
  broadcast(lobbyCode, {
    type: 'game_updated',
    game
  })
}

function shuffleAnswersForReorder(game) {
  const playerSubmissions = game.submissions.map(sub => ({
    id: sub.id,
    ending: sub.ending,
    playerId: sub.playerId,
    isTrue: false
  }))
  
  const trueAnswer = {
    id: 'true',
    ending: game.selectedSaying.trueEnding.replace(/\.+$/, ''), // Remove trailing periods
    isTrue: true
  }
  
  const allAnswers = [...playerSubmissions, trueAnswer]
  
  for (let i = allAnswers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allAnswers[i], allAnswers[j]] = [allAnswers[j], allAnswers[i]]
  }
  
  game.orderedAnswers = allAnswers
}

function setupSelections(game) {
  const nonReaders = game.players.filter(p => p.id !== game.currentReader)
  game.currentChooser = nonReaders[0].id
  game.selections = []
}

function calculateResults(game) {
  const trueAnswer = game.orderedAnswers.find(a => a.isTrue)
  const playerAnswers = game.orderedAnswers.filter(a => !a.isTrue)
  
  const selectionCounts = new Map()
  game.selections.forEach(sel => {
    const count = selectionCounts.get(sel.answerId) || 0
    selectionCounts.set(sel.answerId, count + 1)
  })
  
  const revealResults = []
  
  selectionCounts.forEach((count, answerId) => {
    const answer = game.orderedAnswers.find(a => a.id === answerId)
    const players = game.selections
      .filter(sel => sel.answerId === answerId)
      .map(sel => game.players.find(p => p.id === sel.playerId))
    
    let resultAnswer = { ...answer }
    if (!answer.isTrue) {
      resultAnswer.author = game.players.find(p => p.id === answer.playerId)
    }
    
    revealResults.push({
      answer: resultAnswer,
      players,
      count
    })
  })
  
  game.revealResults = revealResults
  
  const roundScoring = []
  
  game.selections.forEach(sel => {
    const player = game.players.find(p => p.id === sel.playerId)
    
    // Check if player picked their own answer (zero points)
    const theirSubmission = game.submissions.find(s => s.playerId === player.id)
    const pickedOwnAnswer = theirSubmission && sel.answerId === theirSubmission.id
    
    if (!pickedOwnAnswer && sel.answerId === 'true') {
      player.score += 2
      roundScoring.push({
        player,
        points: 2,
        reason: 'Found the true answer'
      })
    } else if (pickedOwnAnswer) {
      roundScoring.push({
        player,
        points: 0,
        reason: 'Picked your own answer'
      })
    }
  })
  
  playerAnswers.forEach(answer => {
    const author = game.players.find(p => p.id === answer.playerId)
    // Count votes excluding self-votes
    const votes = game.selections.filter(s => s.answerId === answer.id && s.playerId !== author.id).length
    if (votes > 0) {
      const bluffPoints = votes * 2
      author.score += bluffPoints
      roundScoring.push({
        player: author,
        points: bluffPoints,
        reason: `${votes} player${votes > 1 ? 's' : ''} picked your bluff`
      })
    }
  })
  
  // Check if reader gets bonus (3 points if nobody found true answer)
  const reader = game.players[game.currentReader]
  const anyonePickedTrue = game.selections.some(s => s.answerId === 'true')
  if (!anyonePickedTrue) {
    reader.score += 3
    roundScoring.push({
      player: reader,
      points: 3,
      reason: 'Nobody found the true answer'
    })
  }
  
  game.roundScoring = roundScoring
  
  const winner = game.players.find(p => p.score >= 10)
  if (winner) {
    game.winner = winner
  } else {
    const currentReaderIndex = game.players.findIndex(p => p.id === game.currentReader)
    const nextReaderIndex = (currentReaderIndex + 1) % game.players.length
    game.nextReader = game.players[nextReaderIndex]
  }
}

function advanceToNextRound(game) {
  game.round++
  const currentReaderIndex = game.players.findIndex(p => p.id === game.currentReader)
  const nextReaderIndex = (currentReaderIndex + 1) % game.players.length
  game.currentReader = game.players[nextReaderIndex].id
  game.phase = 'saying_selection'
  game.candidateSaying = null
  game.selectedSaying = null
  game.submissions = []
  game.orderedAnswers = []
  game.selections = []
  game.currentChooser = null
  game.phaseStartTime = Date.now()
  game.revealResults = []
  game.roundScoring = []
  game.nextReader = null
}

function advanceChooser(game) {
  const nonReaders = game.players.filter(p => p.id !== game.currentReader)
  const currentIndex = nonReaders.findIndex(p => p.id === game.currentChooser)
  
  if (currentIndex === -1 || currentIndex >= nonReaders.length - 1) {
    advanceToNextPhase(game)
    return
  }
  
  game.currentChooser = nonReaders[currentIndex + 1].id
  game.phaseStartTime = Date.now()
  
  broadcast(game.lobbyCode, {
    type: 'game_updated',
    game
  })
}


wss.on('connection', (ws) => {
  console.log('Client connected')
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString())
      handleMessage(ws, data)
    } catch (error) {
      console.error('Invalid JSON:', error)
    }
  })
  
  ws.on('close', () => {
    console.log('Client disconnected')
    
    for (const [clientId, client] of clients.entries()) {
      if (client.ws === ws) {
        clients.delete(clientId)
        
        for (const [lobbyCode, lobby] of lobbies.entries()) {
          const playerIndex = lobby.players.findIndex(p => p.id === clientId)
          if (playerIndex !== -1) {
            lobby.players.splice(playerIndex, 1)
            
            if (lobby.players.length === 0) {
              lobbies.delete(lobbyCode)
              games.delete(lobbyCode)
            } else {
              if (lobby.hostId === clientId && lobby.players.length > 0) {
                lobby.hostId = lobby.players[0].id
              }
              
              broadcast(lobbyCode, {
                type: 'lobby_updated',
                lobby
              })
            }
            break
          }
        }
        break
      }
    }
  })
})

function handleMessage(ws, data) {
  const { type } = data
  
  switch (type) {
    case 'create_lobby':
      handleCreateLobby(ws, data)
      break
    case 'join_lobby':
      handleJoinLobby(ws, data)
      break
    case 'start_game':
      handleStartGame(ws, data)
      break
    case 'kick_player':
      handleKickPlayer(ws, data)
      break
    case 'next_saying':
      handleNextSaying(ws, data)
      break
    case 'select_saying':
      handleSelectSaying(ws, data)
      break
    case 'open_round':
      handleOpenRound(ws, data)
      break
    case 'submit_ending':
      handleSubmitEnding(ws, data)
      break
    case 'set_answer_order':
      handleSetAnswerOrder(ws, data)
      break
    case 'lock_round':
      handleLockRound(ws, data)
      break
    case 'select_answer':
      handleSelectAnswer(ws, data)
      break
    case 'next_round':
      handleNextRound(ws, data)
      break
    case 'end_game':
      handleEndGame(ws, data)
      break
    default:
      ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }))
  }
}

function handleCreateLobby(ws, data) {
  const { nickname, emoji, mode } = data
  
  if (!nickname || !emoji) {
    ws.send(JSON.stringify({ type: 'error', message: 'Nickname and emoji required' }))
    return
  }
  
  const lobbyCode = generateLobbyCode()
  const playerId = generateId()
  
  const player = {
    id: playerId,
    nickname: nickname.trim(),
    emoji,
    isHost: true
  }
  
  const lobby = {
    code: lobbyCode,
    hostId: playerId,
    players: [player],
    mode: mode || 'Remote',
    createdAt: Date.now()
  }
  
  lobbies.set(lobbyCode, lobby)
  clients.set(playerId, { ws, playerId })
  
  ws.send(JSON.stringify({
    type: 'lobby_joined',
    lobby,
    player
  }))
}

function handleJoinLobby(ws, data) {
  const { code, nickname, emoji } = data
  
  if (!code || !nickname || !emoji) {
    ws.send(JSON.stringify({ type: 'error', message: 'Code, nickname and emoji required' }))
    return
  }
  
  const lobby = lobbies.get(code)
  if (!lobby) {
    ws.send(JSON.stringify({ type: 'error', message: 'Lobby not found' }))
    return
  }
  
  if (lobby.players.length >= 8) {
    ws.send(JSON.stringify({ type: 'error', message: 'Lobby is full' }))
    return
  }
  
  if (lobby.players.some(p => p.nickname.toLowerCase() === nickname.toLowerCase().trim())) {
    ws.send(JSON.stringify({ type: 'error', message: 'Nickname already taken' }))
    return
  }
  
  const playerId = generateId()
  const player = {
    id: playerId,
    nickname: nickname.trim(),
    emoji,
    isHost: false
  }
  
  lobby.players.push(player)
  clients.set(playerId, { ws, playerId })
  
  ws.send(JSON.stringify({
    type: 'lobby_joined',
    lobby,
    player
  }))
  
  broadcast(code, {
    type: 'lobby_updated',
    lobby
  })
}

function handleStartGame(ws, data) {
  const client = [...clients.entries()].find(([id, c]) => c.ws === ws)
  if (!client) return
  
  const [playerId] = client
  const lobby = [...lobbies.values()].find(l => l.hostId === playerId)
  
  if (!lobby) {
    ws.send(JSON.stringify({ type: 'error', message: 'Only host can start game' }))
    return
  }
  
  if (lobby.players.length < 2) {
    ws.send(JSON.stringify({ type: 'error', message: 'Need at least 2 players' }))
    return
  }
  
  const game = initializeGame(lobby)
  game.candidateSaying = getNextSaying(game)
  game.mode = lobby.mode
  
  broadcast(lobby.code, {
    type: 'game_started',
    game
  })
}

function handleKickPlayer(ws, data) {
  const { playerId } = data
  const client = [...clients.entries()].find(([id, c]) => c.ws === ws)
  if (!client) return
  
  const [hostId] = client
  const lobby = [...lobbies.values()].find(l => l.hostId === hostId)
  
  if (!lobby) {
    ws.send(JSON.stringify({ type: 'error', message: 'Only host can kick players' }))
    return
  }
  
  const playerIndex = lobby.players.findIndex(p => p.id === playerId)
  if (playerIndex === -1) {
    ws.send(JSON.stringify({ type: 'error', message: 'Player not found' }))
    return
  }
  
  lobby.players.splice(playerIndex, 1)
  
  // Close the kicked player's WebSocket connection
  const kickedClient = clients.get(playerId)
  if (kickedClient) {
    kickedClient.ws.close()
  }
  clients.delete(playerId)
  
  broadcast(lobby.code, {
    type: 'lobby_updated',
    lobby
  })
}

function handleNextSaying(ws, data) {
  const client = [...clients.entries()].find(([id, c]) => c.ws === ws)
  if (!client) return
  
  const [playerId] = client
  const game = [...games.values()].find(g => g.currentReader === playerId && g.phase === 'saying_selection')
  
  if (!game) {
    ws.send(JSON.stringify({ type: 'error', message: 'Not authorized' }))
    return
  }
  
  if (game.submissions.length > 0) {
    game.submissions = []
  }
  
  game.candidateSaying = getNextSaying(game)
  
  broadcast(game.lobbyCode, {
    type: 'game_updated',
    game
  })
}

function handleSelectSaying(ws, data) {
  const { sayingId } = data
  const client = [...clients.entries()].find(([id, c]) => c.ws === ws)
  if (!client) return
  
  const [playerId] = client
  const game = [...games.values()].find(g => g.currentReader === playerId && g.phase === 'saying_selection')
  
  if (!game) {
    ws.send(JSON.stringify({ type: 'error', message: 'Not authorized' }))
    return
  }
  
  game.selectedSaying = game.candidateSaying
  game.usedSayingIds.push(sayingId)
  game.candidateSaying = null
  
  advanceToNextPhase(game)
}

function handleOpenRound(ws, data) {
  const client = [...clients.entries()].find(([id, c]) => c.ws === ws)
  if (!client) return
  
  const [playerId] = client
  const game = [...games.values()].find(g => g.currentReader === playerId && g.phase === 'reading')
  
  if (!game) {
    ws.send(JSON.stringify({ type: 'error', message: 'Not authorized' }))
    return
  }
  
  advanceToNextPhase(game)
}

function handleSubmitEnding(ws, data) {
  const { ending } = data
  const client = [...clients.entries()].find(([id, c]) => c.ws === ws)
  if (!client) return
  
  const [playerId] = client
  const game = [...games.values()].find(g => 
    g.players.some(p => p.id === playerId) && 
    g.phase === 'writing' && 
    g.currentReader !== playerId
  )
  
  if (!game) {
    ws.send(JSON.stringify({ type: 'error', message: 'Not authorized' }))
    return
  }
  
  const existingIndex = game.submissions.findIndex(s => s.playerId === playerId)
  const submission = {
    id: existingIndex === -1 ? generateId() : game.submissions[existingIndex].id,
    playerId,
    ending: ending.trim().replace(/\.+$/, '') // Remove trailing periods
  }
  
  if (existingIndex === -1) {
    game.submissions.push(submission)
  } else {
    game.submissions[existingIndex] = submission
  }
  
  broadcast(game.lobbyCode, {
    type: 'game_updated',
    game
  })
  
  const expectedSubmissions = game.players.length - 1
  if (game.submissions.length >= expectedSubmissions) {
    setTimeout(() => advanceToNextPhase(game), 500)
  }
}

function handleSetAnswerOrder(ws, data) {
  const { orderedAnswers } = data
  const client = [...clients.entries()].find(([id, c]) => c.ws === ws)
  if (!client) return
  
  const [playerId] = client
  const game = [...games.values()].find(g => g.currentReader === playerId && g.phase === 'reorder')
  
  if (!game) {
    ws.send(JSON.stringify({ type: 'error', message: 'Not authorized to set answer order' }))
    return
  }
  
  game.orderedAnswers = orderedAnswers
  
  broadcast(game.lobbyCode, {
    type: 'game_updated',
    game
  })
}

function handleLockRound(ws, data) {
  console.log('Lock round requested')
  const client = [...clients.entries()].find(([id, c]) => c.ws === ws)
  if (!client) {
    console.log('No client found')
    return
  }
  
  const [playerId] = client
  console.log('Player ID:', playerId)
  
  const game = [...games.values()].find(g => g.currentReader === playerId && (g.phase === 'writing' || g.phase === 'reorder'))
  console.log('Current reader:', game?.currentReader, 'Phase:', game?.phase, 'Found game:', !!game)
  
  if (!game) {
    console.log('Not authorized - playerId:', playerId, 'games:', [...games.values()].map(g => ({currentReader: g.currentReader, phase: g.phase})))
    ws.send(JSON.stringify({ type: 'error', message: 'Not authorized' }))
    return
  }
  
  console.log('Advancing to next phase')
  advanceToNextPhase(game)
}

function handleSelectAnswer(ws, data) {
  const { answerId } = data
  const client = [...clients.entries()].find(([id, c]) => c.ws === ws)
  if (!client) return
  
  const [playerId] = client
  const game = [...games.values()].find(g => 
    g.currentChooser === playerId && 
    g.phase === 'selections'
  )
  
  if (!game) {
    ws.send(JSON.stringify({ type: 'error', message: 'Not your turn' }))
    return
  }
  
  const answer = game.orderedAnswers.find(a => a.id === answerId)
  if (!answer) {
    ws.send(JSON.stringify({ type: 'error', message: 'Invalid answer' }))
    return
  }
  
  
  game.selections.push({
    playerId,
    answerId
  })
  
  const nonReaders = game.players.filter(p => p.id !== game.currentReader)
  if (game.selections.length >= nonReaders.length) {
    advanceToNextPhase(game)
  } else {
    advanceChooser(game)
  }
}

function handleNextRound(ws, data) {
  const client = [...clients.entries()].find(([id, c]) => c.ws === ws)
  if (!client) return
  
  const [playerId] = client
  const game = [...games.values()].find(g => g.currentReader === playerId && g.phase === 'reveal')
  
  if (!game || game.winner) {
    ws.send(JSON.stringify({ type: 'error', message: 'Not authorized' }))
    return
  }
  
  advanceToNextRound(game)
  game.candidateSaying = getNextSaying(game)
  
  broadcast(game.lobbyCode, {
    type: 'game_updated',
    game
  })
}

function handleEndGame(ws, data) {
  const client = [...clients.entries()].find(([id, c]) => c.ws === ws)
  if (!client) return
  
  const [playerId] = client
  const lobby = [...lobbies.values()].find(l => l.hostId === playerId)
  
  if (!lobby) {
    ws.send(JSON.stringify({ type: 'error', message: 'Only host can end game' }))
    return
  }
  
  games.delete(lobby.code)
  
  broadcast(lobby.code, {
    type: 'lobby_updated',
    lobby
  })
}

// Start the server
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`)
})