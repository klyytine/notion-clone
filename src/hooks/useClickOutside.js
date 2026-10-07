import { useEffect, useRef } from 'react';

/** Calls `handler` on a pointer-down outside `ref`, or on Escape, while `active`. */
export function useClickOutside(ref, handler, active = true) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!active) return undefined;
    const onPointerDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) handlerRef.current(e);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') handlerRef.current(e);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [ref, active]);
}
