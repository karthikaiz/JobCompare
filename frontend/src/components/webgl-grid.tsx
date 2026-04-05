"use client";

import { useEffect, useRef } from "react";

export function WebGLGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });
  const offset = useRef({ x: 0, y: 0 });
  const raf = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const GRID = 60;
    const PROXIMITY = 150;
    const PARALLAX_STRENGTH = 12;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMouseMove);

    function draw() {
      if (!ctx || !canvas) return;

      // Lerp offset toward mouse-based parallax
      const targetX = ((mouse.current.x / canvas.width) - 0.5) * -PARALLAX_STRENGTH;
      const targetY = ((mouse.current.y / canvas.height) - 0.5) * -PARALLAX_STRENGTH;
      offset.current.x += (targetX - offset.current.x) * 0.05;
      offset.current.y += (targetY - offset.current.y) * 0.05;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const ox = offset.current.x;
      const oy = offset.current.y;

      // Draw grid lines in a single path
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;

      const cols = Math.ceil(canvas.width / GRID) + 2;
      const rows = Math.ceil(canvas.height / GRID) + 2;

      for (let i = 0; i <= cols; i++) {
        const x = (i * GRID + (ox % GRID)) - GRID;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
      }
      for (let j = 0; j <= rows; j++) {
        const y = (j * GRID + (oy % GRID)) - GRID;
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
      }
      ctx.stroke();

      // Draw intersection dots
      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          const x = (i * GRID + (ox % GRID)) - GRID;
          const y = (j * GRID + (oy % GRID)) - GRID;
          const dx = x - mouse.current.x;
          const dy = y - mouse.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < PROXIMITY) {
            const intensity = 1 - dist / PROXIMITY;
            ctx.beginPath();
            ctx.arc(x, y, 1.5 + intensity * 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0,112,243,${0.15 + intensity * 0.6})`;
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255,255,255,0.07)";
            ctx.fill();
          }
        }
      }

      raf.current = requestAnimationFrame(draw);
    }

    raf.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}
