---
"@jfdevelops/devtools-kit": minor
"@jfdevelops/devtools-kit-react": minor
---

Add borrowed external-store clients, typed optional actions, explicit preference storage and production opt-in. Add a CSS-free headless React entry with composable visibility, focus, geometry, docking, tabs and explicit hosts. Keep legacy panel and provider exports compatible and build the standalone preset on headless visibility primitives.

The React context hooks now return the structural DevtoolsClient type. Consumers calling channel-only methods through context should keep their original Devtools instance for those calls.
