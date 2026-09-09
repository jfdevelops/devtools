import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createDevtools } from '@jfdevelops/devtools-kit';
import {
  createDiagnosticsTab,
  createEventLogTab,
  DevtoolsPanel,
  DevtoolsProvider,
  DevtoolsStandalone,
  type DevtoolsTab,
} from '../src';

afterEach(() => {
  cleanup();
});

const widgetSchema = z.object({ id: z.string(), label: z.string() });
const eventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('widget:add'), at: z.number(), label: z.string() }),
  z.object({ type: z.literal('widget:error'), at: z.number(), message: z.string() }),
]);
type Event = z.infer<typeof eventSchema>;

interface ViewModel {
  widgets: ReadonlyArray<z.infer<typeof widgetSchema>>;
  events: ReadonlyArray<Event>;
}

let keySeq = 0;

function setup() {
  const key = `__DEVTOOLS_KIT_REACT_TEST_${(keySeq += 1)}__`;
  const api = createDevtools({
    key,
    entities: { widget: widgetSchema },
    events: eventSchema,
  });
  const devtools = api.createClient<ViewModel>((snapshot) => ({
    widgets: snapshot.entities.widget ?? [],
    events: snapshot.events,
  }));

  const widgetsTab: DevtoolsTab<ViewModel> = {
    id: 'widgets',
    label: 'Widgets',
    count: (vm) => vm.widgets.length,
    render: (vm) => (
      <ul>
        {vm.widgets.map((w) => (
          <li key={w.id}>{w.label}</li>
        ))}
      </ul>
    ),
  };
  const eventsTab = createEventLogTab<ViewModel>({
    select: (vm) => vm.events.map((e) => ({ type: e.type, at: e.at })),
  });
  const diagnosticsTab = createDiagnosticsTab<ViewModel>({
    select: (vm) =>
      vm.events
        .filter((e): e is Extract<Event, { type: 'widget:error' }> =>
          e.type === 'widget:error',
        )
        .map((e) => ({
          kind: 'error',
          at: e.at,
          title: 'widget:error',
          detail: e.message,
        })),
  });

  return { api, devtools, tabs: [widgetsTab, eventsTab, diagnosticsTab], key };
}

describe('DevtoolsPanel', () => {
  it('renders tabs with counts and switches between them', async () => {
    const { api, devtools, tabs } = setup();
    api.putEntity('widget', 'w1', { id: 'w1', label: 'Alpha' });
    api.emit({ type: 'widget:add', at: Date.now(), label: 'Alpha' });
    await Promise.resolve();

    render(
      <DevtoolsProvider devtools={devtools}>
        <DevtoolsPanel tabs={tabs} />
      </DevtoolsProvider>,
    );

    expect(screen.getByRole('tab', { name: /Widgets\s*1/ })).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /Events/ }));
    // filter chip + one log row
    expect(screen.getAllByText('widget:add')).toHaveLength(2);
  });

  it('shows diagnostics from the built-in tab', async () => {
    const { api, devtools, tabs } = setup();
    api.emit({ type: 'widget:error', at: Date.now(), message: 'kaboom' });
    await Promise.resolve();

    render(
      <DevtoolsProvider devtools={devtools}>
        <DevtoolsPanel tabs={tabs} defaultTabId='diagnostics' />
      </DevtoolsProvider>,
    );

    expect(screen.getByText('kaboom')).toBeInTheDocument();
  });

  it('filters events by type', async () => {
    const { api, devtools, tabs } = setup();
    api.emit({ type: 'widget:add', at: Date.now(), label: 'A' });
    api.emit({ type: 'widget:error', at: Date.now(), message: 'x' });
    await Promise.resolve();

    render(
      <DevtoolsProvider devtools={devtools}>
        <DevtoolsPanel tabs={tabs} defaultTabId='events' />
      </DevtoolsProvider>,
    );

    expect(screen.getAllByText('widget:add')).toHaveLength(2); // filter chip + row
    fireEvent.click(screen.getByRole('button', { name: 'widget:add' }));
    expect(screen.getAllByText('widget:add')).toHaveLength(1); // chip only
  });
});

describe('DevtoolsStandalone', () => {
  it('mounts a shadow host and toggles open', () => {
    const { devtools, tabs } = setup();
    render(<DevtoolsStandalone devtools={devtools} tabs={tabs} />);

    const host = document.querySelector('[data-devtools-kit]');
    expect(host?.shadowRoot).not.toBeNull();

    const toggle = host!.shadowRoot!.querySelector(
      '.dtk-chrome__toggle',
    ) as HTMLButtonElement;
    fireEvent.click(toggle);
    expect(
      host!.shadowRoot!.querySelector('.dtk-chrome__panel'),
    ).not.toBeNull();
  });
});
