import type { ReactNode } from 'react';

/**
 * A panel tab. Libraries build their own (a resource tree, a form-steps view)
 * and pass them to {@link DevtoolsPanel} / {@link DevtoolsStandalone} alongside
 * the built-in event-log and diagnostics tabs.
 */
export interface DevtoolsTab<VM> {
  id: string;
  label: string;
  /** Optional badge count shown next to the label. */
  count?: (viewModel: VM) => number | undefined;
  render: (viewModel: VM) => ReactNode;
}
