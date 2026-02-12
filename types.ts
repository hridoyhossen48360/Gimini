
export enum DesignStyle {
  SCANDINAVIAN = 'Scandinavian',
  MID_CENTURY_MODERN = 'Mid-Century Modern',
  INDUSTRIAL = 'Industrial',
  BOHEMIAN = 'Bohemian',
  MINIMALIST = 'Minimalist',
  JAPANDI = 'Japandi',
  ART_DECO = 'Art Deco'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface DesignState {
  originalImage: string | null;
  currentImage: string | null;
  history: string[];
  style: DesignStyle;
  isGenerating: boolean;
  error: string | null;
}

export type ImageSize = '1K' | '2K' | '4K';
