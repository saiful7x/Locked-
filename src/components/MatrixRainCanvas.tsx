import { useEffect, useRef } from 'react';

interface MatrixRainCanvasProps {
  locked?: boolean;
}

export function MatrixRainCanvas({ locked = false }: MatrixRainCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animationId = 0;
    let width = 0;
    let height = 0;
    const fontSize = 14;
    let columns = 0;
    let drops: number[] = [];
    let isRedColumn: boolean[] = [];

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      width = parent.clientWidth;
      height = parent.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      columns = Math.max(1, Math.floor(width / (fontSize * 1.25)));
      drops = Array.from({ length: columns }, () => Math.floor(Math.random() * -40));
      isRedColumn = Array.from({ length: columns }, () => Math.random() < 0.14);
    };

    resize();
    const observer = new ResizeObserver(resize);
    if (canvas.parentElement) {
      observer.observe(canvas.parentElement);
    }

    const drawStatic = () => {
      ctx.fillStyle = '#020604';
      ctx.fillRect(0, 0, width, height);
      ctx.font = `600 ${fontSize}px "JetBrains Mono", monospace`;
      for (let i = 0; i < columns; i++) {
        const x = i * fontSize * 1.25;
        for (let row = 0; row < Math.floor(height / fontSize); row += 3) {
          if (Math.random() < 0.35) {
            const char = Math.random() > 0.5 ? '1' : '0';
            ctx.fillStyle = isRedColumn[i]
              ? 'rgba(185, 28, 28, 0.25)'
              : 'rgba(16, 185, 129, 0.22)';
            ctx.fillText(char, x, row * fontSize);
          }
        }
      }
    };

    if (prefersReducedMotion) {
      drawStatic();
      return () => observer.disconnect();
    }

    let lastTime = 0;
    const frameInterval = 62;

    const render = (time: number) => {
      animationId = requestAnimationFrame(render);
      if (time - lastTime < frameInterval) return;
      lastTime = time;

      ctx.fillStyle = 'rgba(2, 6, 4, 0.14)';
      ctx.fillRect(0, 0, width, height);
      ctx.font = `600 ${fontSize}px "JetBrains Mono", monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = Math.random() > 0.5 ? '1' : '0';
        const x = i * fontSize * 1.25;
        const y = drops[i] * fontSize;

        if (y > 0) {
          if (locked && isRedColumn[i]) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.42)';
          } else if (isRedColumn[i]) {
            ctx.fillStyle = 'rgba(185, 28, 28, 0.32)';
          } else if (Math.random() > 0.85) {
            ctx.fillStyle = 'rgba(52, 211, 153, 0.55)';
          } else {
            ctx.fillStyle = 'rgba(16, 185, 129, 0.32)';
          }
          ctx.fillText(char, x, y);
        }

        if (y > height && Math.random() > 0.96) {
          drops[i] = 0;
          isRedColumn[i] = Math.random() < (locked ? 0.28 : 0.14);
        } else {
          drops[i]++;
        }
      }
    };

    ctx.fillStyle = '#020604';
    ctx.fillRect(0, 0, width, height);
    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  }, [locked]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
