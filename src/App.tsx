import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Ticket, TombolaConfig, DrawHistoryItem, QuestionPack } from './types/tombola';
import { INITIAL_TICKETS, THEME_STYLES, PRESET_PACKS } from './utils/presets';
import { TombolaDrum3D } from './components/TombolaDrum3D';
import { UnifiedManagerModal } from './components/UnifiedManagerModal';
import { DrawResultModal } from './components/DrawResultModal';
import { HistoryDrawer } from './components/HistoryDrawer';

import { PwaControls } from './components/PwaControls';

const PACKS_REVISION = 'secciones-salud-v1';
const STORAGE_KEYS = {
  PACKS_REVISION: 'tombola_question_packs_revision',
  TICKETS: 'tombola_tickets_v3_pastel',
  CONFIG: 'tombola_config_v3_pastel',
  HISTORY: 'tombola_history_v3_pastel',
  PACKS: 'tombola_question_packs_v1',
};

const DEFAULT_CONFIG: TombolaConfig = {
  title: '✨ Tómbola Mágica de Preguntas ✨',
  subtitle: '¡Gira el bolillero 3D de caramelos y descubre qué reto o pregunta te toca hoy!',
  theme: 'cottonCandy',
  withReplacement: true,
  soundEnabled: true,
  spinDurationSeconds: 3.5,
  drumSpeed: 'normal',
  predictionMode: 'weighted',
  oracleBoostFactor: 1.8,
};

