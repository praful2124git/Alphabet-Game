
import React, { useState, useEffect } from 'react';
import { PlayerProfile } from '../types';

interface StartScreenProps {
  onStartSingle: (duration: number, rounds: number) => void;
  onHostGame: (duration: number, rounds: number) => void;
  onJoinGame: (roomId: string) => void;
  myPeerId: string;
  isMultiplayerConnected: boolean;
  onInitMultiplayer: () => void;
  userProfile: PlayerProfile;
  setUserProfile: (p: PlayerProfile) => void;
  opponentProfile: PlayerProfile | null;
}

const AVATARS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🦄', '🐙', '🦋', '🤖', '👽', '👻'];

// The user's custom logo URL
const LOGO_URL = "components/LogoAlphabet.png";

// Fallback SVG that mimics the user's custom logo design (4 colored quadrants)
const GameLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 200" className={`${className} rounded-full shadow-2xl border-4 border-white dark:border-stone-700 bg-stone-100`} xmlns="http://www.w3.org/2000/svg">
    {/* Top Left - Red - Name/Brain */}
    <path d="M100,100 L0,100 A100,100 0 0,1 100,0 Z" fill="#9f1239" />
    <text x="50" y="70" fontSize="50" textAnchor="middle" dominantBaseline="middle">🧠</text>

    {/* Top Right - Yellow/Gold - Place */}
    <path d="M100,100 L100,0 A100,100 0 0,1 200,100 Z" fill="#ca8a04" />
    <text x="150" y="70" fontSize="50" textAnchor="middle" dominantBaseline="middle">🌍</text>

    {/* Bottom Left - Green - Animal */}
    <path d="M100,100 L100,200 A100,100 0 0,1 0,100 Z" fill="#15803d" />
    <text x="50" y="170" fontSize="50" textAnchor="middle" dominantBaseline="middle">🦁</text>

    {/* Bottom Right - Orange - Thing/Note */}
    <path d="M100,100 L200,100 A100,100 0 0,1 100,200 Z" fill="#c2410c" />
    <text x="150" y="170" fontSize="50" textAnchor="middle" dominantBaseline="middle">📝</text>

    {/* Dividers */}
    <line x1="100" y1="0" x2="100" y2="200" stroke="#f5f5f4" strokeWidth="3" />
    <line x1="0" y1="100" x2="200" y2="100" stroke="#f5f5f4" strokeWidth="3" />

    {/* Outer Ring */}
    <circle cx="100" cy="100" r="98" fill="none" stroke="#78350f" strokeWidth="4" opacity="0.3" />

    {/* Center Badge */}
    <g filter="url(#shadow)">
       <rect x="65" y="65" width="70" height="70" rx="15" fill="#f5f5f4" stroke="#d6d3d1" strokeWidth="1" />
       <text x="100" y="102" fontSize="50" fontWeight="900" fill="#ea580c" textAnchor="middle" dominantBaseline="middle" fontFamily="sans-serif">A</text>
    </g>
    
    <defs>
      <filter id="shadow" x="0" y="0" width="200%" height="200%">
        <feOffset result="offOut" in="SourceAlpha" dx="1" dy="2" />
        <feGaussianBlur result="blurOut" in="offOut" stdDeviation="2" />
        <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
      </filter>
    </defs>
  </svg>
);

