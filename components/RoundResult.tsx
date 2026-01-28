import React from 'react';
import { GameInputs, ValidationResult, Category } from '../types';

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
  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 md:p-8 animate-pop-in">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-slate-800">Round Results</h2>
        <div className="flex justify-center items-center gap-8 mt-2">
          <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
             <p className="text-xs font-bold text-slate-400 uppercase">You</p>
             <p className="text-indigo-600 font-black text-2xl">{validation.totalRoundScore} <span className="text-sm text-slate-400 font-normal">pts</span></p>
          </div>
          
          {isMultiplayer && (
            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
              <p className="text-xs font-bold text-slate-400 uppercase">Opponent</p>
              {opponentScore !== null && opponentScore !== undefined ? (
                 <p className="text-pink-500 font-black text-2xl">{opponentScore} <span className="text-sm text-slate-400 font-normal">pts</span></p>
              ) : (
                 <p className="text-slate-400 text-lg italic animate-pulse pt-1">Thinking...</p>
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

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 flex justify-center">
        {(!isMultiplayer || isHost) ? (
          <button
            onClick={onNextRound}
            disabled={isMultiplayer && opponentScore === null}
            className={`text-white text-lg font-bold py-3 px-12 rounded-full shadow-lg transition-all transform ${
              isMultiplayer && opponentScore === null 
                ? 'bg-slate-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105 hover:shadow-xl active:scale-95'
            }`}
          >
            {isLastRound ? "Finish Game" : (isMultiplayer && opponentScore === null) ? "Waiting for opponent..." : "Next Round →"}
          </button>
        ) : (
          <div className="text-slate-500 font-bold bg-slate-100 py-3 px-8 rounded-full">
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
    <div className={`p-4 rounded-xl border-l-8 shadow-sm flex items-center justify-between ${valid ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{icon}</span>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{category}</span>
        </div>
        <div className="text-xl font-bold text-slate-800 break-all">
          {input || <span className="text-slate-300 italic">Empty</span>}
        </div>
        <div className={`text-sm mt-1 ${valid ? 'text-green-600' : 'text-red-600'}`}>
          {valid ? '✅ ' : '❌ '} {message}
        </div>
      </div>
      <div className="ml-4 flex flex-col items-center justify-center min-w-[3rem]">
        <span className={`text-2xl font-black ${valid ? 'text-green-600' : 'text-red-600'}`}>
          +{score}
        </span>
        <span className="text-[10px] text-slate-400 font-bold uppercase">Points</span>
      </div>
    </div>
  );
};