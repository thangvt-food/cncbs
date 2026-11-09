import bankData from '../data/banks.json';

export const BANKS = bankData.banks;
export const QUESTIONS = Object.fromEntries(BANKS.flatMap((b) => b.questions.map((q) => [q.id, q])));
export const BANK_BY_ID = Object.fromEntries(BANKS.map((b) => [b.id, b]));

export const TYPE_META = {
  single: { label: 'Một đáp án', instruction: 'Chọn một đáp án.' },
  true_false: { label: 'Đúng / Sai', instruction: 'Chọn Đúng hoặc Sai.' },
  multi: { label: 'Nhiều đáp án', instruction: 'Chọn tất cả đáp án đúng, có thể hơn một đáp án.' },
  blanks: { label: 'Điền chỗ trống', instruction: 'Chọn từ phù hợp cho từng chỗ trống.' },
};

export function createSession({ bankId, mode, count, shuffle, minutes }) {
  const bank = BANK_BY_ID[bankId];
  const list = [...bank.questions];
  if (shuffle) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
  }
  const picked = count > 0 ? list.slice(0, count) : list;
  return {
    id: `${bankId}-${Date.now()}`,
    bankId,
    mode,
    order: picked.map((q) => q.id),
    answers: {},
    marked: [],
    index: 0,
    startedAt: Date.now(),
    finishedAt: null,
    durationSec: minutes > 0 ? minutes * 60 : 0,
    usedSec: 0,
  };
}

export function isAnswered(session, q) {
  const a = session.answers[q.id];
  if (!a) return false;
  if (q.type === 'blanks') return q.blanks.every((b) => a[b.id]);
  return a.length > 0;
}

export function grade(q, answer) {
  if (q.type === 'blanks') {
    return { correct: q.blanks.every((b) => answer?.[b.id] === b.answer) };
  }
  const expected = [...q.answers].sort().join('|');
  const got = [...(answer ?? [])].sort().join('|');
  return { correct: got !== '' && got === expected };
}

export function optionVerdict(q, answer, key) {
  const chosen = Boolean((answer ?? []).includes(key));
  const isAnswer = q.answers.includes(key);
  if (chosen && isAnswer) return 'correct';
  if (chosen && !isAnswer) return 'wrong';
  if (!chosen && isAnswer) return 'missed';
  return null;
}

export function summarize(session) {
  const byType = {};
  let correct = 0;
  let answered = 0;
  for (const id of session.order) {
    const q = QUESTIONS[id];
    byType[q.type] ??= { label: TYPE_META[q.type].label, total: 0, correct: 0 };
    byType[q.type].total += 1;
    if (isAnswered(session, q)) {
      answered += 1;
      if (grade(q, session.answers[id]).correct) {
        correct += 1;
        byType[q.type].correct += 1;
      }
    }
  }
  const total = session.order.length;
  return {
    total,
    answered,
    blank: total - answered,
    correct,
    wrong: answered - correct,
    score: total ? correct / total : 0,
    byType: Object.entries(byType).map(([id, v]) => ({ id, ...v })),
    timeUsedMs: (session.finishedAt ?? Date.now()) - session.startedAt,
  };
}

export function fmtClock(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function fmtMinutes(ms) {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m} phút`;
  return `${Math.floor(m / 60)} giờ ${m % 60} phút`;
}
