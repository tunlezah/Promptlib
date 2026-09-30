import { html } from '../../scripts/lib/html.js';
import { page } from './layout.js';

export function tryPage(model, assets) {
  const body = html`<div class="container container--narrow try-layout" id="try">
  <div class="page-intro"><h1>Try a prompt</h1><p>Send any text to the configured AI endpoint without saving it to the library. Nothing you type here is stored anywhere except this browser.</p></div>
  <label class="field"><span class="field__label">Prompt</span><textarea class="textarea" id="try-prompt" rows="10" placeholder="Paste or write a prompt…"></textarea></label>
  <section class="ai-panel" id="ai-panel" data-mode="try" aria-labelledby="ai-title"></section>
</div>`;
  return { path: '/try/', noindex: true, html: page({ model, assets, title: 'Try', description: 'Send any prompt to the configured AI endpoint.', body, bodyClass: 'page-try', current: 'try', scripts: ['try'], noindex: true, path: model.u('try/') }) };
}
