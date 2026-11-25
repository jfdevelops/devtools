import * as core from '@jfdevelops/devtools-kit';
import { expect, it } from 'vitest';
import * as headless from '../src/headless';
import * as root from '../src/index';

it('re-exports every core runtime export from both entry points', () => {
  for (const name of Object.keys(core)) {
    expect(root, name).toHaveProperty(name, core[name as keyof typeof core]);
    expect(headless, name).toHaveProperty(name, core[name as keyof typeof core]);
  }
});
