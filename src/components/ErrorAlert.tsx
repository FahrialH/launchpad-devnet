import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ErrorAlertProps {
  message: string | null;
  onDismiss: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full p-4 rounded-2xl bg-red-950/90 border border-red-500/40 text-red-200 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-200">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-red-500/20 text-red-400 shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1 pr-2">
          <h4 className="text-sm font-bold text-white mb-0.5">Registration Error</h4>
          <p className="text-xs text-red-300 leading-relaxed">{message}</p>
        </div>
        <button
          onClick={onDismiss}
          className="p-1.5 rounded-lg bg-red-900/40 hover:bg-red-800/60 text-red-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
