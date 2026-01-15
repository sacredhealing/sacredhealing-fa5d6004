import React, { useRef, useEffect } from 'react';

interface SpectralVisualizerProps {
  frequencyData: Uint8Array | null;
  timeData: Uint8Array | null;
  mode?: 'bars' | 'wave' | 'radial';
  primaryColor?: string;
  secondaryColor?: string;
  height?: number;
}

export default function SpectralVisualizer({
  frequencyData,
  timeData,
  mode = 'bars',
  primaryColor = '#a855f7',
  secondaryColor = '#06b6d4',
  height = 200,
}: SpectralVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (!frequencyData && !timeData) {
      // Draw placeholder
      drawPlaceholder(ctx, rect.width, rect.height, primaryColor);
      return;
    }

    switch (mode) {
      case 'bars':
        drawBars(ctx, frequencyData!, rect.width, rect.height, primaryColor, secondaryColor);
        break;
      case 'wave':
        drawWave(ctx, timeData!, rect.width, rect.height, primaryColor);
        break;
      case 'radial':
        drawRadial(ctx, frequencyData!, rect.width, rect.height, primaryColor, secondaryColor);
        break;
    }
  }, [frequencyData, timeData, mode, primaryColor, secondaryColor]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-xl"
      style={{ height: `${height}px` }}
    />
  );
}

function drawPlaceholder(ctx: CanvasRenderingContext2D, width: number, height: number, color: string) {
  const barCount = 64;
  const barWidth = width / barCount;
  const gap = 2;

  for (let i = 0; i < barCount; i++) {
    const barHeight = Math.sin((i / barCount) * Math.PI) * height * 0.3 + 10;
    const x = i * barWidth + gap / 2;
    
    const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
    gradient.addColorStop(0, `${color}20`);
    gradient.addColorStop(1, `${color}60`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x, height - barHeight, barWidth - gap, barHeight);
  }
}

function drawBars(
  ctx: CanvasRenderingContext2D,
  data: Uint8Array,
  width: number,
  height: number,
  primary: string,
  secondary: string
) {
  const barCount = 64;
  const step = Math.floor(data.length / barCount);
  const barWidth = width / barCount;
  const gap = 2;

  for (let i = 0; i < barCount; i++) {
    const value = data[i * step];
    const barHeight = (value / 255) * height * 0.9;
    const x = i * barWidth + gap / 2;

    // Gradient based on frequency (low = primary, high = secondary)
    const ratio = i / barCount;
    const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
    gradient.addColorStop(0, `${primary}40`);
    gradient.addColorStop(0.5, primary);
    gradient.addColorStop(1, secondary);

    ctx.fillStyle = gradient;
    
    // Rounded bars
    const radius = Math.min(barWidth - gap, 4);
    roundRect(ctx, x, height - barHeight, barWidth - gap, barHeight, radius);

    // Glow effect
    ctx.shadowColor = primary;
    ctx.shadowBlur = value > 180 ? 15 : 5;
  }
  
  ctx.shadowBlur = 0;
}

function drawWave(
  ctx: CanvasRenderingContext2D,
  data: Uint8Array,
  width: number,
  height: number,
  color: string
) {
  const sliceWidth = width / data.length;
  
  // Draw multiple waves with offset for depth
  for (let wave = 2; wave >= 0; wave--) {
    ctx.beginPath();
    ctx.lineWidth = 2 + wave;
    ctx.strokeStyle = `${color}${['ff', '80', '40'][wave]}`;
    
    let x = 0;
    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 128.0;
      const y = (v * height) / 2 + (wave * 3);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }
    
    ctx.stroke();
  }

  // Add glow
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
}

function drawRadial(
  ctx: CanvasRenderingContext2D,
  data: Uint8Array,
  width: number,
  height: number,
  primary: string,
  secondary: string
) {
  const centerX = width / 2;
  const centerY = height / 2;
  const baseRadius = Math.min(width, height) * 0.25;
  const barCount = 64;
  const step = Math.floor(data.length / barCount);

  for (let i = 0; i < barCount; i++) {
    const value = data[i * step];
    const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
    const barLength = (value / 255) * baseRadius;

    const x1 = centerX + Math.cos(angle) * baseRadius;
    const y1 = centerY + Math.sin(angle) * baseRadius;
    const x2 = centerX + Math.cos(angle) * (baseRadius + barLength);
    const y2 = centerY + Math.sin(angle) * (baseRadius + barLength);

    const ratio = i / barCount;
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    gradient.addColorStop(0, primary);
    gradient.addColorStop(1, secondary);

    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = gradient;
    ctx.lineCap = 'round';
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Inner glow circle
    if (i % 8 === 0 && value > 150) {
      ctx.beginPath();
      ctx.arc(x2, y2, 4, 0, Math.PI * 2);
      ctx.fillStyle = secondary;
      ctx.shadowColor = secondary;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // Center circle
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius * 0.8);
  gradient.addColorStop(0, `${primary}30`);
  gradient.addColorStop(0.5, `${primary}10`);
  gradient.addColorStop(1, 'transparent');
  
  ctx.beginPath();
  ctx.arc(centerX, centerY, baseRadius * 0.8, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x, y + height);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}
