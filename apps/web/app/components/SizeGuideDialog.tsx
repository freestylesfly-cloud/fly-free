'use client';

import { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';

interface SizeGuide {
  id: string;
  size: string;
  chest: string;
  shoulder: string;
  length: string;
  sleeve: string;
}

export function SizeGuideDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [sizes, setSizes] = useState<SizeGuide[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && sizes.length === 0) {
      loadSizes();
    }
  }, [isOpen]);

  const loadSizes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/admin/size-guides`);
      if (response.ok) {
        const data = await response.json();
        setSizes(data);
      }
    } catch (error) {
      console.error('Failed to load sizes:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-black/10 px-4 py-2.5 font-bold hover:bg-black/5 transition"
      >
        <span>📏 Size Guide</span>
        <ChevronDown size={18} />
      </button>

      {/* Dialog Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Dialog Panel - Bottom Sheet on Mobile, Center Modal on Desktop */}
      <div
        className={`fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none ${
          isOpen ? 'pointer-events-auto' : ''
        }`}
      >
        <div
          className={`bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-2xl md:max-h-[90vh] overflow-y-auto shadow-2xl transition-transform duration-300 pointer-events-auto ${
            isOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-black/10 px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <h2 className="text-2xl font-black">📏 Size Guide</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-black/10 rounded-lg transition"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {loading ? (
              <p className="text-center text-black/60 py-8">Loading size information...</p>
            ) : sizes.length === 0 ? (
              <p className="text-center text-black/60 py-8">Size guide data not available</p>
            ) : (
              <>
                {/* Size Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-black/10 bg-black/[0.02]">
                        <th className="px-4 py-3 text-left font-bold">Size</th>
                        <th className="px-4 py-3 text-left font-bold">Chest</th>
                        <th className="px-4 py-3 text-left font-bold">Shoulder</th>
                        <th className="px-4 py-3 text-left font-bold">Length</th>
                        <th className="px-4 py-3 text-left font-bold">Sleeve</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sizes.map((size) => (
                        <tr key={size.id} className="border-b border-black/5 hover:bg-black/2">
                          <td className="px-4 py-3 font-bold text-lg">{size.size}</td>
                          <td className="px-4 py-3">{size.chest}</td>
                          <td className="px-4 py-3">{size.shoulder}</td>
                          <td className="px-4 py-3">{size.length}</td>
                          <td className="px-4 py-3">{size.sleeve}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* How to Measure Guide */}
                <div className="border-t border-black/10 pt-6">
                  <h3 className="font-bold text-lg mb-4">📐 How to Measure</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <p className="font-bold flex items-center gap-2">
                          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-black text-white text-xs font-bold">1</span>
                          Shoulder
                        </p>
                        <p className="text-sm text-black/70 ml-9 mt-1">Straight across the back from one shoulder seam to the other, tape flat along the upper back.</p>
                      </div>
                      <div>
                        <p className="font-bold flex items-center gap-2">
                          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-black text-white text-xs font-bold">2</span>
                          Chest
                        </p>
                        <p className="text-sm text-black/70 ml-9 mt-1">Around the fullest part of your chest, tape level and parallel to the ground. Arms relaxed at your sides.</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="font-bold flex items-center gap-2">
                          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-black text-white text-xs font-bold">3</span>
                          Length
                        </p>
                        <p className="text-sm text-black/70 ml-9 mt-1">From the base of your neck down the center of your back to the hem.</p>
                      </div>
                      <div>
                        <p className="font-bold flex items-center gap-2">
                          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-black text-white text-xs font-bold">4</span>
                          Sleeve
                        </p>
                        <p className="text-sm text-black/70 ml-9 mt-1">From center back neck, across shoulder, down to wrist with arm relaxed at 90°.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tips */}
                <div className="rounded-lg bg-black/[0.02] border border-black/10 p-4 space-y-2">
                  <p className="text-sm font-bold">💡 Pro Tips:</p>
                  <ul className="text-xs text-black/70 space-y-1 list-disc list-inside">
                    <li>All measurements are in inches</li>
                    <li>Compare with a garment that fits you well</li>
                    <li>Sizes designed for Indian physique</li>
                    <li>For oversized fit, choose one size up</li>
                  </ul>
                </div>
              </>
            )}

            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="w-full py-3 rounded-lg bg-black text-white font-bold hover:bg-black/90 transition"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
