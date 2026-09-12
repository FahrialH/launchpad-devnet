import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-purple-600/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest">404 Error</span>
          <h1 className="text-3xl font-black text-white">Token Sale Not Found</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            The token private sale URL you visited does not exist or has been removed from our launchpad configuration.
          </p>
        </div>

        <div className="pt-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-900/30 transition-all hover:scale-105"
          >
            <Home className="w-4 h-4" />
            <span>Return to Token Directory</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
