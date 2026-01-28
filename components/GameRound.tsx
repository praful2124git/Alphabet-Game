import React, { useState, useEffect, useRef } from 'react';
import { GameInputs } from '../types';

interface GameRoundProps {
  letter: string;
  duration: number;
  onSubmit: (inputs: GameInputs) => void;
}

export const GameRound: React.FC<GameRoundProps> = ({ letter, duration, onSubmit }) => {
  const [inputs, setInputs] = useState<GameInputs>({
    name: '',
    place: '',
    animal: '',
    thing: ''
  });
  const [timeLeft, setTimeLeft] = useState(duration);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setTimeLeft(duration);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [letter, duration]);

  // Auto-submit when time hits 0
  useEffect(() => {
    if (timeLeft === 0) {
      onSubmit(inputs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const handleChange = (field: keyof GameInputs, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const progressPercentage = (timeLeft / duration) * 100;
  let timerColor = 'bg-green-500';
  if (timeLeft < duration * 0.3) timerColor = 'bg-yellow-500';
  if (timeLeft < duration * 0.15) timerColor = 'bg-red-500';

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 text-white w-16 h-16 rounded-xl flex items-center justify-center text-4xl font-bold shadow-lg">
            {letter}
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Current Letter</p>
            <p className="text-slate-800 font-bold">Must start with {letter}</p>
          </div>
        </div>
        <div className="flex flex-col items-end w-1/3">
          <div className="text-2xl font-mono font-bold text-slate-700 mb-1">{timeLeft}s</div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div 
              className={`h-2.5 rounded-full transition-all duration-1000 linear ${timerColor}`} 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Input Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 flex-grow overflow-y-auto pb-24">
        <InputField 
          label="Name" 
          icon="👤"
          value={inputs.name} 
          onChange={(v) => handleChange('name', v)} 
          placeholder="e.g. Alice"
          autoFocus={true}
        />
        <InputField 
          label="Place" 
          icon="🌍"
          value={inputs.place} 
          onChange={(v) => handleChange('place', v)} 
          placeholder="e.g. Australia"
        />
        <InputField 
          label="Animal" 
          icon="🦁"
          value={inputs.animal} 
          onChange={(v) => handleChange('animal', v)} 
          placeholder="e.g. Alligator"
        />
        <InputField 
          label="Thing" 
          icon="📦"
          value={inputs.thing} 
          onChange={(v) => handleChange('thing', v)} 
          placeholder="e.g. Apple"
        />
      </div>

      {/* Footer Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 flex justify-center">
        <button
          onClick={() => onSubmit(inputs)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-bold py-3 px-12 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95 w-full md:w-auto"
        >
          Stop & Submit
        </button>
      </div>
    </div>
  );
};

interface InputFieldProps {
  label: string;
  icon: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  autoFocus?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({ label, icon, value, onChange, placeholder, autoFocus }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-slate-100 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50 transition-all group">
    <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
      <span className="text-lg">{icon}</span> {label}
    </label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full text-2xl font-bold text-slate-800 placeholder-slate-300 outline-none bg-transparent"
      placeholder={placeholder}
      autoComplete="off"
      autoFocus={autoFocus}
    />
  </div>
);