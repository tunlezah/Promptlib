// Markdown → sanitised HTML. Raw HTML in content is disabled, so nothing from the content repo executes.
import MarkdownIt from 'markdown-it';

function slugify(s) {
  return String(s).toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 80) || 'section';
}

export function createMarkdown({ anchors = true } = {}) {
  const md = new MarkdownIt({ html: false, linkify: true, typographer: false, breaks: false });
  // Only allow safe link protocols (markdown-it already blocks javascript:, vbscript:, file: and data: except images).
  const defaultValidate = md.validateLink.bind(md);
  md.validateLink = (url) => defaultValidate(url) && !/^\s*data:/i.test(url);
  // External links open safely.
  const defaultLinkOpen = md.renderer.rules.link_open || ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const href = tokens[idx].attrGet('href') || '';
    if (/^[a-z][a-z0-9+.-]*:/i.test(href) && !href.startsWith(env?.siteUrl || '\u0000')) {
      tokens[idx].attrSet('rel', 'noopener noreferrer');
    }
    return defaultLinkOpen(tokens, idx, options, env, self);
  };
  if (anchors) {
    md.core.ruler.push('heading_anchors', (state) => {
      const used = new Set();
      for (let i = 0; i < state.tokens.length; i++) {
        const t = state.tokens[i];
        if (t.type !== 'heading_open') continue;
        const inline = state.tokens[i + 1];
        const text = inline?.children?.filter((c) => c.type === 'text' || c.type === 'code_inline').map((c) => c.content).join('') || '';
        let id = slugify(text);
        let n = 2;
        while (used.has(id)) id = `${slugify(text)}-${n++}`;
        used.add(id);
        t.attrSet('id', id);
      }
    });
  }
  return md;
}

const shared = createMarkdown();
const inlineMd = createMarkdown({ anchors: false });

export function renderMarkdown(src, env = {}) {
  return shared.render(String(src ?? ''), env);
}

export function renderInline(src) {
  return inlineMd.renderInline(String(src ?? ''));
}

// Plain text version (for meta descriptions and search).
export function stripMarkdown(src) {
  return String(src ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_>#]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
