# Consect — Features

**Consect is an AI-native team chat platform.** It brings real-time channels, DMs, and
group conversations together with an **AI Hub** — a knowledge base that ingests your
documents and lets an in-chat assistant (`@consecto`) answer questions grounded in your
own sources.

> _Chat, share, and let AI do the recall._

---

## Architecture at a glance

Consect is a monorepo of three cooperating services:

| Service | Stack | Responsibility |
| --- | --- | --- |
| **`web`** | Next.js (App Router), React, Tailwind, shadcn/ui, Zustand, socket.io-client | User-facing workspace UI |
| **`server`** | Express, Drizzle ORM (PostgreSQL), Better Auth, socket.io, Redis, OpenAI Agents, Qdrant | REST API, realtime gateway, auth, RAG orchestration |
| **`embedding-service`** | FastAPI (Python), pypdf, Qdrant | Document parsing, chunking, embedding, vector indexing |

Supporting infrastructure: **PostgreSQL** (primary store), **Qdrant** (vector DB),
**Redis** (caching), and **Cloudinary** (file storage).

---

## 💬 Messaging & Collaboration

- **Channels** — Organize work into focused channels, public for the whole workspace or
  private for the people who need them.
- **DMs & group chats** — Quick one-on-ones or a huddle with a few teammates. Three
  conversation types are supported: `channel`, `group`, and `dm`.
- **Rich text composer** — Tiptap-based editor with **@-mentions** for teammates (and the
  AI assistant).
- **Message lifecycle** — Create, edit, and delete messages, with mentions tracked per
  message.
- **Real-time presence** — See who's online the moment they arrive; presence is tracked
  over web sockets (`mark_online`).
- **Live delivery** — Messages and conversation events are pushed instantly via socket.io
  rooms (`join_conversation`).
- **Activity feed** — Mentions, replies, and reactions roll up into one place so nothing
  important slips by.

## 🤖 AI Hub & Assistant (`@consecto`)

- **Drop in any source** — Add knowledge from **PDF, Word docs, Markdown, plain text, or a
  URL**. Consect ingests it and keeps it fresh.
- **Automatic vectorization** — Every source is chunked, embedded, and indexed the moment
  it's added — no setup, no manual pipelines.
- **Grounded, cited answers** — Mention `@consecto` in any channel to get answers drawn
  from your own knowledge base rather than generic model output.
- **Multi-query RAG** — For each question the assistant expands the query into 2–5
  optimized variants, embeds each, searches the vector store, and **fuses the scores**
  across searches to assemble the best context before answering.
- **Channel-scoped knowledge** — Each resource can be scoped to specific channels or left
  available organization-wide, so knowledge respects membership boundaries.
- **Resource management UI** — Add, edit, tag, sort, and delete resources, each showing a
  live indexing status (`pending → processing → success / failed`).
- **Self-healing indexing** — A cron job re-processes any embeddings stuck or failed,
  running every 10 minutes.

## 🧠 Embedding Pipeline (`embedding-service`)

- **`POST /embed_document`** — Single endpoint that fetches a document, extracts text,
  chunks it, embeds the chunks, and writes them to the vector DB.
- **Multi-format document reader** — Reads PDFs (via `pypdf`), Word documents (with magic-
  byte sniffing to tell `.docx` apart), Markdown, and plain text.
- **Overlapping chunking** — Text is split into ~2000-character chunks with 200-character
  overlap to preserve context across boundaries.
- **Deterministic chunk IDs** — Each chunk gets a stable, globally-unique ID per
  (document, chunk) so re-embedding a document overwrites only its own chunks.
- **Embedding cache** — Documents are pulled to a local cache before processing to avoid
  redundant downloads.

## 🔐 Authentication & Access Control

- **Better Auth** powering email/password plus **GitHub** and **Google** social sign-in.
- **Bearer token & OpenAPI plugins** for programmatic and documented API access.
- **Organizations / multi-workspace** — Run separate workspaces for teams, clients, or
  projects, each with its own members.
- **Role-based access** — `owner`, `admin`, and `member` roles at both organization and
  conversation level.
- **Access configs** — Fine-grained permission scoping per space (`channel` or
  `organization`).
- **Invitations** — Invite teammates to organizations and conversations; send and revoke
  invites in bulk.
- **Active session management** — View signed-in devices (browser/OS parsed from user
  agent) and revoke all other sessions.

## ⚙️ Workspace & Settings

- **Profile** — Full-width profile page with avatar, role, bio, verification badge, and an
  account-security summary.
- **Connectors** — Surface for linking external tools (Google Drive, Notion, Slack,
  GitHub).
- **API** — Surface for creating and managing API keys for the Consect REST API.
- **Theming** — Light/dark mode via `next-themes`.
- **User preferences** — Per-user settings including the active organization.

## 🛠️ Platform & Developer Experience

- **REST API** versioned under `/api/v1` with modules for system, conversations, messages,
  user preferences, organizations, AI Hub, and webhooks.
- **Interactive API docs** — Scalar API reference served at `/docs`, kept in sync with
  route schemas via `zod-openapi`.
- **Realtime gateway** — socket.io server for presence, conversation rooms, and live
  message delivery.
- **Type-safe data layer** — Drizzle ORM over PostgreSQL with a repository pattern;
  migrations, seeding, and Drizzle Studio via npm scripts.
- **File handling** — Cloudinary-backed uploads (up to 25 MB).
- **Structured logging** — Winston-based logging with persisted logs.
- **Scheduled jobs** — `node-cron` for background maintenance (e.g. embedding re-processing).
- **Caching** — Redis (`ioredis`) for fast lookups.

---

## Tech Stack Summary

**Frontend:** Next.js · React · TypeScript · Tailwind CSS · shadcn/ui · Zustand · Tiptap ·
Recharts · socket.io-client

**Backend:** Node.js · Express · TypeScript · Drizzle ORM · PostgreSQL · Better Auth ·
socket.io · Redis · Qdrant · OpenAI Agents · Cloudinary · Winston

**Embedding service:** Python · FastAPI · pypdf · Qdrant

---

_This document is generated from the current state of the codebase and reflects implemented
and in-progress features. Some surfaces (Connectors, API keys, certain security controls)
are present in the UI as scaffolding pending backend wiring._
