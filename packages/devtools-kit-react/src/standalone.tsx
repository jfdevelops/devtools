import { useEffect, useState } from 'react';
import { DevtoolsPanelRoot, DevtoolsPanelContent, DevtoolsTrigger, DevtoolsClose, useDevtoolsPanel } from './interactions';
import { createPortal } from 'react-dom';
import type { Devtools } from '@jfdevelops/devtools-kit';
import { DevtoolsProvider } from './context';
import { DevtoolsPanel } from './panel/Panel';
import { CHROME_CSS, PANEL_CSS } from './panel/styles';
import type { DevtoolsTab } from './tab';

const IS_PROD = process.env.NODE_ENV === 'production';

export interface DevtoolsStandaloneProps<VM> {
  /** The devtools client. A per-library wrapper typically creates this. */
  devtools: Devtools<VM>;
  /** Tabs to show. */
  tabs: ReadonlyArray<DevtoolsTab<VM>>;
  /** Start with the panel open. Default `false`. */
  defaultOpen?: boolean;
  /** Header label. */
  title?: string;
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
export function DevtoolsStandalone<VM>(props: DevtoolsStandaloneProps<VM>) {
  if (!(props.enabled ?? !IS_PROD)) {
    return null;
  }
  return <DevtoolsChrome {...props} />;
}

function DevtoolsChrome<VM>({
  devtools,
  tabs,
  defaultOpen = false,
  title = 'devtools',
  nonce,
  injectStyles = true,
  container,
  open,
  onOpenChange,
}: DevtoolsStandaloneProps<VM>) {

  const shadowRoot = useShadowRoot(container, injectStyles, nonce);

  if (!shadowRoot) {
    return null;
  }

  return createPortal(
    <DevtoolsProvider devtools={devtools as Devtools<unknown>}>
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

function StandaloneTrigger({ title }: { title: string }) {
  const { open } = useDevtoolsPanel();
  // Stays mounted while open so focus can return to it on close.
  return <DevtoolsTrigger className='dtk-chrome__toggle' hidden={open}>{title}</DevtoolsTrigger>;
}
