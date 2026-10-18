import React, { useState, useMemo } from 'react';
import { Ticket, TombolaConfig, TombolaTheme, QuestionPack } from '../types/tombola';
import { THEME_STYLES } from '../utils/presets';
import { sound } from '../utils/audio';

interface UnifiedManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: TombolaConfig;
  onUpdateConfig: (newConfig: Partial<TombolaConfig>) => void;
  tickets: Ticket[];
  onAddTicket: (ticket: Omit<Ticket, 'id' | 'createdAt' | 'timesDrawn'>) => void;
  onAddBatchTickets: (tickets: Omit<Ticket, 'id' | 'createdAt' | 'timesDrawn'>[]) => void;
  onUpdateTicket: (id: string, updates: Partial<Ticket>) => void;
  onDeleteTicket: (id: string) => void;
  onClearAllTickets: () => void;
  onResetDefaultTickets: () => void;

  // Dynamic Question Packs Props
  questionPacks: QuestionPack[];
  onCreatePack: (pack: Omit<QuestionPack, 'id' | 'createdAt'>) => void;
  onUpdatePack: (id: string, updates: Partial<QuestionPack>) => void;
  onDeletePack: (id: string) => void;
  onLoadPackToDrum: (packId: string, mode: 'replace' | 'append') => void;
  onSaveCurrentDrumAsPack: (name: string, description: string, icon: string) => void;
  onResetDefaultPacks: () => void;
}

const PASTEL_COLOR_OPTIONS = [
  { hex: '#FF9AA2', name: 'Fresa Pastel' },
  { hex: '#FFB7B2', name: 'Melocotón' },
  { hex: '#FFDAC1', name: 'Crema Dulce' },
  { hex: '#B5EAD7', name: 'Menta Suave' },
  { hex: '#BAE6FD', name: 'Azul Cielo' },
  { hex: '#DDD6FE', name: 'Lavanda' },
  { hex: '#FBCFE8', name: 'Chicle Rosa' },
  { hex: '#FDE047', name: 'Amarillo Sol' },
];

const KID_CATEGORIES = [
  'Recreo & Juegos',
  'Pregunta Divertida',
  'Reto Loco',
  'Superpoderes & Magia',
  'Compañerismo',
  'Comida & Dulces',
  'Música & Baile',
  'Libre',
];

const EMOJI_OPTIONS = ['🎒', '⭐', '🦄', '💖', '🚀', '⚽', '🎨', '🧪', '🎃', '🍕', '🍦', '🦁', '🎪', '🎲'];

