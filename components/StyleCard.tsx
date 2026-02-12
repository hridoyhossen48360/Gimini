
import React from 'react';
import { DesignStyle } from '../types';

interface StyleCardProps {
  style: DesignStyle;
  isSelected: boolean;
  onSelect: (style: DesignStyle) => void;
  imageUrl: string;
}

export const StyleCard: React.FC<StyleCardProps> = ({ style, isSelected, onSelect, imageUrl }) => {
  return (
    <button
      onClick={() => onSelect(style)}
      className={`relative flex-shrink-0 w-40 h-52 rounded-xl overflow-hidden transition-all duration-300 transform ${
        isSelected ? 'ring-4 ring-indigo-500 scale-105 shadow-xl' : 'opacity-80 hover:opacity-100 hover:scale-102 grayscale-[50%] hover:grayscale-0'
      }`}
    >
      <img src={imageUrl} alt={style} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <span className="absolute bottom-3 left-0 right-0 text-white font-medium text-sm text-center">
        {style}
      </span>
    </button>
  );
};
