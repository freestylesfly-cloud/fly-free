'use client';

import { useEffect, useRef, useState } from 'react';

interface DesignPreviewProps {
  imageUrl?: string;
  tshirtColor: string;
  placement: string;
  size: string;
}

export function DesignCanvasPreview({
  imageUrl,
  tshirtColor,
  placement,
  size
}: DesignPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!canvasRef.current || !imageUrl) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawPreview = async () => {
      try {
        setLoading(true);
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          canvas.width = 400;
          canvas.height = 500;

          // Draw t-shirt
          ctx.fillStyle = tshirtColor;
          ctx.beginPath();
          ctx.moveTo(80, 100);
          ctx.lineTo(120, 80);
          ctx.lineTo(280, 80);
          ctx.lineTo(320, 100);
          ctx.lineTo(320, 350);
          ctx.quadraticCurveTo(200, 420, 80, 350);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#ccc';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Draw sleeves
          ctx.fillRect(20, 100, 60, 120);
          ctx.fillRect(320, 100, 60, 120);

          // Draw collar
          ctx.beginPath();
          ctx.ellipse(200, 90, 40, 20, 0, 0, Math.PI * 2);
          ctx.fill();

          let x = 200, y = 200, width = 100, height = 100;
          if (placement === 'Sleeve') {
            x = 50; y = 140; width = 40; height = 60;
          }

          ctx.drawImage(img, x - width / 2, y - height / 2, width, height);

          // Labels
          ctx.fillStyle = '#666';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${placement}`, 200, 470);
          ctx.font = '11px sans-serif';
          ctx.fillText(`Size: ${size}`, 200, 485);

          setLoading(false);
        };

        img.onerror = () => {
          setLoading(false);
        };

        img.src = imageUrl;
      } catch (error) {
        console.error('Error:', error);
        setLoading(false);
      }
    };

    drawPreview();
  }, [imageUrl, tshirtColor, placement, size]);

  return (
    <canvas
      ref={canvasRef}
      className="border-2 border-gray-300 rounded-lg"
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
}
