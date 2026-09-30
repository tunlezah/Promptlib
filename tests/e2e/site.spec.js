// Browser smoke tests against the test build (base path /lib/, mock AI endpoint). Run on desktop and a 390px viewport.
import { test, expect } from '@playwright/test';

const SSE = [
  'data: {"id":"1","choices":[{"delta":{"role":"assistant","content":"Hello "}}]}',
  'data: {"id":"1","choices":[{"delta":{"content":"from **mock**"}}]}',
  'data: {"id":"1","choices":[{"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":12,"completion_tokens":3}}',
  'data: [DONE]', ''
].join('\n\n');

async function mockAi(page) {
  const calls = [];
  await page.route('**/mock-ai/v1/chat/completions', async (route) => {
    calls.push(route.request().postDataJSON());
    await route.fulfill({ status: 200, contentType: 'text/event-stream', body: SSE });
  });
  return calls;
}

test.describe('home and search', () => {
  test('home focuses the search box and searching goes to browse with results', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('#start-here')).toBeVisible();
    await expect(page.locator('.banner--sticky')).toHaveText('TEST ENVIRONMENT');
    await expect(page.locator('#home-search')).toBeFocused();
    await page.locator('#home-search').fill('security review');
    await page.locator('#home-search').press('Enter');
    await expect(page).toHaveURL(/\/lib\/browse\/\?q=security\+review/);
    await expect(page.locator('#result-count')).toContainText('results for');
    const first = page.locator('#results .card').first();
    await expect(first).toContainText('Security code review');
    await expect(page.locator('#results .card__snippet mark').first()).toBeVisible();
  });

  test('slash focuses search, ? opens the shortcuts dialog, j/k move through results', async ({ page }) => {
    await page.goto('./browse/');
    await page.locator('body').press('/');
    await expect(page.locator('#site-search')).toBeFocused();
    await page.locator('#site-search').press('Escape');
    await page.locator('body').press('?');
    await expect(page.locator('#shortcuts-dialog')).toBeVisible();
    await page.locator('#shortcuts-dialog [data-close-dialog]').click();
    await expect(page.locator('#shortcuts-dialog')).toBeHidden();
    await page.locator('body').press('j');
    await expect(page.locator('#results .card').first()).toHaveClass(/is-focused/);
    await page.locator('body').press('j');
    await expect(page.locator('#results .card').nth(1)).toHaveClass(/is-focused/);
    await page.locator('body').press('k');
    await expect(page.locator('#results .card').first()).toHaveClass(/is-focused/);
  });
});

test.describe('browse filters', () => {
  test('filters combine, live in the URL, and clear', async ({ page }) => {
    await page.goto('./browse/');
    await expect(page.locator('#result-count strong')).toHaveText('28');
    await page.locator('.filter-group[data-axis="type"] > summary').click();
    await page.locator('.filter-group[data-axis="type"] .chip[data-value="skill"]').click();
    await expect(page).toHaveURL(/type=skill/);
    await expect(page.locator('#result-count strong')).toHaveText('2');
    await expect(page.locator('#active-filters .chip')).toHaveCount(1);
    await page.locator('.filter-group[data-axis="type"] .chip[data-value="rule"]').click(); // OR within an axis
    await expect(page.locator('#result-count strong')).toHaveText('5');
    await page.locator('.filter-group[data-axis="assistant"] > summary').click();
    await page.locator('.filter-group[data-axis="assistant"] .chip[data-value="codex-cli"]').click(); // AND across axes
    await expect(page).toHaveURL(/type=skill,rule/);
    await expect(page).toHaveURL(/assistant=codex-cli/);
    const n = Number(await page.locator('#result-count strong').textContent());
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThan(5);
    await page.goBack();
    await expect(page.locator('#result-count strong')).toHaveText('5');
    await page.locator('#clear-filters').click();
    await expect(page.locator('#result-count strong')).toHaveText('28');
    await expect(page).toHaveURL(/\/lib\/browse\/$/);
  });

  test('landing pages pre-select their filter and the list view persists', async ({ page }) => {
    await page.goto('./browse/type/prompt/');
    await expect(page.locator('h1')).toHaveText('Prompts');
    await expect(page.locator('#results .card')).toHaveCount(10);
    await page.locator('#view-list').click();
    await expect(page.locator('#results')).toHaveAttribute('data-view', 'list');
    await page.reload();
    await expect(page.locator('#results')).toHaveAttribute('data-view', 'list');
  });
});

