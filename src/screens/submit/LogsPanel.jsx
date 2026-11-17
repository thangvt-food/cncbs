import { formatTimestamp, ACTION_LABEL } from './shared';

export function LogsPanel({ logs }) {
  const safeLogs = Array.isArray(logs) ? logs : [];

  return (
    <ul className="logs-timeline">
      {safeLogs.length === 0 ? (
        <li className="meta" style={{ padding: 'var(--sp-4)', textAlign: 'center' }}>
          Chưa có hoạt động nào.
        </li>
      ) : (
        safeLogs.map((l) => (
          <li key={l.id} className="log-card">
            <div className="log-card__head">
              <span className={`log-badge log-badge--${l.action}`}>
                {ACTION_LABEL[l.action] || l.action}
              </span>
              <span className="log-card__time num">{formatTimestamp(l.at)}</span>
            </div>

            <span className="log-card__target">{l.targetLabel}</span>

            {l.by && (
              <span className="log-card__author">
                {l.by.ten || 'Ẩn danh'}{l.by.mssv ? ` (${l.by.mssv})` : ''}
              </span>
            )}

            {l.detail && <span className="log-card__detail">{l.detail}</span>}
          </li>
        ))
      )}
    </ul>
  );
}
