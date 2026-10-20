# BGames — Screen Recording Guide

**Format:** screen capture + microphone. No webcam.  
**Target:** 12–15 minutes, aligned with `BGAMES_TECHNICAL_PRESENTATION_SCRIPT.md`.  
**Base URL:** `http://localhost:3000`  
**Before recording:** `npm run dev`; `docker compose up -d`; `npm run db:push` if tables are missing. Confirm the dashboard does **not** say “Record unavailable.” If Docker Desktop is stopped, skip live SQL demos and say so.

Do not show `.env`. Do not type a real password into a zoomed editor. Seed admin credentials stay off screen.

VS Code: Explorer visible, file path in the tab, zoom enough to read identifiers.

---

## 0:00–0:45 — Title and homepage

**Screen:** browser, `http://localhost:3000/`  
**Clicks:** none at first; scroll slowly through the hero, catalog, and footer.  
**Say:** name, course, “this is BGames,” three products, guests vs accounts.

**Then VS Code:** `package.json` scripts and dependencies (`next`, `next-auth`, `@prisma/client`, `chess.js`, `zod`, `bcryptjs`).

---

## 0:45–1:30 — Why this exists

**Screen:** `ACADEMIC_MAPPING.md` headings, then back to the homepage catalog cards.  
**Clicks:** none required.  
**Say:** Odin wanted separate assignments; this is one integrated app. Chess is an extension, not a fake engine.

---

## 1:30–2:30 — Stack and design decisions

**VS Code:**

1. `package.json` — Next 16, React 19, Prisma 6, Auth.js beta, Vitest.  
2. `next.config.ts` — `cacheComponents`, `partialPrefetching`. No security headers.  
3. `app/globals.css` — `:root` tokens (`--obsidian`, `--accent`, `--header`).  
4. `app/layout.tsx` — metadata, fonts, skip link, shell.

**Say:** Server Components for data, client islands for boards, tokens instead of a UI kit, no Redux.

---

## 2:30–3:30 — Architecture

**VS Code:**

1. `proxy.ts` — `authorized`, matcher for dashboard/profile/admin.  
2. `components/islands.tsx` — `dynamic` + `ssr: false`.  
3. `app/api/auth/[...nextauth]/route.ts` — `GET`/`POST` from `handlers` (only API route).

**Optional mermaid:** open `BGAMES_PROJECT_AUDIT.md` architecture section for one beat, then return to code.

**Say:** request hits proxy, then RSC, then actions. Session reads sit in Suspense.

---

## 3:30–4:15 — Frontend structure

**Browser:** resize toward ~860px if you can, open the nav toggle, close it, restore desktop.  
**VS Code:** `.chess-board` and `.ttt-board` in `app/globals.css` (`grid-template-rows: repeat(..., minmax(0, 1fr))`, `aspect-ratio: 1`).  
**Clicks:** header Games / Library / About so routing is visible.  
**Say:** file-based routes; grid lock so pieces cannot stretch tracks; Motion only in `app/template.tsx`.

---

## 4:15–5:15 — Backend and data flow

**VS Code:**

1. `app/actions/library.ts` — thin wrappers.  
2. `lib/data/queries.ts` — `saveBook`, `ownedBook`, `recordMatch`.  
3. `lib/validations.ts` — `bookSchema`, `matchSchema`.

**Say:** server action, not REST. Zod twice. Owner comes from the session. Match rows are **not** a server-side replay of the game.

---

## 5:15–6:15 — Database

**VS Code:** `prisma/schema.prisma` — `User`, `GameMatch`, `Book`, enums, comments on unused `Account`/`Session`.  
**Terminal (optional):** `docker compose ps` showing the `db` service. Do not dump `.env`.  
**Say:** PostgreSQL, Prisma Client via `getPrisma()`, `db push` not migration files, JWT sessions so Account/Session tables stay empty in this credentials flow.

If Docker is down, say that and stay on the schema file.

---

## 6:15–7:30 — Authentication and security

**Browser:** `/sign-up` then `/sign-in`. Show labels, required fields, “Show password.” Do **not** complete signup live unless you use a disposable address.  
**VS Code:**

1. `auth.ts` — `authorize`, `bcrypt.compare`.  
2. `app/actions/auth.ts` — `registerAccount` create payload **without** `role`; `setUserRole` last-admin and self guards.  
3. `prisma/seed.ts` — env-based admin.  
4. `auth.config.ts` — `session.strategy: "jwt"`.

**Say:** real credentials auth. Signup cannot grant ADMIN. Proxy is convenience; `getCurrentAccount` is the page-level source of truth.

---

## 7:30–8:00 — Docker