export const StartScreen: React.FC<StartScreenProps> = ({ 
  onStartSingle, 
  onHostGame, 
  onJoinGame,
  myPeerId,
  isMultiplayerConnected,
  onInitMultiplayer,
  userProfile,
  setUserProfile,
  opponentProfile
}) => {
  const [step, setStep] = useState<'PROFILE' | 'MENU'>('PROFILE');
  const [mode, setMode] = useState<'SINGLE' | 'MULTI'>('SINGLE');
  const [multiMode, setMultiMode] = useState<'HOST' | 'JOIN'>('HOST');
  const [duration, setDuration] = useState(60);
  const [rounds, setRounds] = useState(5);
  const [joinId, setJoinId] = useState('');
  const [copied, setCopied] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempAvatar, setTempAvatar] = useState(AVATARS[0]);
  const [logoError, setLogoError] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    // Listen for PWA install prompt
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    if (mode === 'MULTI' && !myPeerId && step === 'MENU') {
      onInitMultiplayer();
    }
  }, [mode, myPeerId, onInitMultiplayer, step]);

  const displayCode = myPeerId ? myPeerId.split('npat-game-')[1] : '';

  const copyToClipboard = () => {
    if (!displayCode) return;
    navigator.clipboard.writeText(displayCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setJoinId(val);
  };

  const handleProfileSubmit = () => {
    if (!tempName.trim()) return;
    setUserProfile({ name: tempName.trim(), avatar: tempAvatar });
    setStep('MENU');
  };

  const handleInstallClick = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult: any) => {
      setInstallPrompt(null);
    });
  };

  const LogoComponent = () => (
    <>
      {!logoError ? (
        <img 
          src={LOGO_URL} 
          alt="Name Place Animal Thing" 
          onError={() => setLogoError(true)}
          className="w-32 h-32 md:w-40 md:h-40 rounded-full shadow-2xl mb-4 border-4 border-white dark:border-stone-700 object-cover hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <GameLogo className="w-32 h-32 md:w-40 md:h-40 mb-4 hover:scale-105 transition-transform duration-500" />
      )}
    </>
  );

  if (step === 'PROFILE') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center animate-pop-in">
         <div className="mb-6 flex flex-col items-center">
          <LogoComponent />
          <h1 className="text-4xl font-black text-orange-600 dark:text-orange-500 mb-2">Who are you?</h1>
          <p className="text-stone-500 dark:text-stone-400">Create your profile to start playing.</p>
        </div>
        
        <div className="bg-white dark:bg-stone-800 p-6 rounded-3xl shadow-xl max-w-sm w-full border-2 border-stone-100 dark:border-stone-700 flex flex-col gap-6">
          <div>
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 block text-left">Your Name</label>
            <input 
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Enter your name"
              className="w-full p-3 bg-stone-50 dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-700 rounded-xl font-bold text-stone-800 dark:text-stone-100 focus:border-orange-500 outline-none"
              maxLength={12}
            />
          </div>

          <div>
             <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 block text-left">Choose Avatar</label>
             <div className="grid grid-cols-5 gap-2">
                {AVATARS.map(a => (
                  <button 
                    key={a} 
                    onClick={() => setTempAvatar(a)}
                    className={`text-2xl p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-all ${tempAvatar === a ? 'bg-orange-100 dark:bg-orange-900 ring-2 ring-orange-500 transform scale-110' : 'grayscale hover:grayscale-0'}`}
                  >
                    {a}
                  </button>
                ))}
             </div>
          </div>

          <button
            onClick={handleProfileSubmit}
            disabled={!tempName.trim()}
            className={`w-full py-3 rounded-2xl font-bold text-white transition-all shadow-lg ${!tempName.trim() ? 'bg-stone-300 dark:bg-stone-700 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 hover:scale-105'}`}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 text-center animate-pop-in overflow-y-auto">
      <div className="mb-4 mt-2 flex flex-col items-center">
        <LogoComponent />
        <h1 className="text-4xl md:text-5xl font-black text-stone-800 dark:text-stone-100 mb-2 drop-shadow-sm tracking-tight leading-tight hidden md:block">
          Name Place <br/> <span className="text-orange-500">Animal Thing</span>
        </h1>
        <div className="flex items-center justify-center gap-2 mt-2 bg-white/50 dark:bg-stone-800/50 py-1 px-3 rounded-full inline-flex border border-stone-100 dark:border-stone-700">
           <span className="text-2xl">{userProfile.avatar}</span>
           <span className="font-bold text-stone-700 dark:text-stone-200">{userProfile.name}</span>
           <button onClick={() => setStep('PROFILE')} className="text-xs text-orange-600 dark:text-orange-400 font-bold ml-2 hover:underline">Edit</button>
        </div>
      </div>

      <div className="bg-white dark:bg-stone-800 p-6 rounded-3xl shadow-xl max-w-md w-full border-2 border-stone-100 dark:border-stone-700 flex flex-col gap-6">
        
        {/* Tabs */}
        <div className="flex p-1 bg-stone-100 dark:bg-stone-900 rounded-xl">
          <button 
            onClick={() => setMode('SINGLE')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'SINGLE' ? 'bg-white dark:bg-stone-700 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}
          >
            Single Player
          </button>
          <button 
            onClick={() => setMode('MULTI')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'MULTI' ? 'bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-200 shadow-sm' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}
          >
            Multiplayer
          </button>
        </div>

        {mode === 'SINGLE' && (
          <div className="space-y-6 animate-pop-in">
             <div className="text-left space-y-4">
               <div>
                 <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 block">Number of Rounds</label>
                 <div className="flex items-center gap-4">
                   <input 
                      type="range" 
                      min="3" 
                      max="10" 
                      step="1"
                      value={rounds} 
                      onChange={(e) => setRounds(Number(e.target.value))}
                      className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-orange-600"
                   />
                   <span className="text-xl font-bold text-orange-600 dark:text-orange-500 w-16 text-right">{rounds}</span>
                 </div>
               </div>
               
               <div>
                 <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 block">Timer Duration</label>
                 <div className="flex items-center gap-4">
                   <input 
                      type="range" 
                      min="30" 
                      max="180" 
                      step="10"
                      value={duration} 
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-orange-600"
                   />
                   <span className="text-xl font-bold text-orange-600 dark:text-orange-500 w-16 text-right">{duration}s</span>
                 </div>
               </div>
             </div>

             <button
              onClick={() => onStartSingle(duration, rounds)}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white text-xl font-bold py-4 px-8 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-orange-200 dark:shadow-none"
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
                  className={`px-4 py-1 rounded-full text-xs font-bold border ${multiMode === 'HOST' ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400' : 'bg-transparent border-transparent text-stone-400'}`}
                >
                  Host a Room
                </button>
                <button 
                  onClick={() => setMultiMode('JOIN')}
                  className={`px-4 py-1 rounded-full text-xs font-bold border ${multiMode === 'JOIN' ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400' : 'bg-transparent border-transparent text-stone-400'}`}
                >
                  Join a Room
                </button>
             </div>

             {multiMode === 'HOST' && (
               <div className="space-y-4">
                  <div className="text-left space-y-4">
                    <div>
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 block">Number of Rounds</label>
                      <div className="flex items-center gap-4">
                        <input 
                            type="range" 
                            min="3" 
                            max="10" 
                            step="1"
                            value={rounds} 
                            onChange={(e) => setRounds(Number(e.target.value))}
                            className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-orange-600"
                        />
                        <span className="text-xl font-bold text-orange-600 dark:text-orange-500 w-16 text-right">{rounds}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 block">Timer Duration</label>
                      <div className="flex items-center gap-4">
                        <input 
                            type="range" 
                            min="30" 
                            max="180" 
                            step="10"
                            value={duration} 
                            onChange={(e) => setDuration(Number(e.target.value))}
                            className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-orange-600"
                        />
                        <span className="text-xl font-bold text-orange-600 dark:text-orange-500 w-16 text-right">{duration}s</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-stone-50 dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-700">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 block text-center">Your Room Code</label>
                    {displayCode ? (
                      <div 
                        onClick={copyToClipboard}
                        className="text-4xl font-mono font-black text-stone-800 dark:text-stone-100 tracking-widest cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 p-2 rounded transition-colors text-center relative"
                      >
                        {displayCode}
                        {copied && <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-stone-900 text-white text-xs py-1 px-2 rounded font-sans tracking-normal">Copied!</span>}
                      </div>
                    ) : (
                      <div className="animate-pulse text-stone-400 font-bold">Generating Code...</div>
                    )}
                    <p className="text-xs text-stone-400 mt-2 text-center">Share this code with your friend</p>
                  </div>

                  {isMultiplayerConnected && opponentProfile ? (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-xl flex items-center justify-between animate-pop-in">
                      <div className="flex items-center gap-3">
                         <span className="text-3xl">{opponentProfile.avatar}</span>
                         <div className="text-left">
                           <p className="font-bold text-green-900 dark:text-green-300">{opponentProfile.name}</p>
                           <p className="text-xs text-green-700 dark:text-green-500">Joined your room!</p>
                         </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-stone-400 text-sm font-medium italic py-2">
                      Waiting for player to join...
                    </div>
                  )}

                  {isMultiplayerConnected && opponentProfile && (
                     <button
                       onClick={() => onHostGame(duration, rounds)}
                       className="w-full bg-green-600 hover:bg-green-700 text-white text-lg font-bold py-3 px-8 rounded-2xl animate-pulse shadow-lg shadow-green-200 dark:shadow-none"
                     >
                       Start Game
                     </button>
                  )}
               </div>
             )}

             {multiMode === 'JOIN' && (
               <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 block text-left">Room Code</label>
                    <input
                      type="text"
                      value={joinId}
                      onChange={handleJoinIdChange}
                      placeholder="Enter 4-digit code"
                      maxLength={4}
                      className="w-full p-4 bg-stone-50 dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-700 rounded-xl font-mono font-black text-3xl tracking-widest focus:border-orange-500 outline-none text-center placeholder:text-stone-300 placeholder:text-xl placeholder:tracking-normal placeholder:font-sans text-stone-800 dark:text-stone-100"
                    />
                  </div>
                  
                  {isMultiplayerConnected && opponentProfile ? (
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4 rounded-xl flex items-center gap-3 animate-pop-in">
                       <span className="text-3xl">{opponentProfile.avatar}</span>
                       <div className="text-left">
                         <p className="font-bold text-orange-900 dark:text-orange-300">{opponentProfile.name}</p>
                         <p className="text-xs text-orange-700 dark:text-orange-500">Is the host. Waiting for start...</p>
                       </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => onJoinGame(joinId)}
                      disabled={joinId.length !== 4 || isMultiplayerConnected}
                      className={`w-full text-white text-lg font-bold py-3 px-8 rounded-2xl shadow-lg transition-all ${joinId.length !== 4 || isMultiplayerConnected ? 'bg-stone-300 dark:bg-stone-700 cursor-not-allowed' : 'bg-stone-800 hover:bg-stone-900 dark:bg-stone-600 dark:hover:bg-stone-500'}`}
                    >
                      {isMultiplayerConnected ? "Connecting..." : "Join Room"}
                    </button>
                  )}
               </div>
             )}
             
             {installPrompt && (
                <button 
                  onClick={handleInstallClick}
                  className="w-full mt-4 py-3 bg-gradient-to-r from-stone-800 to-stone-700 dark:from-stone-700 dark:to-stone-600 text-white font-bold rounded-2xl shadow-lg border border-stone-600 flex items-center justify-center gap-2"
                >
                  <span>📲</span> Install App
                </button>
             )}
          </div>
        )}

      </div>
    </div>
  );
};
