// Inline SVG icons (24×24, stroke-based). Shared by build templates and the browser.
const wrap = (paths, extra = '') => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"${extra}>${paths}</svg>`;

export const ICONS = {
  search: wrap('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  copy: wrap('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>'),
  check: wrap('<path d="m5 12 4.5 4.5L19 7"/>'),
  star: wrap('<path d="m12 3 2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.4 6.3 20.5l1.2-6.4L2.8 9.7l6.4-.8z"/>'),
  starFilled: wrap('<path d="m12 3 2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.4 6.3 20.5l1.2-6.4L2.8 9.7l6.4-.8z" fill="currentColor"/>'),
  download: wrap('<path d="M12 4v11m0 0 4-4m-4 4-4-4M4 19h16"/>'),
  external: wrap('<path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>'),
  chevronDown: wrap('<path d="m6 9 6 6 6-6"/>'),
  chevronRight: wrap('<path d="m9 6 6 6-6 6"/>'),
  arrowLeft: wrap('<path d="M19 12H5m0 0 6-6m-6 6 6 6"/>'),
  close: wrap('<path d="M6 6l12 12M18 6 6 18"/>'),
  sun: wrap('<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  moon: wrap('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>'),
  contrast: wrap('<circle cx="12" cy="12" r="9"/><path d="M12 3v18a9 9 0 0 0 0-18z" fill="currentColor"/>'),
  keyboard: wrap('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10"/>'),
  menu: wrap('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  alert: wrap('<path d="M12 3 2.5 20h19L12 3z"/><path d="M12 10v4m0 3h.01"/>'),
  info: wrap('<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>'),
  send: wrap('<path d="M21 3 10 14M21 3l-7 18-4-7-7-4z"/>'),
  stop: wrap('<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>'),
  settings: wrap('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  rss: wrap('<path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1" fill="currentColor"/>'),
  list: wrap('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'),
  grid: wrap('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
  filter: wrap('<path d="M3 5h18l-7 8v6l-4-2v-4z"/>'),
  plus: wrap('<path d="M12 5v14M5 12h14"/>'),
  trash: wrap('<path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  upload: wrap('<path d="M12 15V4m0 0-4 4m4-4 4 4M4 19h16"/>'),
  play: wrap('<path d="M7 4v16l13-8z" fill="currentColor"/>'),
  book: wrap('<path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4zM20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/>'),
  layers: wrap('<path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 13 9 5 9-5M3 17l9 5 9-5"/>'),
  terminal: wrap('<path d="m5 7 5 5-5 5M12 17h7"/>'),
  code: wrap('<path d="m8 8-4 4 4 4m8-8 4 4-4 4M14 5l-4 14"/>'),
  bolt: wrap('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),
  shield: wrap('<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>'),
  puzzle: wrap('<path d="M10 3a2 2 0 0 1 4 0v1h4v4h1a2 2 0 0 1 0 4h-1v4h-4v1a2 2 0 0 1-4 0v-1H6v-4H5a2 2 0 0 1 0-4h1V4h4z"/>'),
  plug: wrap('<path d="M9 2v6m6-6v6M6 8h12v3a6 6 0 0 1-12 0zM12 17v5"/>'),
  robot: wrap('<rect x="4" y="8" width="16" height="12" rx="2"/><path d="M12 4v4M8 13h.01M16 13h.01M9 17h6"/>'),
  hook: wrap('<path d="M12 3v9a4 4 0 0 0 8 0v-1M12 3a3 3 0 1 1-3 3"/>'),
  route: wrap('<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h6a4 4 0 0 0 0-8H10a4 4 0 0 1 0-8h6"/>'),
  chat: wrap('<path d="M21 12a8 8 0 0 1-8 8H8l-5 3 1.5-4.5A8 8 0 1 1 21 12z"/>'),
  cpu: wrap('<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4"/>'),
  sparkle: wrap('<path d="M12 3v4m0 10v4m-9-9h4m10 0h4M6.3 6.3l2.8 2.8m5.8 5.8 2.8 2.8M6.3 17.7l2.8-2.8m5.8-5.8 2.8-2.8"/>'),
  gitlab: wrap('<path d="m12 21 4-12H8zM4 9h4l4 12zm16 0h-4l-4 12zM4 9l1.5-5L8 9m8 0 2.5-5L20 9"/>'),
  print: wrap('<path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2M6 15h12v6H6z"/>'),
  link: wrap('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
  edit: wrap('<path d="M4 20h4l11-11-4-4L4 16z"/>'),
  flag: wrap('<path d="M5 21V4h11l-1 4h5l-2 8h-7l1-4z"/>')
};

export const TYPE_ICONS = {
  prompt: 'chat', 'system-prompt': 'sparkle', skill: 'layers', rule: 'shield', agent: 'robot', command: 'terminal',
  hook: 'hook', mcp: 'plug', plugin: 'puzzle', workflow: 'route'
};

export function icon(name, className = '') {
  const svg = ICONS[name] || ICONS.info;
  return className ? svg.replace('<svg ', `<svg class="${className}" `) : svg;
}
