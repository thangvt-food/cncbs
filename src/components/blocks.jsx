/* Dựng block model (JSON sinh từ scripts/build-book.mjs) thành phần tử React thật.
   Không có chuỗi HTML: mỗi mẩu text là một phần tử mang data-o = offset ký tự của nó trong
   block.text, nên tô sáng và kết quả tìm ánh xạ đúng mà không cần DOMPurify. */

const HEAD = { 1: 'h2', 2: 'h2', 3: 'h3', 4: 'h4', 5: 'h5' };

function markClass(ranges) {
  const last = ranges[ranges.length - 1];
  if (!last) return '';
  return last.kind === 'hit' ? 'b-hit' : `b-hl b-hl--${last.tone}`;
}

function Leaf({ run, from, to, marks }) {
  const text = run.x.slice(from - run.o, to - run.o);
  const inner = marks.length ? (
    <mark
      className={markClass(marks)}
      data-marks={marks.map((m) => m.id ?? 'hit').join(' ')}
      title={marks.find((m) => m.note)?.note || undefined}
    >
      {text}
    </mark>
  ) : (
    text
  );

  const o = String(from);
  if (run.c) return <code data-o={o}>{inner}</code>;
  if (run.href) {
    return (
      <a data-o={o} className="b-link" href={run.href} target="_blank" rel="noreferrer noopener">
        {inner}
      </a>
    );
  }
  if (run.b && run.i) {
    return (
      <strong data-o={o} className="b-bi">
        {inner}
      </strong>
    );
  }
  if (run.b) return <strong data-o={o}>{inner}</strong>;
  if (run.i) return <em data-o={o}>{inner}</em>;
  if (run.s) return <s data-o={o}>{inner}</s>;
  return <span data-o={o}>{inner}</span>;
}

export function Runs({ runs, ranges = [] }) {
  const out = [];
  for (let i = 0; i < runs.length; i += 1) {
    const run = runs[i];
    const start = run.o;
    const end = run.o + run.x.length;
    const covering = ranges.filter((r) => r.end > start && r.start < end);
    if (!covering.length) {
      out.push(<Leaf key={i} run={run} from={start} to={end} marks={[]} />);
      continue;
    }
    const cuts = new Set([start, end]);
    for (const r of covering) {
      cuts.add(Math.max(r.start, start));
      cuts.add(Math.min(r.end, end));
    }
    const at = [...cuts].sort((a, b) => a - b);
    for (let k = 0; k < at.length - 1; k += 1) {
      const marks = covering.filter((r) => r.start <= at[k] && r.end >= at[k + 1]);
      out.push(<Leaf key={`${i}-${k}`} run={run} from={at[k]} to={at[k + 1]} marks={marks} />);
    }
  }
  return out;
}

/* items phẳng kèm depth -> cây danh sách lồng nhau. */
function buildNodes(items, depth) {
  const nodes = [];
  for (let i = 0; i < items.length; ) {
    if (items[i].depth < depth) break;
    if (items[i].depth > depth) {
      i += 1;
      continue;
    }
    const node = { runs: items[i].runs, children: [] };
    i += 1;
    const from = i;
    while (i < items.length && items[i].depth > depth) i += 1;
    if (i > from) node.children = buildNodes(items.slice(from, i), depth + 1);
    nodes.push(node);
  }
  return nodes;
}

function ListLevel({ nodes, ranges, ordered, start, depth, block }) {
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag
      data-b={block}
      start={ordered && start > 1 ? String(start) : undefined}
      className={`b b--list b-list${depth ? ' b-list--sub' : ''}`}
    >
      {nodes.map((node, i) => (
        <li key={i} className="b-li">
          <Runs runs={node.runs} ranges={ranges} />
          {node.children.length ? (
            <ListLevel nodes={node.children} ranges={ranges} ordered={false} start={1} depth={depth + 1} />
          ) : null}
        </li>
      ))}
    </Tag>
  );
}

function Table({ b, ranges }) {
  return (
    <div className="b-scroll" data-b={b.n} role="group" aria-label="Bảng trong bài đọc">
      <table className="b-table">
        <thead>
          <tr>
            {b.cols.map((cell, i) => (
              <th key={i} scope="col">
                <Runs runs={cell} ranges={ranges} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {b.rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td key={c}>
                  <Runs runs={cell} ranges={ranges} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Block({ b, ranges = [] }) {
  switch (b.t) {
    case 'h': {
      const Tag = HEAD[b.lv] ?? 'h2';
      return (
        <Tag data-b={b.n} className={`b b--h b--h${b.lv}${b.intro ? ' b--intro' : ''}`}>
          <Runs runs={b.runs} ranges={ranges} />
        </Tag>
      );
    }
    case 'p':
      return (
        <p data-b={b.n} className={`b b--p${b.intro ? ' b--intro' : ''}`}>
          <Runs runs={b.runs} ranges={ranges} />
        </p>
      );
    case 'quote':
      return (
        <blockquote data-b={b.n} className="b b--quote">
          <Runs runs={b.runs} ranges={ranges} />
        </blockquote>
      );
    case 'list':
      return (
        <ListLevel
          nodes={buildNodes(b.items, 0)}
          ranges={ranges}
          ordered={b.ol}
          start={b.start}
          depth={0}
          block={b.n}
        />
      );
    case 'table':
      return <Table b={b} ranges={ranges} />;
    case 'hr':
      return <hr data-b={b.n} className="b b--hr" />;
    default:
      return null;
  }
}