test.describe('artefact page', () => {
  test('variables fill inline, copy uses them, and values persist', async ({ page, context, browserName }) => {
    await page.goto('./library/security-code-review/');
    const lang = page.locator('select.var-field[data-var="language"]').first();
    const focus = page.locator('input.var-field[data-var="focus"]').first();
    await expect(lang).toHaveValue('Python');
    await lang.selectOption('Go');
    await focus.fill('SQL injection');
    await page.locator('#copy-btn').click();
    await expect(page.locator('#copy-btn')).toHaveClass(/is-done/);
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toContain('reviewing Go code');
    expect(text).toContain('Prioritise SQL injection,');
    expect(text).not.toContain('{{');
    await page.reload();
    await expect(page.locator('select.var-field[data-var="language"]').first()).toHaveValue('Go');
    await expect(page.locator('input.var-field[data-var="focus"]').first()).toHaveValue('SQL injection');
    // The plain-text fallback mirrors the assembled prompt.
    await expect(page.locator('#prompt-fallback textarea')).toHaveValue(/reviewing Go code/);
  });

  test('variants switch the body and the copy', async ({ page }) => {
    await page.goto('./library/security-code-review/');
    await page.locator('#variant-switch [data-variant="claude"]').click();
    await expect(page.locator('.prompt__variant[data-variant="claude"]')).toBeVisible();
    await expect(page.locator('.prompt__variant[data-variant=""]')).toBeHidden();
    await page.locator('#copy-btn').click();
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toContain('<task>');
  });

  test('install one-liner uses the site origin and switches shells', async ({ page }) => {
    await page.goto('./library/threat-model/');
    await page.locator('[data-open-install]').click();
    await expect(page.locator('#install')).toHaveAttribute('open', '');
    const cmd = page.locator('#install-cmd pre');
    await expect(cmd).toContainText('mkdir -p');
    await expect(cmd).toContainText('http://127.0.0.1:4180/lib/downloads/threat-model.zip');
    await expect(cmd).toContainText('.claude/skills/threat-model');
    await page.locator('[data-shell="powershell"]').click();
    await expect(cmd).toContainText('Expand-Archive');
    await page.locator('#install-target').selectOption({ index: 1 });
    await expect(cmd).not.toContainText('.claude/skills/threat-model');
  });

  test('favourite from the page shows up on the favourites view', async ({ page }) => {
    await page.goto('./library/patient-tutor/');
    await page.locator('#fav-btn').click();
    await expect(page.locator('#fav-btn')).toHaveAttribute('aria-pressed', 'true');
    await page.goto('./favourites/');
    await expect(page.locator('#favourites-list .card')).toHaveCount(1);
    await expect(page.locator('#favourites-list .card__title')).toContainText('Patient tutor');
    await expect(page.locator('#favs-count')).toHaveText('1');
    await expect(page.locator('#export-favs')).toBeVisible();
    await page.locator('#favourites-list .btn-fav').click();
    await expect(page.locator('#favourites-empty')).toBeVisible();
  });

  test('reading and copying work without JavaScript', async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(`${baseURL}library/explain-this-error/`);
    await expect(page.locator('h1')).toHaveText('Explain this error message');
    await page.locator('#prompt-fallback summary').click();
    await expect(page.locator('#prompt-fallback textarea')).toHaveValue(/I got this error while running the program/);
    await ctx.close();
  });
});

test.describe('theme', () => {
  test('switching to dark persists across reloads', async ({ page }) => {
    await page.goto('./');
    await page.locator('#theme-menu > summary').click();
    await page.locator('#theme-menu input[value="dark"]').check();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.locator('#theme-menu .swatch[data-accent="violet"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-accent', 'violet');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('html')).toHaveAttribute('data-accent', 'violet');
  });
});

test.describe('send to AI', () => {
  test('sends the filled prompt to the mocked endpoint and streams the reply', async ({ page }) => {
    const calls = await mockAi(page);
    await page.goto('./library/security-code-review/');
    await page.locator('input.var-field[data-var="focus"]').first().fill('XSS');
    await page.locator('#send-to-ai-btn').click();
    await expect(page.locator('#ai-panel')).toBeVisible();
    await expect(page.locator('#ai-model')).toHaveValue('mock-model');
    await page.locator('#ai-user').fill('def f(x): return x');
    await page.locator('#ai-send').click();
    await expect(page.locator('#ai-reply')).toContainText('Hello from mock');
    await expect(page.locator('#ai-reply strong')).toHaveText('mock');
    await expect(page.locator('#ai-usage')).toContainText('12 input tokens');
    await expect(page.locator('#ai-status')).toHaveText('Done.');
    expect(calls).toHaveLength(1);
    expect(calls[0].model).toBe('mock-model');
    expect(calls[0].messages[0].role).toBe('user');
    expect(calls[0].messages[0].content).toContain('Prioritise XSS');
    expect(calls[0].messages[0].content).toContain('def f(x): return x');
    expect(calls[0].stream).toBe(true);
  });

  test('a system prompt artefact goes in the system message; the try page works too', async ({ page }) => {
    const calls = await mockAi(page);
    await page.goto('./library/terse-senior-engineer/');
    await page.locator('#send-to-ai-btn').click();
    await page.locator('#ai-send').click();
    await expect(page.locator('#ai-status')).toContainText('Type a message');
    await page.locator('#ai-user').fill('How do I reverse a list in Python?');
    await page.locator('#ai-send').click();
    await expect(page.locator('#ai-reply')).toContainText('Hello from mock');
    expect(calls[0].messages[0].role).toBe('system');
    expect(calls[0].messages[0].content).toContain('senior software engineer');
    expect(calls[0].messages[1].content).toBe('How do I reverse a list in Python?');
    await page.goto('./try/');
    await page.locator('#try-prompt').fill('Say pong');
    await page.locator('#ai-send').click();
    await expect(page.locator('#ai-reply')).toContainText('Hello from mock');
    expect(calls[1].messages[0].content).toBe('Say pong');
  });

  test('an unreachable endpoint explains itself instead of breaking the page', async ({ page }) => {
    await page.route('**/mock-ai/v1/chat/completions', (route) => route.abort('connectionrefused'));
    await page.goto('./try/');
    await page.locator('#try-prompt').fill('hi');
    await page.locator('#ai-check').click();
    await expect(page.locator('#ai-status')).toContainText('could not reach');
    await expect(page.locator('#ai-status')).toContainText('CORS');
    await expect(page.locator('#ai-send')).toBeEnabled();
  });
});
