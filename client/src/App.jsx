import { useState, useEffect, useRef } from 'react'
import './App.css'

const EMOJI_AVATARS = ['😀', '😊', '🤠', '🦄', '🐸', '🐧', '🍀', '⭐', '🎯', '🎪', '🚀', '🎸']

function App() {
  const [ws, setWs] = useState(null)
  const [gameState, setGameState] = useState('lobby')
  const [player, setPlayer] = useState(null)
  const [lobby, setLobby] = useState(null)
  const [game, setGame] = useState(null)
  const [nickname, setNickname] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJI_AVATARS[0])
  const [lobbyCode, setLobbyCode] = useState('')
  const [submission, setSubmission] = useState('')
  const [message, setMessage] = useState('')
  const [gameMode, setGameMode] = useState('online') // 'online' or 'local'
  const [localPlayers, setLocalPlayers] = useState([])
  const [currentLocalPlayer, setCurrentLocalPlayer] = useState(0)

  const wsRef = useRef(null)

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:3001')
    
    socket.onopen = () => {
      console.log('Connected to server')
      setWs(socket)
      wsRef.current = socket
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
          break
        case 'game_started':
          setGame(data.game)
          setGameState('game')
          setMessage('')
          break
        case 'game_updated':
          setGame(data.game)
          break
        case 'error':
          setMessage(data.message)
          break
      }
    }

    socket.onclose = () => {
      console.log('Disconnected from server')
      setWs(null)
    }

    return () => {
      socket.close()
    }
  }, [])

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

  const selectPhrase = (phraseId) => {
    send({ type: 'select_phrase', phraseId })
  }

  const requestNextPhrase = () => {
    send({ type: 'next_phrase' })
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
    send({ type: 'end_game' })
  }

  const kickPlayer = (playerId) => {
    send({ type: 'kick_player', playerId })
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
      phase: 'phrase_selection',
      selectedPhrase: null,
      submissions: [],
      orderedAnswers: [],
      currentChooser: localPlayers.length > 1 ? 1 : 0, // First non-reader
      selections: [],
      revealResults: [],
      roundScoring: [],
      winner: null,
      usedPhraseIds: []
    })
  }

  if (gameState === 'lobby') {
    return (
      <div className="app">
        <div className="container">
          <h1>Griot</h1>
          
          <div className="form-group">
            <label>Game Mode:</label>
            <div className="mode-selector">
              <button 
                className={gameMode === 'online' ? 'selected' : ''}
                onClick={() => setGameMode('online')}
              >
                🌐 Online Play
              </button>
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
                <label>Pick your emoji:</label>
                <div className="emoji-grid">
                  {EMOJI_AVATARS.map((emoji) => (
                    <button
                      key={emoji}
                      className={`emoji-btn ${selectedEmoji === emoji ? 'selected' : ''}`}
                      onClick={() => setSelectedEmoji(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
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
                />
                <button onClick={joinLobby} disabled={!ws}>Join Lobby</button>
              </div>

              <div className="divider">OR</div>

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
                <label>Pick emoji for this player:</label>
                <div className="emoji-grid">
                  {EMOJI_AVATARS.map((emoji) => (
                    <button
                      key={emoji}
                      className={`emoji-btn ${selectedEmoji === emoji ? 'selected' : ''}`}
                      onClick={() => setSelectedEmoji(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
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
          <h2>Lobby {lobby.code}</h2>
          <p className="mode">Mode: {lobby.mode}</p>
          
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

          {isHost && lobby.players.length >= 2 && (
            <button onClick={startGame} className="primary-btn">
              Start Game
            </button>
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
    
    if (game.phase === 'phrase_selection') {
      return (
        <div className="app">
          <div className="container">
            <h2>Pass to Reader</h2>
            <div className="pass-device">
              <div className="current-player">
                <span className="player-emoji">{currentPlayer.emoji}</span>
                <h3>{currentPlayer.nickname}</h3>
                <p>You are the Reader for Round {game.round}</p>
              </div>
              
              <button 
                onClick={() => {
                  const phrases = [
                    { id: 1, firstHalf: "The owl of Minerva", trueEnding: "flies only at dusk." },
                    { id: 2, firstHalf: "A cat may look", trueEnding: "at a king." },
                    { id: 3, firstHalf: "The mills of God", trueEnding: "grind slowly but exceedingly fine." },
                    { id: 4, firstHalf: "Fish and guests", trueEnding: "stink after three days." },
                    { id: 5, firstHalf: "When the moon is full", trueEnding: "the wolves howl loudest." },
                    { id: 6, firstHalf: "A whistling woman and a crowing hen", trueEnding: "bring luck to neither gods nor men." },
                    { id: 7, firstHalf: "The darkest hour", trueEnding: "is just before dawn." },
                    { id: 8, firstHalf: "A hedge between", trueEnding: "keeps friendship green." },
                    { id: 9, firstHalf: "The tongue that brings healing", trueEnding: "is a tree of life." },
                    { id: 10, firstHalf: "A soft answer", trueEnding: "turns away wrath." },
                    { id: 11, firstHalf: "The sleep of a laboring man", trueEnding: "is sweet." },
                    { id: 12, firstHalf: "A good name", trueEnding: "is rather to be chosen than great riches." },
                    { id: 13, firstHalf: "The race is not", trueEnding: "to the swift." },
                    { id: 14, firstHalf: "Cast your bread upon the waters", trueEnding: "and it will return after many days." },
                    { id: 15, firstHalf: "A threefold cord", trueEnding: "is not quickly broken." },
                    { id: 16, firstHalf: "Iron sharpens iron", trueEnding: "as one man sharpens another." },
                    { id: 17, firstHalf: "The heart of man", trueEnding: "plans his way." },
                    { id: 18, firstHalf: "A man's heart", trueEnding: "deviseth his way." },
                    { id: 19, firstHalf: "The lot is cast into the lap", trueEnding: "but its every decision is from the Lord." },
                    { id: 20, firstHalf: "A gentle tongue", trueEnding: "is a tree of life." }
                  ]
                  const availablePhrases = phrases.filter(p => !game.usedPhraseIds.includes(p.id))
                  const randomPhrase = availablePhrases[Math.floor(Math.random() * availablePhrases.length)]
                  setGame({...game, selectedPhrase: randomPhrase, phase: 'writing', usedPhraseIds: [...game.usedPhraseIds, randomPhrase.id]})
                }}
                className="primary-btn"
              >
                Pick Random Phrase & Start Round
              </button>
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
            <div className="container">
              <h2>Pass to Writer</h2>
              <div className="pass-device">
                <div className="current-player">
                  <span className="player-emoji">{currentWriter.emoji}</span>
                  <h3>{currentWriter.nickname}</h3>
                  <p>Write your ending</p>
                </div>
                
                <div className="phrase-card">
                  <p className="first-half">{game.selectedPhrase.firstHalf}</p>
                  <p className="continuation">...</p>
                </div>

                <div className="form-group">
                  <textarea
                    value={submission}
                    onChange={(e) => setSubmission(e.target.value)}
                    placeholder="Write your creative ending..."
                    maxLength={100}
                  />
                  <button 
                    onClick={() => {
                      if (submission.trim()) {
                        const newSubmission = {
                          id: Date.now().toString(),
                          playerId: currentWriter.id,
                          ending: submission.trim()
                        }
                        setGame({...game, submissions: [...game.submissions, newSubmission]})
                        setSubmission('')
                      }
                    }}
                    disabled={!submission.trim()}
                  >
                    Submit & Pass Device
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      } else {
        // All submissions collected, pass back to reader
        return (
          <div className="app">
            <div className="container">
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
                      ending: sub.ending,
                      playerId: sub.playerId,
                      isTrue: false
                    }))
                    
                    const trueAnswer = {
                      id: 'true',
                      ending: game.selectedPhrase.trueEnding,
                      isTrue: true
                    }
                    
                    const allAnswers = [...playerSubmissions, trueAnswer]
                    // Simple shuffle
                    for (let i = allAnswers.length - 1; i > 0; i--) {
                      const j = Math.floor(Math.random() * (i + 1));
                      [allAnswers[i], allAnswers[j]] = [allAnswers[j], allAnswers[i]]
                    }
                    
                    setGame({...game, orderedAnswers: allAnswers, phase: 'selections', currentChooser: game.currentReader === 0 ? 1 : 0})
                  }}
                  className="primary-btn"
                >
                  Shuffle Answers & Start Voting
                </button>
              </div>
            </div>
          </div>
        )
      }
    }
    
    if (game.phase === 'selections') {
      const chooser = game.players[game.currentChooser]
      
      if (game.selections.length < game.players.length - 1) {
        return (
          <div className="app">
            <div className="container">
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
                
                <div className="phrase-card">
                  <p className="first-half">{game.selectedPhrase.firstHalf}</p>
                </div>
                
                <div className="answers-list">
                  {game.orderedAnswers.map((answer, idx) => (
                    <button
                      key={answer.id}
                      className="answer-button"
                      onClick={() => {
                        const newSelection = {
                          playerId: chooser.id,
                          answerId: answer.id
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
                      }}
                    >
                      <span className="answer-number">{idx + 1}.</span>
                      <span className="answer-text">...{answer.ending}</span>
                    </button>
                  ))}
                </div>
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
            
            // Check if picked true answer (2 points)
            const pickedTrue = game.selections.some(s => s.playerId === player.id && s.answerId === 'true')
            if (pickedTrue) {
              points += 2
            }
            
            // Check votes on their bluff (2 points each)
            const theirSubmission = game.submissions.find(s => s.playerId === player.id)
            if (theirSubmission) {
              const votes = game.selections.filter(s => s.answerId === theirSubmission.id).length
              points += votes * 2
            }
            
            // Check if reader and nobody got the true answer (3 points)
            const isReader = game.currentReader === game.players.indexOf(player)
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
            <div className="container">
              <h2>Results - Round {game.round}</h2>
              
              <div className="phrase-card">
                <p className="first-half">{game.selectedPhrase.firstHalf}</p>
                <p className="true-ending highlight">...{game.selectedPhrase.trueEnding}</p>
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
                  
                  // Check if picked true answer (2 points)
                  const pickedTrue = game.selections.some(s => s.playerId === player.id && s.answerId === 'true')
                  if (pickedTrue) {
                    points += 2
                    reasons.push('Found the true answer (+2)')
                  }
                  
                  // Check votes on their bluff (2 points each)
                  const theirSubmission = game.submissions.find(s => s.playerId === player.id)
                  if (theirSubmission) {
                    const votes = game.selections.filter(s => s.answerId === theirSubmission.id).length
                    if (votes > 0) {
                      const bluffPoints = votes * 2
                      points += bluffPoints
                      reasons.push(`${votes} vote${votes > 1 ? 's' : ''} on your bluff (+${bluffPoints})`)
                    }
                  }
                  
                  // Check if reader and nobody got the true answer (3 points)
                  const isReader = game.currentReader === game.players.indexOf(player)
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
                    Back to Menu
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
                      phase: 'phrase_selection',
                      selectedPhrase: null,
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

    if (currentPhase === 'phrase_selection' && isReader) {
      return (
        <div className="app">
          <div className="container">
            <h2>Select a Phrase</h2>
            <p>Round {game.round} - You are the Reader</p>
            
            {game.candidatePhrase && (
              <div className="phrase-card">
                <p className="first-half">{game.candidatePhrase.firstHalf}</p>
                <p className="true-ending">...{game.candidatePhrase.trueEnding}</p>
                
                <div className="phrase-actions">
                  <button onClick={requestNextPhrase}>Next Phrase</button>
                  <button onClick={() => selectPhrase(game.candidatePhrase.id)} className="primary-btn">
                    Select This Phrase
                  </button>
                </div>
              </div>
            )}

            {game.submissions.length > 0 && (
              <div className="submissions-info">
                <p>⚠️ {game.submissions.length} submission(s) received</p>
                <p>Switching phrases will clear all submissions!</p>
              </div>
            )}
          </div>
        </div>
      )
    }

    if (currentPhase === 'phrase_selection' && !isReader) {
      return (
        <div className="app">
          <div className="container">
            <h2>Waiting for Reader</h2>
            <p>Round {game.round}</p>
            <p className="reader-name">
              {game.players.find(p => p.id === game.currentReader)?.emoji} 
              {' '}
              {game.players.find(p => p.id === game.currentReader)?.nickname} is selecting a phrase...
            </p>
          </div>
        </div>
      )
    }

    if (currentPhase === 'reading' && isReader) {
      return (
        <div className="app">
          <div className="container">
            <h2>Read Aloud</h2>
            <p>Round {game.round}</p>
            
            <div className="phrase-card">
              <p className="first-half">{game.selectedPhrase.firstHalf}</p>
            </div>

            <div className="reading-instructions">
              <p>Read the phrase aloud to all players, then open the round for writing.</p>
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
          <div className="container">
            <h2>Reader is Reading...</h2>
            <p>Round {game.round}</p>
            <p>Listen carefully to the phrase!</p>
          </div>
        </div>
      )
    }

    if (currentPhase === 'writing') {
      if (isReader) {
        return (
          <div className="app">
            <div className="container">
              <h2>Writers are Writing</h2>
              <p>Round {game.round}</p>
              
              <div className="phrase-card">
                <p className="first-half">{game.selectedPhrase.firstHalf}</p>
              </div>

              <div className="submissions-status">
                <p>Submissions: {game.submissions.length}/{game.players.length - 1}</p>
                {game.submissions.map((sub, idx) => (
                  <div key={idx} className="submission-preview">
                    "{sub.ending}"
                  </div>
                ))}
              </div>

              <button onClick={lockRound} className="primary-btn">
                Lock Round ({30 - Math.floor((Date.now() - game.phaseStartTime) / 1000)}s)
              </button>
            </div>
          </div>
        )
      } else {
        const hasSubmitted = game.submissions.some(s => s.playerId === player.id)
        return (
          <div className="app">
            <div className="container">
              <h2>Write Your Ending</h2>
              <p>Round {game.round}</p>
              
              <div className="phrase-card">
                <p className="first-half">{game.selectedPhrase.firstHalf}</p>
                <p className="continuation">...</p>
              </div>

              <div className="form-group">
                <textarea
                  value={submission}
                  onChange={(e) => setSubmission(e.target.value)}
                  placeholder="Write your creative ending..."
                  maxLength={100}
                />
                <button onClick={submitEnding} disabled={!submission.trim()}>
                  {hasSubmitted ? 'Update Submission' : 'Submit'}
                </button>
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
      const allAnswers = [...game.submissions, { 
        id: 'true', 
        ending: game.selectedPhrase.trueEnding,
        isTrue: true 
      }]
      
      return (
        <div className="app">
          <div className="container">
            <h2>Reorder Answers</h2>
            <p>Round {game.round}</p>
            
            <div className="reorder-instructions">
              <p>Drag to reorder the answers, then lock when ready:</p>
            </div>

            <div className="answers-list">
              {allAnswers.map((answer, idx) => (
                <div key={answer.id} className={`answer-item ${answer.isTrue ? 'true-answer' : ''}`}>
                  <span className="answer-number">{idx + 1}.</span>
                  <span className="answer-text">...{answer.ending}</span>
                  {answer.isTrue && <span className="true-badge">TRUE</span>}
                </div>
              ))}
            </div>

            <button onClick={lockRound} className="primary-btn">
              Lock Order ({30 - Math.floor((Date.now() - game.phaseStartTime) / 1000)}s)
            </button>
          </div>
        </div>
      )
    }

    if (currentPhase === 'reorder' && !isReader) {
      return (
        <div className="app">
          <div className="container">
            <h2>Reader is Organizing</h2>
            <p>Round {game.round}</p>
            <p>The Reader is putting the answers in order...</p>
          </div>
        </div>
      )
    }

    if (currentPhase === 'selections') {
      const currentChooser = game.currentChooser
      const isMyTurn = currentChooser === player?.id
      const chooserPlayer = game.players.find(p => p.id === currentChooser)
      const hasChosen = game.selections.some(s => s.playerId === player?.id)

      if (isReader) {
        return (
          <div className="app">
            <div className="container">
              <h2>Players are Choosing</h2>
              <p>Round {game.round}</p>
              <p>Current chooser: {chooserPlayer?.emoji} {chooserPlayer?.nickname}</p>
              
              <div className="answers-list">
                {game.orderedAnswers.map((answer, idx) => (
                  <div key={answer.id} className="answer-item">
                    <span className="answer-number">{idx + 1}.</span>
                    <span className="answer-text">...{answer.ending}</span>
                  </div>
                ))}
              </div>

              <div className="selections-status">
                <p>Selections: {game.selections.length}/{game.players.length - 1}</p>
              </div>
            </div>
          </div>
        )
      } else if (isMyTurn) {
        const mySubmission = game.submissions.find(s => s.playerId === player.id)
        return (
          <div className="app">
            <div className="container">
              <h2>Your Turn to Choose</h2>
              <p>Round {game.round}</p>
              <p>Pick the answer you think is the TRUE one:</p>
              
              <div className="answers-list">
                {game.orderedAnswers.map((answer, idx) => {
                  const isMyAnswer = mySubmission && answer.id === mySubmission.id
                  return (
                    <button
                      key={answer.id}
                      className={`answer-button ${isMyAnswer ? 'my-answer' : ''}`}
                      onClick={() => !isMyAnswer && selectAnswer(answer.id)}
                      disabled={isMyAnswer}
                    >
                      <span className="answer-number">{idx + 1}.</span>
                      <span className="answer-text">...{answer.ending}</span>
                      {isMyAnswer && <span className="my-badge">YOURS</span>}
                    </button>
                  )
                })}
              </div>

              <div className="timer">
                Time: {30 - Math.floor((Date.now() - game.phaseStartTime) / 1000)}s
              </div>
            </div>
          </div>
        )
      } else {
        return (
          <div className="app">
            <div className="container">
              <h2>Waiting for Players</h2>
              <p>Round {game.round}</p>
              <p>
                {hasChosen ? 
                  `Waiting for others... (${chooserPlayer?.emoji} ${chooserPlayer?.nickname} is choosing)` :
                  `${chooserPlayer?.emoji} ${chooserPlayer?.nickname} is choosing...`
                }
              </p>
              
              <div className="answers-list">
                {game.orderedAnswers.map((answer, idx) => (
                  <div key={answer.id} className="answer-item">
                    <span className="answer-number">{idx + 1}.</span>
                    <span className="answer-text">...{answer.ending}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      }
    }

    if (currentPhase === 'reveal') {
      return (
        <div className="app">
          <div className="container">
            <h2>Results</h2>
            <p>Round {game.round}</p>
            
            <div className="phrase-card">
              <p className="first-half">{game.selectedPhrase.firstHalf}</p>
              <p className="true-ending highlight">...{game.selectedPhrase.trueEnding}</p>
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
                {isReader && (
                  <button onClick={endGame} className="primary-btn">
                    End Game
                  </button>
                )}
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
