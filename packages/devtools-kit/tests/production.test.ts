import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { build } from 'vite';
import { expect, it } from 'vitest';

it('verifies exclusion, default no-op and explicit opt-in in actual production bundles', async () => {
  for (const fixture of ['excluded', 'noop', 'enabled']) {
    const result = await build({ configFile: false, logLevel: 'silent', define: { 'process.env.NODE_ENV': JSON.stringify('production') }, build: { write: false, minify: true, lib: { entry: resolve(import.meta.dirname, `fixtures/${fixture}.ts`), name: 'fixture', formats: ['iife'] } } });
    const output = Array.isArray(result) ? result[0] : result;
    if (!('output' in output)) throw new Error('Expected a bundle');
    const code = output.output.map((chunk) => chunk.type === 'chunk' ? chunk.code : '').join('');
    const context: { fixtureResult?: unknown; [key: string]: unknown } = { queueMicrotask: () => {} };
    runInNewContext(code, context);
    if (fixture === 'excluded') {
      expect(code).not.toContain('__excluded_fixture__');
      expect(code).not.toContain('development-only-payload');
      expect(code).not.toContain('putEntity');
    } else if (fixture === 'noop') {
      expect(context.fixtureResult).toEqual([]);
      expect(context.__noop_fixture__).toBeUndefined();
    } else {
      expect(context.fixtureResult).toEqual(['production-event']);
    }
  }
});
