import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Ticket } from '../types/tombola';
import { sound } from '../utils/audio';

interface DrawResultModalProps {
  ticket: Ticket | null;
  onClose: () => void;
  onSpinAgain: () => void;
  onReturnToDrum: (ticket: Ticket) => void;
  withReplacement: boolean;
}

export const DrawResultModal: React.FC<DrawResultModalProps> = ({
  ticket,
  onClose,
  onSpinAgain,
  onReturnToDrum,
  withReplacement,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (ticket) {
      sound.playRevealChime();
      try {
        // Multi-stage rainbow pastel confetti explosion
        confetti({
          particleCount: 100,
          spread: 85,
          origin: { y: 0.55 },
          colors: [ticket.color, '#FFB7B2', '#FFEAA7', '#B5EAD7', '#BAE6FD', '#DDD6FE', '#FBCFE8'],
        });

        setTimeout(() => {
          confetti({
            particleCount: 60,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#FF9AA2', '#FDE047', '#34D399', '#38BDF8'],
          });
          confetti({
            particleCount: 60,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#C4B5FD', '#FBCFE8', '#BAE6FD', '#FED7AA'],
          });
        }, 250);
      } catch {}
    }
  }, [ticket]);

  if (!ticket) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(ticket.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white/95 border-4 border-pink-200 rounded-3xl w-full max-w-xl overflow-hidden shadow-[0_20px_50px_rgba(244,114,182,0.35)] relative">
        {/* Playful pastel decorative background blotches */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl opacity-40 pointer-events-none"
          style={{ backgroundColor: ticket.color }}
        />
        <div className="absolute top-3 left-4 text-2xl select-none animate-bounce">⭐</div>
        <div className="absolute top-4 right-14 text-2xl select-none animate-pulse">✨</div>
        <div className="absolute bottom-4 left-6 text-2xl select-none animate-spin">🎈</div>
        <div className="absolute bottom-4 right-6 text-2xl select-none animate-bounce">🎉</div>

        {/* Top Header */}
        <div className="px-6 pt-6 pb-2 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 bg-pink-50 px-3 py-1.5 rounded-full border border-pink-200">
            <span
              className="w-3 h-3 rounded-full ring-2 ring-white shadow-sm"
              style={{ backgroundColor: ticket.color }}
            />
            <span className="text-pink-600 font-extrabold">¡Boleto Seleccionado!</span>
            <span aria-hidden="true" className="text-pink-300">·</span>
            <span className="text-purple-600">{ticket.category}</span>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-2xl hover:bg-slate-100 transition-colors"
            title="Cerrar"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Question & Card Body */}
        <div className="p-6 md:p-8 space-y-6 relative z-10 text-center">
          {/* Sphere insignia badge */}
          <div className="flex justify-center">
            <div
              className="w-20 h-20 rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.15)] flex items-center justify-center text-white font-extrabold text-3xl border-4 border-white animate-bounce"
              style={{
                backgroundColor: ticket.color,
                boxShadow: `0 10px 25px ${ticket.color}88, 0 0 20px #ffffff`,
              }}
            >
              ?
            </div>
          </div>

          {/* Question / Prompt in playful typography */}
          <div className="space-y-2">
            <h3
              className="text-2xl sm:text-3xl font-extrabold text-slate-800 leading-snug tracking-normal px-2"
              style={{ fontFamily: "'Fredoka', 'Outfit', sans-serif" }}
            >
              "{ticket.text}"
            </h3>
          </div>

          {/* Submitter credit */}
          <div className="pt-1 flex items-center justify-center gap-2 text-sm text-slate-600 bg-amber-50/80 py-2 px-4 rounded-2xl border border-amber-200 inline-flex mx-auto">
            <span>Escrito por:</span>
            <strong className="text-amber-800 font-bold">
              {ticket.author || 'Estudiante'} ⭐
            </strong>
          </div>

          {!withReplacement && (
            <p className="text-xs text-slate-400 italic">
              Este boleto ya jugó y descansará fuera del bolillero para las siguientes rondas.
            </p>
          )}

          {/* Action CTAs with squishy cartoon feel */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleCopy}
              className="w-full sm:w-auto px-4 py-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all shadow-[0_4px_0_#cbd5e1] active:translate-y-1 active:shadow-none flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              <span>{copied ? '¡Texto Copiado!' : 'Copiar Pregunta'}</span>
            </button>

            {!withReplacement && (
              <button
                onClick={() => onReturnToDrum(ticket)}
                className="w-full sm:w-auto px-4 py-3 text-xs font-bold text-sky-800 bg-sky-100 hover:bg-sky-200 rounded-2xl transition-all shadow-[0_4px_0_#7dd3fc] active:translate-y-1 active:shadow-none"
              >
                Volver a Meter a la Tómbola
              </button>
            )}

            <button
              onClick={onSpinAgain}
              className="w-full sm:w-auto px-7 py-3 text-sm font-extrabold text-white bg-pink-400 hover:bg-pink-500 rounded-2xl transition-all shadow-[0_5px_0_#db2777] active:translate-y-1.5 active:shadow-none flex items-center justify-center gap-2 cursor-pointer"
              style={{ fontFamily: "'Fredoka', 'Outfit', sans-serif" }}
            >
              <span>¡Girar Otra Pregunta!</span>
              <span className="text-lg">🎲</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
