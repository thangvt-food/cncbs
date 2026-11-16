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

export const ArrowLeft = (p) => (
  <svg {...base} {...p}>
    <path d="M16 10H4M9 5l-5 5 5 5" />
  </svg>
);

export const Upload = (p) => (
  <svg {...base} {...p}>
    <path d="M3.5 14v2.5a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V14M10 3.5v10M6.5 7 10 3.5 13.5 7" />
  </svg>
);

export const Download = (p) => (
  <svg {...base} {...p}>
    <path d="M3.5 14v2.5a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V14M10 13.5V3.5M6.5 10 10 13.5 13.5 10" />
  </svg>
);

export const Trash = (p) => (
  <svg {...base} {...p}>
    <path d="M3 5h14M7 5V3.5a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5V5M15 5v11.5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5M8.5 9v6M11.5 9v6" />
  </svg>
);

export const FileText = (p) => (
  <svg {...base} {...p}>
    <path d="M12 2.5H5a1.5 1.5 0 0 0-1.5 1.5v12A1.5 1.5 0 0 0 5 17.5h10a1.5 1.5 0 0 0 1.5-1.5V7.5L12 2.5z" />
    <path d="M12 2.5v5h5M7 10.5h6M7 13.5h4" />
  </svg>
);

export const User = (p) => (
  <svg {...base} {...p}>
    <path d="M16 17v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 15.5V17" />
    <circle cx="10" cy="6.5" r="3.5" />
  </svg>
);

export const Users = (p) => (
  <svg {...base} {...p}>
    <path d="M14 17v-1.5a3.5 3.5 0 0 0-3-3.45M6.5 12A3.5 3.5 0 0 0 3 15.5V17M11 4.2a3.5 3.5 0 0 1 0 6.6M7.5 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
  </svg>
);

export const RefreshCw = (p) => (
  <svg {...base} {...p}>
    <path d="M17.5 4.5v4h-4M2.5 15.5v-4h4" />
    <path d="M3.8 8.8a7 7 0 0 1 11.9-3.3l1.8 2M16.2 11.2a7 7 0 0 1-11.9 3.3l-1.8-2" />
  </svg>
);

export const AlertCircle = (p) => (
  <svg {...base} {...p}>
    <circle cx="10" cy="10" r="7.5" />
    <path d="M10 6.5v4M10 13.5h.01" />
  </svg>
);

export const MoreVertical = (p) => (
  <svg {...base} {...p}>
    <circle cx="10" cy="4.5" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="10" cy="10" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="10" cy="15.5" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

export const Link = (p) => (
  <svg {...base} {...p}>
    <path d="M8.2 11.8a3.2 3.2 0 0 0 4.6 0l2.4-2.4a3.25 3.25 0 0 0-4.6-4.6l-1.2 1.2" />
    <path d="M11.8 8.2a3.2 3.2 0 0 0-4.6 0L4.8 10.6a3.25 3.25 0 0 0 4.6 4.6l1.2-1.2" />
  </svg>
);



