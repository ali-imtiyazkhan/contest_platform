"use client";

import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const ring = ringRef.current;
    if (!cursor || !ring) return;

    const onMove = (e: MouseEvent) => {
      cursor.style.transform = `translate(${e.clientX - 7}px, ${e.clientY - 7}px)`;
      ring.style.transform = `translate(${e.clientX - 20}px, ${e.clientY - 20}px)`;
    };

    const onEnter = () => {
      cursor.style.transform += " scale(2.5)";
    };

    const onLeave = (e: Event) => {
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      cursor.style.transform = `translate(${rect.left}px, ${rect.top}px)`;
    };

    document.addEventListener("mousemove", onMove);

    const interactables = document.querySelectorAll<HTMLElement>(
      "a, button, input, textarea"
    );
    interactables.forEach((el) => {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });

    return () => {
      document.removeEventListener("mousemove", onMove);
      interactables.forEach((el) => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      });
    };
  }, []);

  return (
    <>
      <div ref={cursorRef} className="custom-cursor" />
      <div ref={ringRef} className="cursor-ring" />
    </>
  );
}
