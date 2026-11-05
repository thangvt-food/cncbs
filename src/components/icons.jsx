const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
};

export const Check = (p) => (
  <svg {...base} {...p}>
    <path d="M4 10.5 8 14l8-9" />
  </svg>
);

export const Cross = (p) => (
  <svg {...base} {...p}>
    <path d="M5 5l10 10M15 5 5 15" />
  </svg>
);

export const Minus = (p) => (
  <svg {...base} {...p}>
    <path d="M4 10h12" />
  </svg>
);

export const Flag = (p) => (
  <svg {...base} {...p}>
    <path d="M6 3v14M6 4h9l-2 4 2 4H6" />
  </svg>
);

export const Close = (p) => (
  <svg {...base} {...p}>
    <path d="M5 5l10 10M15 5 5 15" />
  </svg>
);

export const Grid = (p) => (
  <svg {...base} {...p}>
    <path d="M3 3h6v6H3zM11 3h6v6h-6zM3 11h6v6H3zM11 11h6v6h-6z" />
  </svg>
);

export const ChevronLeft = (p) => (
  <svg {...base} {...p}>
    <path d="M12 4 6 10l6 6" />
  </svg>
);

export const ChevronRight = (p) => (
  <svg {...base} {...p}>
    <path d="M8 4l6 6-6 6" />
  </svg>
);

export const Clock = (p) => (
  <svg {...base} {...p}>
    <circle cx="10" cy="10" r="7" />
    <path d="M10 6v4l3 2" />
  </svg>
);
