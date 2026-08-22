\# DocuAI Project Rules



\## Architecture

\- Before implementing new features, inspect existing project architecture and reuse current patterns.

\- Avoid creating duplicate state management when existing utilities or hooks are available.



\## Theme System

\- All UI changes must support both Light Mode and Dark Mode.

\- Theme changes must be tested across all routes, especially Home Page and Workspace.



\## Components

\- New components should follow existing DocuAI component structure.

\- Keep business logic separated from UI components whenever possible.



\## Verification

\- Run TypeScript check, ESLint, and production build before considering a feature complete.

