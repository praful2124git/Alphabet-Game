
import React, { useState, useEffect, useRef } from 'react';
import { GameInputs } from '../types';

interface GameRoundProps {
  letter: string;
  duration: number;
  onSubmit: (inputs: GameInputs) => void;
  onManualStop: () => void;
  forceSubmit: boolean;
}

export const GameRound: React.FC<GameRoundProps> = ({ letter, duration, onSubmit, onManualStop, forceSubmit }) => {
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

  // Handle Forced Submission (when opponent stops)
  useEffect(() => {
    if (forceSubmit) {
      if (timerRef.current) clearInterval(timerRef.current);
      onSubmit(inputs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceSubmit]);

  // Auto-submit when time hits 0
  useEffect(() => {
    if (timeLeft === 0) {
      onSubmit(inputs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const handleStopClick = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    onManualStop(); // Notify parent to send STOP_ROUND
    onSubmit(inputs); // Submit locally
  };

  const handleChange = (field: keyof GameInputs, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const progressPercentage = (timeLeft / duration) * 100;
  let timerColor = 'bg-green-500';
  if (timeLeft < duration * 0.3) timerColor = 'bg-red-500';
  else if (timeLeft < duration * 0.5) timerColor = 'bg-orange-500';

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-white dark:bg-stone-800 p-4 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-700">
        <div className="flex items-center gap-4">
          <div className="bg-orange-600 dark:bg-orange-500 text-white w-16 h-16 rounded-xl flex items-center justify-center text-4xl font-bold shadow-lg">
            {letter}
          </div>
          <div>
            <p className="text-stone-500 dark:text-stone-400 text-sm font-medium uppercase tracking-wider">Current Letter</p>
            <p className="text-stone-800 dark:text-stone-200 font-bold">Must start with {letter}</p>
          </div>
        </div>
        <div className="flex flex-col items-end w-1/3">
          <div className="text-2xl font-mono font-bold text-stone-700 dark:text-stone-300 mb-1">{timeLeft}s</div>
          <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-2.5 overflow-hidden">
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
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 flex justify-center">
        <button
          onClick={handleStopClick}
          className="bg-orange-600 hover:bg-orange-700 text-white text-lg font-bold py-3 px-12 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95 w-full md:w-auto"
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
  <div className="bg-white dark:bg-stone-800 p-6 rounded-2xl shadow-sm border-2 border-stone-100 dark:border-stone-700 focus-within:border-orange-400 dark:focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-50 dark:focus-within:ring-orange-900/20 transition-all group">
    <label className="block text-stone-500 dark:text-stone-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
      <span className="text-lg">{icon}</span> {label}
    </label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full text-2xl font-bold text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600 outline-none bg-transparent"
      placeholder={placeholder}
      autoComplete="off"
      autoFocus={autoFocus}
    />
  </div>
);
