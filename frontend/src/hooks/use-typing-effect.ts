"use client";

import { useEffect, useRef, useState } from "react";

export function useTypingEffect(text: string, delay = 0, charInterval = 35) {
  const [displayed, setDisplayed] = useState("");
  const ref = useRef<HTMLElement>(null);
  const fired = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fired.current) {
          fired.current = true;
          let i = 0;
          const start = () => {
            const interval = setInterval(() => {
              i++;
              setDisplayed(text.slice(0, i));
              if (i >= text.length) clearInterval(interval);
            }, charInterval);
          };
          if (delay > 0) setTimeout(start, delay);
          else start();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [text, delay, charInterval]);

  return { displayed, ref };
}