export default function App() {
  // 1. Persistent State
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TICKETS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_TICKETS;
  });

  const [questionPacks, setQuestionPacks] = useState<QuestionPack[]>(() => {
    try {
      if (localStorage.getItem(STORAGE_KEYS.PACKS_REVISION) !== PACKS_REVISION) return PRESET_PACKS;
      const saved = localStorage.getItem(STORAGE_KEYS.PACKS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return PRESET_PACKS;
  });

  const [config, setConfig] = useState<TombolaConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_CONFIG;
  });

  const [history, setHistory] = useState<DrawHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // 2. Fullscreen & Interaction State
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [ticketPendingExtraction, setTicketPendingExtraction] = useState<Ticket | null>(null);
  const [currentDrawnTicket, setCurrentDrawnTicket] = useState<Ticket | null>(null);

  // 3. Modals
  const [isUnifiedManagerOpen, setIsUnifiedManagerOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
    } catch {}
  }, [tickets]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PACKS, JSON.stringify(questionPacks));
      localStorage.setItem(STORAGE_KEYS.PACKS_REVISION, PACKS_REVISION);
    } catch {}
  }, [questionPacks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    } catch {}
  }, [config]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch {}
  }, [history]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        setIsFullscreen(true);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  }, []);

  // Total weight for draw selection
  const totalWeight = useMemo(() => {
    return tickets.reduce((acc, t) => acc + (t.weight || 1), 0);
  }, [tickets]);

  // Handle spin draw algorithm
  const handleStartSpin = useCallback(() => {
    if (isSpinning || tickets.length === 0) return;

    setIsSpinning(true);
    setCurrentDrawnTicket(null);

    let selected: Ticket;
    if (config.predictionMode === 'equal') {
      const randIdx = Math.floor(Math.random() * tickets.length);
      selected = tickets[randIdx];
    } else {
      let randVal = Math.random() * totalWeight;
      let chosen = tickets[0];
      for (const t of tickets) {
        const w = t.weight || 1;
        if (randVal < w) {
          chosen = t;
          break;
        }
        randVal -= w;
      }
      selected = chosen;
    }

    const duration = config.spinDurationSeconds * 1000;
    setTimeout(() => {
      setIsSpinning(false);
      setTicketPendingExtraction(selected);
    }, duration);
  }, [isSpinning, tickets, config, totalWeight]);

  // When ball is extracted from 3D drum
  const handleBallExtracted = useCallback(
    (ticket: Ticket) => {
      setTicketPendingExtraction(null);

      setTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, timesDrawn: t.timesDrawn + 1 } : t))
      );

      if (!config.withReplacement) {
        setTickets((prev) => prev.filter((t) => t.id !== ticket.id));
      }

      const historyItem: DrawHistoryItem = {
        id: `h-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        ticketId: ticket.id,
        ticketText: ticket.text,
        author: ticket.author,
        category: ticket.category,
        color: ticket.color,
        timestamp: Date.now(),
        calculatedProbability: 0,
        wasPredicted: false,
      };
      setHistory((prev) => [historyItem, ...prev]);

      setCurrentDrawnTicket(ticket);
    },
    [config.withReplacement]
  );

  // Ticket Operations
  const handleAddTicket = useCallback(
    (newTicket: Omit<Ticket, 'id' | 'createdAt' | 'timesDrawn'>) => {
      const ticket: Ticket = {
        ...newTicket,
        id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        createdAt: Date.now(),
        timesDrawn: 0,
      };
      setTickets((prev) => [ticket, ...prev]);
    },
    []
  );

  const handleAddBatchTickets = useCallback(
    (batch: Omit<Ticket, 'id' | 'createdAt' | 'timesDrawn'>[]) => {
      const mapped: Ticket[] = batch.map((item, idx) => ({
        ...item,
        id: `t-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        createdAt: Date.now() + idx,
        timesDrawn: 0,
      }));
      setTickets((prev) => [...mapped, ...prev]);
    },
    []
  );

  const handleUpdateTicket = useCallback((id: string, updates: Partial<Ticket>) => {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const handleDeleteTicket = useCallback((id: string) => {
    setTickets((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleResetDefaultTickets = useCallback(() => {
    if (window.confirm('¿Quieres volver a los boletos infantiles originales en la tómbola?')) {
      setTickets(INITIAL_TICKETS);
    }
  }, []);

  const handleClearAllTickets = useCallback(() => {
    if (window.confirm('¿Quieres vaciar todas las esferas de la tómbola?')) {
      setTickets([]);
    }
  }, []);

  const handleReturnToDrum = useCallback((ticket: Ticket) => {
    setTickets((prev) => {
      if (prev.some((t) => t.id === ticket.id)) return prev;
      return [...prev, ticket];
    });
  }, []);

  // QUESTION PACKS OPERATIONS
  const handleCreatePack = useCallback((newPack: Omit<QuestionPack, 'id' | 'createdAt'>) => {
    const pack: QuestionPack = {
      ...newPack,
      id: `pack-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: Date.now(),
    };
    setQuestionPacks((prev) => [pack, ...prev]);
  }, []);

  const handleUpdatePack = useCallback((id: string, updates: Partial<QuestionPack>) => {
    setQuestionPacks((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  const handleDeletePack = useCallback((id: string) => {
    setQuestionPacks((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleLoadPackToDrum = useCallback(
    (packId: string, mode: 'replace' | 'append') => {
      const pack = questionPacks.find((p) => p.id === packId);
      if (!pack) return;

      const newItems: Ticket[] = pack.tickets.map((t, idx) => ({
        ...t,
        id: `t-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        createdAt: Date.now() + idx,
        timesDrawn: 0,
      }));

      if (mode === 'replace') {
        setTickets(newItems);
      } else {
        setTickets((prev) => [...prev, ...newItems]);
      }
    },
    [questionPacks]
  );

  const handleSaveCurrentDrumAsPack = useCallback(
    (name: string, description: string, icon: string) => {
      const packTickets = tickets.map((t) => ({
        text: t.text,
        author: t.author,
        category: t.category,
        color: t.color,
        weight: t.weight || 10,
      }));

      const pack: QuestionPack = {
        id: `pack-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name,
        description,
        icon: icon || '⭐',
        createdAt: Date.now(),
        tickets: packTickets,
      };

      setQuestionPacks((prev) => [pack, ...prev]);
    },
    [tickets]
  );

  const handleResetDefaultPacks = useCallback(() => {
    setQuestionPacks(PRESET_PACKS);
  }, []);

  const currentTheme = THEME_STYLES[config.theme] || THEME_STYLES.cottonCandy;

  return (
    <div
      className={`min-h-screen bg-gradient-to-b ${currentTheme.bgGradient} text-slate-800 flex flex-col relative overflow-x-hidden ${
        isFullscreen ? 'fixed inset-0 z-50 overflow-hidden' : ''
      }`}
      style={{ fontFamily: "'Plus Jakarta Sans Variable', 'Outfit Variable', sans-serif" }}
    >
      {/* Decorative Pastel Background Shapes */}
      <div className="absolute top-10 left-8 text-3xl select-none pointer-events-none opacity-60 animate-bounce duration-1000">
        ☁️
      </div>
      <div className="absolute top-20 right-12 text-3xl select-none pointer-events-none opacity-60 animate-pulse">
        ⭐
      </div>
      <div className="absolute bottom-16 left-12 text-3xl select-none pointer-events-none opacity-60 animate-spin">
        ✨
      </div>
      <div className="absolute bottom-24 right-16 text-3xl select-none pointer-events-none opacity-60 animate-bounce">
        🎈
      </div>

      {/* TOP BAR (Hidden in Fullscreen) */}
      {!isFullscreen && (
        <header className="border-b border-pink-100/80 bg-white/70 backdrop-blur-md sticky top-0 z-40 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            {/* Zone 1: Wordmark */}
            <a
              href="/"
              className="text-xl md:text-2xl font-extrabold tracking-tight text-pink-600 hover:text-pink-700 transition-colors flex items-center gap-2"
              style={{ fontFamily: "'Fredoka Variable', 'Outfit Variable', sans-serif" }}
            >
              <span className="text-2xl animate-bounce">🎪</span>
              <span>Tómbola Mágica</span>
            </a>

            {/* Zone 2: Navigation Links */}
            <nav className="hidden md:flex items-center gap-5 text-sm font-bold text-slate-600">
              <button
                onClick={() => setIsUnifiedManagerOpen(true)}
                className="hover:text-pink-600 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>📚</span>
                <span>Bancos de Preguntas</span>
              </button>
              <button
                onClick={() => setIsUnifiedManagerOpen(true)}
                className="hover:text-pink-600 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>✏️</span>
                <span>Registrar Boletos</span>
              </button>
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="hover:text-pink-600 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>🏆</span>
                <span>Historial</span>
                {history.length > 0 && (
                  <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-bold">
                    {history.length}
                  </span>
                )}
              </button>
            </nav>

            {/* Zone 3: Actions */}
            <div className="flex items-center gap-2.5">
              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border-2 border-pink-200 hover:border-pink-300 hover:bg-pink-50 rounded-2xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                title="Modo Pantalla Completa para Proyector / Pizarrón"
              >
                <span className="text-sm">📺</span>
                <span className="hidden sm:inline">Pantalla Completa</span>
              </button>

              {/* Unified Manager Trigger */}
              <button
                onClick={() => setIsUnifiedManagerOpen(true)}
                className="px-4 py-2 text-xs font-extrabold text-white bg-pink-400 hover:bg-pink-500 rounded-2xl transition-all shadow-[0_3px_0_#db2777] active:translate-y-1 active:shadow-none flex items-center gap-1.5 cursor-pointer"
                style={{ fontFamily: "'Fredoka Variable', 'Outfit Variable', sans-serif" }}
              >
                <span>🎒</span>
                <span>Bancos & Boletos</span>
              </button>
            </div>
          </div>
        </header>
      )}

      <div className={isFullscreen ? "hidden" : ""}><PwaControls /></div>

      {/* FULLSCREEN MINIMAL FLOATING CONTROLS */}
      {isFullscreen && (
        <div className="absolute top-4 right-4 z-40 flex items-center gap-2 animate-in fade-in duration-200">
          <button
            onClick={() => setConfig((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
            className="p-3 bg-white/90 backdrop-blur-md border-2 border-pink-200 text-slate-700 hover:bg-white rounded-2xl transition-all shadow-md cursor-pointer"
            title={config.soundEnabled ? 'Silenciar Sonido' : 'Activar Sonido'}
          >
            {config.soundEnabled ? '🔔' : '🔕'}
          </button>

          <button
            onClick={() => setIsUnifiedManagerOpen(true)}
            className="p-3 bg-white/90 backdrop-blur-md border-2 border-pink-200 text-slate-700 hover:bg-white rounded-2xl transition-all shadow-md cursor-pointer"
            title="Abrir Bancos de Preguntas"
          >
            🎒
          </button>

          <button
            onClick={toggleFullscreen}
            className="px-4 py-2.5 bg-white/90 backdrop-blur-md border-2 border-pink-200 text-pink-600 hover:bg-white rounded-2xl transition-all shadow-md text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            title="Salir de pantalla completa"
          >
            <span>✖ Salir</span>
          </button>
        </div>
      )}

      {/* MAIN GAME STAGE - CENTERED 3D PASTEL TOMBOLA */}
      <main className={`flex-1 w-full mx-auto px-4 flex flex-col items-center justify-center relative z-10 ${isFullscreen ? 'p-2 justify-center max-w-5xl' : 'py-6 md:py-8 max-w-4xl'}`}>
        {/* Title Presentation */}
        <div className="text-center space-y-1.5 mb-2">
          <h1
            className={`${isFullscreen ? 'text-2xl sm:text-4xl' : 'text-3xl sm:text-5xl'} font-extrabold text-slate-800 tracking-tight drop-shadow-xs`}
            style={{ fontFamily: "'Fredoka Variable', 'Outfit Variable', sans-serif" }}
          >
            {config.title}
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-600 max-w-lg mx-auto">
            {config.subtitle}
          </p>
        </div>

        {/* 3D Interactive Three.js Tombola Drum */}
        <div className="w-full flex justify-center items-center my-auto">
          <TombolaDrum3D
            tickets={tickets}
            theme={config.theme}
            isSpinning={isSpinning}
            onSpinStart={handleStartSpin}
            onBallExtracted={handleBallExtracted}
            soundEnabled={config.soundEnabled}
            selectedTicketToExtract={ticketPendingExtraction}
            isFullscreen={isFullscreen}
          />
        </div>

        {/* Discrete bottom bar in standard view */}
        {!isFullscreen && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600 bg-white/60 backdrop-blur-sm px-5 py-2.5 rounded-full border border-pink-100 shadow-xs">
            <button
              onClick={() => setIsUnifiedManagerOpen(true)}
              className="text-pink-600 hover:text-pink-700 font-extrabold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>📚</span>
              <span>Administrar Bancos de Preguntas</span>
            </button>
            <span aria-hidden="true" className="text-pink-300">·</span>
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="hover:text-slate-900 font-bold transition-colors cursor-pointer"
            >
              Ver Historial ({history.length})
            </button>
            <span aria-hidden="true" className="text-pink-300">·</span>
            <button
              onClick={toggleFullscreen}
              className="hover:text-slate-900 font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>📺</span>
              <span>Ver Solo Tómbola en Pantalla Completa</span>
            </button>
          </div>
        )}
      </main>

      {/* FOOTER (Hidden in Fullscreen) */}
      {!isFullscreen && (
        <footer className="border-t border-pink-100/60 py-3 text-center text-xs text-slate-500 bg-white/40">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 font-medium">
            <span>🎪 Tómbola de Preguntas para Primaria</span>
            <span>Bancos personalizables con creación, edición y guardado</span>
            <span>Desarrollado y creado por <a href="https://github.com/Ezequi-el" className="font-bold text-pink-600 hover:text-pink-700 underline underline-offset-2">Ezequiel Hernández</a></span>
          </div>
        </footer>
      )}

      {/* UNIFIED MANAGEMENT MODAL (Question Banks, Ticket Registration, Secret Priority & Pastel Themes) */}
      <UnifiedManagerModal
        isOpen={isUnifiedManagerOpen}
        onClose={() => setIsUnifiedManagerOpen(false)}
        config={config}
        onUpdateConfig={(updates) => setConfig((prev) => ({ ...prev, ...updates }))}
        tickets={tickets}
        onAddTicket={handleAddTicket}
        onAddBatchTickets={handleAddBatchTickets}
        onUpdateTicket={handleUpdateTicket}
        onDeleteTicket={handleDeleteTicket}
        onClearAllTickets={handleClearAllTickets}
        onResetDefaultTickets={handleResetDefaultTickets}
        questionPacks={questionPacks}
        onCreatePack={handleCreatePack}
        onUpdatePack={handleUpdatePack}
        onDeletePack={handleDeletePack}
        onLoadPackToDrum={handleLoadPackToDrum}
        onSaveCurrentDrumAsPack={handleSaveCurrentDrumAsPack}
        onResetDefaultPacks={handleResetDefaultPacks}
      />

      {/* DRAW RESULT REVEAL MODAL (No probabilities displayed) */}
      {currentDrawnTicket && (
        <DrawResultModal
          ticket={currentDrawnTicket}
          onClose={() => setCurrentDrawnTicket(null)}
          onSpinAgain={() => {
            setCurrentDrawnTicket(null);
            handleStartSpin();
          }}
          onReturnToDrum={handleReturnToDrum}
          withReplacement={config.withReplacement}
        />
      )}

      {/* HISTORY DRAWER */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onClearHistory={() => setHistory([])}
      />
    </div>
  );
}
