import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function DemoBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-amber-100 border-b border-amber-200 px-4 py-2 flex items-center justify-between z-50 text-sm">
      <div className="flex items-center text-amber-800 font-medium">
        <span className="mr-2">⚕️</span>
        DEMONSTRATION MODE — All patient data shown is completely synthetic and created for demonstration purposes only.
      </div>
      <button 
        onClick={() => setIsVisible(false)}
        className="text-amber-700 hover:text-amber-900 focus:outline-none"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
