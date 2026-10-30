import { createDevtools } from '../../src';
const api = createDevtools({ key: '__production_fixture__', entities: {}, enabled: true });
api.emit('production-event');
(globalThis as typeof globalThis & { fixtureResult: unknown }).fixtureResult = api.createClient((snapshot) => snapshot.events).getViewModel();

