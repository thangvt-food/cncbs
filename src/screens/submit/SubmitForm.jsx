import { useRef, useState } from 'react';
import { FileText, Link as LinkIcon } from '../../components/icons';
import { readKey, writeKey } from '../../lib/store';
import {
  MAX_FILE_BYTES,
  formatBytes,
  nhannot,
  submissionId,
  submitAssignment,
} from '../../lib/submissions';

export function SubmitForm({ bai, phan, existingSub, me, pushToast, onSubmitted }) {
  const isPart = Boolean(bai.phans);
  const active = existingSub?.status === 'active';
  const targetId = submissionId(bai.bai, isPart ? phan : null);

  const [nguoi1, setNguoi1] = useState(() => {
    if (active && existingSub?.nguoi?.[0]) return { ...existingSub.nguoi[0] };
    return { ten: me?.ten || '', mssv: me?.mssv || '' };
  });
  const [hasPartner, setHasPartner] = useState(() => {
    if (isPart) return false;
    if (active) return (existingSub?.nguoi?.length || 0) >= 2;
    return true;
  });
  const [nguoi2, setNguoi2] = useState(() => {
    if (active && existingSub?.nguoi?.[1]) return { ...existingSub.nguoi[1] };
    const cache = readKey('thsua:partner', { ten: '', mssv: '' });
    return { ten: cache?.ten || '', mssv: cache?.mssv || '' };
  });

  const [kind, setKind] = useState('file');
  const [file, setFile] = useState(null);
  const [link, setLink] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (selectedFile) => {
    setLoi('');
    if (!selectedFile) {
      setFile(null);
      return;
    }
    if (selectedFile.size > MAX_FILE_BYTES) {
      setLoi(`File "${selectedFile.name}" (${formatBytes(selectedFile.size)}) vượt mức tối đa 20MB.`);
      setFile(null);
      return;
    }
    setFile(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoi('');

    const n1Ten = nguoi1.ten.trim();
    const n1Mssv = nguoi1.mssv.trim();
    if (!n1Ten || !n1Mssv) {
      setLoi('Vui lòng nhập đầy đủ Họ tên và MSSV người nộp.');
      return;
    }

    const nguoiList = [{ ten: n1Ten, mssv: n1Mssv }];
    if (!isPart && hasPartner) {
      const n2Ten = nguoi2.ten.trim();
      const n2Mssv = nguoi2.mssv.trim();
      if (!n2Ten || !n2Mssv) {
        setLoi('Vui lòng nhập Họ tên và MSSV người 2 (hoặc bỏ chọn làm chung nếu làm đơn).');
        return;
      }
      if (n1Mssv.toLowerCase() === n2Mssv.toLowerCase()) {
        setLoi('MSSV của người 1 và 2 không được trùng nhau.');
        return;
      }
      nguoiList.push({ ten: n2Ten, mssv: n2Mssv });
      writeKey('thsua:partner', { ten: n2Ten, mssv: n2Mssv });
    }

    if (kind === 'file' && !file) {
      setLoi('Vui lòng chọn file báo cáo.');
      return;
    }
    if (kind === 'link' && !link.trim()) {
      setLoi('Vui lòng dán liên kết bài làm (Google Docs, Canva…).');
      return;
    }

    setBusy(true);
    try {
      await submitAssignment({
        bai: bai.bai,
        phan: isPart ? phan : null,
        nguoi: nguoiList,
        file: kind === 'file' ? file : null,
        link: kind === 'link' ? link.trim() : null,
      });
      pushToast(`Đã nộp ${nhannot(targetId)}.`);
      onSubmitted();
    } catch (err) {
      setLoi(err?.message || 'Nộp thất bại. Kiểm tra kết nối mạng rồi thử lại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="submit-form">
      {/* Người nộp 1 */}
      <div className="form-group">
        <div className="form-group__head">
          <span className="form-group__title">
            {isPart ? `Sinh viên làm Phần ${phan}` : 'Người nộp 1'}
          </span>
          {me?.ten && !(nguoi1.ten === me.ten && nguoi1.mssv === me.mssv) && (
            <button
              type="button"
              className="quick-btn"
              onClick={() => {
                setNguoi1({ ten: me.ten, mssv: me.mssv });
                setLoi('');
              }}
            >
              Điền tên tôi ({me.ten})
            </button>
          )}
        </div>

        <div className="person-row">
          <input
            type="text"
            className="form-input"
            placeholder="Họ và tên sinh viên"
            value={nguoi1.ten}
            onChange={(e) => setNguoi1({ ...nguoi1, ten: e.target.value })}
            required
          />
          <input
            type="text"
            inputMode="numeric"
            className="form-input"
            placeholder="MSSV"
            value={nguoi1.mssv}
            onChange={(e) => setNguoi1({ ...nguoi1, mssv: e.target.value.trim() })}
            required
          />
        </div>
      </div>

      {/* Người nộp 2 (Bài 2-5) */}
      {!isPart && (
        <div className="form-group">
          <label className="partner-toggle">
            <input
              type="checkbox"
              checked={hasPartner}
              onChange={(e) => setHasPartner(e.target.checked)}
            />
            <span>Làm chung 2 người</span>
          </label>

          {hasPartner && (
            <div className="person-row">
              <input
                type="text"
                className="form-input"
                placeholder="Họ và tên người 2"
                value={nguoi2.ten}
                onChange={(e) => setNguoi2({ ...nguoi2, ten: e.target.value })}
                required
              />
              <input
                type="text"
                inputMode="numeric"
                className="form-input"
                placeholder="MSSV"
                value={nguoi2.mssv}
                onChange={(e) => setNguoi2({ ...nguoi2, mssv: e.target.value.trim() })}
                required
              />
            </div>
          )}
        </div>
      )}

      {/* Sản phẩm nộp: tệp hoặc liên kết */}
      <div className="form-group">
        <span className="form-group__title">Sản phẩm nộp</span>

        <div className="type-switch" role="group" aria-label="Hình thức nộp">
          <button type="button" data-active={kind === 'file'} onClick={() => setKind('file')}>
            <FileText width={14} height={14} />
            <span>Tệp tin</span>
          </button>
          <button type="button" data-active={kind === 'link'} onClick={() => setKind('link')}>
            <LinkIcon width={14} height={14} />
            <span>
              Link
              <em className="type-switch__more"> (Docs, Canva…)</em>
            </span>
          </button>
        </div>

        {kind === 'file' ? (
          !file ? (
            <div
              className={`dropzone ${isDragOver ? 'dropzone--drag' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                handleFileChange(e.dataTransfer.files?.[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="dropzone__input"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.rar"
                onChange={(e) => handleFileChange(e.target.files?.[0])}
              />
              <span className="dropzone__title">Nhấn để chọn file hoặc kéo thả file</span>
              <span className="dropzone__hint">.docx, .pdf, .pptx, .zip (≤ 20MB)</span>
            </div>
          ) : (
            <div className="file-card">
              <div className="file-card__main">
                <FileText width={20} height={20} style={{ color: 'var(--board)', flexShrink: 0 }} />
                <span className="file-card__name" title={file.name}>{file.name}</span>
                <span className="file-card__size num">({formatBytes(file.size)})</span>
              </div>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                disabled={busy}
              >
                Đổi
              </button>
            </div>
          )
        ) : (
          <div className="form-group">
            <input
              type="text"
              inputMode="url"
              className="form-input"
              placeholder="https://docs.google.com/… hoặc https://canva.com/…"
              value={link}
              onChange={(e) => setLink(e.target.value.trim())}
              maxLength={600}
            />
            <span className="link-hint">
              Google Docs, Canva, Figma, Drive… — nhớ bật quyền xem/sửa trước khi nộp.
            </span>
          </div>
        )}
      </div>

      {loi && <p className="alert-box alert-box--danger">{loi}</p>}

      <button type="submit" className="btn btn--primary submit-form__submit" disabled={busy}>
        {busy ? (
          <>
            <span className="spinner" />
            <span>Đang tải lên…</span>
          </>
        ) : active ? (
          'Nộp lại bản mới'
        ) : (
          'Xác nhận nộp bài'
        )}
      </button>
    </form>
  );
}
