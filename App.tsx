
import React, { useState, useEffect } from 'react';
import { StartScreen } from './components/StartScreen';
import { GameRound } from './components/GameRound';
import { RoundResult } from './components/RoundResult';
import { LoadingScreen } from './components/LoadingScreen';
import { validateAnswers } from './services/geminiService';
import { GameStatus, GameInputs, ValidationResult, GameMode, PlayerProfile } from './types';
import { useMultiplayer } from './hooks/useMultiplayer';

// prettier-ignore
const ALPHABET = "ABCDEFGHIJKLMNOPRSTW"; 

const TOTAL_ROUNDS = 5;

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>('MENU');
  const [gameMode, setGameMode] = useState<GameMode>('SINGLE');
  const [duration, setDuration] = useState(60);
  
  // User Identity
  const [userProfile, setUserProfile] = useState<PlayerProfile>({ name: 'Player', avatar: '🐶' });
  const [opponentProfile, setOpponentProfile] = useState<PlayerProfile | null>(null);

  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentLetter, setCurrentLetter] = useState('');
  
  // My current round state
  const [lastInputs, setLastInputs] = useState<GameInputs | null>(null);
  const [lastValidation, setLastValidation] = useState<ValidationResult | null>(null);

  // Opponent current round state
  const [opponentInputs, setOpponentInputs] = useState<GameInputs | null>(null);
  const [opponentValidation, setOpponentValidation] = useState<ValidationResult | null>(null);
  
  // Multiplayer specific state
  const [roundLetters, setRoundLetters] = useState<string[]>([]);

  // Computed final adjusted result for the UI
  const [finalMyResult, setFinalMyResult] = useState<ValidationResult | null>(null);
  const [finalOpponentResult, setFinalOpponentResult] = useState<ValidationResult | null>(null);

  const { 
    peerId, 
    initializePeer, 
    connectToPeer, 
    sendMessage, 
    messages, 
    isConnected,
    clearMessages
  } = useMultiplayer();

  // --- Multiplayer Message Handling ---
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      
      switch (lastMsg.type) {
        case 'JOINED':
          // Host received a join request. 
          // We accept this even if gameMode is 'SINGLE' because we are in the lobby setup phase.
          setOpponentProfile(lastMsg.profile);
          // Send Welcome back so guest knows who host is
          sendMessage({ type: 'WELCOME', profile: userProfile });
          break;

        case 'WELCOME':
          // Guest received welcome from host
          // We accept this if we are trying to join (MULTI_GUEST) or in lobby
          setOpponentProfile(lastMsg.profile);
          break;

        case 'START_ROUND':
          if (gameMode === 'MULTI_GUEST') {
            setDuration(lastMsg.duration);
            setCurrentRoundIndex(lastMsg.roundIndex);
            setCurrentLetter(lastMsg.letter);
            startNewRoundCleanup();
            setStatus('COUNTDOWN');
            setTimeout(() => setStatus('PLAYING'), 2000);
          }
          break;
        case 'SUBMIT_ANSWERS':
          // Only accept if it matches current round index
          if (lastMsg.roundIndex === currentRoundIndex) {
            setOpponentInputs(lastMsg.inputs);
            setOpponentValidation(lastMsg.validation);
          }
          break;
        case 'GAME_OVER':
          setStatus('GAME_OVER');
          break;
      }
    }
  }, [messages, gameMode, currentRoundIndex, userProfile]);

  // --- Trigger handshake on connection ---
  useEffect(() => {
    if (isConnected && gameMode === 'MULTI_GUEST') {
      // Send my profile to host immediately upon connection
      sendMessage({ type: 'JOINED', profile: userProfile });
    }
  }, [isConnected, gameMode]); // Removing userProfile from dep array to avoid loops

  // --- Score Calculation & Collision Logic ---
  useEffect(() => {
    if (gameMode === 'SINGLE') {
      if (lastValidation) {
        setFinalMyResult(lastValidation);
      }
      return;
    }

    // Multiplayer Logic: Wait until both have submitted
    if (lastValidation && lastInputs && opponentValidation && opponentInputs) {
      const myRes = JSON.parse(JSON.stringify(lastValidation)); // Deep copy
      const oppRes = JSON.parse(JSON.stringify(opponentValidation)); // Deep copy

      let myRoundScore = 0;
      let oppRoundScore = 0;

      const keys: (keyof GameInputs)[] = ['name', 'place', 'animal', 'thing'];

      keys.forEach(key => {
        // Basic scores from Gemini
        let myScore = myRes[key].score;
        let oppScore = oppRes[key].score;
        let myMsg = myRes[key].message;
        let oppMsg = oppRes[key].message;

        // Check for collision (same answer)
        const myWord = lastInputs[key].trim().toLowerCase();
        const oppWord = opponentInputs[key].trim().toLowerCase();

        if (myScore > 0 && oppScore > 0 && myWord === oppWord && myWord !== '') {
          myScore = 5;
          oppScore = 5;
          myMsg = "Same answer as opponent! (5pts)";
          oppMsg = "Same answer! (5pts)";
          
          // Update messages in the result object
          myRes[key].message = myMsg;
          myRes[key].score = myScore;
        }

        myRoundScore += myScore;
        oppRoundScore += oppScore;
      });

      myRes.totalRoundScore = myRoundScore;
      oppRes.totalRoundScore = oppRoundScore;

      setFinalMyResult(myRes);
      setFinalOpponentResult(oppRes);
    }
  }, [lastValidation, lastInputs, opponentValidation, opponentInputs, gameMode]);

  // Track History of Scores
  const [scoresHistory, setScoresHistory] = useState<{my: number, opp: number}[]>([]);

  useEffect(() => {
     if (finalMyResult && (gameMode === 'SINGLE' || finalOpponentResult)) {
        // Only update history if we haven't recorded this round yet
        if (scoresHistory.length === currentRoundIndex) {
           const myScore = finalMyResult.totalRoundScore;
           const oppScore = gameMode === 'SINGLE' ? 0 : (finalOpponentResult?.totalRoundScore || 0);
           setScoresHistory(prev => [...prev, { my: myScore, opp: oppScore }]);
        }
     }
  }, [finalMyResult, finalOpponentResult, currentRoundIndex, scoresHistory.length, gameMode]);

  const currentTotalMyScore = scoresHistory.reduce((acc, curr) => acc + curr.my, 0);
  const currentTotalOppScore = scoresHistory.reduce((acc, curr) => acc + curr.opp, 0);


  const startGameSingle = (selectedDuration: number) => {
    setGameMode('SINGLE');
    setDuration(selectedDuration);
    resetGame();
    startRound();
  };

  const startHostGame = (selectedDuration: number) => {
    if (!isConnected || !opponentProfile) return; // Prevent crash if no one joined
    setGameMode('MULTI_HOST');
    setDuration(selectedDuration);
    
    // We manually reset game variables here to avoid race conditions with state updates
    setScoresHistory([]);
    setCurrentRoundIndex(0);
    setRoundLetters([]);
    startNewRoundCleanup();

    // Pass true to indicate we are forcefully starting as host
    // and pass the initial round index (0) explicitly
    startRound(true, 0);
  };

  const joinGame = (roomId: string) => {
    setGameMode('MULTI_GUEST');
    initializePeer();
    connectToPeer(roomId);
  };

  const resetGame = () => {
    setScoresHistory([]);
    setCurrentRoundIndex(0);
    setRoundLetters([]);
    startNewRoundCleanup();
  };

  const startNewRoundCleanup = () => {
    setLastInputs(null);
    setLastValidation(null);
    setOpponentInputs(null);
    setOpponentValidation(null);
    setFinalMyResult(null);
    setFinalOpponentResult(null);
  };

  const startRound = (isForceHost = false, explicitRoundIndex?: number) => {
    let letter = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    // Simple retry to avoid duplicates
    let attempts = 0;
    while (roundLetters.includes(letter) && attempts < 50) {
       letter = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
       attempts++;
    }
    
    setRoundLetters(prev => [...prev, letter]);
    setCurrentLetter(letter);
    startNewRoundCleanup();
    setStatus('COUNTDOWN');

    // Determine the round index to send (use explicit if provided, else current state)
    const roundIdxToSend = explicitRoundIndex !== undefined ? explicitRoundIndex : currentRoundIndex;

    // Check if we are hosting (either via state or force flag)
    if (gameMode === 'MULTI_HOST' || isForceHost) {
      sendMessage({
        type: 'START_ROUND',
        letter,
        roundIndex: roundIdxToSend,
        totalRounds: TOTAL_ROUNDS,
        duration: duration
      });
    }
    
    setTimeout(() => {
      setStatus('PLAYING');
    }, 2000);
  };

  const handleRoundSubmit = async (inputs: GameInputs) => {
    setStatus('VALIDATING');
    setLastInputs(inputs);

    const result = await validateAnswers(currentLetter, inputs);
    setLastValidation(result);

    if (gameMode !== 'SINGLE') {
      sendMessage({
        type: 'SUBMIT_ANSWERS',
        inputs: inputs,
        validation: result,
        roundIndex: currentRoundIndex
      });
    }

    setStatus('ROUND_RESULT');
  };

  const handleNext = () => {
    if (currentRoundIndex < TOTAL_ROUNDS - 1) {
      // Increment locally
      const nextIndex = currentRoundIndex + 1;
      setCurrentRoundIndex(nextIndex);
      
      // Start next round (passing undefined for forcedHost as state should be updated by now, and explicit index)
      // Actually we can rely on state now as this is user triggered well after mount
      // But to be safe in multiplayer sync, we just call startRound() which uses state.
      // Wait, startRound uses currentRoundIndex state. React state update is async.
      // We must pass the NEXT index explicitly to startRound to ensure the message is correct.
      
      // But we can't pass 'nextIndex' to startRound easily without refactoring startRound logic completely
      // because startRound generates the letter and sends the message.
      
      // Better approach for Next Round:
      // 1. Update state
      // 2. Use useEffect to trigger startRound? No, user click.
      
      // Let's modify startRound to use a "nextIndex" param if provided, otherwise use state.
      startRound(false, nextIndex);
    } else {
      setStatus('GAME_OVER');
      if (gameMode === 'MULTI_HOST') {
        sendMessage({ type: 'GAME_OVER' });
      }
    }
  };

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col overflow-hidden">
      {/* Top Bar for Global State */}
      {status !== 'MENU' && (
        <div className="bg-white border-b border-slate-200 p-4 flex justify-between items-center shadow-sm z-10">
           <div className="font-bold text-slate-600 text-xs md:text-base flex items-center gap-2">
             <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md">Round {currentRoundIndex + 1} / {TOTAL_ROUNDS}</span>
           </div>
           
           <div className="flex gap-4 md:gap-8">
             <div className="flex items-center gap-2">
               <span className="text-xl">{userProfile.avatar}</span>
               <div className="flex flex-col items-end">
                 <span className="text-xs font-bold text-slate-400 uppercase">You</span>
                 <span className="font-black text-slate-800 text-lg leading-none">{currentTotalMyScore}</span>
               </div>
             </div>
             {gameMode !== 'SINGLE' && opponentProfile && (
               <div className="flex items-center gap-2">
                 <div className="flex flex-col items-start">
                   <span className="text-xs font-bold text-slate-400 uppercase">{opponentProfile.name}</span>
                   <span className="font-black text-slate-800 text-lg leading-none">{currentTotalOppScore}</span>
                 </div>
                 <span className="text-xl">{opponentProfile.avatar}</span>
               </div>
             )}
           </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-grow relative overflow-hidden">
        {status === 'MENU' && (
          <StartScreen 
            onStartSingle={startGameSingle}
            onHostGame={startHostGame}
            onJoinGame={joinGame}
            myPeerId={peerId}
            isMultiplayerConnected={isConnected}
            onInitMultiplayer={initializePeer}
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            opponentProfile={opponentProfile}
          />
        )}

        {status === 'COUNTDOWN' && (
          <div className="absolute inset-0 flex items-center justify-center bg-indigo-600 z-50">
            <div className="text-center animate-pop-in">
              <p className="text-white/80 text-2xl font-bold mb-4">Letter for this round</p>
              <div className="text-9xl font-black text-white drop-shadow-2xl">
                {currentLetter}
              </div>
            </div>
          </div>
        )}

        {status === 'PLAYING' && (
          <GameRound letter={currentLetter} duration={duration} onSubmit={handleRoundSubmit} />
        )}

        {status === 'VALIDATING' && <LoadingScreen />}

        {status === 'ROUND_RESULT' && lastInputs && (
           <>
             {/* If single player, or if multiplayer AND we have calculated final results */}
             {(gameMode === 'SINGLE' && finalMyResult) || (gameMode !== 'SINGLE' && finalMyResult && finalOpponentResult) ? (
                <RoundResult 
                  inputs={lastInputs} 
                  validation={finalMyResult!} 
                  onNextRound={handleNext} 
                  isLastRound={currentRoundIndex === TOTAL_ROUNDS - 1}
                  isMultiplayer={gameMode !== 'SINGLE'}
                  opponentScore={finalOpponentResult?.totalRoundScore}
                  isHost={gameMode !== 'MULTI_GUEST'}
                />
             ) : (
               <div className="flex flex-col items-center justify-center h-full animate-pop-in">
                  <div className="text-6xl mb-4 animate-bounce">{opponentProfile?.avatar || '👤'}</div>
                  <h2 className="text-2xl font-bold text-slate-700">Waiting for {opponentProfile?.name || 'Opponent'}...</h2>
                  <p className="text-slate-500 mt-2">The scores will be revealed once both players submit.</p>
               </div>
             )}
           </>
        )}

        {status === 'GAME_OVER' && (
          <div className="flex flex-col items-center justify-center h-full p-8 animate-pop-in text-center">
             <div className="text-6xl mb-6">🏆</div>
             <h1 className="text-4xl font-black text-slate-800 mb-2">Game Over!</h1>
             
             <div className="flex gap-8 justify-center mt-8">
               <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 min-w-[140px]">
                  <div className="text-4xl mb-2">{userProfile.avatar}</div>
                  <p className="text-slate-500 text-sm font-bold uppercase mb-1">You</p>
                  <div className="text-5xl font-black text-indigo-600">
                    {currentTotalMyScore}
                  </div>
               </div>
               {gameMode !== 'SINGLE' && opponentProfile && (
                 <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 min-w-[140px]">
                    <div className="text-4xl mb-2">{opponentProfile.avatar}</div>
                    <p className="text-slate-500 text-sm font-bold uppercase mb-1">{opponentProfile.name}</p>
                    <div className="text-5xl font-black text-pink-500">
                      {currentTotalOppScore}
                    </div>
                 </div>
               )}
             </div>

             {gameMode !== 'SINGLE' && (
                <div className="mt-8 text-3xl font-black">
                  {currentTotalMyScore > currentTotalOppScore ? (
                    <span className="text-green-500 drop-shadow-sm">You Won! 🎉</span>
                  ) : currentTotalMyScore < currentTotalOppScore ? (
                    <span className="text-red-500 drop-shadow-sm">You Lost 😔</span>
                  ) : (
                    <span className="text-slate-500">It's a Tie! 🤝</span>
                  )}
                </div>
             )}

             <button
              onClick={() => {
                setOpponentProfile(null);
                setOpponentInputs(null);
                setOpponentValidation(null);
                setStatus('MENU');
              }}
              className="mt-12 bg-slate-800 hover:bg-slate-900 text-white text-xl font-bold py-4 px-10 rounded-full shadow-lg transition-transform hover:scale-105"
             >
               Main Menu
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
