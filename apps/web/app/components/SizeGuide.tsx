'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

export function SizeGuide() {
  const [isOpen, setIsOpen] = useState(false);

  const sizes = [
    { size: 'S', chest: '44"', shoulder: '20.5"', length: '28"', sleeve: '8.5"' },
    { size: 'M', chest: '46"', shoulder: '21.5"', length: '29"', sleeve: '9"' },
    { size: 'L', chest: '48"', shoulder: '22.5"', length: '30"', sleeve: '9.5"' },
    { size: 'XL', chest: '51"', shoulder: '23.5"', length: '30.5"', sleeve: '10"' },
  ];

  return (
    <div className="space-y-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 rounded-lg border border-black/10 px-4 py-2.5 font-bold hover:bg-black/5 transition"
      >
        <span>📏 Size Guide</span>
        <ChevronDown size={18} className={`transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="rounded-lg border border-black/10 bg-black/[0.02] p-5 space-y-4">
          {/* Size Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/10">
                  <th className="px-4 py-2 text-left font-bold">Size</th>
                  <th className="px-4 py-2 text-left font-bold">Chest</th>
                  <th className="px-4 py-2 text-left font-bold">Shoulder</th>
                  <th className="px-4 py-2 text-left font-bold">Length</th>
                  <th className="px-4 py-2 text-left font-bold">Sleeve</th>
                </tr>
              </thead>
              <tbody>
                {sizes.map((s) => (
                  <tr key={s.size} className="border-b border-black/5">
                    <td className="px-4 py-2.5 font-black text-ink">{s.size}</td>
                    <td className="px-4 py-2.5">{s.chest}</td>
                    <td className="px-4 py-2.5">{s.shoulder}</td>
                    <td className="px-4 py-2.5">{s.length}</td>
                    <td className="px-4 py-2.5">{s.sleeve}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* How to Measure */}
          <div className="border-t border-black/10 pt-4 space-y-3">
            <h3 className="font-bold">How to Measure</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="font-bold">1. Shoulder</p>
                <p className="text-black/70">Straight across the back from one shoulder seam to the other, tape flat along the upper back.</p>
              </div>
              <div>
                <p className="font-bold">2. Chest</p>
                <p className="text-black/70">Around the fullest part of your chest, tape level and parallel to the ground. Arms relaxed at your sides.</p>
              </div>
              <div>
                <p className="font-bold">3. Length</p>
                <p className="text-black/70">From the base of your neck down the center of your back to the hem.</p>
              </div>
              <div>
                <p className="font-bold">4. Sleeve</p>
                <p className="text-black/70">From center back neck, across shoulder, down to wrist with arm relaxed at 90°.</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-black/60 pt-2">
            ✓ All measurements are in inches
            ✓ Compare with a garment that fits you well
            ✓ Designed for Indian physique
          </p>
        </div>
      )}
    </div>
  );
}
