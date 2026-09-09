import { useMemo, useState } from 'react';
import type { DevtoolsTab } from '../tab';

/** A row in the built-in event-log tab. */
export interface DevtoolsEventRow {
  type: string;
  at: number;
  detail?: string;
}

/** A row in the built-in diagnostics tab. */
export interface DevtoolsDiagnosticRow {
  kind: string;
  at: number;
  title: string;
  detail?: string;
  context?: unknown;
}

function formatTime(at: number): string {
  const date = new Date(at);
  return `${String(date.getMinutes()).padStart(2, '0')}:${String(
    date.getSeconds(),
  ).padStart(2, '0')}.${String(date.getMilliseconds()).padStart(3, '0')}`;
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export interface EventLogTabOptions<VM> {
  select: (viewModel: VM) => ReadonlyArray<DevtoolsEventRow>;
  id?: string;
  label?: string;
}

/** Built-in tab: a reverse-chronological event log with per-type filters. */
export function createEventLogTab<VM>({
  select,
  id = 'events',
  label = 'Events',
}: EventLogTabOptions<VM>): DevtoolsTab<VM> {
  return {
    id,
    label,
    count: (viewModel) => select(viewModel).length,
    render: (viewModel) => <EventLog rows={select(viewModel)} />,
  };
}

function EventLog({ rows }: { rows: ReadonlyArray<DevtoolsEventRow> }) {
  const types = useMemo(
    () => [...new Set(rows.map((row) => row.type))].sort(),
    [rows],
  );
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set());

  const visible = rows
    .filter((row) => !hidden.has(row.type))
    .slice()
    .reverse();

  function toggle(type: string) {
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }

  return (
    <div>
      {types.length > 0 ? (
        <div className='dtk__filters'>
          {types.map((type) => (
            <button
              type='button'
              key={type}
              className='dtk__filter'
              data-active={!hidden.has(type)}
              onClick={() => toggle(type)}
            >
              {type}
            </button>
          ))}
        </div>
      ) : null}
      {visible.length === 0 ? (
        <p className='dtk__empty'>No events.</p>
      ) : (
        <div className='dtk__list'>
          {visible.map((row, index) => (
            <div className='dtk__row' key={`${row.at}-${index}`}>
              <span className='dtk__row-time'>{formatTime(row.at)}</span>
              <span className='dtk__row-type'>{row.type}</span>
              <span className='dtk__row-detail'>{row.detail ?? ''}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export interface DiagnosticsTabOptions<VM> {
  select: (viewModel: VM) => ReadonlyArray<DevtoolsDiagnosticRow>;
  id?: string;
  label?: string;
}

/** Built-in tab: a list of diagnostic entries, newest first. */
export function createDiagnosticsTab<VM>({
  select,
  id = 'diagnostics',
  label = 'Diagnostics',
}: DiagnosticsTabOptions<VM>): DevtoolsTab<VM> {
  return {
    id,
    label,
    count: (viewModel) => select(viewModel).length,
    render: (viewModel) => <Diagnostics rows={select(viewModel)} />,
  };
}

function Diagnostics({ rows }: { rows: ReadonlyArray<DevtoolsDiagnosticRow> }) {
  if (rows.length === 0) {
    return <p className='dtk__empty'>Nothing to report.</p>;
  }
  return (
    <div>
      {rows.map((row, index) => (
        <div className='dtk__diag' data-kind={row.kind} key={`${row.at}-${index}`}>
          <div className='dtk__diag-title'>{row.title}</div>
          {row.detail ? (
            <div className='dtk__diag-detail'>{row.detail}</div>
          ) : null}
          {row.context != null ? (
            <pre className='dtk__diag-context'>{safeStringify(row.context)}</pre>
          ) : null}
        </div>
      ))}
    </div>
  );
}
