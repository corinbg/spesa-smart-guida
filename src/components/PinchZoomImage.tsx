import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const MIN_SCALE = 1;
const MAX_SCALE = 5;

function getTouchDistance(touches: TouchList) {
  if (touches.length < 2) return 0;
  const dx = touches[1].clientX - touches[0].clientX;
  const dy = touches[1].clientY - touches[0].clientY;
  return Math.hypot(dx, dy);
}

type PinchZoomImageProps = {
  src: string;
  alt: string;
  className?: string;
};

export function PinchZoomImage({ src, alt, className }: PinchZoomImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const transformRef = useRef(transform);
  transformRef.current = transform;

  const gestureRef = useRef({
    mode: "none" as "none" | "pan" | "pinch",
    startScale: 1,
    startDist: 0,
    startX: 0,
    startY: 0,
    startTranslateX: 0,
    startTranslateY: 0,
    lastTap: 0,
  });

  const applyTransform = useCallback((scale: number, x: number, y: number) => {
    const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
    const next =
      clamped <= MIN_SCALE ? { scale: MIN_SCALE, x: 0, y: 0 } : { scale: clamped, x, y };
    setTransform(next);
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    const gesture = gestureRef.current;

    if (e.touches.length === 2) {
      gesture.mode = "pinch";
      gesture.startDist = getTouchDistance(e.touches);
      gesture.startScale = transformRef.current.scale;
      gesture.startTranslateX = transformRef.current.x;
      gesture.startTranslateY = transformRef.current.y;
      return;
    }

    if (e.touches.length !== 1) return;

    const now = Date.now();
    if (now - gesture.lastTap < 300) {
      const current = transformRef.current;
      if (current.scale > MIN_SCALE) {
        applyTransform(MIN_SCALE, 0, 0);
      } else {
        applyTransform(2.5, 0, 0);
      }
      gesture.lastTap = 0;
      gesture.mode = "none";
      return;
    }

    gesture.lastTap = now;

    if (transformRef.current.scale > MIN_SCALE) {
      gesture.mode = "pan";
      gesture.startX = e.touches[0].clientX;
      gesture.startY = e.touches[0].clientY;
      gesture.startTranslateX = transformRef.current.x;
      gesture.startTranslateY = transformRef.current.y;
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const gesture = gestureRef.current;

    if (gesture.mode === "pinch" && e.touches.length === 2) {
      const dist = getTouchDistance(e.touches);
      if (gesture.startDist > 0) {
        const scale = gesture.startScale * (dist / gesture.startDist);
        applyTransform(scale, gesture.startTranslateX, gesture.startTranslateY);
      }
      return;
    }

    if (gesture.mode === "pan" && e.touches.length === 1) {
      const dx = e.touches[0].clientX - gesture.startX;
      const dy = e.touches[0].clientY - gesture.startY;
      applyTransform(
        transformRef.current.scale,
        gesture.startTranslateX + dx,
        gesture.startTranslateY + dy,
      );
    }
  };

  const onTouchEnd = () => {
    gestureRef.current.mode = "none";
    if (transformRef.current.scale <= MIN_SCALE) {
      applyTransform(MIN_SCALE, 0, 0);
    }
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const blockScroll = (e: TouchEvent) => {
      if (e.touches.length >= 2 || transformRef.current.scale > MIN_SCALE) {
        e.preventDefault();
      }
    };

    el.addEventListener("touchmove", blockScroll, { passive: false });
    return () => el.removeEventListener("touchmove", blockScroll);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "h-full w-full touch-none select-none overflow-hidden overscroll-none",
        className,
      )}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <div
        className="flex h-full w-full items-center justify-center"
        style={{
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
          transformOrigin: "center center",
          willChange: "transform",
        }}
      >
        <img
          src={src}
          alt={alt}
          className="pointer-events-none max-h-full max-w-full object-contain"
          draggable={false}
        />
      </div>
    </div>
  );
}
