
import React, { useEffect } from 'react';
import { GameInputs, ValidationResult, Category } from '../types';
import { playSound } from '../utils/sound';

interface RoundResultProps {
  inputs: GameInputs;
  validation: ValidationResult;
  onNextRound: () => void;
  isLastRound: boolean;
  isMultiplayer: boolean;
  opponentScore?: number | null;
  isHost: boolean;
}

export const RoundResult: React.FC<RoundResultProps> = ({ 
  inputs, 
  validation, 
  onNextRound, 
  isLastRound,
  isMultiplayer,
  opponentScore,
  isHost
}) => {
  
  useEffect(() => {
    playSound('score');
  }, []);

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 md:p-8 animate-pop-in">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-stone-800 dark:text-stone-100">Round Results</h2>
        <div className="flex justify-center items-center gap-8 mt-2">
          <div className="bg-white dark:bg-stone-800 p-3 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700">
             <p className="text-xs font-bold text-stone-400 uppercase">You</p>
             <p className="text-orange-600 dark:text-orange-500 font-black text-2xl">{validation.totalRoundScore} <span className="text-sm text-stone-400 font-normal">pts</span></p>
          </div>
          
          {isMultiplayer && (
            <div className="bg-white dark:bg-stone-800 p-3 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700">
              <p className="text-xs font-bold text-stone-400 uppercase">Opponent</p>
              {opponentScore !== null && opponentScore !== undefined ? (
                 <p className="text-stone-600 dark:text-stone-300 font-black text-2xl">{opponentScore} <span className="text-sm text-stone-400 font-normal">pts</span></p>
              ) : (
                 <p className="text-stone-400 text-lg italic animate-pulse pt-1">Thinking...</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 flex-grow overflow-y-auto pb-28">
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

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 flex justify-center">
        {(!isMultiplayer || isHost) ? (
          <button
            onClick={onNextRound}
            disabled={isMultiplayer && opponentScore === null}
            className={`text-white text-lg font-bold py-3 px-12 rounded-full shadow-lg transition-all transform ${
              isMultiplayer && opponentScore === null 
                ? 'bg-stone-400 cursor-not-allowed' 
                : 'bg-orange-600 hover:bg-orange-700 hover:scale-105 hover:shadow-xl active:scale-95'
            }`}
          >
            {isLastRound ? "Finish Game" : (isMultiplayer && opponentScore === null) ? "Waiting for opponent..." : "Next Round →"}
          </button>
        ) : (
          <div className="text-stone-500 dark:text-stone-400 font-bold bg-stone-100 dark:bg-stone-800 py-3 px-8 rounded-full">
            Waiting for host to start next round...
          </div>
        )}
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
    <div className={`p-4 rounded-xl border-l-8 shadow-sm flex items-center justify-between ${valid ? 'bg-green-50 dark:bg-green-900/10 border-green-500' : 'bg-red-50 dark:bg-red-900/10 border-red-500'}`}>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{icon}</span>
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">{category}</span>
        </div>
        <div className="text-xl font-bold text-stone-800 dark:text-stone-200 break-all">
          {input || <span className="text-stone-300 dark:text-stone-600 italic">Empty</span>}
        </div>
        <div className={`text-sm mt-1 ${valid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {valid ? '✅ ' : '❌ '} {message}
        </div>
      </div>
      <div className="ml-4 flex flex-col items-center justify-center min-w-[3rem]">
        <span className={`text-2xl font-black ${valid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          +{score}
        </span>
        <span className="text-[10px] text-stone-400 font-bold uppercase">Points</span>
      </div>
    </div>
  );
};
