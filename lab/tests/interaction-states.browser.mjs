import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';
import { createServer } from 'vite';

// The shared interaction states are CSS: cascade layers, pseudo-classes and color math need a real browser.
const fixtureId = '\0interaction-states-fixture';
const fixture = {
  name: 'interaction-states-fixture',
  configureServer(server) {
    server.middlewares.use(async (request, response, next) => {
      if (request.url !== '/interaction-states') return next();
      response.setHeader('Content-Type', 'text/html');
      response.end(await server.transformIndexHtml(request.url, `<!doctype html><html><body class="agent-ui-theme" style="margin:24px">
        <button id="neutral" class="agent-ui-interactive">Neutral</button>
        <button id="selected" class="agent-ui-interactive" aria-pressed="true">Selected</button>
        <button id="disabled" class="agent-ui-interactive" disabled>Disabled</button>
        <button id="solid" class="agent-ui-interactive" data-variant="primary" data-appearance="solid">Solid</button>
        <section data-agent-ui-scope><div id="scoped-tab" role="tab" tabindex="0">Tab</div></section>
        <button id="host" class="agent-ui-interactive">Host</button>
        <script type="module" src="/interaction-states.js"></script></body></html>`));
    });
  },
  resolveId(id) { if (id === '/interaction-states.js') return fixtureId; },
  load(id) { if (id === fixtureId) return `import '/@fs/${fileURLToPath(new URL('../../src/vue/styles.css', import.meta.url))}';`; },
};
const server = await createServer({
  configFile: new URL('../vite.config.ts', import.meta.url).pathname,
  root: new URL('..', import.meta.url).pathname,
  plugins: [fixture],
  server: { port: 0, strictPort: false },
});
let browser;
try {
  await server.listen();
  for (const engine of [chromium, webkit]) {
    browser = await engine.launch();
    const page = await browser.newPage();
    page.setDefaultTimeout(10_000);
    await page.goto(new URL('/interaction-states', server.resolvedUrls.local[0]).href);
    await page.locator('#neutral').waitFor();
    const style = (selector, property) => page.locator(selector).evaluate((element, name) => getComputedStyle(element)[name], property);
    const label = text => `${engine.name()}: ${text}`;
    await page.addStyleTag({ content: ':root { --agent-ui-state-hover: rgb(40, 50, 60); --agent-ui-state-selected: rgb(1, 2, 3); }' });

    // Hover, selected, scope hook and disabled come from the shared rules and tokens.
    await page.locator('#neutral').hover();
    assert.equal(await style('#neutral', 'backgroundColor'), 'rgb(40, 50, 60)', label('hover token'));
    assert.equal(await style('#selected', 'backgroundColor'), 'rgb(1, 2, 3)', label('selected token'));
    await page.locator('#scoped-tab').hover();
    assert.equal(await style('#scoped-tab', 'backgroundColor'), 'rgb(40, 50, 60)', label('scoped role=tab hover'));
    await page.locator('#disabled').hover({ force: true });
    assert.equal(await style('#disabled', 'backgroundColor'), 'rgba(0, 0, 0, 0)', label('disabled has no hover fill'));
    assert.equal(await style('#disabled', 'cursor'), 'default', label('disabled cursor'));

    // Solid hover moves away from the foreground: contrast never drops.
    // Computed colors can come back as oklab() or color(), so read them as real sRGB pixels through a canvas.
    const pixel = value => page.evaluate(color => {
      const context = Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d', { willReadFrequently: true });
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
    }, value);
    const luminance = rgb => { const [r, g, b] = rgb.map(channel => { const v = channel / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const ratio = async (a, b) => { const x = luminance(await pixel(a)); const y = luminance(await pixel(b)); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    for (const [fill, foreground] of [['rgb(30, 102, 245)', 'rgb(239, 241, 245)'], ['rgb(137, 180, 250)', 'rgb(30, 30, 46)']]) {
      await page.addStyleTag({ content: `#solid { --agent-ui-state-primary-solid: ${fill}; --agent-ui-state-primary-solid-foreground: ${foreground}; }` });
      await page.locator('#solid').hover();
      assert(await ratio(await style('#solid', 'backgroundColor'), foreground) >= await ratio(fill, foreground) - 0.01, label(`solid hover keeps contrast for ${fill}`));
    }

    // The rules sit in a low-priority layer: plain host CSS wins whatever its specificity.
    await page.addStyleTag({ content: ':where(#host) { background-color: rgb(200, 0, 0); }' });
    assert.equal(await style('#host', 'backgroundColor'), 'rgb(200, 0, 0)', label('unlayered host CSS wins'));
    await browser.close();
    browser = undefined;
  }
  console.log('interaction states: tokens, scope, solid contrast and host overrides behave in Chromium and WebKit');
} finally {
  await browser?.close();
  await server.close();
}
