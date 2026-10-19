import React from 'react';
import { DrawHistoryItem } from '../types/tombola';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: DrawHistoryItem[];
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border-4 border-pink-200 rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-[0_20px_50px_rgba(244,114,182,0.25)] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-pink-100 flex items-center justify-between shrink-0 bg-pink-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <h2
              className="text-lg font-extrabold text-slate-800 tracking-tight"
              style={{ fontFamily: "'Fredoka Variable', 'Outfit Variable', sans-serif" }}
            >
              Historial de Preguntas Jugadas ({history.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-2xl hover:bg-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {history.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              ¡Aún no se ha girado la tómbola! Dale al botón mágico para sacar la primera pregunta.
            </div>
          ) : (
            history.map((item, index) => (
              <div
                key={item.id}
                className="p-4 bg-slate-50 border-2 border-pink-100 rounded-2xl space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-extrabold text-pink-600">Pregunta #{history.length - index} ⭐</span>
                  <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p
                  className="text-sm font-bold text-slate-800"
                  style={{ fontFamily: "'Fredoka Variable', 'Outfit Variable', sans-serif" }}
                >
                  "{item.ticketText}"
                </p>
                <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-700">{item.author || 'Estudiante'}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-purple-600 font-bold">{item.category}</span>
                  </div>
                  <span className="text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    ¡Jugada!
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-pink-100 flex items-center justify-between shrink-0 bg-pink-50/40">
          {history.length > 0 ? (
            <button
              onClick={onClearHistory}
              className="text-xs font-bold text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
            >
              Borrar historial
            </button>
          ) : <div />}
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 shadow-sm cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
