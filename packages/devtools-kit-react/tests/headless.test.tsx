import { StrictMode, createRef } from 'react';
import { renderToString } from 'react-dom/server';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { createExternalStoreClient, DevtoolsProvider, useDevtoolsViewModel, DevtoolsPanelRoot, DevtoolsTrigger, DevtoolsClose, DevtoolsPanelContent, usePanelGeometry, useDevtoolsTabs, DevtoolsShadowHost } from '../src/headless';

afterEach(cleanup);

it('renders provider-only inspectors without markup or styles and cleans borrowed subscriptions in StrictMode', () => {
  let snapshot = { requests: 1 };
  const listeners = new Set<() => void>();
  const client = createExternalStoreClient({ getSnapshot: () => snapshot, getServerSnapshot: () => ({ requests: 0 }), subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; } });
  function Inspector() { return <span>{useDevtoolsViewModel<{ requests: number }>().requests}</span>; }
  const view = render(<StrictMode><DevtoolsProvider client={client}><Inspector /></DevtoolsProvider></StrictMode>);
  expect(listeners.size).toBe(1);
  expect(view.container.querySelector('style')).toBeNull();
  act(() => { snapshot = { requests: 2 }; listeners.forEach((listener) => listener()); });
  expect(screen.getByText('2')).toBeInTheDocument();
  view.unmount();
  expect(listeners.size).toBe(0);
  expect(renderToString(<DevtoolsProvider client={client}><Inspector /></DevtoolsProvider>)).toContain('0');
});

it('isolates panel state, forwards refs and restores focus on Escape', () => {
  const ref = createRef<HTMLButtonElement>();
  render(<><DevtoolsPanelRoot><DevtoolsTrigger ref={ref}>First</DevtoolsTrigger><DevtoolsPanelContent aria-label='Inspector'><DevtoolsClose>Close</DevtoolsClose></DevtoolsPanelContent></DevtoolsPanelRoot><DevtoolsPanelRoot><DevtoolsTrigger>Second</DevtoolsTrigger></DevtoolsPanelRoot></>);
  fireEvent.click(ref.current!);
  expect(screen.getByText('Second')).toHaveAttribute('aria-expanded', 'false');
  fireEvent.keyDown(screen.getByLabelText('Inspector'), { key: 'Escape' });
  expect(ref.current).toHaveFocus();
  expect(screen.queryByText('Close')).toBeNull();
});

it('requests controlled changes without feedback and contains focus only when modal', () => {
  const onChange = vi.fn();
  const view = render(<DevtoolsPanelRoot open onOpenChange={onChange}><DevtoolsPanelContent modal aria-label='Modal'><button>A</button><button>B</button></DevtoolsPanelContent></DevtoolsPanelRoot>);
  expect(onChange).not.toHaveBeenCalled();
  screen.getByText('B').focus();
  fireEvent.keyDown(screen.getByText('B'), { key: 'Tab' });
  expect(screen.getByText('A')).toHaveFocus();
  fireEvent.keyDown(screen.getByText('A'), { key: 'Escape' });
  expect(onChange).toHaveBeenCalledWith(false);
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  view.unmount();
});

it('supports keyboard geometry constraints and cleans pointer listeners on unmount', () => {
  const remove = vi.spyOn(window, 'removeEventListener');
  function Handles() {
    const { geometry, getDragHandleProps, getResizeHandleProps } = usePanelGeometry();
    return <><div {...getDragHandleProps()} /><div {...getResizeHandleProps()} /><output>{JSON.stringify(geometry)}</output></>;
  }
  const view = render(<StrictMode><Handles /></StrictMode>);
  fireEvent.keyDown(screen.getByLabelText('Move panel'), { key: 'ArrowLeft' });
  expect(screen.getByRole('status').textContent).toContain('"x":0');
  fireEvent.keyDown(screen.getByLabelText('Resize panel'), { key: 'ArrowRight' });
  expect(screen.getByRole('status').textContent).toContain('481');
  fireEvent.pointerDown(screen.getByLabelText('Move panel'), { button: 0, pointerId: 1, clientX: 0, clientY: 0 });
  view.unmount();
  expect(remove).toHaveBeenCalledWith('pointermove', expect.any(Function));
  remove.mockRestore();
});

it('navigates tabs and mounts optional shadow content in an explicit container', () => {
  function Tabs() {
    const tabs = useDevtoolsTabs({ ids: ['a', 'b'] });
    return <><div role='tablist'><button {...tabs.getTabProps('a')}>A</button><button {...tabs.getTabProps('b')}>B</button></div><div {...tabs.getPanelProps('b')}>Content</div></>;
  }
  render(<Tabs />);
  fireEvent.keyDown(screen.getByText('A'), { key: 'End' });
  expect(screen.getByText('B')).toHaveFocus();
  expect(screen.getByText('B')).toHaveAttribute('aria-selected', 'true');
  const container = document.createElement('div');
  const view = render(<StrictMode><DevtoolsShadowHost container={container} css='button {}' nonce='test'>Shadow content</DevtoolsShadowHost></StrictMode>);
  expect(container.children).toHaveLength(1);
  expect(container.firstElementChild?.shadowRoot?.querySelector('style')?.nonce).toBe('test');
  view.unmount();
  expect(container.children).toHaveLength(0);
});

it('supports a graph-shaped source independently of a request-shaped source', () => {
  const graph = createExternalStoreClient({
    getSnapshot: () => graphSnapshot,
    subscribe: () => () => {},
  });
  const graphSnapshot = { nodes: new Map([['layout:1', { mounted: 2, source: 'layout.tsx', children: ['layout:2'] }]]) };
  const requests = createExternalStoreClient({ getSnapshot: () => requestSnapshot, subscribe: () => () => {} });
  const requestSnapshot = { requests: ['https://example.test'] };
  function Graph() { const value = useDevtoolsViewModel<typeof graphSnapshot>(); return <span>{value.nodes.get('layout:1')?.source}</span>; }
  function Requests() { const value = useDevtoolsViewModel<typeof requestSnapshot>(); return <span>{value.requests[0]}</span>; }
  render(<><DevtoolsProvider client={graph}><Graph /></DevtoolsProvider><DevtoolsProvider client={requests}><Requests /></DevtoolsProvider></>);
  expect(screen.getByText('layout.tsx')).toBeInTheDocument();
  expect(screen.getByText('https://example.test')).toBeInTheDocument();
  expect(graph.getViewModel()).toBe(graphSnapshot);
});

it('releases drags when pointer capture is lost and skips notifying unchanged geometry on resize', () => {
  const onChange = vi.fn();
  const geometry = { x: 10, y: 10, width: 200, height: 150 };
  function Handle() {
    const { getDragHandleProps } = usePanelGeometry({ value: geometry, onChange });
    return <div {...getDragHandleProps()} />;
  }
  render(<Handle />);
  const handle = screen.getByLabelText('Move panel');
  handle.setPointerCapture = vi.fn();
  fireEvent.pointerDown(handle, { button: 0, pointerId: 1, clientX: 0, clientY: 0 });
  expect(handle.setPointerCapture).toHaveBeenCalledWith(1);
  const remove = vi.spyOn(window, 'removeEventListener');
  fireEvent(handle, Object.assign(new Event('lostpointercapture'), { pointerId: 1 }));
  expect(remove).toHaveBeenCalledWith('pointermove', expect.any(Function));
  remove.mockRestore();
  fireEvent(window, new Event('resize'));
  expect(onChange).not.toHaveBeenCalled();
});