export const UnifiedManagerModal: React.FC<UnifiedManagerModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  tickets,
  onAddTicket,
  onAddBatchTickets,
  onUpdateTicket,
  onDeleteTicket,
  onClearAllTickets,
  onResetDefaultTickets,
  questionPacks,
  onCreatePack,
  onUpdatePack,
  onDeletePack,
  onLoadPackToDrum,
  onSaveCurrentDrumAsPack,
  onResetDefaultPacks,
}) => {
  const [activeTab, setActiveTab] = useState<'register' | 'prediction' | 'packs' | 'settings'>('packs');
  const [regMode, setRegMode] = useState<'single' | 'batch'>('single');

  // Single ticket registration state
  const [newText, setNewText] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newCategory, setNewCategory] = useState('Recreo & Juegos');
  const [newColor, setNewColor] = useState('#FF9AA2');

  // Batch registration state
  const [batchText, setBatchText] = useState('');
  const [batchAuthor, setBatchAuthor] = useState('');
  const [batchCategory, setBatchCategory] = useState('Recreo & Juegos');

  // Search in drum tickets
  const [drumSearchQuery, setDrumSearchQuery] = useState('');
  const [editingDrumTicketId, setEditingDrumTicketId] = useState<string | null>(null);
  const [editDrumText, setEditDrumText] = useState('');
  const [editDrumAuthor, setEditDrumAuthor] = useState('');
  const [editDrumCategory, setEditDrumCategory] = useState('');

  // QUESTION PACKS MANAGEMENT STATE
  const [packSubView, setPackSubView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingPackId, setEditingPackId] = useState<string | null>(null);

  // New pack creation form state
  const [newPackName, setNewPackName] = useState('');
  const [newPackDesc, setNewPackDesc] = useState('');
  const [newPackIcon, setNewPackIcon] = useState('🎒');
  const [newPackQuestionsText, setNewPackQuestionsText] = useState('');
  const [newPackCategory, setNewPackCategory] = useState('Recreo & Juegos');

  // Pack editing state
  const [editPackName, setEditPackName] = useState('');
  const [editPackDesc, setEditPackDesc] = useState('');
  const [editPackIcon, setEditPackIcon] = useState('🎒');
  const [packNewQuestionText, setPackNewQuestionText] = useState('');
  const [packNewQuestionAuthor, setPackNewQuestionAuthor] = useState('');
  const [packNewQuestionCategory, setPackNewQuestionCategory] = useState('Recreo & Juegos');
  const [packNewQuestionColor, setPackNewQuestionColor] = useState('#FF9AA2');

  // Save current drum as new pack state
  const [isSavingDrumModalOpen, setIsSavingDrumModalOpen] = useState(false);
  const [saveDrumName, setSaveDrumName] = useState('Mi Banco de Tómbola');
  const [saveDrumDesc, setSaveDrumDesc] = useState('Colección guardada de preguntas del salón');
  const [saveDrumIcon, setSaveDrumIcon] = useState('⭐');

  // Inline edit question inside pack
  const [editingPackQuestionIndex, setEditingPackQuestionIndex] = useState<number | null>(null);
  const [editPackQuestionText, setEditPackQuestionText] = useState('');

  // Filter drum tickets
  const filteredDrumTickets = useMemo(() => {
    if (!drumSearchQuery.trim()) return tickets;
    const q = drumSearchQuery.toLowerCase();
    return tickets.filter(
      (t) =>
        t.text.toLowerCase().includes(q) ||
        (t.author && t.author.toLowerCase().includes(q)) ||
        t.category.toLowerCase().includes(q)
    );
  }, [tickets, drumSearchQuery]);

  // Currently selected pack for editing
  const currentEditingPack = useMemo(() => {
    if (!editingPackId) return null;
    return questionPacks.find((p) => p.id === editingPackId) || null;
  }, [questionPacks, editingPackId]);

  if (!isOpen) return null;

  // Register single ticket
  const handleRegisterSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    onAddTicket({
      text: newText.trim(),
      author: newAuthor.trim() || 'Estudiante',
      category: newCategory,
      color: newColor,
      weight: 10,
    });

    sound.playTumbleClick(1.2);
    setNewText('');
  };

  // Register batch tickets
  const handleRegisterBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = batchText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    const items = lines.map((line, idx) => ({
      text: line,
      author: batchAuthor.trim() || `Alumno ${idx + 1}`,
      category: batchCategory,
      color: PASTEL_COLOR_OPTIONS[idx % PASTEL_COLOR_OPTIONS.length].hex,
      weight: 10,
    }));

    onAddBatchTickets(items);
    sound.playRevealChime();
    setBatchText('');
    setActiveTab('packs');
  };

  // Save drum ticket edit
  const handleSaveDrumTicketEdit = (id: string) => {
    if (!editDrumText.trim()) return;
    onUpdateTicket(id, {
      text: editDrumText.trim(),
      author: editDrumAuthor.trim() || 'Estudiante',
      category: editDrumCategory.trim() || 'General',
    });
    setEditingDrumTicketId(null);
    sound.playTumbleClick(1.1);
  };

  const handleEqualizePriorities = () => {
    tickets.forEach((t) => {
      onUpdateTicket(t.id, { weight: 10 });
    });
    sound.playRevealChime();
  };

  const getPriorityLabel = (weight: number) => {
    if (weight <= 5) return '⭐ Normal';
    if (weight <= 15) return '⭐⭐ Frecuente';
    if (weight <= 30) return '⭐⭐⭐ Muy Frecuente';
    return '🌟 Favorito Especial';
  };

  // START EDITING A QUESTION PACK
  const handleStartEditingPack = (pack: QuestionPack) => {
    setEditingPackId(pack.id);
    setEditPackName(pack.name);
    setEditPackDesc(pack.description);
    setEditPackIcon(pack.icon || '🎒');
    setPackSubView('edit');
  };

  // SAVE PACK INFO
  const handleSavePackInfo = () => {
    if (!editingPackId || !editPackName.trim()) return;
    onUpdatePack(editingPackId, {
      name: editPackName.trim(),
      description: editPackDesc.trim(),
      icon: editPackIcon,
    });
    sound.playRevealChime();
  };

  // ADD QUESTION TO EDITING PACK
  const handleAddQuestionToPack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEditingPack || !packNewQuestionText.trim()) return;

    const newTicket = {
      text: packNewQuestionText.trim(),
      author: packNewQuestionAuthor.trim() || 'Estudiante',
      category: packNewQuestionCategory,
      color: packNewQuestionColor,
      weight: 10,
    };

    const updatedTickets = [...currentEditingPack.tickets, newTicket];
    onUpdatePack(currentEditingPack.id, { tickets: updatedTickets });
    setPackNewQuestionText('');
    sound.playTumbleClick(1.2);
  };

  // DELETE QUESTION FROM EDITING PACK
  const handleDeleteQuestionFromPack = (index: number) => {
    if (!currentEditingPack) return;
    const updatedTickets = currentEditingPack.tickets.filter((_, i) => i !== index);
    onUpdatePack(currentEditingPack.id, { tickets: updatedTickets });
    sound.playTumbleClick(0.9);
  };

  // EDIT INDIVIDUAL QUESTION IN PACK
  const handleSaveEditedQuestionInPack = (index: number) => {
    if (!currentEditingPack || !editPackQuestionText.trim()) return;
    const updatedTickets = currentEditingPack.tickets.map((t, i) =>
      i === index ? { ...t, text: editPackQuestionText.trim() } : t
    );
    onUpdatePack(currentEditingPack.id, { tickets: updatedTickets });
    setEditingPackQuestionIndex(null);
    sound.playTumbleClick(1.1);
  };

  // CREATE NEW PACK
  const handleCreateNewPack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPackName.trim()) return;

    const lines = newPackQuestionsText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const packTickets = lines.map((line, idx) => ({
      text: line,
      author: 'Estudiante',
      category: newPackCategory,
      color: PASTEL_COLOR_OPTIONS[idx % PASTEL_COLOR_OPTIONS.length].hex,
      weight: 10,
    }));

    onCreatePack({
      name: newPackName.trim(),
      description: newPackDesc.trim() || 'Banco de preguntas personalizadas',
      icon: newPackIcon,
      tickets: packTickets,
    });

    sound.playRevealChime();
    setNewPackName('');
    setNewPackDesc('');
    setNewPackQuestionsText('');
    setPackSubView('list');
  };

  // CONFIRM DELETE PACK
  const handleDeletePackConfirm = (pack: QuestionPack) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el banco "${pack.name}"?`)) {
      onDeletePack(pack.id);
      sound.playTumbleClick(0.8);
      if (editingPackId === pack.id) {
        setPackSubView('list');
        setEditingPackId(null);
      }
    }
  };

  // SAVE CURRENT DRUM AS PACK
  const handleSaveDrumAsPack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveDrumName.trim()) return;
    onSaveCurrentDrumAsPack(saveDrumName.trim(), saveDrumDesc.trim(), saveDrumIcon);
    sound.playRevealChime();
    setIsSavingDrumModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border-4 border-pink-200 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-[0_20px_50px_rgba(244,114,182,0.25)] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-pink-100 flex items-center justify-between shrink-0 bg-pink-50/50">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl animate-bounce">🎒</span>
            <div>
              <h2
                className="text-lg md:text-xl font-extrabold text-slate-800 tracking-tight"
                style={{ fontFamily: "'Fredoka', 'Outfit', sans-serif" }}
              >
                Panel de Boletos & Bancos de Preguntas
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Crea, edita o elimina bancos enteros de preguntas, o agrega nuevos boletos al instante
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-2xl hover:bg-white transition-colors"
            title="Cerrar"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-pink-100 bg-amber-50/30 flex gap-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('packs');
              setPackSubView('list');
            }}
            className={`py-3 px-4 text-xs font-bold border-b-4 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'packs'
                ? 'border-pink-400 text-pink-600 bg-pink-100/40 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>📚</span>
            <span>Bancos de Preguntas ({questionPacks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('register')}
            className={`py-3 px-4 text-xs font-bold border-b-4 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'register'
                ? 'border-pink-400 text-pink-600 bg-pink-100/40 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>✏️</span>
            <span>Registrar Boletos Directos</span>
          </button>

          <button
            onClick={() => setActiveTab('prediction')}
            className={`py-3 px-4 text-xs font-bold border-b-4 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'prediction'
                ? 'border-pink-400 text-pink-600 bg-pink-100/40 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>⭐</span>
            <span>Prioridad Secreta</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-4 text-xs font-bold border-b-4 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'settings'
                ? 'border-pink-400 text-pink-600 bg-pink-100/40 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>🎨</span>
            <span>Temas Pastel</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: GESTIÓN COMPLETA DE BANCOS DE PREGUNTAS (NUEVO / EDITAR / BORRAR) */}
          {activeTab === 'packs' && (
            <div className="space-y-6">
              {/* SUBVIEW 1: LIST OF QUESTION PACKS */}
              {packSubView === 'list' && (
                <div className="space-y-5">
                  {/* Top Action Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-pink-50/60 p-4 rounded-3xl border-2 border-pink-200">
                    <div>
                      <h3
                        className="text-sm font-extrabold text-slate-800"
                        style={{ fontFamily: "'Fredoka', 'Outfit', sans-serif" }}
                      >
                        Bancos de Preguntas Disponibles
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Crea colecciones temáticas, edítalas cuando quieras o cárgalas en la tómbola con 1 clic
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setIsSavingDrumModalOpen(true)}
                        className="px-3.5 py-2 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border-2 border-amber-300 rounded-2xl transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                        title="Guarda las preguntas actuales del bolillero como un banco nuevo"
                      >
                        <span>💾</span>
                        <span>Guardar Tómbola Actual</span>
                      </button>

                      <button
                        onClick={() => setPackSubView('create')}
                        className="px-4 py-2 text-xs font-extrabold text-white bg-pink-400 hover:bg-pink-500 rounded-2xl transition-all shadow-[0_3px_0_#db2777] active:translate-y-1 active:shadow-none flex items-center gap-1.5 cursor-pointer"
                        style={{ fontFamily: "'Fredoka', 'Outfit', sans-serif" }}
                      >
                        <span>➕</span>
                        <span>Crear Nuevo Banco</span>
                      </button>
                    </div>
                  </div>

                  {/* List of Packs Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {questionPacks.map((pack) => (
                      <div
                        key={pack.id}
                        className="p-5 bg-white border-2 border-pink-100 hover:border-pink-300 rounded-3xl transition-all shadow-sm hover:shadow-md flex flex-col justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl p-2 bg-pink-50 rounded-2xl border border-pink-200">
                                {pack.icon || '🎒'}
                              </span>
                              <div>
                                <h4
                                  className="text-base font-extrabold text-slate-800"
                                  style={{ fontFamily: "'Fredoka', 'Outfit', sans-serif" }}
                                >
                                  {pack.name}
                                </h4>
                                <span className="inline-block text-[11px] font-extrabold text-pink-600 bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-200 mt-1">
                                  {pack.tickets.length} preguntas
                                </span>
                              </div>
                            </div>

                            {/* Delete pack button */}
                            <button
                              onClick={() => handleDeletePackConfirm(pack)}
                              className="text-slate-400 hover:text-rose-500 p-1.5 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Borrar este banco de preguntas"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>

                          <p className="text-xs text-slate-600 mt-3 line-clamp-2">
                            {pack.description}
                          </p>

                          {/* Quick preview of questions inside */}
                          <div className="mt-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                              Muestra de preguntas:
                            </span>
                            {pack.tickets.slice(0, 2).map((t, i) => (
                              <p key={i} className="text-[11px] text-slate-700 italic truncate">
                                • "{t.text}"
                              </p>
                            ))}
                            {pack.tickets.length > 2 && (
                              <span className="text-[10px] text-pink-500 font-bold block pt-0.5">
                                + {pack.tickets.length - 2} preguntas más...
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions for this pack */}
                        <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-slate-100">
                          <button
                            onClick={() => onLoadPackToDrum(pack.id, 'replace')}
                            className="flex-1 py-2 px-3 text-xs font-extrabold text-white bg-pink-400 hover:bg-pink-500 rounded-2xl shadow-[0_3px_0_#db2777] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>🎲</span>
                            <span>Cargar en Tómbola</span>
                          </button>

                          <button
                            onClick={() => onLoadPackToDrum(pack.id, 'append')}
                            className="py-2 px-3 text-xs font-bold text-sky-800 bg-sky-100 hover:bg-sky-200 rounded-2xl transition-all cursor-pointer"
                            title="Sumar estas preguntas a las que ya están en la tómbola"
                          >
                            <span>➕ Sumar</span>
                          </button>

                          <button
                            onClick={() => handleStartEditingPack(pack)}
                            className="py-2 px-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all flex items-center gap-1 cursor-pointer"
                            title="Editar preguntas de este banco"
                          >
                            <span>✏️</span>
                            <span>Editar</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reset packs button */}
                  <div className="pt-4 flex justify-between items-center text-xs text-slate-500">
                    <span>Puedes crear tantos bancos como quieras para tus diferentes materias o juegos.</span>
                    <button
                      onClick={() => {
                        if (window.confirm('¿Quieres restaurar los bancos escolares predeterminados?')) {
                          onResetDefaultPacks();
                        }
                      }}
                      className="text-pink-600 hover:underline font-bold cursor-pointer"
                    >
                      Restaurar Bancos Originales
                    </button>
                  </div>

                  {/* SECCIÓN ADICIONAL: VER / EDITAR LOS BOLETOS ACTUALES DEL BOLILLERO */}
                  <div className="mt-8 pt-6 border-t-2 border-dashed border-pink-200 space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <h4
                          className="text-sm font-extrabold text-slate-800"
                          style={{ fontFamily: "'Fredoka', 'Outfit', sans-serif" }}
                        >
                          Boletos actualmente en el Bolillero ({tickets.length})
                        </h4>
                        <p className="text-xs text-slate-500">
                          Estos son los boletos que están girando en la tómbola en este momento
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={onResetDefaultTickets}
                          className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl cursor-pointer"
                        >
                          Restablecer Tómbola
                        </button>
                        <button
                          onClick={onClearAllTickets}
                          className="px-3 py-1.5 text-xs font-bold text-rose-500 hover:text-rose-700 bg-rose-50 rounded-xl cursor-pointer"
                        >
                          Vaciar
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={drumSearchQuery}
                      onChange={(e) => setDrumSearchQuery(e.target.value)}
                      placeholder="Buscar entre los boletos que están en la tómbola..."
                      className="w-full bg-slate-50 border-2 border-pink-200 rounded-2xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-pink-400 focus:bg-white"
                    />

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {filteredDrumTickets.map((t) => (
                        <div
                          key={t.id}
                          className="p-3 bg-slate-50 border border-pink-100 rounded-2xl flex items-start justify-between gap-3 text-xs"
                        >
                          {editingDrumTicketId === t.id ? (
                            <div className="w-full space-y-2">
                              <textarea
                                rows={2}
                                value={editDrumText}
                                onChange={(e) => setEditDrumText(e.target.value)}
                                className="w-full bg-white border-2 border-pink-300 rounded-xl p-2 text-xs text-slate-800"
                              />
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={editDrumAuthor}
                                  onChange={(e) => setEditDrumAuthor(e.target.value)}
                                  placeholder="Autor"
                                  className="bg-white border border-pink-200 rounded-xl px-2 py-1 text-xs text-slate-800"
                                />
                                <button
                                  onClick={() => handleSaveDrumTicketEdit(t.id)}
                                  className="px-3 py-1 text-xs font-bold bg-pink-400 text-white rounded-xl shadow-xs"
                                >
                                  Guardar
                                </button>
                                <button
                                  onClick={() => setEditingDrumTicketId(null)}
                                  className="px-2 py-1 text-xs text-slate-400 hover:text-slate-600"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                <div
                                  className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5 border border-white shadow-xs"
                                  style={{ backgroundColor: t.color }}
                                />
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-800 truncate">{t.text}</p>
                                  <span className="text-[10px] text-slate-500">
                                    {t.author || 'Estudiante'} · {t.category}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => {
                                    setEditingDrumTicketId(t.id);
                                    setEditDrumText(t.text);
                                    setEditDrumAuthor(t.author || '');
                                    setEditDrumCategory(t.category);
                                  }}
                                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white"
                                  title="Editar pregunta"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => onDeleteTicket(t.id)}
                                  className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-white"
                                  title="Quitar de la tómbola"
                                >
                                  🗑️
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SUBVIEW 2: CREATE NEW QUESTION PACK */}
              {packSubView === 'create' && (
                <form onSubmit={handleCreateNewPack} className="space-y-5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-3 border-b border-pink-100">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPackSubView('list')}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
                      >
                        ← Volver
                      </button>
                      <h3
                        className="text-base font-extrabold text-slate-800"
                        style={{ fontFamily: "'Fredoka', 'Outfit', sans-serif" }}
                      >
                        Crear Nuevo Banco de Preguntas
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Nombre del Banco de Preguntas <span className="text-pink-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newPackName}
                        onChange={(e) => setNewPackName(e.target.value)}
                        placeholder="Ej: Matemáticas & Acertijos Locos"
                        className="w-full bg-slate-50 border-2 border-pink-200 rounded-2xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-pink-400 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Emoji Representativo
                      </label>
                      <div className="flex flex-wrap gap-1.5 bg-slate-50 p-2 rounded-2xl border-2 border-pink-200">
                        {EMOJI_OPTIONS.slice(0, 8).map((em) => (
                          <button
                            key={em}
                            type="button"
                            onClick={() => setNewPackIcon(em)}
                            className={`w-7 h-7 text-sm rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                              newPackIcon === em ? 'bg-pink-300 scale-110 shadow-xs' : 'hover:bg-pink-100'
                            }`}
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Descripción corta del banco
                    </label>
                    <input
                      type="text"
                      value={newPackDesc}
                      onChange={(e) => setNewPackDesc(e.target.value)}
                      placeholder="Ej: Preguntas y dinámicas para la clase de cálculo y acertijos divertidos"
                      className="w-full bg-slate-50 border-2 border-pink-200 rounded-2xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-pink-400 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Preguntas Iniciales (pega una pregunta por línea)
                    </label>
                    <textarea
                      rows={5}
                      value={newPackQuestionsText}
                      onChange={(e) => setNewPackQuestionsText(e.target.value)}
                      placeholder={"¿Cuánto es 5 x 5 + 10?\nSi tienes 3 manzanas y regalas 1, ¿cuántas te quedan?\nInventa una rima divertida con tu nombre"}
                      className="w-full bg-slate-50 border-2 border-pink-200 rounded-2xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-pink-400 focus:bg-white"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setPackSubView('list')}
                      className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-2xl"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-7 py-2.5 text-xs font-extrabold text-white bg-pink-400 hover:bg-pink-500 rounded-2xl transition-all shadow-[0_4px_0_#db2777] active:translate-y-1 active:shadow-none cursor-pointer"
                      style={{ fontFamily: "'Fredoka', 'Outfit', sans-serif" }}
                    >
                      ¡Crear y Guardar Banco! ⭐
                    </button>
                  </div>
                </form>
              )}

              {/* SUBVIEW 3: EDIT EXISTING QUESTION PACK */}
              {packSubView === 'edit' && currentEditingPack && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Top Bar with Back and Save */}
                  <div className="flex items-center justify-between pb-3 border-b border-pink-100">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPackSubView('list')}
                        className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                      >
                        ← Volver a la Lista
                      </button>
                      <h3
                        className="text-base font-extrabold text-slate-800 flex items-center gap-2"
                        style={{ fontFamily: "'Fredoka', 'Outfit', sans-serif" }}
                      >
                        <span>Editando Banco:</span>
                        <span className="text-pink-600">{currentEditingPack.name}</span>
                      </h3>
                    </div>

                    <button
                      onClick={() => handleDeletePackConfirm(currentEditingPack)}
                      className="text-xs font-bold text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                    >
                      🗑️ Borrar este Banco
                    </button>
                  </div>

                  {/* Edit Pack Details Card */}
                  <div className="p-4 bg-pink-50/50 border-2 border-pink-200 rounded-3xl space-y-3">
                    <span className="text-xs font-extrabold text-slate-700 block">
                      Detalles del Banco
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Nombre</label>
                        <input
                          type="text"
                          value={editPackName}
                          onChange={(e) => setEditPackName(e.target.value)}
                          className="w-full bg-white border border-pink-200 rounded-xl px-3 py-1.5 text-xs text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Emoji</label>
                        <div className="flex gap-1">
                          {EMOJI_OPTIONS.slice(0, 5).map((em) => (
                            <button
                              key={em}
                              type="button"
                              onClick={() => setEditPackIcon(em)}
                              className={`w-7 h-7 text-xs rounded-lg flex items-center justify-center cursor-pointer ${
                                editPackIcon === em ? 'bg-pink-300 shadow-xs' : 'bg-white'
                              }`}
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={handleSavePackInfo}
                          className="w-full py-1.5 px-3 text-xs font-bold text-white bg-pink-400 hover:bg-pink-500 rounded-xl shadow-[0_2px_0_#db2777] active:translate-y-0.5 active:shadow-none cursor-pointer"
                        >
                          Guardar Nombre
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Add Question to this Pack Form */}
                  <form onSubmit={handleAddQuestionToPack} className="p-4 bg-slate-50 border-2 border-pink-100 rounded-3xl space-y-3">
                    <span className="text-xs font-extrabold text-slate-700 block">
                      ➕ Agregar Nueva Pregunta a este Banco
                    </span>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        required
                        value={packNewQuestionText}
                        onChange={(e) => setPackNewQuestionText(e.target.value)}
                        placeholder="Escribe la nueva pregunta o reto para este banco..."
                        className="flex-1 bg-white border-2 border-pink-200 rounded-2xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-pink-400"
                      />
                      <button
                        type="submit"
                        className="py-2 px-5 text-xs font-extrabold text-white bg-pink-400 hover:bg-pink-500 rounded-2xl shadow-[0_3px_0_#db2777] active:translate-y-1 active:shadow-none cursor-pointer whitespace-nowrap"
                        style={{ fontFamily: "'Fredoka', 'Outfit', sans-serif" }}
                      >
                        + Añadir al Banco
                      </button>
                    </div>
                  </form>

                  {/* List of Questions inside this Pack */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-700">
                        Preguntas guardadas en este banco ({currentEditingPack.tickets.length})
                      </span>
                      <button
                        onClick={() => onLoadPackToDrum(currentEditingPack.id, 'replace')}
                        className="text-xs font-bold text-pink-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>🎲 Cargar este banco ahora en la tómbola</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {currentEditingPack.tickets.map((t, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 bg-white border-2 border-pink-100 rounded-2xl flex items-center justify-between gap-3 text-xs"
                        >
                          {editingPackQuestionIndex === idx ? (
                            <div className="flex-1 flex gap-2">
                              <input
                                type="text"
                                value={editPackQuestionText}
                                onChange={(e) => setEditPackQuestionText(e.target.value)}
                                className="flex-1 bg-slate-50 border-2 border-pink-300 rounded-xl px-2.5 py-1 text-xs text-slate-800"
                              />
                              <button
                                onClick={() => handleSaveEditedQuestionInPack(idx)}
                                className="px-3 py-1 bg-pink-400 text-white rounded-xl font-bold cursor-pointer"
                              >
                                Guardar
                              </button>
                              <button
                                onClick={() => setEditingPackQuestionIndex(null)}
                                className="px-2 py-1 text-slate-400 hover:text-slate-600"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <span className="text-slate-400 font-bold text-[11px] w-5">
                                  #{idx + 1}
                                </span>
                                <div
                                  className="w-3.5 h-3.5 rounded-full shrink-0 border border-white shadow-xs"
                                  style={{ backgroundColor: t.color || '#FFB7B2' }}
                                />
                                <p className="font-semibold text-slate-800 truncate">
                                  {t.text}
                                </p>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => {
                                    setEditingPackQuestionIndex(idx);
                                    setEditPackQuestionText(t.text);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 cursor-pointer"
                                  title="Editar texto"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteQuestionFromPack(idx)}
                                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 cursor-pointer"
                                  title="Eliminar de este banco"
                                >
                                  🗑️
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}

                      {currentEditingPack.tickets.length === 0 && (
                        <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          Este banco no tiene preguntas todavía. ¡Usa el formulario de arriba para agregar la primera!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REGISTRAR BOLETOS DIRECTOS */}
          {activeTab === 'register' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRegMode('single')}
                  className={`px-4 py-2 text-xs font-bold rounded-2xl transition-all cursor-pointer ${
                    regMode === 'single'
                      ? 'bg-pink-400 text-white shadow-[0_3px_0_#db2777]'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Un Boleto a la vez
                </button>
                <button
                  type="button"
                  onClick={() => setRegMode('batch')}
                  className={`px-4 py-2 text-xs font-bold rounded-2xl transition-all cursor-pointer ${
                    regMode === 'batch'
                      ? 'bg-pink-400 text-white shadow-[0_3px_0_#db2777]'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Carga Rápida de la Clase
                </button>
              </div>

              {regMode === 'single' ? (
                <form onSubmit={handleRegisterSingle} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Pregunta, Reto o Dinámica <span className="text-pink-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      placeholder="Ej: ¿Cuál ha sido el dibujo o juego más divertido que has hecho en la escuela?"
                      className="w-full bg-slate-50 border-2 border-pink-200 rounded-2xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-pink-400 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Nombre del Alumno o Profesor
                      </label>
                      <input
                        type="text"
                        value={newAuthor}
                        onChange={(e) => setNewAuthor(e.target.value)}
                        placeholder="Ej: Lucas (4to B)"
                        className="w-full bg-slate-50 border-2 border-pink-200 rounded-2xl px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-pink-400 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Categoría
                      </label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-pink-200 rounded-2xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-pink-400 focus:bg-white"
                      >
                        {KID_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Elige el color pastel para tu esfera
                    </label>
                    <div className="flex flex-wrap gap-3 items-center">
                      {PASTEL_COLOR_OPTIONS.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setNewColor(c.hex)}
                          className={`w-9 h-9 rounded-full transition-transform flex items-center justify-center border-2 border-white shadow-xs cursor-pointer ${
                            newColor === c.hex ? 'scale-125 ring-3 ring-pink-300' : 'hover:scale-110 opacity-85'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        >
                          {newColor === c.hex && (
                            <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-7 py-3 text-sm font-extrabold text-white bg-pink-400 hover:bg-pink-500 rounded-2xl transition-all shadow-[0_4px_0_#db2777] active:translate-y-1 active:shadow-none cursor-pointer flex items-center gap-2"
                      style={{ fontFamily: "'Fredoka', 'Outfit', sans-serif" }}
                    >
                      <span>¡Meter a la Tómbola Mágica!</span>
                      <span>✨</span>
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRegisterBatch} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Pega las preguntas de tus alumnos (un boleto por renglón)
                    </label>
                    <textarea
                      required
                      rows={6}
                      value={batchText}
                      onChange={(e) => setBatchText(e.target.value)}
                      placeholder={"¿Cuál es tu película animada favorita?\nSi pudieras volar a cualquier país en un avión de juguete, ¿a cuál irías?\n¡Reto! Haz cara de pececito por 10 segundos\n¿Qué juego te gusta más de la clase de educación física?"}
                      className="w-full bg-slate-50 border-2 border-pink-200 rounded-2xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-pink-400 focus:bg-white font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Grupo o Salón
                      </label>
                      <input
                        type="text"
                        value={batchAuthor}
                        onChange={(e) => setBatchAuthor(e.target.value)}
                        placeholder="Ej: Salón 3° Primaria"
                        className="w-full bg-slate-50 border-2 border-pink-200 rounded-2xl px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-pink-400 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Categoría
                      </label>
                      <select
                        value={batchCategory}
                        onChange={(e) => setBatchCategory(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-pink-200 rounded-2xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-pink-400 focus:bg-white"
                      >
                        {KID_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-7 py-3 text-sm font-extrabold text-white bg-pink-400 hover:bg-pink-500 rounded-2xl transition-all shadow-[0_4px_0_#db2777] active:translate-y-1 active:shadow-none cursor-pointer flex items-center gap-2"
                      style={{ fontFamily: "'Fredoka', 'Outfit', sans-serif" }}
                    >
                      <span>Cargar Todas las Esferas Pastel</span>
                      <span>🌈</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: PRIORIDADES SECRETAS (NO PROBABILITIES SHOWN) */}
          {activeTab === 'prediction' && (
            <div className="space-y-6">
              <div className="p-4 bg-pink-50/70 border-2 border-pink-200 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3
                    className="text-sm font-extrabold text-slate-800"
                    style={{ fontFamily: "'Fredoka', 'Outfit', sans-serif" }}
                  >
                    Control de Frecuencia Secreta
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Elige si todas las preguntas salen parejitas o si quieres darle una estrellita a ciertas preguntas especiales.
                  </p>
                </div>
                <button
                  onClick={handleEqualizePriorities}
                  className="px-4 py-2 text-xs font-bold text-pink-700 bg-white hover:bg-pink-100 rounded-2xl transition-colors border-2 border-pink-200 shadow-xs cursor-pointer"
                >
                  Poner Todas Iguales (Parejitas)
                </button>
              </div>

              {/* Mode switch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onUpdateConfig({ predictionMode: 'equal' })}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    config.predictionMode === 'equal'
                      ? 'border-pink-400 bg-pink-50/90 text-slate-800 shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="block text-xs font-extrabold text-slate-800">🎲 Azar Totalmente Igual</span>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Todas las esferas del bolillero tienen exactamente la misma oportunidad.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateConfig({ predictionMode: 'weighted' })}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    config.predictionMode === 'weighted'
                      ? 'border-pink-400 bg-pink-50/90 text-slate-800 shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="block text-xs font-extrabold text-slate-800">⭐ Con Estrellitas Especiales</span>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Favorece de forma secreta las preguntas con mayor prioridad para animar el juego.
                  </span>
                </button>
              </div>

              {/* Sliders for priority (no percentage figures) */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-700">Nivel de Frecuencia Secreta</h4>
                <div className="space-y-2.5">
                  {tickets.map((t) => (
                    <div
                      key={t.id}
                      className="p-3.5 bg-slate-50 border-2 border-pink-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className="w-4 h-4 rounded-full shrink-0 border border-white shadow-xs"
                          style={{ backgroundColor: t.color }}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">
                            {t.text}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <span>{t.author || 'Estudiante'}</span>
                            <span aria-hidden="true">·</span>
                            <span>{t.category}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 sm:w-64">
                        <input
                          type="range"
                          min="1"
                          max="40"
                          value={t.weight || 10}
                          onChange={(e) =>
                            onUpdateTicket(t.id, { weight: Number(e.target.value) })
                          }
                          className="w-full accent-pink-500 cursor-pointer h-2 bg-pink-200 rounded-lg"
                        />
                        <span className="text-xs font-bold text-pink-600 w-28 text-right whitespace-nowrap">
                          {getPriorityLabel(t.weight || 10)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TEMAS PASTEL & PERSONALIZAR TÓMBOLA */}
          {activeTab === 'settings' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Título de la Tómbola
                  </label>
                  <input
                    type="text"
                    value={config.title}
                    onChange={(e) => onUpdateConfig({ title: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-pink-200 rounded-2xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-pink-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Subtítulo / Mensaje para los Niños
                  </label>
                  <input
                    type="text"
                    value={config.subtitle}
                    onChange={(e) => onUpdateConfig({ subtitle: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-pink-200 rounded-2xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-pink-400 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Temas Visuales en Colores Pastel
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {(Object.keys(THEME_STYLES) as TombolaTheme[]).map((themeKey) => {
                    const tStyle = THEME_STYLES[themeKey];
                    return (
                      <button
                        key={themeKey}
                        onClick={() => onUpdateConfig({ theme: themeKey })}
                        className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                          config.theme === themeKey
                            ? 'border-pink-400 bg-pink-50 shadow-md ring-2 ring-pink-300'
                            : 'border-slate-200 bg-white hover:border-pink-200'
                        }`}
                      >
                        <div
                          className="w-full h-8 rounded-xl mb-2 flex items-center justify-center font-bold text-xs shadow-xs"
                          style={{ backgroundColor: tStyle.drumRing, color: '#1e293b' }}
                        >
                          {tStyle.badge}
                        </div>
                        <span className="text-xs font-bold text-slate-800 block truncate">
                          {tStyle.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 bg-amber-50/70 border-2 border-amber-200 rounded-3xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-extrabold text-amber-900 block">
                    Modo Con Reemplazo (Volver a jugar)
                  </span>
                  <span className="text-[11px] text-amber-800 mt-0.5 block">
                    Si está activado, la pregunta extraída puede volver a salir en futuros giros.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={config.withReplacement}
                  onChange={(e) => onUpdateConfig({ withReplacement: e.target.checked })}
                  className="w-6 h-6 accent-pink-500 rounded cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-pink-100 flex justify-end shrink-0 bg-pink-50/40">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-xs font-extrabold text-white bg-pink-400 hover:bg-pink-500 rounded-2xl transition-all shadow-[0_3px_0_#db2777] active:translate-y-1 active:shadow-none cursor-pointer"
            style={{ fontFamily: "'Fredoka', 'Outfit', sans-serif" }}
          >
            ¡Listo! Volver a la Tómbola 🎲
          </button>
        </div>
      </div>

      {/* POPUP MODAL: GUARDAR TÓMBOLA ACTUAL COMO NUEVO BANCO */}
      {isSavingDrumModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border-4 border-amber-300 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💾</span>
              <h4
                className="text-base font-extrabold text-slate-800"
                style={{ fontFamily: "'Fredoka', 'Outfit', sans-serif" }}
              >
                Guardar Tómbola Actual como Banco
              </h4>
            </div>
            <p className="text-xs text-slate-600">
              Se creará un nuevo banco permanente con las <strong>{tickets.length} preguntas</strong> que están actualmente en el bolillero.
            </p>

            <form onSubmit={handleSaveDrumAsPack} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Banco</label>
                <input
                  type="text"
                  required
                  value={saveDrumName}
                  onChange={(e) => setSaveDrumName(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-amber-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción</label>
                <input
                  type="text"
                  value={saveDrumDesc}
                  onChange={(e) => setSaveDrumDesc(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-amber-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ícono</label>
                <div className="flex gap-1.5">
                  {EMOJI_OPTIONS.slice(0, 6).map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setSaveDrumIcon(em)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer text-sm ${
                        saveDrumIcon === em ? 'bg-amber-300 shadow-xs' : 'bg-slate-100'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSavingDrumModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-extrabold text-slate-900 bg-amber-400 hover:bg-amber-500 rounded-xl shadow-[0_3px_0_#d97706] active:translate-y-0.5 active:shadow-none cursor-pointer"
                >
                  Guardar Banco
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
