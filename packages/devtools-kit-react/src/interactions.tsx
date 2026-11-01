import { createContext, forwardRef, useContext, useEffect, useId, useRef, useState, type HTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from 'react';

/** Change callbacks run only for interaction requests, never in response to props. */
export function useControllableState<Value>({ value, defaultValue, onChange }: { value?: Value; defaultValue: Value; onChange?: (value: Value) => void }) {
  const [internal, setInternal] = useState(defaultValue);
  const current = value === undefined ? internal : value;
  function setValue(next: Value) {
    if (Object.is(next, current)) return;
    if (value === undefined) setInternal(next);
    onChange?.(next);
  }
  return [current, setValue] as const;
}

export interface PanelStateOptions {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function usePanelState({ open, defaultOpen = false, onOpenChange }: PanelStateOptions = {}) {
  const [isOpen, setOpen] = useControllableState({ value: open, defaultValue: defaultOpen, onChange: onOpenChange });
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  return { open: isOpen, setOpen, id, triggerRef };
}
const PanelContext = createContext<ReturnType<typeof usePanelState> | null>(null);
export function DevtoolsPanelRoot({ children, ...options }: PanelStateOptions & { children: ReactNode }) {
  const state = usePanelState(options);
  return <PanelContext.Provider value={state}>{children}</PanelContext.Provider>;
}
export function useDevtoolsPanel() {
  const state = useContext(PanelContext);
  if (!state) throw new Error('Panel interactions require DevtoolsPanelRoot.');
  return state;
}
export const DevtoolsTrigger = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(function DevtoolsTrigger({ onClick, ...props }, ref) {
  const state = useDevtoolsPanel();
  return <button type='button' {...props} ref={ref} aria-expanded={state.open} aria-controls={state.id} onClick={(event) => {
    onClick?.(event);
    if (!event.defaultPrevented) {
      (state.triggerRef as { current: HTMLButtonElement | null }).current = event.currentTarget;
      state.setOpen(!state.open);
    }
  }} />;
});
export const DevtoolsClose = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(function DevtoolsClose({ onClick, ...props }, ref) {
  const state = useDevtoolsPanel();
  return <button type='button' {...props} ref={ref} onClick={(event) => {
    onClick?.(event);
    if (!event.defaultPrevented) state.setOpen(false);
  }} />;
});

/** Inline, unstyled content. Focus containment is explicitly opt-in; `autoFocus` moves focus in on open without containing it. */
export const DevtoolsPanelContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { modal?: boolean }>(function DevtoolsPanelContent({ modal = false, autoFocus = false, onKeyDown, ...props }, forwardedRef) {
  const state = useDevtoolsPanel();
  const elementRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!state.open) return;
    const focusRoot = elementRef.current?.getRootNode() as Document | ShadowRoot | undefined;
    const previous = focusRoot?.activeElement as HTMLElement | null;
    const document = elementRef.current?.ownerDocument;
    function containFocus(event: FocusEvent) {
      if (modal && elementRef.current && !event.composedPath().includes(elementRef.current)) elementRef.current?.focus();
    }
    if (modal || autoFocus) elementRef.current?.focus();
    if (modal) document?.addEventListener('focusin', containFocus);
    return () => {
      document?.removeEventListener('focusin', containFocus);
      const target = state.triggerRef.current ?? previous;
      if (target?.isConnected) target.focus();
    };
  }, [state.open, modal, autoFocus, state.triggerRef]);
  if (!state.open) return null;
  return <div {...props} id={state.id} ref={(element) => {
    elementRef.current = element;
    if (typeof forwardedRef === 'function') forwardedRef(element);
    else if (forwardedRef) forwardedRef.current = element;
  }} role={props.role ?? (modal ? 'dialog' : undefined)} aria-modal={modal || undefined} tabIndex={props.tabIndex ?? -1} onKeyDown={(event) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key === 'Escape') { event.preventDefault(); state.setOpen(false); }
    if (modal && event.key === 'Tab') {
      const elements = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')).filter((element) => element.tabIndex >= 0 && !element.closest('[hidden], [inert]'));
      const first = elements[0];
      const last = elements[elements.length - 1];
      const active = (event.currentTarget.getRootNode() as Document | ShadowRoot).activeElement;
      if (!first) { event.preventDefault(); event.currentTarget.focus(); }
      else if (event.shiftKey && (active === first || active === event.currentTarget)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (active === last || active === event.currentTarget)) { event.preventDefault(); first.focus(); }
    }
  }} />;
});

export type PanelDock = 'floating' | 'left' | 'right' | 'bottom';
export interface PanelGeometry { x: number; y: number; width: number; height: number }

