import { formatTimestamp, ACTION_LABEL } from './shared';

export function LogsPanel({ logs }) {
  return (
    <ul className="logs-timeline">
      {logs.length === 0 ? (
        <li className="meta" style={{ padding: 'var(--sp-4)', textAlign: 'center' }}>
          Chưa có hoạt động nào.
        </li>
      ) : (
        logs.map((l) => (
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
                {l.by.ten} ({l.by.mssv})
              </span>
            )}

            {l.detail && <span className="log-card__detail">{l.detail}</span>}
          </li>
        ))
      )}
    </ul>
  );
}
