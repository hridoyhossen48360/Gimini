
import React, { useState, useRef, useEffect } from 'react';

interface ComparisonSliderProps {
  original: string;
  reimagined: string;
}

export const ComparisonSlider: React.FC<ComparisonSliderProps> = ({ original, reimagined }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const relativeX = x - rect.left;
    const percentage = Math.max(0, Math.min(100, (relativeX / rect.width) * 100));
    setSliderPos(percentage);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video rounded-xl overflow-hidden cursor-ew-resize shadow-2xl border border-slate-200 group"
      onMouseMove={(e) => e.buttons === 1 && handleMove(e)}
      onTouchMove={handleMove}
      onMouseDown={handleMove}
    >
      {/* Background Image (Original) */}
      <img src={original} alt="Original Space" className="absolute inset-0 w-full h-full object-cover" />

      {/* Foreground Image (Reimagined) */}
      <div 
        className="absolute inset-0 w-full h-full overflow-hidden"
        style={{ width: `${sliderPos}%` }}
      >
        <img src={reimagined} alt="Reimagined Space" className="absolute inset-0 w-full h-full object-cover max-w-none" style={{ width: containerRef.current?.offsetWidth }} />
      </div>

      {/* Slider Line & Handle */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg pointer-events-none"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center border-2 border-indigo-500">
          <i className="fa-solid fa-arrows-left-right text-indigo-500 text-sm"></i>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
        REIMAGINED
      </div>
      <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
        ORIGINAL
      </div>
    </div>
  );
};