**VS Code:** `docker-compose.yml` only. Search the repo mentally: no app `Dockerfile`.  
**Say:** image vs container in one sentence. This project containerizes Postgres, not Next.

---

## 8:00–10:00 — Tic Tac Toe walkthrough

**VS Code (90s):**

1. `lib/games/tic-tac-toe/rules.ts` — `WIN_LINES`, `findWinner`.  
2. `lib/games/tic-tac-toe/factory.ts` — `createTicTacToeGame`, `play` guards.  
3. `lib/games/tic-tac-toe/ai.ts` — IIFE, `minimax`, `chooseMove`.  
4. `tests/games.test.ts` — immediate win, block, hard-vs-hard draw.

**Browser:** `/games/tic-tac-toe`

| Step | Click | Expect |
| --- | --- | --- |
| 1 | Opponent: Computer, Difficulty: Hard | Status “X to move.” |
| 2 | Corner (row 1, column 1) | X appears; after ~180ms O takes centre |
| 3 | Restart | Empty board, X to move |
| 4 | Opponent: Another person | Both colours clickable |
| 5 | Optional: Easy mode one move | Random empty reply, not necessarily centre |

**Say:** React renders snapshots; the factory decides legality; minimax is my algorithm; there is no online multiplayer.

---

## 10:00–11:30 — Chess walkthrough

**VS Code:** `lib/games/chess/session.ts` — comment that chess.js owns rules; `play`, `describePosition`, `resign`. `components/games/chess-piece.tsx` — inline SVG.

**Browser:** `/games/chess`

| Step | Click | Expect |
| --- | --- | --- |
| 1 | `e2` then `e4` | Status becomes “Black to move.” History shows `e4` |
| 2 | `e7` then `e5` | White to move |
| 3 | Undo | Last ply disappears |
| 4 | Point at Resign / Reset / Flip | Explain; do not resign unless you reset after |
| 5 | Optional scholar’s mate if time | Ends on “Checkmate. White wins.” |

**Say:** I wrote the session factory and the UI. I did **not** write move generation. No engine, no online play.

---

## 11:30–12:30 — Library CRUD

**VS Code:** `lib/library/book.js` (`new.target`, `prototype.info`), `lib/library/collection.js` (`createLibrary`).

**Browser:** `/library`

| Step | Action | Expect |
| --- | --- | --- |
| 1 | Title, author, pages → Add book | Card with `info()` sentence |
| 2 | Mark read | Sentence switches to “already read” |
| 3 | Edit, save | Fields update |
| 4 | Search box | List filters |
| 5 | Remove → Confirm remove | Card gone |

If the banner says the database is offline, say: this is the `localStorage` path (`bgames.library`). With Postgres up and a session, the same form calls server actions.

---

## 12:30–13:15 — Admin, dashboard, forms

**Browser:** `/dashboard` — stats table + Recharts if the DB answers; otherwise the offline copy (honest).  
**Browser:** `/admin` as an administrator — player table, GET search, open **Make admin** until “Confirm for …” then **Cancel**. Do not demote anyone.  
**VS Code:** `components/admin/role-control.tsx` — `useActionState`, two-step confirm.

**Say:** hiding a nav link is not authorization. `setUserRole` enforces rules on the server.

---

## 13:15–14:00 — Odin mapping, limits, close

**VS Code:** `ACADEMIC_MAPPING.md` table, then `content/developer.ts` (placeholder, no invented biography).  
**Say:** constructor, factory, module pattern, forms, tables, grid/flex. Missing: dedicated browser-compatibility lesson; app Docker; match replay.

**Close:** thank the lecturer; offer Q&A from `BGAMES_TECHNICAL_QA.md`.

---

## Files to have in the editor tabs (in order)

1. `package.json`  
2. `proxy.ts`  
3. `prisma/schema.prisma`  
4. `auth.ts`  
5. `app/actions/auth.ts`  
6. `lib/games/tic-tac-toe/factory.ts`  
7. `lib/games/tic-tac-toe/ai.ts`  
8. `lib/games/chess/session.ts`  
9. `lib/library/book.js`  
10. `lib/data/queries.ts`  
11. `tests/games.test.ts`

---

## If something breaks on camera

| Symptom | What to say | What to do |
| --- | --- | --- |
| “Ruling the grid…” | Client island hydrating | Wait a few seconds |
| Dashboard “Record unavailable” | JWT session is fine; Prisma cannot reach Postgres | Start Docker Desktop + compose |
| Hydration overlay in an automated browser | Not a product bug | Ignore; use your own Chrome |
| Hard AI feels slow | 180ms delay plus full-tree search | Expected on an empty opening |
| Favicon stale | Browser cache | Hard refresh; not needed in this speech |
