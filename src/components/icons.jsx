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

export const Plus = (p) => (
  <svg {...base} {...p}>
    <path d="M10 4v12M4 10h12" />
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

export const BookOpen = (p) => (
  <svg {...base} {...p}>
    <path d="M10 5.8C8.5 4.4 6.3 3.8 3.4 4v11.5c2.9-.2 5.1.4 6.6 1.8 1.5-1.4 3.7-2 6.6-1.8V4c-2.9-.2-5.1.4-6.6 1.8Zm0 0v11.5" />
  </svg>
);

export const List = (p) => (
  <svg {...base} {...p}>
    <path d="M7.5 5.5H17M7.5 10H17M7.5 14.5H17M3.6 5.5h.01M3.6 10h.01M3.6 14.5h.01" />
  </svg>
);

export const Search = (p) => (
  <svg {...base} {...p}>
    <circle cx="9" cy="9" r="5.4" />
    <path d="M13.1 13.1 17 17" />
  </svg>
);

export const Bookmark = (p) => (
  <svg {...base} {...p}>
    <path d="M5.6 3.6h8.8v13L10 13.4l-4.4 3.2Z" />
  </svg>
);

export const BookmarkFill = (p) => (
  <svg {...base} fill="currentColor" {...p}>
    <path d="M5.6 3.6h8.8v13L10 13.4l-4.4 3.2Z" />
  </svg>
);

export const Marker = (p) => (
  <svg {...base} {...p}>
    <path d="M3.4 16.6h5.2M10.8 5l4.2 4.2-6.4 6.4H4.4v-4.2Z" />
  </svg>
);

export const Pen = (p) => (
  <svg {...base} {...p}>
    <path d="M4 16.5l.9-3.4 8.4-8.4 2.6 2.6-8.4 8.4ZM12.2 5.8l2 2" />
  </svg>
);

