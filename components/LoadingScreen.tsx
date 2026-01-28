import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
          <span className="text-2xl animate-pulse">🤖</span>
        </div>
      </div>
      <h2 className="text-2xl font-bold text-slate-800">The AI Judge is thinking...</h2>
      <p className="text-slate-500">Checking your answers for validity and creativity.</p>
    </div>
  );
};