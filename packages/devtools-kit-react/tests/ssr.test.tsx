// @vitest-environment node
import { resolve } from 'node:path';
import { renderToString } from 'react-dom/server';
import { build } from 'vite';
import { expect, it } from 'vitest';
import { createExternalStoreClient, DevtoolsProvider, DevtoolsPanelRoot, DevtoolsPanelContent, DevtoolsShadowHost, useDevtoolsViewModel } from '../src/headless';

it('imports and server-renders headless content without a browser', () => {
  const client = createExternalStoreClient({ getSnapshot: () => 'client', getServerSnapshot: () => 'server', subscribe: () => () => {} });
  function Content() { return <span>{useDevtoolsViewModel<string>()}</span>; }
  const html = renderToString(<DevtoolsProvider client={client}><DevtoolsPanelRoot defaultOpen><DevtoolsPanelContent><Content /></DevtoolsPanelContent></DevtoolsPanelRoot><DevtoolsShadowHost container={null}>Deferred</DevtoolsShadowHost></DevtoolsProvider>);
  expect(html).toContain('server');
  expect(html).not.toContain('<style');
  expect(html).not.toContain('Deferred');
});

it('keeps styled presets out of the built headless entry', async () => {
  const result = await build({ configFile: false, logLevel: 'silent', define: { 'process.env.NODE_ENV': JSON.stringify('production') }, build: {
    write: false,
    lib: { entry: resolve(import.meta.dirname, '../src/headless.ts'), formats: ['es'] },
    rollupOptions: { external: ['react', 'react-dom', 'react/jsx-runtime', '@jfdevelops/devtools-kit'] },
  } });
  const output = Array.isArray(result) ? result[0] : result;
  if (!('output' in output)) throw new Error('Expected a bundle');
  const code = output.output.map((chunk) => chunk.type === 'chunk' ? chunk.code : '').join('');
  expect(code).not.toContain('.dtk');
  expect(code).not.toContain('DevtoolsStandalone');
  expect(code).not.toContain('PANEL_CSS');
});
