import { useEffect, useRef } from 'react';
import { Close } from './icons';

export function Sheet({ title, open, onClose, children }) {
  const panel = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.activeElement;
    const restore = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = restore;
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="sheet__scrim" onClick={onClose} aria-label="Đóng bảng" tabIndex={-1} />
      <div className="sheet__panel" ref={panel} tabIndex={-1}>
        <div className="sheet__handle" />
        <div className="sheet__head">
          <h2>{title}</h2>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onClose}>
            <Close />
            <span className="sr-only">Đóng</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
