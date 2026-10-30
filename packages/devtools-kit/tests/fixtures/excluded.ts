import { createDevtools, IS_DEV } from '../../src';
if (IS_DEV) {
  const api = createDevtools({ key: '__excluded_fixture__', entities: {} });
  api.emit('development-only-payload');
}
