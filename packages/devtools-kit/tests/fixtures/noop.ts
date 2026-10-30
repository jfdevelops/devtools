import { createDevtools } from '../../src';
const api = createDevtools({ key: '__noop_fixture__', entities: {} });
api.emit('ignored');
(globalThis as typeof globalThis & { fixtureResult: unknown }).fixtureResult = api.createClient((snapshot) => snapshot.events).getViewModel();

