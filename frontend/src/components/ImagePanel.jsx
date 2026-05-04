import { useState } from "react";
import { API_BASE_URL } from '../api/config';

export function ImagePanel({ title, imageUrl, altText }) {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!imageUrl) return null;

  const isAbsoluteUrl = imageUrl.startsWith('http://') || imageUrl.startsWith('https://');
  const finalUrl = isAbsoluteUrl ? imageUrl : `${API_BASE_URL}${imageUrl}`;
  
  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-100">{title}</div>
        <button 
          className="btn text-xs" 
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? "Hide Photo" : "View Photo"}
        </button>
      </div>
      {isOpen && (
        <div className="mt-3 animate-fade-in">
          <img 
            src={finalUrl} 
            alt={altText || title} 
            className="w-full max-w-full h-auto rounded-xl border border-white/10 object-cover"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      )}
    </div>
  );
}
