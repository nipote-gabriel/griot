import { useState, useEffect, useRef } from 'react'
import './App.css'
import { SAYINGS } from './phrases.js'
// Force deploy after GitHub reconnect

const EMOJI_AVATARS = ['🧙‍♂️', '🧙‍♀️', '⚔️', '🛡️', '🏰', '👑', '🧝‍♂️', '🧝‍♀️', '🧌', '🧞‍♂️', '🧞‍♀️', '🐉']

function App() {
  const [ws, setWs] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [gameState, setGameState] = useState('lobby')
  const [player, setPlayer] = useState(null)
  const [lobby, setLobby] = useState(null)
  const [game, setGame] = useState(null)
  const [nickname, setNickname] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJI_AVATARS[0])
  const [lobbyCode, setLobbyCode] = useState('')
  const [submission, setSubmission] = useState('')
  const [message, setMessage] = useState('')
  // Set default game mode based on availability
  const getDefaultGameMode = () => {
    if (location.hostname.includes('vercel.app') || location.protocol === 'https:') {
      return 'local' // Only Pass & Play mode available in production
    }
    return 'online' // Online mode available in local development
  }
  const [gameMode, setGameMode] = useState(getDefaultGameMode()) // 'online' or 'local'
  const [localPlayers, setLocalPlayers] = useState([])
  const [currentLocalPlayer, setCurrentLocalPlayer] = useState(0)
  const [sayingOptions, setSayingOptions] = useState([])
  const [currentSayingIndex, setCurrentSayingIndex] = useState(0)
  const [answerOrder, setAnswerOrder] = useState([])
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [showSubmissionConfirm, setShowSubmissionConfirm] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showVoteConfirm, setShowVoteConfirm] = useState(false)
  const [sayingCounter, setSayingCounter] = useState(1)
  const [showHomeConfirm, setShowHomeConfirm] = useState(false)
  const [showInfoDialog, setShowInfoDialog] = useState(false)
  const [showRecycleConfirm, setShowRecycleConfirm] = useState(false)
  const [onlineSayingOptions, setOnlineSayingOptions] = useState([])
  const [currentOnlineSayingIndex, setCurrentOnlineSayingIndex] = useState(0)
  const [countdown, setCountdown] = useState(null)

  const wsRef = useRef(null)
  const gameStateRef = useRef(gameState)

  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])

  // Check if online mode is available (not on production deployment)
  const isOnlineModeAvailable = () => {
    // Disable online mode on Vercel or other production deployments
    if (location.hostname.includes('vercel.app') || location.protocol === 'https:') {
      return false
    }
    // Enable online mode for local development
    return location.hostname === 'localhost' || location.hostname === '127.0.0.1'
  }

  useEffect(() => {
    // Don't try to connect to WebSocket if online mode is not available
    if (!isOnlineModeAvailable()) {
      setConnectionStatus('disconnected')
      return
    }

    // WebSocket URL - dynamically determine based on current location
    const getWebSocketUrl = () => {
      if (import.meta.env.VITE_WEBSOCKET_URL) {
        return import.meta.env.VITE_WEBSOCKET_URL
      }
      
      // For production, use wss with current host
      if (location.protocol === 'https:') {
        return `wss://${location.host}`
      }
      
      // For local development, check if we're on mobile accessing via IP
      if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        return `ws://${location.hostname}:3001`
      }
      
      // Default fallback for local development
      return 'ws://localhost:3001'
    }
    
    const wsUrl = getWebSocketUrl()
    console.log('Connecting to WebSocket:', wsUrl)
    setConnectionStatus('connecting')
    const socket = new WebSocket(wsUrl)
    
    socket.onopen = () => {
      console.log('Connected to server')
      setWs(socket)
      wsRef.current = socket
      setConnectionStatus('connected')
      setMessage('') // Clear any connection error messages
    }

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      console.log('Received:', data)
      
      switch (data.type) {
        case 'lobby_joined':
          setLobby(data.lobby)
          setPlayer(data.player)
          setGameState('waiting')
          setMessage('')
          break
        case 'lobby_updated':
          setLobby(data.lobby)
          // Check if current player was removed from lobby
          if (player && !data.lobby.players.some(p => p.id === player.id)) {
            // Player was kicked, return to home
            setGameState('lobby')
            setLobby(null)
            setPlayer(null)
            setMessage('You were removed from the lobby')
          }
          break
        case 'game_ended':
          setGame(null)
          setGameState('waiting')
          setLobby(data.lobby)
          break
        case 'game_ended_by_disconnect':
          setGame(null);
          setGameState('lobby');
          setMessage(data.message);
          break;
        case 'game_started':
          setGame(data.game)
          setGameState('game')
          setMessage('')
          setSayingCounter(1)
          break
        case 'game_updated':
          setGame(data.game)
          break
        case 'recycle_notification':
          setMessage(data.message)
          setTimeout(() => setMessage(''), 3000)
          break
        case 'error':
          setMessage(data.message)
          break
        case 'sayings_options':
          setOnlineSayingOptions(data.sayings)
          setCurrentOnlineSayingIndex(0)
          break
        case 'no_more_sayings':
          setMessage("You have used all the sayings! Please start a new game to continue.");
          break;
      }
    }

    socket.onclose = () => {
      console.log('Disconnected from server')
      setWs(null)
      setConnectionStatus('disconnected')
      // Return to home screen if disconnected (e.g., kicked from lobby)
      if (gameStateRef.current !== 'lobby') {
        setGameState('lobby')
        setLobby(null)
        setPlayer(null)
        setGame(null)
        setMessage('Connection lost. Returned to home.')
      }
    }

    socket.onerror = (error) => {
      console.log('WebSocket error:', error)
      setConnectionStatus('error')
      setMessage('Connection failed. Please check your network and try again.')
      setWs(null)
    }

    return () => {
      socket.close()
    }
  }, [])

  useEffect(() => {
    if (gameState === 'game' && game?.phase === 'saying_selection' && player?.id === game.currentReader && onlineSayingOptions.length === 0) {
      send({ type: 'request_sayings' })
    }
  }, [gameState, game, player, onlineSayingOptions])

  useEffect(() => {
    if (game?.timer) {
      const interval = setInterval(() => {
        const remaining = Math.round((game.timer.endTime - Date.now()) / 1000);
        if (remaining > 0) {
          setCountdown(remaining);
        } else {
          setCountdown(0);
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCountdown(null);
    }
  }, [game?.timer]);

  const send = (data) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data))
    }
  }

  const createLobby = () => {
    if (!nickname.trim()) {
      setMessage('Please enter a nickname')
      return
    }
    send({
      type: 'create_lobby',
      nickname: nickname.trim(),
      emoji: selectedEmoji,
      mode: 'Remote'
    })
  }

  const joinLobby = () => {
    if (!nickname.trim()) {
      setMessage('Please enter a nickname')
      return
    }
    if (!lobbyCode.trim() || lobbyCode.length !== 3) {
      setMessage('Please enter a 3-digit lobby code')
      return
    }
    send({
      type: 'join_lobby',
      code: lobbyCode.trim(),
      nickname: nickname.trim(),
      emoji: selectedEmoji
    })
  }

  const startGame = () => {
    send({ type: 'start_game' })
  }

  const selectSaying = (sayingId) => {
    send({ type: 'select_saying', sayingId })
  }

  const requestNextSaying = () => {
    setSayingCounter(prev => prev + 1)
    send({ type: 'next_saying' })
  }

  const openRound = () => {
    send({ type: 'open_round' })
  }

  const submitEnding = () => {
    if (submission.trim()) {
      send({ type: 'submit_ending', ending: submission.trim() })
      setSubmission('')
    }
  }

  const lockRound = () => {
    send({ type: 'lock_round' })
  }

  const selectAnswer = (answerId) => {
    send({ type: 'select_answer', answerId })
  }

  const nextRound = () => {
    send({ type: 'next_round' })
  }

  const endGame = () => {
    if (gameState === 'local-game') {
      goBackToHome()
    } else {
      send({ type: 'end_game' })
      goBackToHome()
    }
  }

  const kickPlayer = (playerId) => {
    send({ type: 'kick_player', playerId })
  }

  const goBackToHome = () => {
    setGameState('lobby')
    setLobby(null)
    setPlayer(null)
    setGame(null)
    setMessage('')
    // Don't close WebSocket - keep connection active for immediate use
  }

  const handleHomeConfirm = () => {
    if (gameState === 'game' && ws) {
      ws.close()
    }
    if (gameState === 'local-game') {
      setGameState('lobby')
      setGame(null)
      setLobby(null)
      setPlayer(null)
      setMessage('')
    } else {
      goBackToHome()
    }
    setShowHomeConfirm(false)
  }

  const moveAnswerUp = (index) => {
    if (index > 0) {
      const newOrder = [...answerOrder]
      const [item] = newOrder.splice(index, 1)
      newOrder.splice(index - 1, 0, item)
      setAnswerOrder(newOrder)
    }
  }

  const moveAnswerDown = (index) => {
    if (index < answerOrder.length - 1) {
      const newOrder = [...answerOrder]
      const [item] = newOrder.splice(index, 1)
      newOrder.splice(index + 1, 0, item)
      setAnswerOrder(newOrder)
    }
  }

  const handleRecycleSaying = () => {
    if (gameState === 'game') {
      send({ type: 'recycle_saying' })
    } else if (gameState === 'local-game') {
      // For local games, just reset to saying selection
      setMessage('Someone knows this saying already. Picking a new saying...')
      setTimeout(() => setMessage(''), 3000)
      setGame(prev => ({
        ...prev,
        phase: 'saying_selection'
      }))
    }
    setShowRecycleConfirm(false)
  }

  const addLocalPlayer = () => {
    if (!nickname.trim()) {
      setMessage('Please enter a nickname')
      return
    }
    
    if (localPlayers.some(p => p.nickname.toLowerCase() === nickname.toLowerCase().trim())) {
      setMessage('Nickname already taken')
      return
    }
    
    const newPlayer = {
      id: Date.now().toString(),
      nickname: nickname.trim(),
      emoji: selectedEmoji,
      score: 0
    }
    
    setLocalPlayers([...localPlayers, newPlayer])
    setNickname('')
    setSelectedEmoji(EMOJI_AVATARS[Math.floor(Math.random() * EMOJI_AVATARS.length)])
    setMessage('')
  }

  const removeLocalPlayer = (playerId) => {
    setLocalPlayers(localPlayers.filter(p => p.id !== playerId))
  }

  const startLocalGame = () => {
    if (localPlayers.length < 2) {
      setMessage('Need at least 2 players')
      return
    }
    setGameState('local-game')
    setGame({
      id: 'local-game',
      players: [...localPlayers],
      round: 1,
      currentReader: 0,
      phase: 'saying_selection',
      selectedSaying: null,
      submissions: [],
      orderedAnswers: [],
      currentChooser: localPlayers.length > 1 ? 1 : 0, // First non-reader
      selections: [],
      revealResults: [],
      roundScoring: [],
      winner: null,
      usedSayingIds: []
    })
  }

  const RenderDialogs = () => (
    <>
      {/* Global Dialogs that appear on top of any screen */}
      {gameState === 'game' && (
        <>
          {showHomeConfirm && (
            <div className="dialog-overlay">
              <div className="dialog-box">
                <div className="dialog-header">
                  <h3>Leave Game?</h3>
                  <button onClick={() => setShowHomeConfirm(false)} className="close-btn">✕</button>
                </div>
                <p>Are you sure you want to leave the game and go home? You will be removed from the lobby.</p>
                <div className="dialog-actions">
                  <button onClick={() => setShowHomeConfirm(false)} className="cancel-btn">Cancel</button>
                  <button onClick={handleHomeConfirm} className="confirm-btn">Leave Game</button>
                </div>
              </div>
            </div>
          )}

          {showInfoDialog && (
            <div className="dialog-overlay">
              <div className="dialog-box">
                <div className="dialog-header">
                  <h3>Game Info</h3>
                  <button onClick={() => setShowInfoDialog(false)} className="close-btn">✕</button>
                </div>
                <div className="info-content">
                  <h4 className="lobby-info-label"><strong>Lobby:</strong> {lobby?.code}</h4>
                  <div className="players-scores">
                    <h4>Players & Scores:</h4>
                    {game?.players
                      ?.map((p, index) => ({ ...p, originalIndex: index }))
                      .sort((a, b) => {
                        // Sort by reader order: current reader first, then next in line
                        const aDistance = (a.originalIndex - game.currentReader + game.players.length) % game.players.length;
                        const bDistance = (b.originalIndex - game.currentReader + game.players.length) % game.players.length;
                        return aDistance - bDistance;
                      })
                      .map(p => (
                        <div key={p.id} className="score-row">
                          <span>{p.emoji} {p.nickname} {p.originalIndex === game.currentReader ? '👑' : ''}</span>
                          <span className="score">{p.score}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {showRecycleConfirm && (
            <div className="dialog-overlay">
              <div className="dialog-box">
                <div className="dialog-header">
                  <h3>Recycle Saying?</h3>
                  <button onClick={() => setShowRecycleConfirm(false)} className="close-btn">✕</button>
                </div>
                <p>This will notify all players that someone knows this saying and pick a new one. Continue?</p>
                <div className="dialog-actions">
                  <button onClick={() => setShowRecycleConfirm(false)} className="cancel-btn">Cancel</button>
                  <button onClick={handleRecycleSaying} className="confirm-btn">Recycle</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Global Dialogs for local game */}
      {gameState === 'local-game' && (
        <>
          {showHomeConfirm && (
            <div className="dialog-overlay">
              <div className="dialog-box">
                <div className="dialog-header">
                  <h3>Leave Game?</h3>
                  <button onClick={() => setShowHomeConfirm(false)} className="close-btn">✕</button>
                </div>
                <p>Are you sure you want to leave the game and go home?</p>
                <div className="dialog-actions">
                  <button onClick={() => setShowHomeConfirm(false)} className="cancel-btn">Cancel</button>
                  <button onClick={handleHomeConfirm} className="confirm-btn">Leave Game</button>
                </div>
              </div>
            </div>
          )}

          {showInfoDialog && (
            <div className="dialog-overlay">
              <div className="dialog-box">
                <div className="dialog-header">
                  <h3>Game Info</h3>
                  <button onClick={() => setShowInfoDialog(false)} className="close-btn">✕</button>
                </div>
                <div className="info-content">
                  <p><strong>Round:</strong> {game?.round}</p>
                  <div className="players-scores">
                    <h4>Players & Scores:</h4>
                    {game?.players
                      ?.sort((a, b) => b.score - a.score)
                      .map(p => (
                        <div key={p.id} className="score-row">
                          <span>{p.emoji} {p.nickname}</span>
                          <span className="score">{p.score}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {showRecycleConfirm && (
            <div className="dialog-overlay">
              <div className="dialog-box">
                <div className="dialog-header">
                  <h3>Recycle Saying?</h3>
                  <button onClick={() => setShowRecycleConfirm(false)} className="close-btn">✕</button>
                </div>
                <p>Someone knows this saying already. Pick a new saying?</p>
                <div className="dialog-actions">
                  <button onClick={() => setShowRecycleConfirm(false)} className="cancel-btn">Cancel</button>
                  <button onClick={handleRecycleSaying} className="confirm-btn">Recycle</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )

  if (gameState === 'lobby') {
    return (
      <div className="app">
        <div className="container">
          <h1>Soothsayer</h1>
          
          <div className="form-group">
            <label>Game Mode:</label>
            <div className="mode-selector">
              {isOnlineModeAvailable() && (
                <button 
                  className={gameMode === 'online' ? 'selected' : ''}
                  onClick={() => setGameMode('online')}
                >
                  🌐 Online Play
                </button>
              )}
              <button 
                className={gameMode === 'local' ? 'selected' : ''}
                onClick={() => setGameMode('local')}
              >
                📱 Pass & Play
              </button>
            </div>
          </div>

          {gameMode === 'online' ? (
            <>
              <div className="form-group">
                <label>Choose your nickname:</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Enter nickname"
                  maxLength={20}
                />
              </div>

              <div className="form-group">
                <label>Pick your Avatar:</label>
                <div className="emoji-grid">
                  {EMOJI_AVATARS.map((emoji) => {
                    const isUsed = lobby?.players?.some(p => p.emoji === emoji) || false
                    const isSelected = selectedEmoji === emoji
                    
                    return (
                      <button
                        key={emoji}
                        className={`emoji-btn ${isSelected ? 'selected' : ''} ${isUsed && !isSelected ? 'used' : ''}`}
                        onClick={() => !isUsed && setSelectedEmoji(emoji)}
                        disabled={isUsed && !isSelected}
                        title={isUsed && !isSelected ? 'This emoji is already taken' : ''}
                      >
                        {emoji}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="form-group">
                <label>Join existing lobby:</label>
                <input
                  type="text"
                  value={lobbyCode}
                  onChange={(e) => setLobbyCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  placeholder="000"
                  maxLength={3}
                  className="lobby-code-input"
                />
                <button 
                  onClick={joinLobby} 
                  disabled={!ws || lobbyCode.trim().length !== 3}
                  className="primary-btn full-width"
                >
                  Join Lobby
                </button>
              </div>

              <div className="divider">OR</div>

              {connectionStatus !== 'connected' && (
                <div className="message" style={{ 
                  background: connectionStatus === 'connecting' ? '#fff3cd' : '#f8d7da',
                  color: connectionStatus === 'connecting' ? '#856404' : '#721c24',
                  border: connectionStatus === 'connecting' ? '1px solid #ffeaa7' : '1px solid #f5c6cb',
                  marginBottom: '16px'
                }}>
                  {connectionStatus === 'connecting' && '🔄 Connecting to server...'}
                  {connectionStatus === 'error' && '❌ Connection failed. Please check your network.'}
                  {connectionStatus === 'disconnected' && '📶 Reconnecting...'}
                </div>
              )}

              <button onClick={createLobby} disabled={!ws} className="primary-btn">
                Create New Lobby
              </button>
            </>
          ) : (
            <>
              <div className="form-group">
                <label>Add players (pass the device around):</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Enter player name"
                  maxLength={20}
                />
              </div>

              <div className="form-group">
                <label>Pick Avatar for this player:</label>
                <div className="emoji-grid">
                  {EMOJI_AVATARS.map((emoji) => {
                    const isUsed = localPlayers.some(p => p.emoji === emoji)
                    const isSelected = selectedEmoji === emoji
                    
                    return (
                      <button
                        key={emoji}
                        className={`emoji-btn ${isSelected ? 'selected' : ''} ${isUsed && !isSelected ? 'used' : ''}`}
                        onClick={() => !isUsed && setSelectedEmoji(emoji)}
                        disabled={isUsed && !isSelected}
                        title={isUsed && !isSelected ? 'This emoji is already taken' : ''}
                      >
                        {emoji}
                      </button>
                    )
                  })}
                </div>
              </div>

              <button onClick={addLocalPlayer} className="add-player-btn">
                Add Player
              </button>

              {localPlayers.length > 0 && (
                <div className="local-players-list">
                  <h3>Players ({localPlayers.length}/8)</h3>
                  {localPlayers.map((player) => (
                    <div key={player.id} className="player-item">
                      <span className="player-info">
                        {player.emoji} {player.nickname}
                      </span>
                      <button 
                        onClick={() => removeLocalPlayer(player.id)} 
                        className="kick-btn"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {localPlayers.length >= 2 && (
                <button onClick={startLocalGame} className="primary-btn">
                  Start Local Game
                </button>
              )}
            </>
          )}

          {message && <div className="message error">{message}</div>}
        </div>
      </div>
    )
  }

  if (gameState === 'waiting' && lobby) {
    const isHost = player?.id === lobby.hostId
    return (
      <div className="app">
        <div className="container">
          <div className="lobby-header">
            <button onClick={goBackToHome} className="back-btn">← Back to Home</button>
            <p className="lobby-code">Lobby {lobby.code}</p>
          </div>
          
          <div className="players-list">
            <h3>Players ({lobby.players.length}/8)</h3>
            {lobby.players.map((p) => (
              <div key={p.id} className="player-item">
                <span className="player-info">
                  {p.emoji} {p.nickname}
                  {p.id === lobby.hostId && ' (Host)'}
                  {p.id === player?.id && ' (You)'}
                </span>
                {isHost && p.id !== player?.id && (
                  <button onClick={() => kickPlayer(p.id)} className="kick-btn">
                    Kick
                  </button>
                )}
              </div>
            ))}
          </div>

          {isHost && (
            <>
              <button onClick={startGame} className="primary-btn" disabled={lobby.players.length < 3}>
                Start Game
              </button>
              {lobby.players.length < 3 && (
                <p className="message error">Minimum 3 Players to Start Game</p>
              )}
            </>
          )}

          {!isHost && (
            <div className="waiting-message">
              Waiting for host to start the game...
            </div>
          )}

          {message && <div className="message error">{message}</div>}
        </div>
      </div>
    )
  }

  if (gameState === 'local-game' && game) {
    const currentPlayer = game.players[game.currentReader]
    
    // Local Game Buttons
    const LocalGameButtons = () => (
      <>
        <div className="game-buttons local-game-buttons">
          <button onClick={() => setShowHomeConfirm(true)} className="corner-btn home-btn" title="Go Home">
            🏠
          </button>
          <button onClick={() => setShowInfoDialog(true)} className="corner-btn info-btn" title="Game Info">
            ℹ️
          </button>
          <button onClick={() => setShowRecycleConfirm(true)} className="corner-btn recycle-btn" title="Recycle Saying" disabled={game.phase !== 'writing'}>
            ♻️
          </button>
        </div>
        <RenderDialogs />
      </>
    )
    
    if (game.phase === 'saying_selection') {
      return (
        <div className="app">
          <div className="container has-buttons">
            <LocalGameButtons />
            <h2>Pass to Reader</h2>
            <div className="pass-device">
              <div className="current-player">
                <span className="player-emoji">{currentPlayer.emoji}</span>
                <h3>{currentPlayer.nickname}</h3>
                <p>You are the Reader for Round {game.round}</p>
                <div className="reader-debug">
                  <small>Reader order: {game.players.map((p, i) => 
                    `${p.emoji}${p.nickname}${i === game.currentReader ? '👑' : ''}`
                  ).join(' → ')}</small>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  // Get 5 random available sayings for the reader to choose from
                  const availableSayings = SAYINGS.filter(p => !game.usedSayingIds.includes(p.id))
                  
                  // Truly randomize using Fisher-Yates shuffle
                  const shuffled = [...availableSayings]
                  for (let i = shuffled.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                  }
                  
                  const fiveOptions = shuffled.slice(0, 5)
                  
                  setSayingOptions(fiveOptions)
                  setCurrentSayingIndex(0)
                  setGame({...game, phase: 'saying_browsing'})
                }}
                className="primary-btn"
              >
                Browse & Select Saying
              </button>
            </div>
          </div>
        </div>
      )
    }
    
    if (game.phase === 'saying_browsing') {
      const currentSaying = sayingOptions[currentSayingIndex]
      return (
        <div className="app">
          <div className="container has-buttons">
            <LocalGameButtons />
            <h2>Choose Your Saying</h2>
            <div className="pass-device">
              <div className="current-player">
                <span className="player-emoji">{currentPlayer.emoji}</span>
                <h3>{currentPlayer.nickname}</h3>
                <p>Browse through 5 sayings and pick your favorite</p>
              </div>
              
              <div className="saying-browser">
                <div className="saying-card">
                  <div className="saying-header">
                    <button 
                      onClick={() => {
                        // Mark current saying as used and replace with new one
                        const newUsedIds = [...game.usedSayingIds, currentSaying.id]
                        
                        // Get available sayings excluding already used and currently selected ones
                        const currentlySelected = sayingOptions.map(p => p.id)
                        const availableSayings = SAYINGS.filter(p => 
                          !newUsedIds.includes(p.id) && !currentlySelected.includes(p.id)
                        )
                        
                        if (availableSayings.length === 0) {
                          setMessage("All available sayings have been used. Please start a new game.")
                          return
                        }
                        
                        // Get a random replacement saying
                        const randomIndex = Math.floor(Math.random() * availableSayings.length)
                        const replacementSaying = availableSayings[randomIndex]
                        
                        // Replace the current saying with the new one
                        const newOptions = [...sayingOptions]
                        newOptions[currentSayingIndex] = replacementSaying
                        
                        setSayingOptions(newOptions)
                        setGame({...game, usedSayingIds: newUsedIds})
                      }}
                      className="mark-used-btn"
                      title="Mark this saying as already known"
                    >
                      ×
                    </button>
                    <p className="saying-origin">There is an old {currentSaying.origin || 'ancient'} saying:</p>
                  </div>
                  <p className="first-half">{currentSaying.firstHalf}...</p>
                  <p className="true-ending">...{currentSaying.trueEnding}</p>
                </div>
                <div className="saying-navigation">
                  <button 
                    onClick={() => setCurrentSayingIndex((currentSayingIndex - 1 + sayingOptions.length) % sayingOptions.length)}
                    className="nav-btn"
                  >
                    ← Previous
                  </button>
                  
                  <button 
                    onClick={() => setCurrentSayingIndex((currentSayingIndex + 1) % sayingOptions.length)}
                    className="nav-btn"
                  >
                    Next →
                  </button>
                </div>

                <div className="saying-counter">
                  <span>Saying {currentSayingIndex + 1} of {sayingOptions.length}</span>
                </div>
                
                <button 
                  onClick={() => {
                    setGame({
                      ...game, 
                      selectedSaying: currentSaying, 
                      phase: 'writing', 
                      usedSayingIds: [...game.usedSayingIds, currentSaying.id]
                    })
                  }}
                  className="primary-btn"
                >
                  Select This Saying
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }
    
    if (game.phase === 'writing') {
      const nonReaders = game.players.filter((_, i) => i !== game.currentReader)
      const currentWriterIndex = game.submissions.length % nonReaders.length
      const currentWriter = nonReaders[currentWriterIndex]
      
      if (game.submissions.length < nonReaders.length) {
        return (
          <div className="app">
            <div className="container has-buttons">
              <LocalGameButtons />
              <h2>Pass to Writer</h2>
              <div className="pass-device">
                <div className="current-player">
                  <span className="player-emoji">{currentWriter.emoji}</span>
                  <h3>{currentWriter.nickname}</h3>
                  <p>Write your ending</p>
                </div>
                
                <div className="saying-card">
                  <p className="first-half">{game.selectedSaying.firstHalf}...</p>
                </div>

                <div className="form-group">
                  <textarea
                    value={submission}
                    onChange={(e) => {
                      setSubmission(e.target.value)
                      setShowSubmissionConfirm(false)
                    }}
                    placeholder="Write your creative ending..."
                    maxLength={100}
                  />
                  {!showSubmissionConfirm ? (
                    <button 
                      onClick={() => setShowSubmissionConfirm(true)}
                      disabled={!submission.trim()}
                    >
                      Review Answer
                    </button>
                  ) : (
                    <div className="submission-preview">
                      <p><strong>Your answer:</strong> "{submission.trim()}"</p>
                      <div className="saying-actions">
                        <button 
                          onClick={() => setShowSubmissionConfirm(false)}
                          className="nav-btn"
                        >
                          Edit Answer
                        </button>
                        <button 
                          onClick={() => {
                            const newSubmission = {
                              id: Date.now().toString(),
                              playerId: currentWriter.id,
                              ending: submission.trim()
                            }
                            setGame({...game, submissions: [...game.submissions, newSubmission]})
                            setSubmission('')
                            setShowSubmissionConfirm(false)
                          }}
                          className="primary-btn"
                        >
                          Lock It In & Pass Device
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      } else {
        // All submissions collected, pass back to reader
        return (
          <div className="app">
            <div className="container has-buttons">
              <LocalGameButtons />
              <h2>Pass Back to Reader</h2>
              <div className="pass-device">
                <div className="current-player">
                  <span className="player-emoji">{currentPlayer.emoji}</span>
                  <h3>{currentPlayer.nickname}</h3>
                  <p>Organize the answers and start voting</p>
                </div>
                
                <button 
                  onClick={() => {
                    // Create ordered answers with true answer mixed in
                    const playerSubmissions = game.submissions.map(sub => ({
                      id: sub.id,
                      ending: sub.ending.replace(/\.+$/, ''), // Remove trailing periods
                      playerId: sub.playerId,
                      isTrue: false
                    }))
                    
                    const trueAnswer = {
                      id: 'true',
                      ending: game.selectedSaying.trueEnding.replace(/\.+$/, ''), // Remove trailing periods
                      isTrue: true
                    }
                    
                    const allAnswers = [...playerSubmissions, trueAnswer]
                    // Initial shuffle
                    for (let i = allAnswers.length - 1; i > 0; i--) {
                      const j = Math.floor(Math.random() * (i + 1));
                      [allAnswers[i], allAnswers[j]] = [allAnswers[j], allAnswers[i]]
                    }
                    
                    setAnswerOrder(allAnswers)
                    setGame({...game, phase: 'reordering'})
                  }}
                  className="primary-btn"
                >
                  Organize Answers
                </button>
              </div>
            </div>
          </div>
        )
      }
    }
    
    if (game.phase === 'reordering') {
      return (
        <div className="app">
          <div className="container has-buttons">
            <LocalGameButtons />
            <h2>Arrange the Answers</h2>
            <div className="pass-device">
              <div className="current-player">
                <span className="player-emoji">{currentPlayer.emoji}</span>
                <h3>{currentPlayer.nickname}</h3>
                <p>Drag answers up and down to reorder them</p>
              </div>
              
              <div className="saying-card">
                <p className="first-half">{game.selectedSaying.firstHalf}...</p>
                <p className="continuation">...</p>
              </div>

              <div className="reorder-list">
                {answerOrder.map((answer, index) => (
                  <div
                    key={answer.id}
                    className={`reorder-item ${answer.isTrue ? 'true-answer' : ''} ${draggedIndex === index ? 'dragging' : ''}`}
                    draggable
                    onDragStart={() => setDraggedIndex(index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      if (draggedIndex !== null && draggedIndex !== index) {
                        const newOrder = [...answerOrder]
                        const [draggedItem] = newOrder.splice(draggedIndex, 1)
                        newOrder.splice(index, 0, draggedItem)
                        setAnswerOrder(newOrder)
                      }
                      setDraggedIndex(null)
                    }}
                    onDragEnd={() => setDraggedIndex(null)}
                  >
                    <div className="mobile-controls">
                      <button 
                        className="move-btn" 
                        onClick={() => moveAnswerUp(index)}
                        disabled={index === 0}
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button 
                        className="move-btn" 
                        onClick={() => moveAnswerDown(index)}
                        disabled={index === answerOrder.length - 1}
                        title="Move down"
                      >
                        ↓
                      </button>
                    </div>
                    <div className="drag-handle">≡</div>
                    <div className="answer-content">
                      <span className="answer-number">{index + 1}.</span>
                      <span className="answer-text">...{answer.ending}</span>
                    </div>
                    {answer.isTrue && <span className="true-badge">TRUE</span>}
                  </div>
                ))}
              </div>

              <button 
                onClick={() => {
                  const nextChooserIndex = game.currentReader === 0 ? 1 : 0
                  setGame({
                    ...game, 
                    orderedAnswers: answerOrder, 
                    phase: 'selections', 
                    currentChooser: nextChooserIndex
                  })
                }}
                className="primary-btn"
              >
                Confirm Order & Start Voting
              </button>
            </div>
          </div>
        </div>
      )
    }
    
    if (game.phase === 'selections') {
      const chooser = game.players[game.currentChooser]
      
      if (game.selections.length < game.players.length - 1) {
        return (
          <div className="app">
            <div className="container has-buttons">
              <LocalGameButtons />
              <h2>Pass to Voter</h2>
              <div className="voting-progress">
                <p>Voting: {game.selections.length + 1} of {game.players.length - 1}</p>
              </div>
              <div className="pass-device">
                <div className="current-player">
                  <span className="player-emoji">{chooser.emoji}</span>
                  <h3>{chooser.nickname}</h3>
                  <p>Pick the TRUE answer</p>
                </div>
                
                <div className="saying-card">
                  <p className="first-half">{game.selectedSaying.firstHalf}...</p>
                </div>
                
                <div className="answers-list">
                  {game.orderedAnswers.map((answer, idx) => (
                    <button
                      key={answer.id}
                      className="answer-button"
                      onClick={() => {
                        setSelectedAnswer(answer)
                        setShowVoteConfirm(true)
                      }}
                    >
                      <span className="answer-number">{idx + 1}.</span>
                      <span className="answer-text">...{answer.ending}</span>
                    </button>
                  ))}
                </div>

                {/* Show previous guesses */}
                {game.selections && game.selections.length > 0 && (
                  <div className="previous-guesses">
                    <h4>Previous Votes:</h4>
                    {game.selections.map((selection, idx) => {
                      const voter = game.players.find(p => p.id === selection.playerId)
                      const selectedAnswer = game.orderedAnswers.find(a => a.id === selection.answerId)
                      const answerIndex = game.orderedAnswers.findIndex(a => a.id === selection.answerId) + 1
                      return (
                        <div key={selection.playerId} className="previous-guess">
                          <span className="voter-info">{voter.emoji} {voter.nickname}</span>
                          <span className="guess-info">chose #{answerIndex}: "...{selectedAnswer.ending}"</span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {showVoteConfirm && selectedAnswer && (
                  <div className="submission-preview">
                    <p><strong>You selected:</strong> "{game.selectedSaying.firstHalf} {selectedAnswer.ending}"</p>
                    <div className="saying-actions">
                      <button 
                        onClick={() => {
                          setShowVoteConfirm(false)
                          setSelectedAnswer(null)
                        }}
                        className="nav-btn"
                      >
                        Choose Different
                      </button>
                      <button 
                        onClick={() => {
                          const newSelection = {
                            playerId: chooser.id,
                            answerId: selectedAnswer.id
                          }
                          
                          const updatedSelections = [...game.selections, newSelection]
                          
                          // Find next voter (excluding reader and those who already voted)
                          const nextChooserIndex = game.players.findIndex((player, i) => 
                            i !== game.currentReader && 
                            !updatedSelections.some(s => s.playerId === player.id)
                          )
                          
                          setGame({
                            ...game, 
                            selections: updatedSelections,
                            currentChooser: nextChooserIndex === -1 ? game.currentChooser : nextChooserIndex
                          })
                          
                          setShowVoteConfirm(false)
                          setSelectedAnswer(null)
                        }}
                        className="primary-btn"
                      >
                        Lock It In
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      } else {
        // All votes collected, show results
        // Calculate scores only once per round
        if (!game.scoresCalculated) {
          game.players.forEach(player => {
            let points = 0
            
            // Check if player picked their own answer (zero points)
            const theirSubmission = game.submissions.find(s => s.playerId === player.id)
            const pickedOwnAnswer = theirSubmission && game.selections.some(s => s.playerId === player.id && s.answerId === theirSubmission.id)
            
            if (!pickedOwnAnswer) {
              // Check if picked true answer (2 points)
              const pickedTrue = game.selections.some(s => s.playerId === player.id && s.answerId === 'true')
              if (pickedTrue) {
                points += 2
              }
            }
            
            // Check votes on their bluff (2 points each, excluding self-votes)
            if (theirSubmission) {
              const votes = game.selections.filter(s => s.answerId === theirSubmission.id && s.playerId !== player.id).length
              points += votes * 2
            }
            
            // Check if reader and nobody got the true answer (3 points)
            const isReader = game.players[game.currentReader].id === player.id
            if (isReader) {
              const anyonePickedTrue = game.selections.some(s => s.answerId === 'true')
              if (!anyonePickedTrue) {
                points += 3
              }
            }
            
            // Add points to player score
            player.score += points
          })
          
          game.scoresCalculated = true
        }
        
        return (
          <div className="app">
            <div className="container has-buttons">
              <LocalGameButtons />
              <h2>Results - Round {game.round}</h2>
              
              <div className="saying-card">
                <p className="first-half">{game.selectedSaying.firstHalf}...</p>
                <p className="true-ending highlight">...{game.selectedSaying.trueEnding}</p>
              </div>

              <div className="reveal-results">
                <h3>Who picked what:</h3>
                {game.orderedAnswers.map(answer => {
                  const voters = game.selections.filter(s => s.answerId === answer.id)
                  if (voters.length === 0) return null
                  
                  return (
                    <div key={answer.id} className="result-item">
                      <span className="players">
                        {voters.map(v => {
                          const voter = game.players.find(p => p.id === v.playerId)
                          return `${voter.emoji} ${voter.nickname}`
                        }).join(', ')}
                      </span>
                      <span className="picked">picked: "...{answer.ending}"</span>
                      {answer.isTrue && <span className="correct-badge">✓ CORRECT!</span>}
                      {!answer.isTrue && (
                        <span className="author">
                          by {game.players.find(p => p.id === answer.playerId)?.emoji} {game.players.find(p => p.id === answer.playerId)?.nickname}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="scoring">
                <h3>Scoring this round:</h3>
                {game.players.map(player => {
                  let points = 0
                  let reasons = []
                  
                  // Check if player picked their own answer (zero points)
                  const theirSubmission = game.submissions.find(s => s.playerId === player.id)
                  const pickedOwnAnswer = theirSubmission && game.selections.some(s => s.playerId === player.id && s.answerId === theirSubmission.id)
                  
                  if (pickedOwnAnswer) {
                    reasons.push('Picked your own answer (+0)')
                  } else {
                    // Check if picked true answer (2 points)
                    const pickedTrue = game.selections.some(s => s.playerId === player.id && s.answerId === 'true')
                    if (pickedTrue) {
                      points += 2
                      reasons.push('Found the true answer (+2)')
                    }
                  }
                  
                  // Check votes on their bluff (2 points each, excluding self-votes)
                  if (theirSubmission) {
                    const votes = game.selections.filter(s => s.answerId === theirSubmission.id && s.playerId !== player.id).length
                    if (votes > 0) {
                      const bluffPoints = votes * 2
                      points += bluffPoints
                      reasons.push(`${votes} vote${votes > 1 ? 's' : ''} on your bluff (+${bluffPoints})`)
                    }
                  }
                  
                  // Check if reader and nobody got the true answer (3 points)
                  const isReader = game.players[game.currentReader].id === player.id
                  if (isReader) {
                    const anyonePickedTrue = game.selections.some(s => s.answerId === 'true')
                    if (!anyonePickedTrue) {
                      points += 3
                      reasons.push('Nobody found the true answer (+3)')
                    }
                  }
                  
                  if (points > 0) {
                    return (
                      <div key={player.id} className="score-item">
                        <span>{player.emoji} {player.nickname}</span>
                        <span className="points">+{points}</span>
                        <span className="reason">{reasons.join(', ')}</span>
                      </div>
                    )
                  }
                  return null
                })}
              </div>

              <div className="scoreboard">
                <h3>Total Scores:</h3>
                {game.players
                  .sort((a, b) => b.score - a.score)
                  .map(p => (
                    <div key={p.id} className="score-row">
                      <span>{p.emoji} {p.nickname}</span>
                      <span className="total-score">{p.score}</span>
                    </div>
                  ))}
              </div>

              {game.players.some(p => p.score >= 20) ? (
                <div className="game-end">
                  <h2>🎉 {game.players.find(p => p.score >= 20).emoji} {game.players.find(p => p.score >= 20).nickname} Wins! 🎉</h2>
                  <button onClick={() => {
                    setGameState('lobby')
                    setGame(null)
                    setLocalPlayers([])
                  }} className="primary-btn">
                    Return Home
                  </button>
                </div>
              ) : (
                <div className="next-round">
                  <p>Next Reader: {game.players[(game.currentReader + 1) % game.players.length].emoji} {game.players[(game.currentReader + 1) % game.players.length].nickname}</p>
                  <button onClick={() => {
                    const nextReaderIndex = (game.currentReader + 1) % game.players.length
                    setGame({
                      ...game,
                      round: game.round + 1,
                      currentReader: nextReaderIndex,
                      phase: 'saying_selection',
                      selectedSaying: null,
                      submissions: [],
                      orderedAnswers: [],
                      selections: [],
                      currentChooser: nextReaderIndex === 0 ? 1 : 0,  // First non-reader
                      scoresCalculated: false  // Reset for next round
                    })
                  }} className="primary-btn">
                    Next Round
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      }
    }

  }

  if (gameState === 'game' && game) {
    const isReader = player?.id === game.currentReader
    const currentPhase = game.phase

    // Top corner buttons for game
    const GameButtons = () => (
      <>
        <div className="game-buttons">
          <button onClick={() => setShowHomeConfirm(true)} className="corner-btn home-btn" title="Go Home">
            🏠
          </button>
          <button onClick={() => setShowInfoDialog(true)} className="corner-btn info-btn" title="Game Info">
            ℹ️
          </button>
          <button onClick={() => setShowRecycleConfirm(true)} className="corner-btn recycle-btn" title="Recycle Saying" disabled={currentPhase !== 'writing'}>
            ♻️
          </button>
        </div>
        <RenderDialogs />
      </>
    )

    if (currentPhase === 'saying_selection' && isReader) {
      return (
        <div className="app">
          <div className="container has-buttons">
            <GameButtons />
            <h2>Select a Saying</h2>
            <p>Round {game.round} - You are the Reader</p>
            <div className="reader-debug">
              <small>Reader rotation: {game.players.map((p, i) => 
                `${p.emoji}${p.nickname}${i === game.currentReader ? '👑' : ''}`
              ).join(' → ')}</small>
            </div>
            
                        {onlineSayingOptions.length > 0 ? (
              <>
                <div className="saying-card">
                  <div className="saying-header">
                    <button 
                      onClick={() => {
                        setOnlineSayingOptions([]);
                        send({ type: 'request_sayings' });
                      }}
                      className="mark-used-btn"
                      title="Get new sayings"
                    >
                      ×
                    </button>
                    <p className="saying-origin">There is an old {onlineSayingOptions[currentOnlineSayingIndex].origin || 'ancient'} saying:</p>
                  </div>
                  <p className="first-half">{onlineSayingOptions[currentOnlineSayingIndex].firstHalf}...</p>
                  <p className="true-ending">...{onlineSayingOptions[currentOnlineSayingIndex].trueEnding}</p>
                </div>
                <div className="saying-navigation">
                  <button onClick={() => setCurrentOnlineSayingIndex((currentOnlineSayingIndex - 1 + onlineSayingOptions.length) % onlineSayingOptions.length)} className="nav-btn">
                    ← Previous Saying
                  </button>
                  <button onClick={() => setCurrentOnlineSayingIndex((currentOnlineSayingIndex + 1) % onlineSayingOptions.length)} className="nav-btn">
                    Next Saying →
                  </button>
                </div>

                <div className="saying-counter">
                  <span>Saying {currentOnlineSayingIndex + 1} of {onlineSayingOptions.length}</span>
                </div>
                
                <div className="saying-actions">
                  <button onClick={() => selectSaying(onlineSayingOptions[currentOnlineSayingIndex].id)} className="primary-btn">
                    Select This Saying
                  </button>
                </div>
              </>
            ) : game.candidateSaying && (
              <>
                <div className="saying-counter">
                  <span>Saying {sayingCounter}</span>
                </div>
                
                <div className="saying-card">
                  <div className="saying-header">
                    <button 
                      onClick={requestNextSaying}
                      className="mark-used-btn"
                      title="Mark this saying as already known"
                    >
                      ×
                    </button>
                    <p className="saying-origin">There is an old {game.candidateSaying.origin || 'ancient'} saying:</p>
                  </div>
                  <p className="first-half">{game.candidateSaying.firstHalf}...</p>
                  <p className="true-ending">...{game.candidateSaying.trueEnding}</p>
                
                <div className="saying-navigation">
                  <button onClick={requestNextSaying} className="nav-btn">
                    ← Previous Saying
                  </button>
                  <button onClick={requestNextSaying} className="nav-btn">
                    Next Saying →
                  </button>
                </div>
                
                <div className="saying-actions">
                  <button onClick={() => selectSaying(game.candidateSaying.id)} className="primary-btn">
                    Select This Saying
                  </button>
                </div>
              </div>
              </>
            )}

            {game.submissions.length > 0 && (
              <div className="submissions-info">
                <p>⚠️ {game.submissions.length} submission(s) received</p>
                <p>Switching sayings will clear all submissions!</p>
              </div>
            )}
          </div>

        </div>
      )
    }

    if (currentPhase === 'saying_selection' && !isReader) {
      return (
        <div className="app">
          <div className="container has-buttons">
            <GameButtons />
            <h2>Waiting for Reader</h2>
            <p>Round {game.round}</p>
            <p className="reader-name">
              {game.players.find(p => p.id === game.currentReader)?.emoji} 
              {' '}
              {game.players.find(p => p.id === game.currentReader)?.nickname} is selecting a saying...
            </p>

            <div className="scoreboard">
              <h3>Current Scores:</h3>
              {game.players
                .sort((a, b) => b.score - a.score)
                .map(p => (
                  <div key={p.id} className="score-row">
                    <span>{p.emoji} {p.nickname}</span>
                    <span className="total-score">{p.score}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )
    }

    if (currentPhase === 'reading' && isReader) {
      return (
        <div className="app">
          <div className="container has-buttons">
            <GameButtons />
            <h2>Read Aloud</h2>
            <p>Round {game.round}</p>
            
            <div className="saying-card">
              <p className="first-half">{game.selectedSaying.firstHalf}...</p>
            </div>

            <div className="reading-instructions">
              <p>Read the saying aloud to all players, then open the round for writing.</p>
            </div>

            <button onClick={openRound} className="primary-btn">
              Open Round
            </button>
          </div>
        </div>
      )
    }

    if (currentPhase === 'reading' && !isReader) {
      return (
        <div className="app">
          <div className="container has-buttons">
            <GameButtons />
            <h2>Reader is Reading...</h2>
            <p>Round {game.round}</p>
            <p>Listen carefully to the saying!</p>
          </div>
        </div>
      )
    }

    if (currentPhase === 'writing') {
      if (isReader) {
        return (
          <div className="app">
            <div className="container has-buttons">
              <GameButtons />
              <h2>Writers are Writing</h2>
              <p>Round {game.round}</p>
              
              <div className="saying-card">
                <p className="first-half">{game.selectedSaying.firstHalf}...</p>
              </div>

              <div className="submissions-status">
                <p>Submissions: {game.submissions.length}/{game.players.length - 1}</p>
                {game.submissions.map((sub, idx) => {
                  const author = game.players.find(p => p.id === sub.playerId);
                  return (
                    <div key={idx} className="submission-preview">
                      <strong>{author.nickname}:</strong> "{sub.ending}"
                    </div>
                  )
                })}
                <h4>Remaining players:</h4>
                <ul>
                  {game.players
                    .filter(p => p.id !== game.currentReader && !game.submissions.some(s => s.playerId === p.id))
                    .map(p => (
                      <li key={p.id}>{p.emoji} {p.nickname}</li>
                    ))
                  }
                </ul>
              </div>

              {countdown !== null ? (
                <div className="timer">Time remaining: {countdown}s</div>
              ) : (
                <button onClick={() => send({ type: 'start_timer' })} className="primary-btn">
                  Start Timer (30s)
                </button>
              )}
            </div>
          </div>
        )
      } else {
        const hasSubmitted = game.submissions.some(s => s.playerId === player.id)
        return (
          <div className="app">
            <div className="container has-buttons">
              <GameButtons />
              <h2>Write Your Ending</h2>
              <p>Round {game.round}</p>
              
              <div className="saying-card">
                <p className="first-half">{game.selectedSaying.firstHalf}...</p>
                <p className="continuation">...</p>
              </div>

              {countdown !== null && <div className="timer">Time remaining: {countdown}s</div>}

              <div className="submissions-status">
                <p>Submissions: {game.submissions.length}/{game.players.length - 1}</p>
                <ul>
                  {game.players.filter(p => p.id !== game.currentReader).map(p => (
                    <li key={p.id}>
                      {p.emoji} {p.nickname} {game.submissions.some(s => s.playerId === p.id) ? '✅' : '...'}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="form-group">
                <textarea
                  value={submission}
                  onChange={(e) => {
                    setSubmission(e.target.value)
                    setShowSubmissionConfirm(false)
                  }}
                  placeholder="Write your creative ending..."
                  maxLength={100}
                />
                {!showSubmissionConfirm && !hasSubmitted ? (
                  <button 
                    onClick={() => setShowSubmissionConfirm(true)}
                    disabled={!submission.trim()}
                  >
                    Review Answer
                  </button>
                ) : hasSubmitted ? (
                  <button onClick={submitEnding} disabled={!submission.trim()}>
                    Update Submission
                  </button>
                ) : (
                  <div className="submission-preview">
                    <p><strong>Your answer:</strong> "{submission.trim()}"</p>
                    <div className="saying-actions">
                      <button 
                        onClick={() => setShowSubmissionConfirm(false)}
                        className="nav-btn"
                      >
                        Edit Answer
                      </button>
                      <button 
                        onClick={() => {
                          submitEnding()
                          setShowSubmissionConfirm(false)
                        }}
                        className="primary-btn"
                      >
                        Lock It In
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {hasSubmitted && (
                <div className="submitted-info">
                  ✓ Submitted! You can change it until the Reader locks the round.
                </div>
              )}
            </div>
          </div>
        )
      }
    }

    if (currentPhase === 'reorder' && isReader) {
      // Initialize answer order if not already set
      if (!answerOrder || answerOrder.length === 0) {
        const playerSubmissions = game.submissions.map(sub => ({
          id: sub.id,
          ending: sub.ending.replace(/\.+$/, ''),
          playerId: sub.playerId,
          isTrue: false
        }))
        
        const trueAnswer = {
          id: 'true',
          ending: game.selectedSaying.trueEnding.replace(/\.+$/, ''),
          isTrue: true
        }
        
        const allAnswers = [...playerSubmissions, trueAnswer]
        // Initial shuffle
        for (let i = allAnswers.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allAnswers[i], allAnswers[j]] = [allAnswers[j], allAnswers[i]]
        }
        
        setAnswerOrder(allAnswers)
      }
      
      return (
        <div className="app">
          <div className="container has-buttons">
            <GameButtons />
            <h2>Arrange the Answers</h2>
            <p>Round {game.round}</p>
            
            <div className="saying-card">
              <p className="first-half">{game.selectedSaying.firstHalf}...</p>
              <p className="continuation">...</p>
            </div>

            <div className="reorder-list">
              {answerOrder.map((answer, index) => (
                <div
                  key={answer.id}
                  className={`reorder-item ${answer.isTrue ? 'true-answer' : ''} ${draggedIndex === index ? 'dragging' : ''}`}
                  draggable
                  onDragStart={() => setDraggedIndex(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (draggedIndex !== null && draggedIndex !== index) {
                      const newOrder = [...answerOrder]
                      const [draggedItem] = newOrder.splice(draggedIndex, 1)
                      newOrder.splice(index, 0, draggedItem)
                      setAnswerOrder(newOrder)
                    }
                    setDraggedIndex(null)
                  }}
                  onDragEnd={() => setDraggedIndex(null)}
                >
                  <div className="mobile-controls">
                    <button 
                      className="move-btn" 
                      onClick={() => moveAnswerUp(index)}
                      disabled={index === 0}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button 
                      className="move-btn" 
                      onClick={() => moveAnswerDown(index)}
                      disabled={index === answerOrder.length - 1}
                      title="Move down"
                    >
                      ↓
                    </button>
                  </div>
                  <div className="drag-handle">≡</div>
                  <div className="answer-content">
                    <span className="answer-number">{index + 1}.</span>
                    <span className="answer-text">...{answer.ending}</span>
                  </div>
                  {answer.isTrue && <span className="true-badge">TRUE</span>}
                </div>
              ))}
            </div>

            <button 
              onClick={() => {
                // Send the reordered answers to the server
                send({ type: 'set_answer_order', orderedAnswers: answerOrder })
                lockRound()
              }}
              className="primary-btn"
            >
              Confirm Order & Lock Round
            </button>
          </div>
        </div>
      )
    }

    if (currentPhase === 'reorder' && !isReader) {
      return (
        <div className="app">
          <div className="container has-buttons">
            <GameButtons />
            <h2>Reader is Organizing</h2>
            <p>Round {game.round}</p>
            <p>The Reader is putting the answers in order...</p>
          </div>
        </div>
      )
    }

    if (currentPhase === 'selections') {
      const hasChosen = game.selections.some(s => s.playerId === player?.id)
      const nonReaders = game.players.filter(p => p.id !== game.currentReader)

      if (isReader) {
        return (
          <div className="app">
            <div className="container has-buttons">
              <GameButtons />
              <h2>Players are Choosing</h2>
              <p>Round {game.round}</p>
              <p>Votes: {game.selections.length}/{nonReaders.length}</p>
              
              <div className="answers-list">
                {game.orderedAnswers.map((answer, idx) => (
                  <div key={answer.id} className="answer-item">
                    <span className="answer-number">{idx + 1}.</span>
                    <span className="answer-text">...{answer.ending}</span>
                  </div>
                ))}
              </div>

              <div className="voting-status">
                <h4>Voting Status:</h4>
                {nonReaders.map(p => (
                  <div key={p.id} className="voter-status">
                    {p.emoji} {p.nickname}: {game.selections.some(s => s.playerId === p.id) ? '✅ Voted' : '⏳ Choosing...'}
                  </div>
                ))}
              </div>

              <div className="voting-results">
                <h4>Votes:</h4>
                {game.selections.map(selection => {
                  const voter = game.players.find(p => p.id === selection.playerId);
                  const answer = game.orderedAnswers.find(a => a.id === selection.answerId);
                  return (
                    <div key={selection.playerId}>
                      {voter.emoji} {voter.nickname} voted for: "...{answer.ending}"
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      } else {
        const mySubmission = game.submissions.find(s => s.playerId === player.id)
        
        if (player.id !== game.currentChooser) {
          return (
            <div className="app">
              <div className="container has-buttons">
                <GameButtons />
                <h2>Waiting for your turn to vote...</h2>
                <p>It is currently {game.players.find(p => p.id === game.currentChooser)?.nickname}'s turn to vote.</p>

                <div className="voting-results">
                  <h4>Votes:</h4>
                  {game.selections.map(selection => {
                    const voter = game.players.find(p => p.id === selection.playerId);
                    const answer = game.orderedAnswers.find(a => a.id === selection.answerId);
                    return (
                      <div key={selection.playerId}>
                        {voter.emoji} {voter.nickname} voted for: "...{answer.ending}"
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        }

        if (hasChosen) {
          return (
            <div className="app">
              <div className="container has-buttons">
                <GameButtons />
                <h2>Waiting for Other Players</h2>
                <p>Round {game.round}</p>
                <p>You've made your selection. Waiting for others...</p>
                <p>Votes: {game.selections.length}/{nonReaders.length}</p>
              </div>
            </div>
          )
        }
        
        return (
          <div className="app">
            <div className="container has-buttons">
              <GameButtons />
              <h2>Your Turn to Choose</h2>
              <p>Round {game.round}</p>
              
              <div className="saying-card">
                <p className="first-half">{game.selectedSaying.firstHalf}...</p>
              </div>
              
              <p>Pick the answer you think is the TRUE one:</p>
              
              <div className="answers-list">
                {game.orderedAnswers.map((answer, idx) => {
                  const isMyAnswer = mySubmission && answer.id === mySubmission.id
                  return (
                    <button
                      key={answer.id}
                      className={`answer-button ${isMyAnswer ? 'my-answer' : ''}`}
                      onClick={() => (setSelectedAnswer(answer), setShowVoteConfirm(true))}
                    >
                      <span className="answer-number">{idx + 1}.</span>
                      <span className="answer-text">...{answer.ending}</span>
                      {isMyAnswer && <span className="my-badge">YOURS</span>}
                    </button>
                  )
                })}
              </div>

              {/* Show previous guesses */}
              {game.selections && game.selections.length > 0 && (
                <div className="previous-guesses">
                  <h4>Previous Votes:</h4>
                  {game.selections.map((selection, idx) => {
                    const voter = game.players.find(p => p.id === selection.playerId)
                    const selectedAnswer = game.orderedAnswers.find(a => a.id === selection.answerId)
                    const answerIndex = game.orderedAnswers.findIndex(a => a.id === selection.answerId) + 1
                    return (
                      <div key={selection.playerId} className="previous-guess">
                        <span className="voter-info">{voter.emoji} {voter.nickname}</span>
                        <span className="guess-info">chose #{answerIndex}: "...{selectedAnswer.ending}"</span>
                      </div>
                    )
                  })}
                </div>
              )}

              {showVoteConfirm && selectedAnswer && (
                <div className="submission-preview">
                  <p><strong>You selected:</strong> "{game.selectedSaying.firstHalf} {selectedAnswer.ending}"</p>
                  <div className="saying-actions">
                    <button 
                      onClick={() => {
                        setShowVoteConfirm(false)
                        setSelectedAnswer(null)
                      }}
                      className="nav-btn"
                    >
                      Choose Different
                    </button>
                    <button 
                      onClick={() => {
                        selectAnswer(selectedAnswer.id)
                        setShowVoteConfirm(false)
                        setSelectedAnswer(null)
                      }}
                      className="primary-btn"
                    >
                      Lock It In
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )
      }
    }

    if (currentPhase === 'reveal') {
      return (
        <div className="app">
          <div className="container has-buttons">
            <GameButtons />
            <h2>Results</h2>
            <p>Round {game.round}</p>
            
            <div className="saying-card">
              <p className="first-half">{game.selectedSaying.firstHalf}...</p>
              <p className="true-ending highlight">...{game.selectedSaying.trueEnding}</p>
            </div>

            <div className="reveal-results">
              <h3>Who picked what:</h3>
              {game.revealResults.map((result, idx) => (
                <div key={idx} className="result-item">
                  <span className="players">
                    {result.players.map(p => `${p.emoji} ${p.nickname}`).join(', ')}
                  </span>
                  <span className="picked">picked: "...{result.answer.ending}"</span>
                  {result.answer.isTrue && <span className="correct-badge">✓ CORRECT!</span>}
                  {!result.answer.isTrue && result.answer.author && (
                    <span className="author">by {result.answer.author.emoji} {result.answer.author.nickname}</span>
                  )}
                </div>
              ))}
            </div>

            <div className="scoring">
              <h3>Scoring this round:</h3>
              {game.roundScoring.map((score, idx) => (
                <div key={idx} className="score-item">
                  <span>{score.player.emoji} {score.player.nickname}</span>
                  <span className="points">+{score.points}</span>
                  <span className="reason">{score.reason}</span>
                </div>
              ))}
            </div>

            <div className="scoreboard">
              <h3>Total Scores:</h3>
              {game.players
                .sort((a, b) => b.score - a.score)
                .map(p => (
                  <div key={p.id} className="score-row">
                    <span>{p.emoji} {p.nickname}</span>
                    <span className="total-score">{p.score}</span>
                  </div>
                ))}
            </div>

            {game.winner ? (
              <div className="game-end">
                <h2>🎉 {game.winner.emoji} {game.winner.nickname} Wins! 🎉</h2>
                <button onClick={endGame} className="primary-btn">
                  Return Home
                </button>
              </div>
            ) : (
              <div className="next-round">
                <p>Next Reader: {game.nextReader.emoji} {game.nextReader.nickname}</p>
                {isReader && (
                  <button onClick={nextRound} className="primary-btn">
                    Next Round
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )
    }
  }

  return (
    <div className="app">
      <div className="container">
        <h1>Connecting...</h1>
      </div>
      
      
    </div>
  )
}

export default App
