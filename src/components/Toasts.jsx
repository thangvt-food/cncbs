import { Close } from './icons';

export function Toasts({ toasts, dismiss }) {
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div className="toast" key={t.id}>
          <span>{t.text}</span>
          <button type="button" onClick={() => dismiss(t.id)}>
            <Close width={16} height={16} />
            <span className="sr-only">Đóng thông báo</span>
          </button>
        </div>
      ))}
    </div>
  );
}
