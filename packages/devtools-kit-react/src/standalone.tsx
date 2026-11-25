import { useEffect, useState } from 'react';
import { DevtoolsPanelRoot, DevtoolsPanelContent, DevtoolsTrigger, DevtoolsClose, useDevtoolsPanel } from './interactions';
import { createPortal } from 'react-dom';
import type { ActionAdapter, ActionContract, Devtools } from '@jfdevelops/devtools-kit';
import { DevtoolsProvider } from './context';
import { DevtoolsPanel } from './panel/Panel';
import { CHROME_CSS, PANEL_CSS } from './panel/styles';
import type { DevtoolsTab } from './tab';

const IS_PROD = process.env.NODE_ENV === 'production';

export interface DevtoolsStandaloneProps<VM, Actions extends ActionContract<Actions> = ActionContract> {
  /** The devtools client. A per-library wrapper typically creates this. */
  devtools: Devtools<VM>;
  /** Tabs to show. */
  tabs: ReadonlyArray<DevtoolsTab<VM>>;
  /** Start with the panel open. Default `false`. */
  defaultOpen?: boolean;
  /** Header label. */
  title?: string;
  /** Actions the tabs can call through `useDevtoolsActions`. Without it, every action is unavailable. */
  actions?: ActionAdapter<Actions>;
  /** Extra CSS added to the shadow root after the built-in styles, whether or not `injectStyles` is on. */
  css?: string;
  enabled?: boolean;
  nonce?: string;
  injectStyles?: boolean;
  container?: HTMLElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Self-contained devtools chrome: a floating toggle and a panel inside a Shadow
 * DOM so nothing leaks in or out. Renders nothing in a production build.
 */
export function DevtoolsStandalone<VM, Actions extends ActionContract<Actions> = ActionContract>(props: DevtoolsStandaloneProps<VM, Actions>) {
  if (!(props.enabled ?? !IS_PROD)) {
    return null;
  }
  return <DevtoolsChrome {...props} />;
}

function DevtoolsChrome<VM, Actions extends ActionContract<Actions>>({
  devtools,
  tabs,
  actions,
  css,
  defaultOpen = false,
  title = 'devtools',
  nonce,
  injectStyles = true,
  container,
  open,
  onOpenChange,
}: DevtoolsStandaloneProps<VM, Actions>) {
  const shadowRoot = useShadowRoot(container, injectStyles, nonce);

  useShadowCss(shadowRoot, css, nonce);

  if (!shadowRoot) {
    return null;
  }

  return createPortal(
    <DevtoolsProvider devtools={devtools as Devtools<unknown>} actions={actions}>
      <DevtoolsPanelRoot open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
        <div className='dtk-chrome'>
          <DevtoolsPanelContent className='dtk-chrome__panel' autoFocus>
            <div className='dtk-chrome__header'>
              <span>{title}</span>
              <DevtoolsClose className='dtk-chrome__close' aria-label='Close devtools'>&times;</DevtoolsClose>
            </div>
            <div className='dtk-chrome__slot'><DevtoolsPanel tabs={tabs} injectStyles={false} /></div>
          </DevtoolsPanelContent>
          <StandaloneTrigger title={title} />
        </div>
      </DevtoolsPanelRoot>
    </DevtoolsProvider>,
    shadowRoot,
  );
}

/** Creates a `<div>` on `document.body` with an open shadow root to portal into. */
function useShadowRoot(container: HTMLElement | undefined, injectStyles: boolean, nonce: string | undefined): ShadowRoot | null {
  const [root, setRoot] = useState<ShadowRoot | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    const ownerDocument = container?.ownerDocument ?? document;
    const host = ownerDocument.createElement('div');
    host.setAttribute('data-devtools-kit', '');
    const shadow = host.attachShadow({ mode: 'open' });
    const style = ownerDocument.createElement('style');
    if (nonce) style.nonce = nonce;
    style.textContent = `${CHROME_CSS}\n${PANEL_CSS}`;
    if (injectStyles) shadow.appendChild(style);
    (container ?? ownerDocument.body).appendChild(host);
    setRoot(shadow);

    return () => {
      host.remove();
      setRoot(null);
    };
  }, [container, injectStyles, nonce]);

  return root;
}

/** Appends the consumer's CSS after the built-in styles, so it wins on equal specificity. */
function useShadowCss(shadowRoot: ShadowRoot | null, css: string | undefined, nonce: string | undefined) {
  useEffect(() => {
    if (!shadowRoot || !css) {
      return;
    }

    const style = shadowRoot.ownerDocument.createElement('style');

    if (nonce) {
      style.nonce = nonce;
    }

    style.textContent = css;
    shadowRoot.appendChild(style);

    return () => {
      style.remove();
    };
  }, [shadowRoot, css, nonce]);
}

function StandaloneTrigger({ title }: { title: string }) {
  const { open } = useDevtoolsPanel();
  // Stays mounted while open so focus can return to it on close.
  return <DevtoolsTrigger className='dtk-chrome__toggle' hidden={open}>{title}</DevtoolsTrigger>;
}
