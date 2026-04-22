import type { CSSProperties } from 'react';

export const PARTICLE_STYLES: CSSProperties[] = Array.from({ length: 20 }, () => ({
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  animationDelay: `${Math.random() * 8}s`,
  animationDuration: `${6 + Math.random() * 8}s`,
  width: `${2 + Math.random() * 3}px`,
  height: `${2 + Math.random() * 3}px`,
  opacity: 0.15 + Math.random() * 0.2,
}));
