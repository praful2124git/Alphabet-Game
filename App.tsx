
import React, { useState, useEffect } from 'react';
import { StartScreen } from './components/StartScreen';
import { GameRound } from './components/GameRound';
import { RoundResult } from './components/RoundResult';
import { LoadingScreen } from './components/LoadingScreen';
import { validateAnswers } from './services/geminiService';
import { GameStatus, GameInputs, ValidationResult, GameMode, PlayerProfile, ChatMessage } from './types';
import { useMultiplayer } from './hooks/useMultiplayer';
import { playSound } from './utils/sound';

// prettier-ignore
const ALPHABET = "ABCDEFGHIJKLMNOPRSTW"; 

const App: React.FC = () => {
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [status, setStatus] = useState<GameStatus>('MENU');
  const [gameMode, setGameMode] = useState<GameMode>('SINGLE');
  const [duration, setDuration] = useState(60);
  const [totalRounds, setTotalRounds] = useState(5);
  
  // User Identity
  const [userProfile, setUserProfile] = useState<PlayerProfile>({ name: 'Player', avatar: '🐶' });
  const [opponentProfile, setOpponentProfile] = useState<PlayerProfile | null>(null);

  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentLetter, setCurrentLetter] = useState('');
  
  // My current round state
  const [lastInputs, setLastInputs] = useState<GameInputs | null>(null);
  const [lastValidation, setLastValidation] = useState<ValidationResult | null>(null);
  const [forceSubmit, setForceSubmit] = useState(false);

  // Opponent current round state
  const [opponentInputs, setOpponentInputs] = useState<GameInputs | null>(null);
  const [opponentValidation, setOpponentValidation] = useState<ValidationResult | null>(null);
  
  // Multiplayer specific state
  const [roundLetters, setRoundLetters] = useState<string[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

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

  // --- Theme Toggle Logic ---
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // --- Multiplayer Message Handling ---
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      
      switch (lastMsg.type) {
        case 'JOINED':
          setOpponentProfile(lastMsg.profile);
          sendMessage({ type: 'WELCOME', profile: userProfile });
          playSound('joined');
          break;

        case 'WELCOME':
          setOpponentProfile(lastMsg.profile);
          playSound('joined');
          break;

        case 'START_ROUND':
          if (gameMode === 'MULTI_GUEST') {
            setDuration(lastMsg.duration);
            setTotalRounds(lastMsg.totalRounds);
            setCurrentRoundIndex(lastMsg.roundIndex);
            setCurrentLetter(lastMsg.letter);
            startNewRoundCleanup();
            setStatus('COUNTDOWN');
            setTimeout(() => setStatus('PLAYING'), 2000);
          }
          break;

        case 'STOP_ROUND':
          // Opponent hit stop. Force submit my answers immediately.
          if (status === 'PLAYING') {
            setForceSubmit(true);
          }
          break;

        case 'SUBMIT_ANSWERS':
          if (lastMsg.roundIndex === currentRoundIndex) {
            setOpponentInputs(lastMsg.inputs);
            setOpponentValidation(lastMsg.validation);
          }
          break;
        
        case 'CHAT_MESSAGE':
          setChatHistory(prev => [...prev, {
            id: Date.now().toString() + Math.random(),
            text: lastMsg.text,
            sender: lastMsg.senderName,
            isMe: false,
            timestamp: Date.now()
          }]);
          break;

        case 'GAME_OVER':
          setStatus('GAME_OVER');
          break;
      }
    }
  }, [messages, gameMode, currentRoundIndex, userProfile, status]);

  // --- Trigger handshake on connection ---
  useEffect(() => {
    if (isConnected && gameMode === 'MULTI_GUEST') {
      sendMessage({ type: 'JOINED', profile: userProfile });
    }
  }, [isConnected, gameMode]);

  // --- Score Calculation & Collision Logic ---
  useEffect(() => {
    if (gameMode === 'SINGLE') {
      if (lastValidation) {
        setFinalMyResult(lastValidation);
      }
      return;
    }

    if (lastValidation && lastInputs && opponentValidation && opponentInputs) {
      const myRes = JSON.parse(JSON.stringify(lastValidation));
      const oppRes = JSON.parse(JSON.stringify(opponentValidation));

      let myRoundScore = 0;
      let oppRoundScore = 0;

      const keys: (keyof GameInputs)[] = ['name', 'place', 'animal', 'thing'];

      keys.forEach(key => {
        let myScore = myRes[key].score;
        let oppScore = oppRes[key].score;
        let myMsg = myRes[key].message;
        let oppMsg = oppRes[key].message;

        const myWord = lastInputs[key].trim().toLowerCase();
        const oppWord = opponentInputs[key].trim().toLowerCase();

        if (myScore > 0 && oppScore > 0 && myWord === oppWord && myWord !== '') {
          myScore = 5;
          oppScore = 5;
          myMsg = "Same answer as opponent! (5pts)";
          oppMsg = "Same answer! (5pts)";
          
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

  // Track History
  const [scoresHistory, setScoresHistory] = useState<{my: number, opp: number}[]>([]);

  useEffect(() => {
     if (finalMyResult && (gameMode === 'SINGLE' || finalOpponentResult)) {
        if (scoresHistory.length === currentRoundIndex) {
           const myScore = finalMyResult.totalRoundScore;
           const oppScore = gameMode === 'SINGLE' ? 0 : (finalOpponentResult?.totalRoundScore || 0);
           setScoresHistory(prev => [...prev, { my: myScore, opp: oppScore }]);
        }
     }
  }, [finalMyResult, finalOpponentResult, currentRoundIndex, scoresHistory.length, gameMode]);

  const currentTotalMyScore = scoresHistory.reduce((acc, curr) => acc + curr.my, 0);
  const currentTotalOppScore = scoresHistory.reduce((acc, curr) => acc + curr.opp, 0);

  const startGameSingle = (selectedDuration: number, selectedRounds: number) => {
    setGameMode('SINGLE');
    setDuration(selectedDuration);
    setTotalRounds(selectedRounds);
    resetGame();
    startRound(false, 0, selectedRounds);
  };

  const startHostGame = (selectedDuration: number, selectedRounds: number) => {
    if (!isConnected || !opponentProfile) return;
    setGameMode('MULTI_HOST');
    setDuration(selectedDuration);
    setTotalRounds(selectedRounds);
    setScoresHistory([]);
    setCurrentRoundIndex(0);
    setRoundLetters([]);
    setChatHistory([]);
    startNewRoundCleanup();
    startRound(true, 0, selectedRounds);
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
    setChatHistory([]);
    startNewRoundCleanup();
  };

  const startNewRoundCleanup = () => {
    setLastInputs(null);
    setLastValidation(null);
    setOpponentInputs(null);
    setOpponentValidation(null);
    setFinalMyResult(null);
    setFinalOpponentResult(null);
    setForceSubmit(false);
  };

  const startRound = (isForceHost = false, explicitRoundIndex?: number, explicitTotalRounds?: number) => {
    let letter = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    let attempts = 0;
    while (roundLetters.includes(letter) && attempts < 50) {
       letter = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
       attempts++;
    }
    
    setRoundLetters(prev => [...prev, letter]);
    setCurrentLetter(letter);
    startNewRoundCleanup();
    setStatus('COUNTDOWN');

    const roundIdxToSend = explicitRoundIndex !== undefined ? explicitRoundIndex : currentRoundIndex;
    const roundsToSend = explicitTotalRounds !== undefined ? explicitTotalRounds : totalRounds;

    if (gameMode === 'MULTI_HOST' || isForceHost) {
      sendMessage({
        type: 'START_ROUND',
        letter,
        roundIndex: roundIdxToSend,
        totalRounds: roundsToSend,
        duration: duration
      });
    }
    
    setTimeout(() => {
      setStatus('PLAYING');
    }, 2000);
  };

  // Called when this user stops the game manually (clicks Stop button)
  const handleManualStop = () => {
    if (gameMode !== 'SINGLE') {
      sendMessage({ type: 'STOP_ROUND' });
    }
  };

  const handleRoundSubmit = async (inputs: GameInputs) => {
    playSound('submit');
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

  const handleSendChatMessage = (text: string) => {
    if (!text.trim()) return;
    const msg: ChatMessage = {
      id: Date.now().toString() + Math.random(),
      text: text,
      sender: userProfile.name,
      isMe: true,
      timestamp: Date.now()
    };
    setChatHistory(prev => [...prev, msg]);
    sendMessage({ type: 'CHAT_MESSAGE', text, senderName: userProfile.name });
  };

  const handleNext = () => {
    if (currentRoundIndex < totalRounds - 1) {
      const nextIndex = currentRoundIndex + 1;
      setCurrentRoundIndex(nextIndex);
      startRound(false, nextIndex);
    } else {
      setStatus('GAME_OVER');
      if (gameMode === 'MULTI_HOST') {
        sendMessage({ type: 'GAME_OVER' });
      }
    }
  };

  return (
    <div className="h-screen w-full bg-stone-50 dark:bg-stone-950 flex flex-col overflow-hidden transition-colors duration-300">
      
      {/* Top Bar for Global State */}
      {status !== 'MENU' && (
        <div className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 p-4 flex justify-between items-center shadow-sm z-10">
           <div className="font-bold text-stone-600 dark:text-stone-300 text-xs md:text-base flex items-center gap-2">
             <span className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-1 rounded-md">Round {currentRoundIndex + 1} / {totalRounds}</span>
           </div>
           
           <div className="flex gap-4 md:gap-8">
             <div className="flex items-center gap-2">
               <span className="text-xl">{userProfile.avatar}</span>
               <div className="flex flex-col items-end">
                 <span className="text-xs font-bold text-stone-400 uppercase">You</span>
                 <span className="font-black text-stone-800 dark:text-stone-100 text-lg leading-none">{currentTotalMyScore}</span>
               </div>
             </div>
             {gameMode !== 'SINGLE' && opponentProfile && (
               <div className="flex items-center gap-2">
                 <div className="flex flex-col items-start">
                   <span className="text-xs font-bold text-stone-400 uppercase">{opponentProfile.name}</span>
                   <span className="font-black text-stone-800 dark:text-stone-100 text-lg leading-none">{currentTotalOppScore}</span>
                 </div>
                 <span className="text-xl">{opponentProfile.avatar}</span>
               </div>
             )}
           </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-grow relative overflow-hidden flex flex-col">
        
        {/* Theme Toggle Button (Visible in Menu or Corner) */}
        <button 
          onClick={toggleTheme}
          className="absolute top-4 right-4 z-50 p-2 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:scale-110 transition-all shadow-md"
          title="Toggle Theme"
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>

        <div className="flex-grow overflow-hidden relative">
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
            <div className="absolute inset-0 flex items-center justify-center bg-orange-600 dark:bg-orange-700 z-50">
              <div className="text-center animate-pop-in">
                <p className="text-white/80 text-2xl font-bold mb-4">Letter for this round</p>
                <div className="text-9xl font-black text-white drop-shadow-2xl">
                  {currentLetter}
                </div>
              </div>
            </div>
          )}

          {status === 'PLAYING' && (
            <GameRound 
              letter={currentLetter} 
              duration={duration} 
              onSubmit={handleRoundSubmit} 
              onManualStop={handleManualStop}
              forceSubmit={forceSubmit}
            />
          )}

          {status === 'VALIDATING' && <LoadingScreen />}

          {status === 'ROUND_RESULT' && lastInputs && (
             <>
               {(gameMode === 'SINGLE' && finalMyResult) || (gameMode !== 'SINGLE' && finalMyResult && finalOpponentResult) ? (
                  <RoundResult 
                    inputs={lastInputs} 
                    validation={finalMyResult!} 
                    onNextRound={handleNext} 
                    isLastRound={currentRoundIndex === totalRounds - 1}
                    isMultiplayer={gameMode !== 'SINGLE'}
                    opponentScore={finalOpponentResult?.totalRoundScore}
                    isHost={gameMode !== 'MULTI_GUEST'}
                    chatMessages={chatHistory}
                    onSendMessage={handleSendChatMessage}
                  />
               ) : (
                 <div className="flex flex-col items-center justify-center h-full animate-pop-in">
                    <div className="text-6xl mb-4 animate-bounce">{opponentProfile?.avatar || '👤'}</div>
                    <h2 className="text-2xl font-bold text-stone-700 dark:text-stone-200">Waiting for {opponentProfile?.name || 'Opponent'}...</h2>
                    <p className="text-stone-500 dark:text-stone-400 mt-2">The scores will be revealed once both players submit.</p>
                 </div>
               )}
             </>
          )}

          {status === 'GAME_OVER' && (
            <div className="flex flex-col items-center justify-center h-full p-8 animate-pop-in text-center text-stone-800 dark:text-stone-100">
               <div className="text-6xl mb-6">🏆</div>
               <h1 className="text-4xl font-black mb-2">Game Over!</h1>
               
               <div className="flex gap-8 justify-center mt-8">
                 <div className="bg-matte-card p-6 rounded-2xl shadow-md border border-stone-600 min-w-[140px]">
                    <div className="text-4xl mb-2">{userProfile.avatar}</div>
                    <p className="text-stone-300 text-sm font-bold uppercase mb-1">You</p>
                    <div className="text-5xl font-black text-orange-400">
                      {currentTotalMyScore}
                    </div>
                 </div>
                 {gameMode !== 'SINGLE' && opponentProfile && (
                   <div className="bg-matte-card p-6 rounded-2xl shadow-md border border-stone-600 min-w-[140px]">
                      <div className="text-4xl mb-2">{opponentProfile.avatar}</div>
                      <p className="text-stone-300 text-sm font-bold uppercase mb-1">{opponentProfile.name}</p>
                      <div className="text-5xl font-black text-white">
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
                      <span className="text-stone-500">It's a Tie! 🤝</span>
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
                className="mt-12 bg-stone-800 dark:bg-stone-700 hover:bg-stone-900 dark:hover:bg-stone-600 text-white text-xl font-bold py-4 px-10 rounded-full shadow-lg transition-transform hover:scale-105"
               >
                 Main Menu
               </button>
            </div>
          )}
        </div>
        
        {/* Copyright Footer */}
        <div className="bg-stone-100 dark:bg-stone-900 py-2 text-center text-xs text-stone-400 dark:text-stone-500 border-t border-stone-200 dark:border-stone-800">
          Developed by <span className="font-bold text-stone-600 dark:text-stone-400">Praful Kumar</span>
        </div>
      </div>
    </div>
  );
};

export default App;
