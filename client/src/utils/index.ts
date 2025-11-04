import { createStaticStore } from '@solid-primitives/static-store';

export const noop = () => {/* None */ };

export function useLastPointerDown() {
  const [pos, setPos] = createStaticStore({ x: 0, y: 0, e: null });
  makeEventListener(
    window,
    'pointerdown',
    e => setPos({ x: e.clientX, y: e.clientY, e }),
    { passive: true }
  );

  return pos;
}
