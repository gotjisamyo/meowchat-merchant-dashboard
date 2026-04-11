import { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

/**
 * Simple toast notification component.
 * Usage: <Toast message="..." type="success|error" onClose={() => {}} />
 * Auto-dismisses after 3s.
 */
export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isSuccess = type === 'success';

  return (
    <div className={`
      fixed top-5 right-5 z-[400] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl animate-toast-in
      ${isSuccess ? 'bg-emerald-500/15 border border-emerald-500/30' : 'bg-red-500/15 border border-red-500/30'}
    `}>
      {isSuccess
        ? <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        : <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
      }
      <span className={`text-sm font-semibold ${isSuccess ? 'text-emerald-300' : 'text-red-300'}`}>
        {message}
      </span>
      <button
        onClick={onClose}
        className="ml-2 text-zinc-500 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
