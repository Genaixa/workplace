"use client";
import { useEffect, useRef, ReactNode } from "react";

type Animation = "fadeInUp" | "fadeInLeft" | "fadeInRight" | "fadeIn" | "zoomIn";

interface Props {
  children: ReactNode;
  animation?: Animation;
  delay?: number;
  className?: string;
}

export default function ScrollReveal({ children, animation = "fadeInUp", delay = 0, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const inView = rect.top < window.innerHeight * 1.05;

    if (inView) {
      if (delay) el.style.animationDelay = `${delay}ms`;
      el.classList.add(`anim-${animation}`);
      return;
    }

    // Below fold: hide via inline style (no class in SSR HTML), then reveal on scroll
    el.style.opacity = "0";

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "";
          if (delay) el.style.animationDelay = `${delay}ms`;
          el.classList.add(`anim-${animation}`);
          observer.unobserve(el);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [animation, delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
