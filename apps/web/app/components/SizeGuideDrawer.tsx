"use client";

import React from "react";

export default function SizeGuideDrawer({ open, onClose, content }: { open: boolean; onClose: () => void; content?: string }) {
  if (!open) return null;

  return (
    <div>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white shadow-xl overflow-y-auto" style={{ borderLeft: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h3 className="text-lg font-black">Size Guide (in inches)</h3>
          <button onClick={onClose} className="font-black">Close</button>
        </div>

        <div className="p-4 space-y-4">
          {content ? (
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
          ) : (
            <div>
              <table className="w-full table-fixed text-sm border" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr className="bg-[#ff6b5b] text-white">
                    <th className="p-2 text-left">Size</th>
                    <th className="p-2">Chest</th>
                    <th className="p-2">Shoulder</th>
                    <th className="p-2">Length</th>
                    <th className="p-2">Sleeve</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t"><td className="p-2">S</td><td className="p-2">44"</td><td className="p-2">20.5"</td><td className="p-2">28"</td><td className="p-2">8.5"</td></tr>
                  <tr className="border-t"><td className="p-2">M</td><td className="p-2">46"</td><td className="p-2">21.5"</td><td className="p-2">29"</td><td className="p-2">9"</td></tr>
                  <tr className="border-t"><td className="p-2">L</td><td className="p-2">48"</td><td className="p-2">22.5"</td><td className="p-2">30"</td><td className="p-2">9.5"</td></tr>
                  <tr className="border-t"><td className="p-2">XL</td><td className="p-2">51"</td><td className="p-2">23.5"</td><td className="p-2">30.5"</td><td className="p-2">10"</td></tr>
                </tbody>
              </table>

              <div className="mt-4">
                <h4 className="font-black">How to measure</h4>
                <ol className="list-decimal list-inside text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <li className="mt-2">Shoulder — Straight across the back from one shoulder seam to the other.</li>
                  <li className="mt-2">Chest — Around the fullest part of your chest, tape level and parallel to the ground.</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
