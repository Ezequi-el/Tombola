export type TombolaTheme = 'cottonCandy' | 'mintyFresh' | 'lavenderDreams' | 'rainbowPastel' | 'peachSunny' | 'brass' | 'slate';

export interface Ticket {
  id: string;
  text: string;
  author?: string;
  category: string;
  color: string;
  weight: number; // Raw weight for probability calculation (default 10)
  createdAt: number;
  timesDrawn: number;
}

export interface TombolaConfig {
  title: string;
  subtitle: string;
  theme: TombolaTheme;
  withReplacement: boolean; // if false, drawn ticket is removed until reset
  soundEnabled: boolean;
  spinDurationSeconds: number;
  drumSpeed: 'normal' | 'fast' | 'slow';
  predictionMode: 'weighted' | 'equal' | 'oracle_boost'; // how prediction percentages affect the draw
  oracleBoostFactor: number; // extra weight for the highest predicted item (1 to 3)
}

export interface DrawHistoryItem {
  id: string;
  ticketId: string;
  ticketText: string;
  author?: string;
  category: string;
  color: string;
  timestamp: number;
  calculatedProbability: number;
  wasPredicted: boolean;
}

export interface PresetCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
  createdAt?: number;
  tickets: Omit<Ticket, 'id' | 'createdAt' | 'timesDrawn'>[];
}

export type QuestionPack = PresetCategory;
