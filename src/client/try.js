// Playground: send arbitrary text to the configured endpoint.
import { base } from './ui.js';

const root = document.getElementById('ai-panel');
const box = document.getElementById('try-prompt');
if (root && box) {
  import(`${base}assets/js/ai.js`).then((mod) => {
    const panel = mod.mountPanel(root, { mode: 'try', artifactId: 'try', artifactTitle: 'Playground', artifactType: 'prompt', getPrompt: () => box.value });
    if (!panel) root.replaceWith(Object.assign(document.createElement('p'), { className: 'notice notice--info', textContent: 'No AI endpoint is configured.' }));
  });
}
