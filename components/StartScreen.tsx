import React, { useState, useEffect } from 'react';

interface StartScreenProps {
  onStartSingle: (duration: number) => void;
  onHostGame: (duration: number) => void;
  onJoinGame: (roomId: string) => void;
  myPeerId: string;
  isMultiplayerConnected: boolean;
  onInitMultiplayer: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ 
  onStartSingle, 
  onHostGame, 
  onJoinGame,
  myPeerId,
  isMultiplayerConnected,
  onInitMultiplayer
}) => {
  const [mode, setMode] = useState<'SINGLE' | 'MULTI'>('SINGLE');
  const [multiMode, setMultiMode] = useState<'HOST' | 'JOIN'>('HOST');
  const [duration, setDuration] = useState(60);
  const [joinId, setJoinId] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (mode === 'MULTI' && !myPeerId) {
      onInitMultiplayer();
    }
  }, [mode, myPeerId, onInitMultiplayer]);

  // Extract the display code (remove prefix)
  const displayCode = myPeerId ? myPeerId.split('npat-game-')[1] : '';

  const copyToClipboard = () => {
    if (!displayCode) return;
    navigator.clipboard.writeText(displayCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and max 4 digits
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setJoinId(val);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 text-center animate-pop-in overflow-y-auto">
      <div className="mb-6 mt-4">
        <h1 className="text-5xl font-black text-indigo-600 mb-2 drop-shadow-sm tracking-tight">
          Name Place <br/> <span className="text-pink-500">Animal Thing</span>
        </h1>
        <p className="text-slate-500 text-lg font-medium">Classic AI Word Game</p>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-xl max-w-md w-full border-2 border-slate-100 flex flex-col gap-6">
        
        {/* Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button 
            onClick={() => setMode('SINGLE')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'SINGLE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Single Player
          </button>
          <button 
            onClick={() => setMode('MULTI')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'MULTI' ? 'bg-white text-pink-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Multiplayer
          </button>
        </div>

        {mode === 'SINGLE' && (
          <div className="space-y-6 animate-pop-in">
             <div className="text-left">
               <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Timer Duration</label>
               <div className="flex items-center gap-4">
                 <input 
                    type="range" 
                    min="30" 
                    max="180" 
                    step="10"
                    value={duration} 
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                 />
                 <span className="text-xl font-bold text-indigo-600 w-16 text-right">{duration}s</span>
               </div>
             </div>

             <button
              onClick={() => onStartSingle(duration)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xl font-bold py-4 px-8 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-200"
            >
              Start Game
            </button>
          </div>
        )}

        {mode === 'MULTI' && (
          <div className="space-y-6 animate-pop-in">
             <div className="flex gap-2 justify-center mb-2">
                <button 
                  onClick={() => setMultiMode('HOST')}
                  className={`px-4 py-1 rounded-full text-xs font-bold border ${multiMode === 'HOST' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-transparent border-transparent text-slate-400'}`}
                >
                  Host a Room
                </button>
                <button 
                  onClick={() => setMultiMode('JOIN')}
                  className={`px-4 py-1 rounded-full text-xs font-bold border ${multiMode === 'JOIN' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-transparent border-transparent text-slate-400'}`}
                >
                  Join a Room
                </button>
             </div>

             {multiMode === 'HOST' && (
               <div className="space-y-4">
                  <div className="text-left">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Timer Duration</label>
                    <div className="flex items-center gap-4">
                      <input 
                          type="range" 
                          min="30" 
                          max="180" 
                          step="10"
                          value={duration} 
                          onChange={(e) => setDuration(Number(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <span className="text-xl font-bold text-indigo-600 w-16 text-right">{duration}s</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block text-center">Your Room Code</label>
                    {displayCode ? (
                      <div 
                        onClick={copyToClipboard}
                        className="text-4xl font-mono font-black text-slate-800 tracking-widest cursor-pointer hover:bg-slate-100 p-2 rounded transition-colors text-center relative"
                      >
                        {displayCode}
                        {copied && <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded font-sans tracking-normal">Copied!</span>}
                      </div>
                    ) : (
                      <div className="animate-pulse text-slate-400 font-bold">Generating Code...</div>
                    )}
                    <p className="text-xs text-slate-400 mt-2 text-center">Share this code with your friend</p>
                  </div>

                  {isMultiplayerConnected ? (
                    <button
                      onClick={() => onHostGame(duration)}
                      className="w-full bg-green-500 hover:bg-green-600 text-white text-lg font-bold py-3 px-8 rounded-2xl animate-pulse shadow-lg shadow-green-200"
                    >
                      Player Joined! Start Game
                    </button>
                  ) : (
                    <div className="text-slate-400 text-sm font-medium italic py-2">
                      Waiting for player to join...
                    </div>
                  )}
               </div>
             )}

             {multiMode === 'JOIN' && (
               <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block text-left">Room Code</label>
                    <input
                      type="text"
                      value={joinId}
                      onChange={handleJoinIdChange}
                      placeholder="Enter 4-digit code"
                      maxLength={4}
                      className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-mono font-black text-3xl tracking-widest focus:border-indigo-500 outline-none text-center placeholder:text-slate-300 placeholder:text-xl placeholder:tracking-normal placeholder:font-sans"
                    />
                  </div>
                  
                  <button
                    onClick={() => onJoinGame(joinId)}
                    disabled={joinId.length !== 4 || isMultiplayerConnected}
                    className={`w-full text-white text-lg font-bold py-3 px-8 rounded-2xl shadow-lg transition-all ${joinId.length !== 4 || isMultiplayerConnected ? 'bg-slate-300 cursor-not-allowed' : 'bg-pink-500 hover:bg-pink-600 shadow-pink-200'}`}
                  >
                    {isMultiplayerConnected ? "Connected! Waiting for host..." : "Join Room"}
                  </button>
               </div>
             )}
          </div>
        )}

      </div>
    </div>
  );
};