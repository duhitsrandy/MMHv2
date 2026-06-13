import { useEffect, useState } from 'react';

let phase = 'init';
const listeners = new Set<() => void>();

export function setIosBootPhase(next: string): void {
  if (phase === next) {
    return;
  }
  phase = next;
  for (const listener of listeners) {
    listener();
  }
}

export function getIosBootPhase(): string {
  return phase;
}

export function subscribeIosBootPhase(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useIosBootPhase(): string {
  const [current, setCurrent] = useState(getIosBootPhase);
  useEffect(() => subscribeIosBootPhase(() => setCurrent(getIosBootPhase())), []);
  return current;
}
