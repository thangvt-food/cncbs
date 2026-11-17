import { useState } from 'react';
import { AlertCircle, Check, Download, Link as LinkIcon } from '../../components/icons';
import {
  TH_SUA_BAI,
  formatBytes,
  getSubmissionFileUrl,
  laLink,
  submissionId,
} from '../../lib/submissions';
import { formatTimestamp, isSafeHttpUrl, tinhTienSu } from './shared';

/* Bảng tổng hợp dạng quản lý: chỉ kiểm tra tiến độ, không có thao tác nộp/sửa/xoá
   (tránh trùng lặp với tab Nộp bài). */
export function OverviewPanel({ subs = {} }) {
  const [filterMode, setFilterMode] = useState('all');
  const safeSubs = subs || {};
  const { thieu, done, total } = tinhTienSu(safeSubs);

  const hasItems = filterMode === 'missing' ? thieu.length > 0 : filterMode === 'done' ? done > 0 : total > 0;

  return (
    <div className="overview-panel">
      <div className="overview-toolbar">
        <div className="filter-pills" role="group" aria-label="Lọc danh sách">
          <button type="button" className="filter-pill" data-active={filterMode === 'all'} onClick={() => setFilterMode('all')}>
            Tất cả ({total})
          </button>
          <button type="button" className="filter-pill" data-active={filterMode === 'missing'} onClick={() => setFilterMode('missing')}>
            Thiếu ({thieu.length})
          </button>
          <button type="button" className="filter-pill" data-active={filterMode === 'done'} onClick={() => setFilterMode('done')}>
            Đã nộp ({done})
          </button>
        </div>
      </div>

      {thieu.length > 0 && filterMode !== 'done' && (
        <div className="missing-banner">
          <AlertCircle width={15} height={15} style={{ color: 'var(--cinnabar)', flexShrink: 0 }} />
          <span>
            Còn <strong>{thieu.length}</strong> mục chưa nộp — vào tab Nộp bài để hoàn thành:
          </span>
          <div className="missing-banner__list">
            {thieu.map((it) => (
              <span key={it.id} className="missing-chip" title={`Chưa nộp: ${it.label}`}>
                {it.phan || `B${it.bai}`}
              </span>
            ))}
          </div>
        </div>
      )}

      {!hasItems ? (
        <div className="meta" style={{ padding: 'var(--sp-6) var(--sp-4)', textAlign: 'center', background: 'var(--surface)', borderRadius: 'var(--r-ctl)', border: '1px solid var(--hair)' }}>
          {filterMode === 'missing' ? '🎉 Tất cả bài thực hành đã được nộp đầy đủ!' : 'Chưa có bài nào được nộp.'}
        </div>
      ) : (
        TH_SUA_BAI.map((b) => {
          const isPart = Boolean(b.phans);
          const items = isPart
            ? b.phans.map((p) => ({
                id: submissionId(b.bai, p.phan),
                nhiem: `${p.phan}. ${p.ten}`,
              }))
            : [{ id: submissionId(b.bai), nhiem: `Bài ${b.bai}: ${b.tieuDe}` }];

          const filteredItems = items.filter((it) => {
            const isActive = safeSubs[it.id]?.status === 'active';
            if (filterMode === 'missing') return !isActive;
            if (filterMode === 'done') return isActive;
            return true;
          });

          if (filteredItems.length === 0) return null;

          return (
            <section key={b.bai} className="overview-group">
              <h3 className="overview-group__title">
                {isPart ? `Bài ${b.bai} — Phòng 104 (8 phần)` : `Bài ${b.bai} — Thực hành xưởng`}
              </h3>

              <div className="overview-rows">
                {filteredItems.map((it) => {
                  const sub = safeSubs[it.id];
                  const active = sub?.status === 'active';
                  const openUrl = active
                    ? laLink(sub)
                      ? sub.link
                      : getSubmissionFileUrl(sub.storagePath)
                    : '';
                  const safeOpenUrl = isSafeHttpUrl(openUrl) ? openUrl : null;

                  return (
                    <div key={it.id} className="overview-row">
                      <div className="overview-row__check" data-done={String(active)}>
                        {active && <Check width={12} height={12} />}
                      </div>

                      <div className="overview-row__main">
                        <span className="overview-row__title">{it.nhiem}</span>
                        {active ? (
                          <span className="overview-row__meta">
                            {sub.nguoi?.map((n) => `${n.ten} (${n.mssv})`).join(' + ')}
                            {' · '}
                            {laLink(sub) ? (
                              <>
                                <LinkIcon width={11} height={11} style={{ verticalAlign: '-1px' }} />{' '}
                              </>
                            ) : null}
                            {sub.fileName}
                            {laLink(sub) ? '' : ` (${formatBytes(sub.size)})`}
                            {' · '}{formatTimestamp(sub.submittedAt)}
                          </span>
                        ) : (
                          <span className="overview-row__meta" style={{ color: 'var(--cinnabar)' }}>
                            Chưa nộp
                          </span>
                        )}
                      </div>

                      {active && safeOpenUrl && (
                        <a
                          href={safeOpenUrl}
                          download={laLink(sub) ? undefined : sub.fileName}
                          className="btn btn--ghost btn--sm overview-row__open"
                          target="_blank"
                          rel="noopener noreferrer"
                          title={laLink(sub) ? 'Mở liên kết' : 'Tải file báo cáo'}
                        >
                          {laLink(sub) ? <LinkIcon width={12} height={12} /> : <Download width={12} height={12} />}
                          <span>{laLink(sub) ? 'Mở' : 'Tải'}</span>
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
