import { useDevtoolsTabs } from '../interactions';
import type { Devtools } from '@jfdevelops/devtools-kit';
import type { DevtoolsTab } from '../tab';
import { useDevtoolsViewModel } from '../use-view-model';
import { PANEL_CSS } from './styles';

export interface DevtoolsPanelProps<VM> {
  /** Tabs to show, in order. */
  tabs: ReadonlyArray<DevtoolsTab<VM>>;
  /** Read from this instance instead of the surrounding provider. */
  devtools?: Devtools<VM>;
  /** Id of the tab shown first. Defaults to the first tab. */
  defaultTabId?: string;
  /** Inject the scoped stylesheet. Default `true`. */
  injectStyles?: boolean;
  nonce?: string;
  activeTabId?: string;
  onActiveTabChange?: (id: string) => void;
}

/**
 * Chrome-less devtools content: a tab bar over the supplied tabs. Render it
 * inside the standalone {@link DevtoolsStandalone} chrome, a routed page, or a
 * shared devtools host.
 */
export function DevtoolsPanel<VM>({
  tabs,
  devtools,
  defaultTabId,
  injectStyles = true,
  nonce,
  activeTabId,
  onActiveTabChange,
}: DevtoolsPanelProps<VM>) {
  const viewModel = useDevtoolsViewModel<VM>(devtools);
  const { activeId, getTabProps, getPanelProps } = useDevtoolsTabs({ ids: tabs.map((tab) => tab.id), value: activeTabId, defaultValue: defaultTabId, onChange: onActiveTabChange });

  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0];

  return (
    <div className='dtk'>
      {injectStyles ? <style nonce={nonce}>{PANEL_CSS}</style> : null}
      <div className='dtk__tabs' role='tablist'>
        {tabs.map((tab) => {
          const count = tab.count?.(viewModel);
          return (
            <button
              type='button'
              {...getTabProps(tab.id)}
              key={tab.id}
              className='dtk__tab'
              data-active={tab.id === active?.id}
              aria-selected={tab.id === active?.id}

            >
              {tab.label}
              {count === undefined ? null : (
                <span className='dtk__tab-count'> {count}</span>
              )}
            </button>
          );
        })}
      </div>
      <div className='dtk__body' {...(active ? getPanelProps(active.id) : {})}>{active ? active.render(viewModel) : null}</div>
    </div>
  );
}
