import { PresetCategory, Ticket, TombolaTheme } from '../types/tombola';

export const THEME_STYLES: Record<TombolaTheme, {
  name: string;
  badge: string;
  bgGradient: string;
  drumWire: string;
  drumRing: string;
  drumRim: string;
  accent: string;
  accentHover: string;
  accentText: string;
  ballColors: string[];
  standColor: string;
  baseColor: string;
}> = {
  cottonCandy: {
    name: 'Algodón de Azúcar',
    badge: 'Dulce Pastel',
    bgGradient: 'from-pink-100/90 via-purple-50/80 to-sky-100/90',
    drumWire: '#F472B6',
    drumRing: '#F9A8D4',
    drumRim: '#FBCFE8',
    accent: 'bg-pink-400 hover:bg-pink-500 shadow-[0_6px_0_#db2777]',
    accentHover: 'hover:bg-pink-500',
    accentText: 'text-white',
    ballColors: ['#FF9AA2', '#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#C7CEEA', '#FBCFE8', '#BAE6FD'],
    standColor: '#F472B6',
    baseColor: '#FDE047',
  },
  mintyFresh: {
    name: 'Menta & Limón',
    badge: 'Fresquito',
    bgGradient: 'from-emerald-100/80 via-teal-50/70 to-amber-100/80',
    drumWire: '#34D399',
    drumRing: '#6EE7B7',
    drumRim: '#A7F3D0',
    accent: 'bg-emerald-400 hover:bg-emerald-500 shadow-[0_6px_0_#059669]',
    accentHover: 'hover:bg-emerald-500',
    accentText: 'text-white',
    ballColors: ['#A7F3D0', '#BAE6FD', '#FDE047', '#FED7AA', '#DDD6FE', '#FBCFE8', '#6EE7B7', '#99F6E4'],
    standColor: '#10B981',
    baseColor: '#FBBF24',
  },
  lavenderDreams: {
    name: 'Lavanda & Estrellitas',
    badge: 'Mágico',
    bgGradient: 'from-purple-100/90 via-fuchsia-50/80 to-indigo-100/90',
    drumWire: '#A855F7',
    drumRing: '#C084FC',
    drumRim: '#E9D5FF',
    accent: 'bg-purple-400 hover:bg-purple-500 shadow-[0_6px_0_#7e22ce]',
    accentHover: 'hover:bg-purple-500',
    accentText: 'text-white',
    ballColors: ['#C4B5FD', '#FBCFE8', '#BAE6FD', '#FED7AA', '#FDE68A', '#A7F3D0', '#E9D5FF', '#DDD6FE'],
    standColor: '#8B5CF6',
    baseColor: '#F472B6',
  },
  rainbowPastel: {
    name: 'Arcoíris Escolar',
    badge: 'Multicolor',
    bgGradient: 'from-amber-100/80 via-rose-50/80 to-sky-100/90',
    drumWire: '#38BDF8',
    drumRing: '#FBBF24',
    drumRim: '#F472B6',
    accent: 'bg-sky-400 hover:bg-sky-500 shadow-[0_6px_0_#0284c7]',
    accentHover: 'hover:bg-sky-500',
    accentText: 'text-white',
    ballColors: ['#FDA4AF', '#FCD34D', '#86EFAC', '#93C5FD', '#C4B5FD', '#F9A8D4', '#67E8F9', '#FED7AA'],
    standColor: '#38BDF8',
    baseColor: '#34D399',
  },
  peachSunny: {
    name: 'Día Soleado',
    badge: 'Cálido',
    bgGradient: 'from-orange-100/80 via-amber-50/80 to-yellow-100/90',
    drumWire: '#FB923C',
    drumRing: '#FDBA74',
    drumRim: '#FFEDD5',
    accent: 'bg-amber-400 hover:bg-amber-500 shadow-[0_6px_0_#d97706]',
    accentHover: 'hover:bg-amber-500',
    accentText: 'text-slate-900',
    ballColors: ['#FED7AA', '#FDE68A', '#FECDD3', '#BAE6FD', '#BBF7D0', '#DDD6FE', '#FDBA74', '#FEF08A'],
    standColor: '#F97316',
    baseColor: '#38BDF8',
  },
  brass: {
    name: 'Dorado Brillante',
    badge: 'Brillo',
    bgGradient: 'from-amber-100/70 via-stone-50 to-orange-100/70',
    drumWire: '#D97706',
    drumRing: '#FBBF24',
    drumRim: '#FEF3C7',
    accent: 'bg-amber-500 hover:bg-amber-600 shadow-[0_6px_0_#b45309]',
    accentHover: 'hover:bg-amber-600',
    accentText: 'text-white',
    ballColors: ['#FDE047', '#F87171', '#34D399', '#60A5FA', '#A78BFA', '#F472B6', '#2DD4BF', '#FB923C'],
    standColor: '#B45309',
    baseColor: '#D97706',
  },
  slate: {
    name: 'Nube Suave',
    badge: 'Calma',
    bgGradient: 'from-slate-100 via-sky-50 to-indigo-50',
    drumWire: '#64748B',
    drumRing: '#94A3B8',
    drumRim: '#CBD5E1',
    accent: 'bg-slate-700 hover:bg-slate-800 shadow-[0_6px_0_#1e293b]',
    accentHover: 'hover:bg-slate-800',
    accentText: 'text-white',
    ballColors: ['#94A3B8', '#A5B4FC', '#BAE6FD', '#A7F3D0', '#FDE68A', '#FECDD3', '#DDD6FE', '#CBD5E1'],
    standColor: '#475569',
    baseColor: '#64748B',
  },
};

