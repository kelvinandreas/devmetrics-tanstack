# DevMetrics

A GitHub analytics dashboard for exploring user profiles, repositories, and public activity.

---

## Overview

DevMetrics lets you:

- Search GitHub users
- View profile stats and recent repositories
- Browse a user's public activity feed with infinite scrolling
- Explore repositories in a virtualized, filterable, sortable table
- Share table state directly through URL params

---

## Purpose

This project was built to learn and explore the TanStack ecosystem through a real-world application with meaningful data complexity — caching, routing, infinite queries, virtualized tables, and URL-driven state.

GitHub's public API was a good fit because it naturally introduces:

- Server-side state and caching
- Pagination and infinite scrolling
- Relational data between users, repositories, and events
- URL-synced filters and sorting
- Rendering performance challenges with large datasets

---

## Tech Stack

| Tool                 | Role                                                                   |
| -------------------- | ---------------------------------------------------------------------- |
| **TanStack Start**   | SSR framework and application shell                                    |
| **TanStack Router**  | File-based routing with type-safe params and search state              |
| **TanStack Query**   | Data fetching, caching, infinite queries, and async state management   |
| **TanStack Table**   | Headless table logic for sorting, filtering, expansion, and visibility |
| **TanStack Virtual** | Virtualized rendering for large repository lists                       |
| **Axios**            | Pre-configured GitHub API client                                       |
| **TailwindCSS v4**   | Utility-first styling and theme tokens                                 |
| **shadcn/ui**        | Accessible UI primitives (Alert, Badge, Button, Input, etc.)           |

---

## Project Structure

```txt
src/
├── routes/          → route components and layouts
├── hooks/           → TanStack Query hooks
├── services/        → GitHub API layer
├── types/           → shared TypeScript models
├── lib/             → shared utilities and configuration
├── components/      → reusable UI components
│   └── ui/          → shadcn/ui primitives
└── styles.css
```

---

## Running Locally

```bash
pnpm install
pnpm dev
```

The app uses GitHub's public API.

To increase the rate limit from 60 requests/hour to 5,000 requests/hour, add a GitHub personal access token:

```bash
# .env.local
VITE_GITHUB_TOKEN=your_token_here
```
