import { useEffect, useState } from 'react';
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
}

/**
 * Self-contained devtools chrome: a floating toggle and a panel inside a Shadow
 * DOM so nothing leaks in or out. Renders nothing in a production build.
 */
export function DevtoolsStandalone<VM>(props: DevtoolsStandaloneProps<VM>) {
  if (IS_PROD) {
    return null;
  }
  return <DevtoolsChrome {...props} />;
}

function DevtoolsChrome<VM>({
  devtools,
  tabs,
  defaultOpen = false,
  title = 'devtools',
}: DevtoolsStandaloneProps<VM>) {
  const [open, setOpen] = useState(defaultOpen);
  const shadowRoot = useShadowRoot();

  if (!shadowRoot) {
    return null;
  }

  return createPortal(
    <DevtoolsProvider devtools={devtools as Devtools<unknown>}>
      <div className='dtk-chrome'>
        {open ? (
          <div className='dtk-chrome__panel'>
            <div className='dtk-chrome__header'>
              <span>{title}</span>
              <button
                type='button'
                className='dtk-chrome__close'
                aria-label='Close devtools'
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
            <div className='dtk-chrome__slot'>
              <DevtoolsPanel tabs={tabs} injectStyles={false} />
            </div>
          </div>
        ) : (
          <button
            type='button'
            className='dtk-chrome__toggle'
            onClick={() => setOpen(true)}
          >
            {title}
          </button>
        )}
      </div>
    </DevtoolsProvider>,
    shadowRoot,
  );
}

/** Creates a `<div>` on `document.body` with an open shadow root to portal into. */
function useShadowRoot(): ShadowRoot | null {
  const [root, setRoot] = useState<ShadowRoot | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    const host = document.createElement('div');
    host.setAttribute('data-devtools-kit', '');
    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `${CHROME_CSS}\n${PANEL_CSS}`;
    shadow.appendChild(style);
    document.body.appendChild(host);
    setRoot(shadow);

    return () => {
      host.remove();
      setRoot(null);
    };
  }, []);

  return root;
}
