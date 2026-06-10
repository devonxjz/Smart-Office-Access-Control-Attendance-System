import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up previous animations if any
    gsap.killTweensOf(containerRef.current);
    
    // 1. Page entrance animation
    gsap.fromTo(
      containerRef.current,
      { 
        opacity: 0, 
        y: 16,
        scale: 0.99 
      },
      { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        duration: 0.45, 
        ease: "power2.out"
      }
    );

    // 2. Interactive hover/click spring effects using GSAP
    const elements = containerRef.current.querySelectorAll(
      "button, a, input[type='submit'], select, .clickable-card, [role='button']"
    ) as NodeListOf<HTMLElement>;

    const listeners: Array<{
      el: HTMLElement;
      event: string;
      handler: EventListener;
    }> = [];

    elements.forEach((el) => {
      // Skip inline navigation components or tabs that manage their own scale
      if (el.closest('.no-gsap-interaction')) return;

      const onMouseEnter = () => {
        gsap.to(el, { scale: 1.025, duration: 0.25, ease: "power2.out", overwrite: "auto" });
      };
      
      const onMouseLeave = () => {
        gsap.to(el, { scale: 1, duration: 0.25, ease: "power2.out", overwrite: "auto" });
      };

      const onMouseDown = () => {
        gsap.to(el, { scale: 0.96, duration: 0.1, ease: "power1.out", overwrite: "auto" });
      };

      const onMouseUp = () => {
        gsap.to(el, { scale: 1.025, duration: 0.15, ease: "power2.out", overwrite: "auto" });
      };

      el.addEventListener("mouseenter", onMouseEnter);
      el.addEventListener("mouseleave", onMouseLeave);
      el.addEventListener("mousedown", onMouseDown);
      el.addEventListener("mouseup", onMouseUp);

      listeners.push(
        { el, event: "mouseenter", handler: onMouseEnter as EventListener },
        { el, event: "mouseleave", handler: onMouseLeave as EventListener },
        { el, event: "mousedown", handler: onMouseDown as EventListener },
        { el, event: "mouseup", handler: onMouseUp as EventListener }
      );
    });

    return () => {
      // Clean up listeners to prevent memory leaks
      listeners.forEach(({ el, event, handler }) => {
        el.removeEventListener(event, handler);
      });
      if (containerRef.current) {
        gsap.killTweensOf(containerRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full">
      {children}
    </div>
  );
}
