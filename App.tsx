
import React, { useState, useCallback, useEffect } from 'react';
import { DesignStyle, DesignState, ImageSize } from './types';
import { gemini } from './services/geminiService';
import { ComparisonSlider } from './components/ComparisonSlider';
import { StyleCard } from './components/StyleCard';
import { DesignChat } from './components/DesignChat';

const STYLE_PRESETS = [
  { style: DesignStyle.SCANDINAVIAN, img: 'https://picsum.photos/id/106/400/600' },
  { style: DesignStyle.MID_CENTURY_MODERN, img: 'https://picsum.photos/id/10/400/600' },
  { style: DesignStyle.INDUSTRIAL, img: 'https://picsum.photos/id/20/400/600' },
  { style: DesignStyle.BOHEMIAN, img: 'https://picsum.photos/id/42/400/600' },
  { style: DesignStyle.MINIMALIST, img: 'https://picsum.photos/id/50/400/600' },
  { style: DesignStyle.JAPANDI, img: 'https://picsum.photos/id/60/400/600' },
];

export default function App() {
  const [state, setState] = useState<DesignState>({
    originalImage: null,
    currentImage: null,
    history: [],
    style: DesignStyle.SCANDINAVIAN,
    isGenerating: false,
    error: null
  });

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [highResPrompt, setHighResPrompt] = useState('');
  const [selectedSize, setSelectedSize] = useState<ImageSize>('1K');

  // API Key Check for Veo/Pro features
  useEffect(() => {
    const checkKey = async () => {
      const hasKey = await (window as any).aistudio?.hasSelectedApiKey();
      if (!hasKey) setShowKeyDialog(true);
    };
    checkKey();
  }, []);

  const handleKeySelect = async () => {
    await (window as any).aistudio?.openSelectKey();
    setShowKeyDialog(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setState(prev => ({ 
          ...prev, 
          originalImage: base64, 
          currentImage: null, 
          history: [], 
          error: null 
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReimagine = async (style: DesignStyle) => {
    if (!state.originalImage) return;
    setState(prev => ({ ...prev, isGenerating: true, style, error: null }));
    try {
      const newImg = await gemini.reimagineRoom(state.originalImage, style);
      setState(prev => ({ ...prev, currentImage: newImg, isGenerating: false }));
    } catch (err) {
      setState(prev => ({ ...prev, isGenerating: false, error: "Failed to reimagine space." }));
      console.error(err);
    }
  };

  const handleRefine = async (instruction: string) => {
    const imgToEdit = state.currentImage || state.originalImage;
    if (!imgToEdit) return;
    setState(prev => ({ ...prev, isGenerating: true, error: null }));
    try {
      const newImg = await gemini.refineDesign(imgToEdit, instruction);
      setState(prev => ({ ...prev, currentImage: newImg, isGenerating: false }));
    } catch (err) {
      setState(prev => ({ ...prev, isGenerating: false, error: "Failed to update design." }));
    }
  };

  const handleAnimate = async () => {
    const img = state.currentImage || state.originalImage;
    if (!img) return;
    setIsAnimating(true);
    try {
      const url = await gemini.animateRoom(img, "A cinematic camera move showing the interior design details.");
      setVideoUrl(url);
    } catch (err) {
      console.error("Video error", err);
      if (err instanceof Error && err.message.includes("Requested entity was not found")) {
        setShowKeyDialog(true);
      }
    } finally {
      setIsAnimating(false);
    }
  };

  const handleHighResGen = async () => {
    if (!highResPrompt.trim()) return;
    setState(prev => ({ ...prev, isGenerating: true }));
    try {
      const img = await gemini.generateHighResRoom(highResPrompt, selectedSize);
      setState(prev => ({ ...prev, originalImage: img, currentImage: null, isGenerating: false }));
    } catch (err) {
      console.error(err);
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <i className="fa-solid fa-house-chimney-window text-xl"></i>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Lumina Interior</h1>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setShowKeyDialog(true)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600"
            >
              API Key Config
            </button>
            <label className="cursor-pointer bg-indigo-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
              <i className="fa-solid fa-plus mr-2"></i>
              Upload Space
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            </label>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Visualization Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Hero Section */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 min-h-[400px] flex flex-col">
            {!state.originalImage ? (
              <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                <i className="fa-solid fa-cloud-arrow-up text-5xl text-slate-300 mb-4"></i>
                <h2 className="text-xl font-semibold text-slate-800">Start Your Room Makeover</h2>
                <p className="text-slate-500 mt-2 text-center max-w-sm">
                  Upload a photo of your living room, bedroom, or office to see it reimagined by AI.
                </p>
                <label className="mt-6 cursor-pointer bg-white border border-slate-200 text-slate-800 px-6 py-2 rounded-lg font-medium hover:bg-slate-50 shadow-sm">
                  Choose Photo
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                </label>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold text-slate-800">Your Vision</h2>
                  <div className="flex gap-2">
                     <button 
                        onClick={handleAnimate}
                        disabled={isAnimating}
                        className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-all flex items-center gap-2"
                     >
                       <i className={`fa-solid ${isAnimating ? 'fa-spinner fa-spin' : 'fa-film'} text-indigo-500`}></i>
                       {isAnimating ? 'Generating Video...' : 'Animate Space'}
                     </button>
                  </div>
                </div>

                {state.currentImage ? (
                  <ComparisonSlider original={state.originalImage} reimagined={state.currentImage} />
                ) : (
                  <div className="relative rounded-xl overflow-hidden shadow-lg border border-slate-200 aspect-video">
                    <img src={state.originalImage} alt="Uploaded" className="w-full h-full object-cover" />
                    {state.isGenerating && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center animate-pulse">
                        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 font-semibold text-indigo-900">Reimagining your space...</p>
                      </div>
                    )}
                  </div>
                )}

                {videoUrl && (
                  <div className="mt-6 space-y-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <i className="fa-solid fa-play text-indigo-500"></i>
                      AI Rendered Animation
                    </h3>
                    <video src={videoUrl} controls className="w-full rounded-xl shadow-lg border border-slate-100" />
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Style Carousel */}
          {state.originalImage && (
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 px-1">Choose a Style</h3>
              <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar">
                {STYLE_PRESETS.map((p) => (
                  <StyleCard 
                    key={p.style}
                    style={p.style}
                    isSelected={state.style === p.style}
                    imageUrl={p.img}
                    onSelect={handleReimagine}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Pro Generator Section */}
          <section className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
            <h3 className="text-lg font-bold text-indigo-900 mb-2">Inspiration Generator (Pro)</h3>
            <p className="text-sm text-indigo-700/80 mb-4">Generate high-fidelity room designs from scratch using Gemini Pro Vision.</p>
            <div className="space-y-4">
              <textarea 
                value={highResPrompt}
                onChange={(e) => setHighResPrompt(e.target.value)}
                placeholder="Describe a dreamy living room with velvet emerald sofas and floor-to-ceiling windows..."
                className="w-full p-4 rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm min-h-[100px]"
              />
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {(['1K', '2K', '4K'] as ImageSize[]).map(size => (
                    <button 
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${selectedSize === size ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-indigo-600 border border-indigo-100'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={handleHighResGen}
                  disabled={state.isGenerating || !highResPrompt.trim()}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 shadow-md shadow-indigo-200"
                >
                  Generate 8K Design
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Chat & Refinements */}
        <div className="space-y-8">
           <DesignChat 
              currentImage={state.currentImage || state.originalImage}
              onRefine={handleRefine}
              isGenerating={state.isGenerating}
           />

           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
             <h4 className="font-bold text-slate-800 mb-4">Quick Adjustments</h4>
             <div className="grid grid-cols-2 gap-3">
               {[
                 { label: 'Brighter', icon: 'fa-sun', cmd: 'Make the room brighter and airier' },
                 { label: 'Add Plants', icon: 'fa-leaf', cmd: 'Add several lush indoor plants and succulents' },
                 { label: 'Change Rug', icon: 'fa-rug', cmd: 'Replace the rug with a more modern pattern' },
                 { label: 'Paint Walls', icon: 'fa-paint-roller', cmd: 'Paint the walls a soft off-white' },
               ].map(btn => (
                 <button 
                    key={btn.label}
                    onClick={() => handleRefine(btn.cmd)}
                    disabled={state.isGenerating || !state.originalImage}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition-all group disabled:opacity-50"
                 >
                   <i className={`fa-solid ${btn.icon} text-slate-400 group-hover:text-indigo-500 mb-2`}></i>
                   <span className="text-xs font-medium text-slate-600">{btn.label}</span>
                 </button>
               ))}
             </div>
           </div>
        </div>
      </main>

      {/* API Key Modal */}
      {showKeyDialog && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fa-solid fa-key text-2xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Activation Required</h2>
            <p className="text-slate-600 mb-8">
              To use high-fidelity features like Veo Video Generation and 8K Image Generation, you need to select your API key.
            </p>
            <div className="space-y-4">
              <button 
                onClick={handleKeySelect}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
              >
                Select API Key
              </button>
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noreferrer"
                className="block text-sm text-indigo-600 font-medium hover:underline"
              >
                Learn about Billing & API Keys
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
