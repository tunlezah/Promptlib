// Small text helpers shared by the build and the browser.
export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function relativeDate(iso, now = new Date()) {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00Z`);
  const days = Math.round((now - d) / 86400000);
  if (Number.isNaN(days)) return String(iso);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.round(days / 30)} months ago`;
  return formatDate(iso);
}

export const TYPE_LABELS = {
  prompt: 'Prompt', 'system-prompt': 'System prompt', skill: 'Skill', rule: 'Rule', agent: 'Agent',
  command: 'Command', hook: 'Hook', mcp: 'MCP config', plugin: 'Plugin', workflow: 'Workflow'
};

export const TYPE_PLURALS = {
  prompt: 'Prompts', 'system-prompt': 'System prompts', skill: 'Skills', rule: 'Rules', agent: 'Agents',
  command: 'Commands', hook: 'Hooks', mcp: 'MCP configs', plugin: 'Plugins', workflow: 'Workflows'
};

export const TYPE_ORDER = ['prompt', 'system-prompt', 'skill', 'rule', 'agent', 'command', 'hook', 'mcp', 'plugin', 'workflow'];

export const DIFFICULTY_LABELS = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
export const STATUS_LABELS = { draft: 'Draft', reviewed: 'Reviewed', deprecated: 'Deprecated' };

// First ~n characters of text around the first occurrence of any term, with <mark> around matches.
export function snippet(text, terms, { radius = 90 } = {}) {
  const src = String(text || '');
  const lower = src.toLowerCase();
  const list = (terms || []).map((t) => String(t).toLowerCase()).filter((t) => t.length > 1);
  let pos = -1;
  for (const t of list) { const i = lower.indexOf(t); if (i >= 0 && (pos < 0 || i < pos)) pos = i; }
  let start = 0, end = Math.min(src.length, radius * 2);
  if (pos >= 0) { start = Math.max(0, pos - radius); end = Math.min(src.length, pos + radius); }
  // Snap to word boundaries.
  if (start > 0) { const s = src.lastIndexOf(' ', start); if (s > 0 && start - s < 20) start = s + 1; }
  if (end < src.length) { const e = src.indexOf(' ', end); if (e > 0 && e - end < 20) end = e; }
  let piece = escapeHtml(src.slice(start, end).replace(/\s+/g, ' '));
  if (list.length) {
    const re = new RegExp(`(${list.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    piece = piece.replace(re, '<mark>$1</mark>');
  }
  return `${start > 0 ? '…' : ''}${piece}${end < src.length ? '…' : ''}`;
}

export function pluralise(n, one, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}