/** Attach prop getters to consumer handles; apply geometry to consumer markup. */
export function usePanelGeometry(options: {
  value?: PanelGeometry;
  defaultValue?: PanelGeometry;
  onChange?: (value: PanelGeometry) => void;
  minWidth?: number;
  minHeight?: number;
} = {}) {
  const [geometry, setGeometry] = useControllableState({ value: options.value, defaultValue: options.defaultValue ?? { x: 0, y: 0, width: 480, height: 320 }, onChange: options.onChange });
  const cleanupRef = useRef<(() => void) | null>(null);
  useEffect(() => () => cleanupRef.current?.(), []);
  function constrain(next: PanelGeometry, view: Window) {
    const width = Math.min(view.innerWidth, Math.max(options.minWidth ?? 160, next.width));
    const height = Math.min(view.innerHeight, Math.max(options.minHeight ?? 100, next.height));
    const x = Math.max(0, Math.min(view.innerWidth - width, next.x));
    const y = Math.max(0, Math.min(view.innerHeight - height, next.y));
    // Keep identity when nothing moved so unchanged geometry never notifies.
    if (x === next.x && y === next.y && width === next.width && height === next.height) return next;
    return { width, height, x, y };
  }
  useEffect(() => {
    // Viewport changes are browser-only and never run during server rendering.
    if (typeof window === 'undefined') return;
    function resize() { setGeometry(constrain(geometry, window)); }
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [geometry, options.onChange, options.value, options.minWidth, options.minHeight]);
  function getHandleProps(mode: 'move' | 'resize'): HTMLAttributes<HTMLElement> {
    return {
      role: 'button', tabIndex: 0, 'aria-label': mode === 'move' ? 'Move panel' : 'Resize panel', style: { touchAction: 'none' },
      onKeyDown(event) {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
        const view = event.currentTarget.ownerDocument.defaultView;
        if (!view) return;
        event.preventDefault();
        const step = event.shiftKey ? 10 : 1;
        const dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
        const dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0;
        setGeometry(constrain(mode === 'move' ? { ...geometry, x: geometry.x + dx, y: geometry.y + dy } : { ...geometry, width: geometry.width + dx, height: geometry.height + dy }, view));
      },
      onPointerDown(event) {
        if (event.button !== 0) return;
        const handle = event.currentTarget;
        const view = handle.ownerDocument.defaultView;
        if (!view) return;
        event.preventDefault();
        cleanupRef.current?.();
        const startX = event.clientX;
        const startY = event.clientY;
        const pointerId = event.pointerId;
        function move(pointer: PointerEvent) {
          if (pointer.pointerId !== pointerId) return;
          const dx = pointer.clientX - startX;
          const dy = pointer.clientY - startY;
          setGeometry(constrain(mode === 'move' ? { ...geometry, x: geometry.x + dx, y: geometry.y + dy } : { ...geometry, width: geometry.width + dx, height: geometry.height + dy }, view!));
        }
        function finish(pointer: PointerEvent) { if (pointer.pointerId === pointerId) cleanup(); }
        function cleanup() {
          handle.removeEventListener('lostpointercapture', finish);
          if (handle.hasPointerCapture?.(pointerId)) handle.releasePointerCapture(pointerId);
          view!.removeEventListener('pointermove', move);
          view!.removeEventListener('pointerup', finish);
          view!.removeEventListener('pointercancel', finish);
          view!.removeEventListener('blur', cleanup);
          cleanupRef.current = null;
        }
        cleanupRef.current = cleanup;
        // Capture keeps pointer events flowing to this document while the pointer crosses iframes.
        handle.setPointerCapture?.(pointerId);
        handle.addEventListener('lostpointercapture', finish);
        view.addEventListener('pointermove', move);
        view.addEventListener('pointerup', finish);
        view.addEventListener('pointercancel', finish);
        view.addEventListener('blur', cleanup);
      },
    };
  }
  return { geometry, setGeometry, getDragHandleProps: () => getHandleProps('move'), getResizeHandleProps: () => getHandleProps('resize') };
}

export function usePanelDock(options: { value?: PanelDock; defaultValue?: PanelDock; onChange?: (dock: PanelDock) => void } = {}) {
  return useControllableState({ ...options, defaultValue: options.defaultValue ?? 'floating' });
}

export function useDevtoolsTabs({ ids, value, defaultValue, onChange }: { ids: readonly string[]; value?: string; defaultValue?: string; onChange?: (id: string) => void }) {
  const [selected, setSelected] = useControllableState({ value, defaultValue: defaultValue ?? ids[0] ?? '', onChange });
  const activeId = ids.includes(selected) ? selected : ids[0];
  const prefix = useId();
  function getTabProps(id: string): ButtonHTMLAttributes<HTMLButtonElement> {
    return { role: 'tab', id: `${prefix}-tab-${id}`, 'aria-controls': `${prefix}-panel-${id}`, 'aria-selected': id === activeId, tabIndex: id === activeId ? 0 : -1,
      onClick: () => setSelected(id),
      onKeyDown(event) {
        const index = ids.indexOf(id);
        let next: number;
        if (event.key === 'ArrowRight') next = (index + 1) % ids.length;
        else if (event.key === 'ArrowLeft') next = (index - 1 + ids.length) % ids.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = ids.length - 1;
        else return;
        event.preventDefault();
        const nextId = ids[next];
        if (nextId !== undefined) {
          setSelected(nextId);
          (event.currentTarget.getRootNode() as Document | ShadowRoot).getElementById(`${prefix}-tab-${nextId}`)?.focus();
        }
      },
    };
  }
  return { activeId, setActiveId: setSelected, getTabProps, getPanelProps: (id: string) => ({ role: 'tabpanel', id: `${prefix}-panel-${id}`, 'aria-labelledby': `${prefix}-tab-${id}`, hidden: id !== activeId }) };
}



/** Apply these opt-in styles to a consumer-owned host. No page space is reserved. */
export function getPanelPresentationStyle(dock: PanelDock, geometry: PanelGeometry) {
  const base = { position: 'fixed' as const, maxWidth: '100vw', maxHeight: '100vh' };
  if (dock === 'bottom') return { ...base, bottom: 0, left: 0, width: '100%', height: geometry.height };
  if (dock === 'left' || dock === 'right') return { ...base, top: 0, [dock]: 0, width: geometry.width, height: '100%' };
  return { ...base, left: geometry.x, top: geometry.y, width: geometry.width, height: geometry.height };
}