export const PRESET_PACKS: PresetCategory[] = [
  {
    "id": "seccion-preguntas",
    "name": "Sección de preguntas",
    "description": "Preguntas sobre el cuidado del cuerpo, la alimentación y el movimiento.",
    "icon": "❓",
    "tickets": [
      {
        "text": "¿Qué podrías hacer durante el día para cuidar tu cuerpo?",
        "category": "Preguntas",
        "color": "#BAE6FD",
        "weight": 10
      },
      {
        "text": "Después de estar varias horas sentado, tienes 15 minutos libres. ¿Qué podrías hacer?",
        "category": "Preguntas",
        "color": "#BAE6FD",
        "weight": 10
      },
      {
        "text": "Vas a pasar varias horas fuera de casa. ¿Qué podrías llevar para comer?",
        "category": "Preguntas",
        "color": "#BAE6FD",
        "weight": 10
      },
      {
        "text": "Hoy no tienes ganas de practicar un deporte. ¿De qué otra manera podrías moverte?",
        "category": "Preguntas",
        "color": "#BAE6FD",
        "weight": 10
      },
      {
        "text": "Si pudieras agregar un alimento diferente a tu comida de hoy, ¿cuál elegirías y por qué?",
        "category": "Preguntas",
        "color": "#BAE6FD",
        "weight": 10
      },
      {
        "text": "¿Por qué crees que necesitamos diferentes tipos de alimentos?",
        "category": "Preguntas",
        "color": "#BAE6FD",
        "weight": 10
      },
      {
        "text": "¿Qué actividad física disfrutas hacer?",
        "category": "Preguntas",
        "color": "#BAE6FD",
        "weight": 10
      },
      {
        "text": "Después de jugar y moverte mucho, ¿qué crees que necesita tu cuerpo?",
        "category": "Preguntas",
        "color": "#BAE6FD",
        "weight": 10
      },
      {
        "text": "¿Qué podrías hacer durante el día para cuidar tu cuerpo?",
        "category": "Preguntas",
        "color": "#BAE6FD",
        "weight": 10
      }
    ]
  },
  {
    "id": "seccion-frases",
    "name": "Sección de frases",
    "description": "Frases para disfrutar el movimiento y la alimentación.",
    "icon": "💬",
    "tickets": [
      {
        "text": "Moverte es un superpoder! Encuentra el juego, baile o deporte que más te haga sonreír hoy.",
        "category": "Frases",
        "color": "#B5EAD7",
        "weight": 10
      },
      {
        "text": "Tu cuerpo es asombroso y capaz de grandes cosas. ¡Dale el movimiento que más disfrute!",
        "category": "Frases",
        "color": "#B5EAD7",
        "weight": 10
      },
      {
        "text": "Incluso 15 minutos de juego libre pueden llenar tu día de energía. ¡Sal a divertirte!",
        "category": "Frases",
        "color": "#B5EAD7",
        "weight": 10
      },
      {
        "text": "No hay una sola forma de estar activo. ¡Camina, salta, baila o corre, lo que te haga feliz!",
        "category": "Frases",
        "color": "#B5EAD7",
        "weight": 10
      },
      {
        "text": "Cuando juegas y te mueves, ¡tu cuerpo y tu mente te lo agradecen con mucha alegría!",
        "category": "Frases",
        "color": "#B5EAD7",
        "weight": 10
      },
      {
        "text": "Probar alimentos nuevos es como una aventura para tu paladar. ¡Atrévete a descubrir nuevos sabores!",
        "category": "Frases",
        "color": "#B5EAD7",
        "weight": 10
      },
      {
        "text": "Llenar tu día de colores en tus comidas es la mejor forma de darle a tu cuerpo la energía que necesita.",
        "category": "Frases",
        "color": "#B5EAD7",
        "weight": 10
      },
      {
        "text": "¡Cada pequeño bocado saludable y rico es un regalo de energía y fuerza para ti!",
        "category": "Frases",
        "color": "#B5EAD7",
        "weight": 10
      },
      {
        "text": "Escucha a tu cuerpo: él sabe cuándo necesita agua, comida rica o un buen descanso.",
        "category": "Frases",
        "color": "#B5EAD7",
        "weight": 10
      },
      {
        "text": "Alimentarte bien no se trata de reglas, sino de elegir con amor lo que te hace sentir fuerte y feliz.",
        "category": "Frases",
        "color": "#B5EAD7",
        "weight": 10
      }
    ]
  }
];

export const INITIAL_TICKETS: Ticket[] = PRESET_PACKS[0].tickets.map((ticket, index) => ({ ...ticket, id: "pregunta-" + (index + 1), createdAt: 0, timesDrawn: 0 }));
