import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function DevtoolsPortal({ container, children }: { container: Element | DocumentFragment | null; children: ReactNode }) {
  return container ? createPortal(children, container) : null;
}

/** No implicit body host. The caller owns placement and the containing element. */
export function DevtoolsShadowHost({ container, children, css, nonce }: { container: HTMLElement | null; children: ReactNode; css?: string; nonce?: string }) {
  const [root, setRoot] = useState<ShadowRoot | null>(null);
  useEffect(() => {
    if (!container) return;
    const host = container.ownerDocument.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    container.appendChild(host);
    setRoot(shadow);
    return () => { host.remove(); setRoot(null); };
  }, [container]);
  return root ? createPortal(<>{css ? <style nonce={nonce}>{css}</style> : null}{children}</>, root) : null;
}
