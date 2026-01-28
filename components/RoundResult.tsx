
import React, { useEffect, useState, useRef } from 'react';
import { GameInputs, ValidationResult, Category, ChatMessage } from '../types';
import { playSound } from '../utils/sound';

interface RoundResultProps {
  inputs: GameInputs;
  validation: ValidationResult;
  onNextRound: () => void;
  isLastRound: boolean;
  isMultiplayer: boolean;
  opponentScore?: number | null;
  isHost: boolean;
  chatMessages: ChatMessage[];
  onSendMessage: (text: string) => void;
}

export const RoundResult: React.FC<RoundResultProps> = ({ 
  inputs, 
  validation, 
  onNextRound, 
  isLastRound,
  isMultiplayer,
  opponentScore,
  isHost,
  chatMessages,
  onSendMessage
}) => {
  const [msgText, setMsgText] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-open chat on desktop, closed on mobile by default
  useEffect(() => {
    if (window.innerWidth >= 768) {
      setIsChatOpen(true);
    }
  }, []);

  useEffect(() => {
    playSound('score');
  }, []);

  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  const handleSend = () => {
    if (msgText.trim()) {
      onSendMessage(msgText);
      setMsgText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full max-w-6xl mx-auto p-4 md:p-8 animate-pop-in gap-4 md:gap-8 overflow-hidden">
      
      {/* LEFT: Results */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="text-center mb-6 shrink-0">
          <h2 className="text-3xl font-bold text-stone-800 dark:text-stone-100">Round Results</h2>
          <div className="flex justify-center items-center gap-8 mt-2">
            <div className="bg-matte-card p-3 rounded-xl shadow-sm border border-stone-400 dark:border-stone-600">
               <p className="text-xs font-bold text-stone-600 dark:text-stone-300 uppercase">You</p>
               <p className="text-orange-600 dark:text-orange-400 font-black text-2xl">{validation.totalRoundScore} <span className="text-sm text-stone-600 dark:text-stone-400 font-normal">pts</span></p>
            </div>
            
            {isMultiplayer && (
              <div className="bg-matte-card p-3 rounded-xl shadow-sm border border-stone-400 dark:border-stone-600">
                <p className="text-xs font-bold text-stone-600 dark:text-stone-300 uppercase">Opponent</p>
                {opponentScore !== null && opponentScore !== undefined ? (
                   <p className="text-stone-900 dark:text-white font-black text-2xl">{opponentScore} <span className="text-sm text-stone-600 dark:text-stone-400 font-normal">pts</span></p>
                ) : (
                   <p className="text-stone-500 dark:text-stone-400 text-lg italic animate-pulse pt-1">Thinking...</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 overflow-y-auto pr-2 pb-2">
          <ResultCard 
            category={Category.NAME} 
            input={inputs.name} 
            valid={validation.name.valid} 
            message={validation.name.message} 
            score={validation.name.score}
            icon="👤"
          />
          <ResultCard 
            category={Category.PLACE} 
            input={inputs.place} 
            valid={validation.place.valid} 
            message={validation.place.message} 
            score={validation.place.score}
            icon="🌍"
          />
          <ResultCard 
            category={Category.ANIMAL} 
            input={inputs.animal} 
            valid={validation.animal.valid} 
            message={validation.animal.message} 
            score={validation.animal.score}
            icon="🦁"
          />
          <ResultCard 
            category={Category.THING} 
            input={inputs.thing} 
            valid={validation.thing.valid} 
            message={validation.thing.message} 
            score={validation.thing.score}
            icon="📦"
          />
        </div>

        {/* Navigation Button Area - visible on mobile below results */}
        <div className="mt-4 shrink-0 flex justify-center md:hidden">
           {(!isMultiplayer || isHost) ? (
            <button
              onClick={onNextRound}
              disabled={isMultiplayer && opponentScore === null}
              className={`text-white text-lg font-bold py-3 px-12 rounded-full shadow-lg transition-all w-full ${
                isMultiplayer && opponentScore === null 
                  ? 'bg-stone-400 cursor-not-allowed' 
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {isLastRound ? "Finish" : "Next Round"}
            </button>
          ) : (
            <div className="text-stone-500 font-bold bg-stone-200 py-3 px-8 rounded-full text-center w-full">
              Waiting for host...
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Chat & Desktop Nav */}
      <div className={`flex flex-col md:w-80 lg:w-96 shrink-0 transition-all duration-300 ${isChatOpen ? 'h-[50vh] md:h-auto' : 'h-auto'} border-t md:border-t-0 md:border-l border-stone-200 dark:border-stone-700 pt-4 md:pt-0 md:pl-6`}>
        {isMultiplayer ? (
          <div className="flex flex-col h-full bg-matte-card rounded-2xl overflow-hidden border border-stone-400 dark:border-stone-600 shadow-md transition-all duration-300">
             <button 
               onClick={() => setIsChatOpen(!isChatOpen)}
               className="bg-stone-300 dark:bg-stone-800/50 p-3 flex justify-between items-center text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-widest border-b border-stone-400 dark:border-stone-600 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
             >
               <span>Live Chat 💬 {chatMessages.length > 0 && <span className="ml-2 bg-orange-500 text-white px-2 py-0.5 rounded-full text-[10px]">{chatMessages.length}</span>}</span>
               <span className={`transform transition-transform duration-300 ${isChatOpen ? 'rotate-180' : 'rotate-0'}`}>▼</span>
             </button>
             
             {isChatOpen && (
               <>
                 <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-white/30 dark:bg-stone-900/20">
                   {chatMessages.length === 0 ? (
                     <div className="text-center text-stone-600 dark:text-stone-500 text-xs italic mt-4">Say hello!</div>
                   ) : (
                     chatMessages.map(msg => (
                       <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm shadow-sm ${msg.isMe ? 'bg-orange-600 text-white rounded-tr-none' : 'bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 rounded-tl-none'}`}>
                            {msg.text}
                          </div>
                          <span className="text-[10px] text-stone-600 dark:text-stone-400 mt-1 px-1">{msg.sender}</span>
                       </div>
                     ))
                   )}
                   <div ref={chatEndRef} />
                 </div>
                 <div className="p-2 bg-stone-300/50 dark:bg-stone-800/50 border-t border-stone-400 dark:border-stone-600 flex gap-2">
                   <input
                     type="text"
                     value={msgText}
                     onChange={(e) => setMsgText(e.target.value)}
                     onKeyDown={handleKeyDown}
                     placeholder="Type a message..."
                     className="flex-1 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 text-sm px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-orange-500 shadow-inner"
                   />
                   <button 
                     onClick={handleSend}
                     className="bg-orange-600 text-white p-2 rounded-lg hover:bg-orange-700 shadow-sm"
                   >
                     ➤
                   </button>
                 </div>
               </>
             )}
          </div>
        ) : (
          <div className="hidden md:flex items-center justify-center h-full bg-stone-100 dark:bg-stone-900/30 rounded-2xl border-2 border-dashed border-stone-300 dark:border-stone-700 text-stone-400 font-bold p-8 text-center">
            Chat available in Multiplayer Mode
          </div>
        )}

        {/* Desktop Navigation Button */}
        <div className="hidden md:flex mt-4 justify-center">
          {(!isMultiplayer || isHost) ? (
            <button
              onClick={onNextRound}
              disabled={isMultiplayer && opponentScore === null}
              className={`text-white text-lg font-bold py-3 px-12 rounded-full shadow-lg transition-all w-full ${
                isMultiplayer && opponentScore === null 
                  ? 'bg-stone-400 cursor-not-allowed' 
                  : 'bg-orange-600 hover:bg-orange-700 hover:scale-105'
              }`}
            >
              {isLastRound ? "Finish Game" : "Next Round →"}
            </button>
          ) : (
            <div className="text-stone-500 dark:text-stone-400 font-bold bg-stone-200 dark:bg-stone-800 py-3 px-8 rounded-full text-center w-full">
              Waiting for host...
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

const ResultCard: React.FC<{ 
  category: string, 
  input: string, 
  valid: boolean, 
  message: string, 
  score: number,
  icon: string
}> = ({ category, input, valid, message, score, icon }) => {
  return (
    <div className={`p-4 rounded-xl border-l-8 shadow-sm flex items-center justify-between transition-colors bg-matte-card`}>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{icon}</span>
          <span className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">{category}</span>
        </div>
        <div className="text-xl font-bold text-stone-900 dark:text-white break-all">
          {input || <span className="text-stone-500 italic">Empty</span>}
        </div>
        <div className={`text-sm mt-1 font-medium ${valid ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
          {valid ? '✅ ' : '❌ '} {message}
        </div>
      </div>
      <div className="ml-4 flex flex-col items-center justify-center min-w-[3rem]">
        <span className={`text-2xl font-black ${valid ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
          +{score}
        </span>
        <span className="text-[10px] text-stone-600 dark:text-stone-400 font-bold uppercase">Points</span>
      </div>
    </div>
  );
};
