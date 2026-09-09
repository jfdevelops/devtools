/**
 * Panel styling, scoped under `.dtk`. Ships as a string so it can go into a
 * Shadow DOM `<style>` (standalone chrome) or the document (bare panel).
 * Colours are CSS variables with a `prefers-color-scheme` swap.
 */
export const PANEL_CSS = `
.dtk {
  --dtk-bg: #ffffff;
  --dtk-bg-subtle: #f6f6f7;
  --dtk-border: #e2e2e5;
  --dtk-text: #1b1b1f;
  --dtk-text-dim: #6a6a73;
  --dtk-accent: #6d40c4;
  --dtk-danger: #c4364a;
  --dtk-warn: #a9700a;
  --dtk-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --dtk-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  all: initial;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  font-family: var(--dtk-sans);
  font-size: 12px;
  line-height: 1.5;
  color: var(--dtk-text);
  background: var(--dtk-bg);
}
.dtk *, .dtk *::before, .dtk *::after { box-sizing: border-box; }

@media (prefers-color-scheme: dark) {
  .dtk {
    --dtk-bg: #1b1b1f;
    --dtk-bg-subtle: #26262b;
    --dtk-border: #37373d;
    --dtk-text: #ececef;
    --dtk-text-dim: #9a9aa3;
    --dtk-accent: #b794f6;
    --dtk-danger: #f2809a;
    --dtk-warn: #e0b464;
  }
}

.dtk__tabs {
  display: flex;
  gap: 2px;
  padding: 6px 8px 0;
  border-bottom: 1px solid var(--dtk-border);
  background: var(--dtk-bg-subtle);
  flex: 0 0 auto;
  overflow-x: auto;
}
.dtk__tab {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--dtk-text-dim);
  font: inherit;
  padding: 6px 10px;
  border-radius: 6px 6px 0 0;
  cursor: pointer;
  white-space: nowrap;
}
.dtk__tab[data-active="true"] {
  color: var(--dtk-text);
  background: var(--dtk-bg);
  border: 1px solid var(--dtk-border);
  border-bottom-color: var(--dtk-bg);
  margin-bottom: -1px;
}
.dtk__tab-count { color: var(--dtk-text-dim); font-variant-numeric: tabular-nums; }

.dtk__body { flex: 1 1 auto; overflow: auto; padding: 8px 10px; }
.dtk__empty { color: var(--dtk-text-dim); padding: 16px 4px; }

.dtk__list { display: flex; flex-direction: column; gap: 4px; }
.dtk__row {
  display: grid;
  grid-template-columns: 72px 110px 1fr;
  gap: 8px;
  padding: 3px 0;
  border-bottom: 1px solid var(--dtk-border);
}
.dtk__row-time { color: var(--dtk-text-dim); font-variant-numeric: tabular-nums; }
.dtk__row-type { font-family: var(--dtk-mono); color: var(--dtk-accent); }
.dtk__row-detail { font-family: var(--dtk-mono); white-space: pre-wrap; word-break: break-word; }

.dtk__filters { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px; }
.dtk__filter {
  appearance: none;
  font: inherit;
  font-size: 10px;
  border: 1px solid var(--dtk-border);
  background: var(--dtk-bg);
  color: var(--dtk-text-dim);
  border-radius: 999px;
  padding: 1px 8px;
  cursor: pointer;
}
.dtk__filter[data-active="true"] { color: var(--dtk-text); border-color: var(--dtk-accent); }

.dtk__diag { border-bottom: 1px solid var(--dtk-border); padding: 6px 0; }
.dtk__diag-title { font-weight: 600; }
.dtk__diag[data-kind="error"] .dtk__diag-title { color: var(--dtk-danger); }
.dtk__diag[data-kind="warning"] .dtk__diag-title,
.dtk__diag[data-kind="props:invalid"] .dtk__diag-title { color: var(--dtk-warn); }
.dtk__diag-detail { color: var(--dtk-text-dim); white-space: pre-wrap; }
.dtk__diag-context {
  font-family: var(--dtk-mono);
  font-size: 11px;
  background: var(--dtk-bg-subtle);
  border-radius: 4px;
  padding: 4px 6px;
  margin-top: 4px;
  overflow-x: auto;
}

/* Helpers libraries can use in custom tabs. */
.dtk__node { margin: 2px 0; }
.dtk__node-row { display: flex; align-items: baseline; gap: 6px; padding: 2px 0; }
.dtk__node-children { margin-left: 14px; border-left: 1px solid var(--dtk-border); padding-left: 8px; }
.dtk__name { font-family: var(--dtk-mono); }
.dtk__tag {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--dtk-text-dim);
  border: 1px solid var(--dtk-border);
  border-radius: 4px;
  padding: 0 4px;
}
`;

/** Floating standalone chrome — separate from the panel so the panel stays bare. */
export const CHROME_CSS = `
:host { all: initial; }
.dtk-chrome {
  position: fixed;
  right: 12px;
  bottom: 12px;
  z-index: 2147483000;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
.dtk-chrome__toggle {
  appearance: none;
  border: 1px solid rgba(0,0,0,0.15);
  background: #6d40c4;
  color: #fff;
  font: 600 12px/1 inherit;
  padding: 8px 12px;
  border-radius: 999px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0,0,0,0.24);
}
.dtk-chrome__panel {
  position: fixed;
  right: 12px;
  bottom: 12px;
  width: min(560px, calc(100vw - 24px));
  height: min(440px, calc(100vh - 24px));
  border: 1px solid rgba(0,0,0,0.18);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 12px 48px rgba(0,0,0,0.32);
  background: #fff;
  display: flex;
  flex-direction: column;
}
.dtk-chrome__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px 6px 12px;
  background: #6d40c4;
  color: #fff;
  font: 600 12px/1 inherit;
}
.dtk-chrome__close {
  appearance: none;
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  padding: 4px 6px;
}
.dtk-chrome__slot { flex: 1 1 auto; min-height: 0; }
`;
