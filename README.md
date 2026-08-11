# DocuAI

**AI-assisted development capstone** by [Dafa Syachrullah](mailto:dafadafa2211@gmail.com)

DocuAI is a full-stack document workspace: upload PDF, TXT, and CSV files into a private library, retrieve context semantically, and chat with an assistant that grounds answers in your sources. The project demonstrates end-to-end product delivery—from authenticated UI and Supabase backend to n8n-orchestrated processing and source-aware responses—built with an AI-assisted development workflow.

## What this capstone demonstrates

- **Product scope:** A cohesive app spanning public marketing pages, authenticated workspace, community, and admin dashboard—not a single-feature demo.
- **Full-stack integration:** React frontend, Supabase Auth/Postgres/Storage/Edge Functions, and n8n webhooks wired through a secure proxy.
- **Responsible AI UX:** Document-scoped chat, persisted conversations, source metadata on responses, and clear handling when evidence is missing.
- **Engineering discipline:** TypeScript throughout, row-level security migrations, client/server env separation, lint/build tooling, and conventional project structure.

## Features

- Private document library with upload validation (PDF, TXT, CSV; 25 MB limit), organization (tags, categories, favorites), preview, and reprocess on failure
- Source-aware AI chat with saved conversations and optional document filtering
- Supabase Auth (signup, login, password reset) and user-scoped storage
- Community posts and admin dashboard (metrics, moderation, official announcements)
- Dark/light theme and responsive UI

## Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React 18, TypeScript, Vite, React Router, Tailwind CSS, GSAP, lucide-react |
| Backend | Supabase (Auth, Postgres + pgvector, Storage, Edge Functions on Deno) |
| Automation | n8n (upload processing and chat workflows via `n8n-proxy`) |
| AI | Google Gemini (via n8n workflow) |

## Local development

```bash
npm install
npm run dev
```

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_N8N_WEBHOOK_MODE=webhook
```

Edge Function secrets (`N8N_BASE_URL`, `ADMIN_EMAIL`, etc.) are configured separately via `supabase secrets set`; see `supabase/functions/.env.example`.

```bash
npm run lint      # ESLint
npm run build     # Production build
npm run typecheck # TypeScript check
```

## License

MIT — see [LICENSE](LICENSE).
