# Consect

**Consect** is a Slack-style team collaboration platform with a built-in AI knowledge hub. Teams organize into **organizations**, talk in **channels, groups, and DMs**, and upload documents to an **AI Hub** that gets embedded into a vector database. An assistant named **Consecto** then answers questions over that knowledge base using retrieval-augmented generation (RAG) — both inside the app and through a public, API-key-authenticated endpoint.

> Status: active development. This README describes the system as currently implemented in the codebase.

---

## Table of contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [How the AI Hub works (RAG pipeline)](#how-the-ai-hub-works-rag-pipeline)
- [Data model](#data-model)
- [Getting started](#getting-started)
- [API surface](#api-surface)
- [Realtime events](#realtime-events)
- [Project scripts](#project-scripts)

---

## Features

- **Organizations & roles** — multi-tenant workspaces with `owner` / `admin` / `member` roles and email invitations.
- **Conversations** — `channel`, `group`, and `dm` conversation types with per-conversation membership and invitations.
- **Messaging** — threaded replies (`parentMessageId`), `@mentions`, and file attachments (via Cloudinary).
- **Presence** — live online/offline status backed by Redis, pushed over Socket.IO.
- **AI Hub** — upload resources (`doc`, `pdf`, `url`, `text`, `md`); they're chunked, embedded, and stored in Qdrant, scoped per organization and per allowed channel.
- **Consecto assistant** — RAG-powered Q&A over an organization's AI Hub, with multi-query expansion, Reciprocal Rank Fusion, and cited Markdown answers.
- **Public Consecto API** — call the assistant programmatically with an API key/secret (`POST /api/consecto/chat`).
- **Auth** — email/password plus Google and GitHub OAuth via [better-auth](https://better-auth.com), with organization and API-key support.
- **Self-documenting API** — OpenAPI document generated from Zod schemas and served through a [Scalar](https://scalar.com) reference UI at `/docs`.

## Architecture

Consect is a monorepo of three runnable services:

```
consect/
├── server/             # Express + TypeScript API, realtime, and RAG orchestration
├── web/                # Next.js 16 / React 19 frontend
└── embedding-service/  # Python FastAPI service that embeds documents into Qdrant
```

```
                ┌───────────────┐   REST + WebSocket   ┌──────────────────────┐
                │   web (3000)  │ ───────────────────► │     server (8080)    │
                │  Next.js/React│ ◄─────────────────── │  Express · Socket.IO │
                └───────────────┘    presence/messages └───────────┬──────────┘
                                                                    │
        ┌─────────────────────────────┬─────────────────────┬──────┴──────────┐
        ▼                             ▼                     ▼                 ▼
  ┌───────────┐               ┌───────────────┐     ┌──────────────┐   ┌────────────┐
  │ Postgres  │               │ Redis (6379)  │     │ Qdrant (6333)│   │ Cloudinary │
  │  (5432)   │               │ presence/cache│     │  embeddings  │   │  file CDN  │
  └───────────┘               └───────────────┘     └──────┬───────┘   └────────────┘
        ▲                                                   ▲
        │  cron (every 10 min) POST /embed_document         │ upsert vectors
        │                                                   │
        │                  ┌────────────────────────────────┴───┐
        └──── webhook ◄──── │   embedding-service (8000, FastAPI) │
       status-update        │   read → chunk → embed → upsert     │
                            └────────────────────────────────────┘
```

**Default ports:** web `3000`, server `8080`, embedding-service `8000`, Postgres `5432`, Redis `6379`, Qdrant `6333`.

## Tech stack

| Layer | Technologies |
| --- | --- |
| **Frontend** (`web`) | Next.js 16, React 19, Tailwind CSS v4, shadcn / Radix / Base UI, TipTap (rich text + mentions), Zustand, `socket.io-client`, better-auth client, Axios |
| **Backend** (`server`) | Node.js + TypeScript (ESM), Express 5, Drizzle ORM, Socket.IO, better-auth, Zod + `zod-openapi` + Scalar, Winston, `node-cron`, `@openai/agents` / OpenAI SDK |
| **Embedding service** | Python, FastAPI, Uvicorn, httpx, OpenAI embeddings, Qdrant client |
| **Data stores** | PostgreSQL (relational), Redis (presence/cache), Qdrant (vector search) |
| **External services** | OpenAI (LLM + embeddings), Cloudinary (file storage), Mailtrap (transactional email), Google & GitHub OAuth |

## How the AI Hub works (RAG pipeline)

**Ingestion**

1. A resource is uploaded to the AI Hub (`POST /api/v1/ai-hub`). The file lands in Cloudinary and a row is written to `ai_hub_resource` with status `pending`.
2. A `node-cron` job on the server runs **every 10 minutes**, finds `pending`/`failed` resources, marks them `processing`, and `POST`s each to the embedding service at `http://localhost:8000/embed_document`.
3. The embedding service fetches the document, extracts text by type, splits it into chunks, generates OpenAI embeddings, and upserts the vectors into a **Qdrant collection named after the `organizationId`** (with `allowedChannelIds`, `name`, `text`, and `secureURL` in the payload).
4. It calls back the server webhook (`POST /api/webhook/embedding/status-update`) with the resulting point IDs and a `success`/`failed` status, which updates the resource row.

**Query** (`POST /api/consecto/chat`)

1. The caller authenticates with an API key/secret; the server resolves the key's user + organization and the channels they can read.
2. The LLM expands the user's message + history into **2–5 optimized search queries** (resolving pronouns/references against history).
3. Each query is embedded and searched against the org's Qdrant collection, filtered to the caller's allowed channels.
4. Results are merged with **Reciprocal Rank Fusion** (`k = 60`) and assembled into a context block.
5. The LLM produces a concise Markdown answer, citing the resources it used as `[name](secureURL)` links.

## Data model

Drizzle ORM over PostgreSQL. Core tables (see `server/src/app/db/schema.ts`):

- **Auth (better-auth):** `user`, `session`, `account`, `verification`
- **Workspaces:** `organization`, `member` (role), `invitation`
- **Access & prefs:** `access_config` (org/channel-scoped JSON config), `user_preference`
- **Conversations:** `conversation` (`channel` | `group` | `dm`), `conversation_member`, `conversation_invitation`
- **Messages:** `message` (threads via `parentMessageId`, `mentions` JSON), `file`
- **AI:** `ai_hub_resource` (type, status, `allowedChannelIds`, `embeddingIds`), `api_key`

## Getting started

### Prerequisites

- Node.js (with [pnpm](https://pnpm.io)) and [Docker](https://www.docker.com/)
- Python with [uv](https://github.com/astral-sh/uv) (for the embedding service)
- API credentials: OpenAI, Cloudinary, Mailtrap, and Google/GitHub OAuth apps

### 1. Start the infrastructure (Postgres, Redis, Qdrant)

```bash
cd server
pnpm docker:up      # docker-compose up -d
```

### 2. Configure and run the server

```bash
cd server
pnpm install
# Create server/.env and fill in the required variables.
# The full, validated schema is defined in server/src/env.ts.
pnpm db:migrate        # apply Drizzle migrations
pnpm db:seed           # optional: seed sample data
pnpm dev               # tsx watch src/server.ts  →  http://localhost:8080
```

The server validates its environment on boot via Zod (`server/src/env.ts`). Required variables include `PORT`, `DATABASE_URL`, `BETTER_AUTH_URL`, `FRONTEND_URL`, `VALID_ORIGINS`, the Google/GitHub OAuth pairs, `MAILTRAP_TOKEN`, `OPENAI_API_KEY`, `QDRANT_URL`, and the Cloudinary credentials.

### 3. Run the embedding service

```bash
cd embedding-service
uv sync
uv run main.py         # uvicorn on http://localhost:8000
```

### 4. Run the web app

```bash
cd web
pnpm install
pnpm dev               # next dev  →  http://localhost:3000
```

Set `NEXT_PUBLIC_API_URL=http://localhost:8080` in `web/.env`.

## API surface

All routes are mounted in `server/src/app/express.ts`. Interactive docs are generated from the route schemas and served at **`http://localhost:8080/docs`** (raw document at `/openapi.json`).

| Base path | Purpose |
| --- | --- |
| `/api/auth/*` | better-auth (sessions, OAuth, organizations, API keys) |
| `/api/v1/sys` | system / health check |
| `/api/v1/organization` | organizations, members, invites |
| `/api/v1/conversation` | conversation CRUD |
| `/api/v1/message` | messages (send, recent, members, invites) |
| `/api/v1/user-preference` | per-user UI preferences |
| `/api/v1/ai-hub` | AI Hub resource upload / list / delete |
| `/api/v1/api-key` | API key management |
| `/api/consecto/chat` | public RAG chat (API-key auth) |
| `/api/webhook/embedding/status-update` | internal callback from the embedding service |

## Realtime events

Socket.IO is attached to the HTTP server and authenticated with the better-auth session on the handshake (`server/src/app/socket/socket-io.ts`).

| Direction | Event | Description |
| --- | --- | --- |
| client → server | `mark_online` | mark the user online for an org; joins org + personal rooms |
| client → server | `join_conversation` | join `convo_<conversationId>` after a membership check |
| server → client | `presence:update` | broadcasts the org's current presence map |

## Project scripts

Server scripts (`server/package.json`):

| Command | Description |
| --- | --- |
| `pnpm dev` | run the API in watch mode (`tsx`) |
| `pnpm build` / `pnpm start` | compile TypeScript / run the compiled server |
| `pnpm docker:up` / `docker:down` | start / stop Postgres + Redis + Qdrant |
| `pnpm db:generate` | generate Drizzle migrations from the schema |
| `pnpm db:migrate` / `db:push` | apply migrations / push schema directly |
| `pnpm db:studio` | open Drizzle Studio |
| `pnpm db:seed` | seed the database |
| `pnpm auth:generate` | regenerate the better-auth schema |
