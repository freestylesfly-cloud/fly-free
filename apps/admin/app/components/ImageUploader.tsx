'use client';

import { useState } from 'react';
import { Upload, X } from 'lucide-react';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export function ImageUploader({ value, onChange, label = 'Upload Image' }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      // For demo, we'll use a public upload service
      // In production, replace with your backend upload endpoint
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (uploadResponse.ok) {
        const { url } = await uploadResponse.json();
        onChange(url);
      } else {
        // Fallback: use data URL for demo
        const reader = new FileReader();
        reader.onload = (e) => {
          onChange(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      // Fallback: use data URL for demo
      const reader = new FileReader();
      reader.onload = (e) => {
        onChange(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  return (
    <div className="space-y-3">
      {value && (
        <div className="relative rounded-lg overflow-hidden bg-black/5 aspect-video">
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <button
            onClick={() => onChange('')}
            className="absolute top-2 right-2 p-2 rounded-full bg-red-600 text-white hover:bg-red-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {!value ? (
        <div className="space-y-2">
          <label className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-black/20 p-6 cursor-pointer hover:border-black/40 transition">
            <Upload size={20} />
            <span className="text-sm font-bold">{uploading ? 'Uploading...' : 'Click to upload or drag and drop'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>

          <div className="flex gap-2">
            <div className="flex-1 h-px bg-black/10 my-2" />
            <span className="text-xs text-black/50">OR</span>
            <div className="flex-1 h-px bg-black/10 my-2" />
          </div>

          {showUrlInput ? (
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="Paste image URL (https://...)"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
              />
              <button
                onClick={handleUrlSubmit}
                className="px-3 py-2 rounded-lg bg-black text-white text-sm font-bold hover:bg-black/90"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowUrlInput(false);
                  setUrlInput('');
                }}
                className="px-3 py-2 rounded-lg border border-black/10 text-sm font-bold hover:bg-black/5"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowUrlInput(true)}
              className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm font-bold hover:bg-black/5"
            >
              Use URL Instead
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={() => onChange('')}
          className="w-full px-3 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-bold hover:bg-red-50"
        >
          Remove Image
        </button>
      )}
    </div>
  );
}
