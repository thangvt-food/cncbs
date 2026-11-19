import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Check,
  FileText,
  Link as LinkIcon,
  RefreshCw,
  User,
} from '../components/icons';
import { openSubmit, openTongHop } from '../lib/router';
import { readKey, writeKey } from '../lib/store';
import { TH_SUA_BAI, formatBytes, getLogs, laLink, listSubmissions, submissionId } from '../lib/submissions';
import { ProfileSheet } from './submit/ProfileSheet';
import { SubmitDetail } from './submit/SubmitDetail';
import { OverviewPanel } from './submit/OverviewPanel';
import { LogsPanel } from './submit/LogsPanel';
import { tinhTienSu } from './submit/shared';
import '../styles/submit.css';

/* Màn hình chính: Nộp bài & Bảng tổng hợp thực hành.
   Chi tiết từng chế độ xem nằm trong src/screens/submit/. */
export function NoiBai({ route, pushToast, initialTab }) {
  const [activeTab, setActiveTab] = useState(initialTab || (route?.kind === 'tonghop' ? 'tonghop' : 'submit'));
  const [subs, setSubs] = useState({});
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [me, setMe] = useState(() => readKey('thsua:me', { ten: '', mssv: '' }));

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([listSubmissions(), getLogs()])
      .then(([s, l]) => {
        setSubs(s || {});
        setLogs(l || []);
      })
      .catch((err) => {
        pushToast(err?.message || 'Không thể tải dữ liệu.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [pushToast]);

  useEffect(() => {
    loadData();
    window.scrollTo({ top: 0 });
    if (route?.kind === 'tonghop') setActiveTab('tonghop');
    else if (route?.kind === 'submit') setActiveTab('submit');
  }, [loadData, route]);

  const { thieu, done, total } = tinhTienSu(subs);

  const currentBai = route?.bai ? TH_SUA_BAI.find((b) => b.bai === route.bai) : null;
  const currentPhan = route?.phan || null;
  const currentTargetId = currentBai ? submissionId(currentBai.bai, currentBai.phans ? currentPhan : null) : null;
  const currentSub = currentTargetId && subs[currentTargetId]?.status === 'active' ? subs[currentTargetId] : null;

  return (
    <div className="submit-wrap">
      <header className="submit-header">
        <div className="submit-header__top">


          <div className="submit-header__tools">
            <button
              type="button"
              className="submit-header__user-pill"
              onClick={() => setShowProfile(true)}
              title="Thông tin sinh viên của bạn"
            >
              <User width={14} height={14} style={{ color: 'var(--board)' }} />
              {me?.ten ? (
                <span>
                  <strong>{me.ten}</strong>{' '}
                  <span className="num" style={{ color: 'var(--text-2)' }}>({me.mssv})</span>
                </span>
              ) : (
                <span style={{ color: 'var(--muted)' }}>+ Điền tên/MSSV</span>
              )}
            </button>

            <button
              type="button"
              className="submit-back-btn submit-header__refresh"
              onClick={loadData}
              title="Làm mới dữ liệu"
              disabled={loading}
            >
              <RefreshCw className={loading ? 'spinner' : ''} width={13} height={13} />
            </button>
          </div>
        </div>

        <div className="submit-header__main">
          <h1 className="submit-header__title">Nộp bài Thực hành — CN Chế biến Sữa</h1>
          <span className="progress-chip">
            Đã nộp {done}/{total} bài
          </span>
        </div>
      </header>

      <nav className="submit-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          className="submit-tab"
          aria-selected={activeTab === 'submit'}
          onClick={() => {
            setActiveTab('submit');
            openSubmit();
          }}
        >
          <FileText width={15} height={15} />
          <span>Nộp bài</span>
        </button>
        <button
          type="button"
          role="tab"
          className="submit-tab"
          aria-selected={activeTab === 'tonghop'}
          onClick={() => {
            setActiveTab('tonghop');
            openTongHop();
          }}
        >
          <Check width={15} height={15} />
          <span>Tổng hợp</span>
          {thieu.length > 0 && <span className="submit-tab__badge num">{thieu.length}</span>}
        </button>
        <button
          type="button"
          role="tab"
          className="submit-tab"
          aria-selected={activeTab === 'logs'}
          onClick={() => setActiveTab('logs')}
        >
          <RefreshCw width={14} height={14} />
          <span>Nhật ký</span>
        </button>
      </nav>

      {/* ---------------- TAB 1: NỘP BÀI ---------------- */}
      {activeTab === 'submit' && (
        <>
          {/* Cấp 1: Danh sách 5 bài */}
          {!currentBai && (
            <div className="assignments-list">
              {TH_SUA_BAI.map((b) => {
                const isPartBai = Boolean(b.phans);
                const doneCount = isPartBai
                  ? b.phans.filter((p) => subs[submissionId(b.bai, p.phan)]?.status === 'active').length
                  : subs[submissionId(b.bai)]?.status === 'active'
                    ? 1
                    : 0;
                const totalCount = isPartBai ? b.phans.length : 1;
                const isFullyDone = doneCount === totalCount;
                const singleSub = !isPartBai ? subs[submissionId(b.bai)] : null;

                return (
                  <article key={b.bai} className="assignment-card">
                    <div className="assignment-card__header">
                      <div className="assignment-card__title-box">
                        <span className="assignment-card__tag num">Bài {b.bai}</span>
                        <h3 className="assignment-card__title">{b.tieuDe}</h3>
                      </div>
                      <span className="chip chip--tiny" data-done={String(isFullyDone)}>
                        {isPartBai ? `${doneCount}/${totalCount} phần` : isFullyDone ? 'Đã nộp' : 'Chưa nộp'}
                      </span>
                    </div>

                    <p className="assignment-card__desc">{b.moTa}</p>

                    {singleSub?.status === 'active' && (
                      <div className="assignment-card__submitter">
                        <Check width={13} height={13} />
                        <span>
                          <strong>{singleSub.nguoi?.map((n) => `${n.ten} (${n.mssv})`).join(' + ')}</strong>
                          {' — '}
                          {laLink(singleSub) ? (
                            <LinkIcon width={11} height={11} style={{ verticalAlign: '-1px' }} />
                          ) : null}
                          {singleSub.fileName}
                          {laLink(singleSub) ? '' : ` (${formatBytes(singleSub.size)})`}
                        </span>
                      </div>
                    )}

                    <div className="assignment-card__footer">
                      <button
                        type="button"
                        className={`btn btn--sm ${isFullyDone ? 'btn--ghost' : 'btn--primary'}`}
                        onClick={() => openSubmit(b.bai)}
                      >
                        {isPartBai ? 'Xem 8 phần →' : isFullyDone ? 'Xem lại / nộp lại' : 'Nộp bài'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Cấp 2: Danh sách 8 phần Bài 1 */}
          {currentBai && currentBai.phans && !currentPhan && (
            <div className="parts-view">
              <div className="parts-header">
                <button type="button" className="submit-back-btn" onClick={() => openSubmit()}>
                  <ArrowLeft width={14} height={14} />
                  <span>5 bài thực hành</span>
                </button>
                <span className="meta">Phòng 104 Cẩm Tú — mỗi người 1 phần</span>
              </div>

              <div className="parts-grid">
                {currentBai.phans.map((p) => {
                  const s = subs[submissionId(currentBai.bai, p.phan)];
                  const active = s?.status === 'active';

                  return (
                    <article key={p.phan} className="part-card" data-done={String(active)}>
                      <div className="part-card__header">
                        <span className="part-card__num num">{p.phan}</span>
                        <span className="chip chip--tiny" data-done={String(active)}>
                          {active ? 'Đã nộp' : 'Chưa nộp'}
                        </span>
                      </div>

                      <h4 className="part-card__title">{p.ten}</h4>

                      <div className="part-card__body">
                        {active ? (
                          <>
                            <div className="part-card__owner">
                              <User width={12} height={12} style={{ color: 'var(--board)' }} />
                              <span>
                                <strong>{s.nguoi?.[0]?.ten}</strong> ({s.nguoi?.[0]?.mssv})
                              </span>
                            </div>
                            <div className="part-card__file">
                              {laLink(s) ? (
                                <LinkIcon width={11} height={11} style={{ verticalAlign: '-1px' }} />
                              ) : null}
                              {s.fileName}
                              {laLink(s) ? '' : ` (${formatBytes(s.size)})`}
                            </div>
                          </>
                        ) : (
                          <div className="part-card__owner" data-empty="true">
                            Chưa có ai nộp phần này.
                          </div>
                        )}
                      </div>

                      <div className="part-card__footer">
                        <button
                          type="button"
                          className={`btn btn--sm ${active ? 'btn--ghost' : 'btn--primary'}`}
                          onClick={() => openSubmit(currentBai.bai, p.phan)}
                        >
                          {active ? 'Xem lại / nộp lại' : 'Nộp bài →'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cấp 3: chi tiết 1 bài/phần — banner bản nộp + form */}
          {currentBai && (!currentBai.phans || currentPhan) && (
            <SubmitDetail
              bai={currentBai}
              phan={currentPhan}
              sub={currentSub}
              me={me}
              pushToast={pushToast}
              backLabel={currentBai.phans ? '8 phần Bài 1' : '5 bài thực hành'}
              onBack={() => openSubmit(currentBai.phans ? currentBai.bai : undefined)}
              onChanged={loadData}
            />
          )}
        </>
      )}

      {/* ---------------- TAB 2: TỔNG HỢP (chỉ kiểm tra) ---------------- */}
      {activeTab === 'tonghop' && <OverviewPanel subs={subs} me={me} pushToast={pushToast} />}

      {/* ---------------- TAB 3: NHẬT KÝ ---------------- */}
      {activeTab === 'logs' && <LogsPanel logs={logs} />}

      <ProfileSheet
        open={showProfile}
        onClose={() => setShowProfile(false)}
        current={me}
        onSave={(updated) => {
          setMe(updated);
          writeKey('thsua:me', updated);
          pushToast('Đã lưu thông tin sinh viên.');
        }}
      />
    </div>
  );
}
