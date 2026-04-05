"use client";

import { useEffect, useRef, useState } from "react";

export function CursorDot() {
  const dotRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -100, y: -100 });
  const lerp = useRef({ x: -100, y: -100 });
  const raf = useRef<number>(0);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    // Don't show on touch devices
    if (navigator.maxTouchPoints > 0) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    document.documentElement.classList.add("cursor-custom");

    const onMouseMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("a, button")) setScale(2.2);
    };
    const onMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("a, button")) setScale(1);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseover", onMouseOver);
    document.addEventListener("mouseout", onMouseOut);

    function animate() {
      lerp.current.x += (pos.current.x - lerp.current.x) * 0.15;
      lerp.current.y += (pos.current.y - lerp.current.y) * 0.15;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${lerp.current.x - 4}px, ${lerp.current.y - 4}px) scale(${scale})`;
      }
      raf.current = requestAnimationFrame(animate);
    }
    raf.current = requestAnimationFrame(animate);

    return () => {
      document.documentElement.classList.remove("cursor-custom");
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseover", onMouseOver);
      document.removeEventListener("mouseout", onMouseOut);
      cancelAnimationFrame(raf.current);
    };
  }, [scale]);

  if (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0) return null;

  return (
    <div
      ref={dotRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[9999] h-2 w-2 rounded-full bg-[#0070F3] transition-transform duration-200"
      style={{
        boxShadow: "0 0 10px #0070F3, 0 0 20px rgba(0,112,243,0.4)",
        willChange: "transform",
      }}
    />
  );
}
