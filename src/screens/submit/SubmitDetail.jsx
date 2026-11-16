import { useState } from 'react';
import { ArrowLeft, Download, FileText, Link as LinkIcon, Trash } from '../../components/icons';
import {
  formatBytes,
  getSubmissionFileUrl,
  laLink,
  submissionId,
} from '../../lib/submissions';
import { DeleteSheet } from './DeleteSheet';
import { SubmitForm } from './SubmitForm';
import { formatTimestamp, pageTitle } from './shared';

export function SubmitDetail({ bai, phan, sub, me, pushToast, backLabel, onBack, onChanged }) {
  const isPart = Boolean(bai.phans) && phan;
  const targetId = submissionId(bai.bai, isPart ? phan : null);
  const active = sub?.status === 'active' ? sub : null;
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isLink = laLink(active);
  const moUrl = active
    ? isLink
      ? active.link
      : getSubmissionFileUrl(active.storagePath)
    : '';

  return (
    <div className="submit-form-panel">
      <div className="submit-form-head">
        <button type="button" className="submit-back-btn submit-form-head__back" onClick={onBack}>
          <ArrowLeft width={14} height={14} />
          <span>{backLabel}</span>
        </button>
        <div className="submit-form-head__row">
          <h2 className="submit-form-head__title">{pageTitle(bai, phan)}</h2>
          {active && (
            <span className="progress-chip">
              Đã nộp{active.lanNop > 1 ? ` (lần ${active.lanNop})` : ''}
            </span>
          )}
        </div>
        <p className="submit-form-head__desc">
          {isPart ? 'Mỗi sinh viên trong tổ nhận 1 phần riêng biệt.' : bai.moTa}
        </p>
      </div>

      {active && (
        <div className="sub-current">
          <span className="sub-current__icon" data-link={String(isLink)}>
            {isLink ? <LinkIcon width={16} height={16} /> : <FileText width={16} height={16} />}
          </span>
          <div className="sub-current__info">
            <span className="sub-current__name">{active.fileName}</span>
            {isLink ? (
              <span className="sub-current__url" title={active.link}>{active.link}</span>
            ) : (
              <span className="sub-current__meta">
                {formatBytes(active.size)} · {formatTimestamp(active.submittedAt)}
              </span>
            )}
          </div>
          <div className="sub-current__actions">
            <a
              href={moUrl}
              download={isLink ? undefined : active.fileName}
              className="btn btn--primary btn--sm"
              target="_blank"
              rel="noopener noreferrer"
            >
              {isLink ? <LinkIcon width={13} height={13} /> : <Download width={13} height={13} />}
              <span>{isLink ? 'Mở link' : 'Tải file'}</span>
            </a>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              style={{ color: 'var(--cinnabar)' }}
              onClick={() => setConfirmDelete(true)}
              title="Xoá bản nộp để nộp bản mới"
            >
              <Trash width={13} height={13} />
              <span>Xoá</span>
            </button>
          </div>
        </div>
      )}

      <SubmitForm
        key={targetId + (active ? ':again' : ':new')}
        bai={bai}
        phan={phan}
        existingSub={active}
        me={me}
        pushToast={pushToast}
        onSubmitted={onChanged}
      />

      <DeleteSheet
        open={confirmDelete}
        item={{ id: targetId, nhiem: pageTitle(bai, phan), sub: active }}
        me={me}
        onClose={() => setConfirmDelete(false)}
        onDone={onChanged}
        pushToast={pushToast}
      />
    </div>
  );
}
