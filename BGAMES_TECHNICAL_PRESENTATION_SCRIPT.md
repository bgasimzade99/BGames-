# BGames — Technical Presentation Script

**Length:** about 13 minutes · **Spoken length:** ~1,700 words  
**Mode:** first person, screen plus microphone, no webcam  
**Rule:** distinguish application logic from libraries. Do not claim you wrote chess.js, Auth.js, Prisma, or bcrypt internals.

---

## 1. Introduction and project overview

Hello. My name is on the About page as a placeholder — I will say my real name here — and this is **BGames**.

BGames is a dark-first web application that puts three products on one site: a **tic-tac-toe** board with a minimax computer, a **local chess** board, and a **personal library**. Around those I built accounts, a player dashboard, and an administrator console.

The stack is **Next.js 16** with the App Router, **React 19**, **TypeScript**, **PostgreSQL** through **Prisma**, and **Auth.js** with the credentials provider. Guests can play and keep a shelf in the browser. Signed-in users persist matches and books to the database.

This is not a slide deck of mock screens. The games run. The forms validate. Empty dashboards stay empty until someone actually plays.

## 2. Why I developed BGames

The Odin Project asks for a sign-up form, a library, tic tac toe, and an admin dashboard as separate exercises. I did not want four disconnected pages. I wanted one product where those assignments share a shell, a design system, and a real persistence boundary.

Chess is the extension: a full ruleset without pretending I wrote a chess engine. I wrap **chess.js**. That honesty is part of the academic work.

## 3. Technology stack and design decisions

**Next.js App Router** gives me file-based routes under `app/`, Server Components for session and database reads, and Client Components for boards and forms. I chose it so HTML can render on the server while the boards stay interactive.

**TypeScript** is strict. The library constructor is **plain JavaScript** on purpose — `lib/library/book.js` — because the Odin Library project is about `new Book` and prototype methods. `tsconfig.json` sets `allowJs` so that file stays JS.

**Zod** in `lib/validations.ts` is the contract: sign-up, sign-in, books, matches, profile. The same schemas run in the browser and in server actions.

**React Hook Form** drives the auth forms. **bcryptjs** hashes passwords with cost 12. **chess.js** owns chess legality. **Vitest** tests rules without opening a browser.

**Tailwind v4** is the import in `app/globals.css`. The look comes from custom properties — obsidian, graphite, electric violet, ice — not from a component kit.

I did **not** add Redux. Game state lives in factory closures. React only holds a snapshot and re-renders.

## 4. System architecture

Think in three layers.

The **edge** is `proxy.ts`. Next.js 16 uses a proxy file instead of `middleware.ts`. It looks at the JWT session and redirects anonymous visitors away from `/dashboard`, `/profile`, and `/admin`. Non-admins hitting `/admin` go to `/dashboard`.

The **server** is React Server Components plus `"use server"` actions. Pages call `getCurrentAccount()` in `lib/data/account.ts`, which waits on `connection()`, reads Auth.js, then loads the user row from Prisma. Domain writes live in `lib/data/queries.ts`.

The **client** is islands. `components/islands.tsx` loads tic tac toe, chess, the library desk, and home progress with `dynamic(..., { ssr: false })` so `localStorage` does not hydrate as empty and then flash.

There is only one HTTP API route: `app/api/auth/[...nextauth]/route.ts`. Everything else is a server action, not REST.

## 5. Frontend architecture and component structure

`app/layout.tsx` is the shell: skip link, sticky header, `BrandMark`, `PrimaryNav`, `AccountSlot` behind Suspense, main, footer. Fonts are Space Grotesk, Geist, and JetBrains Mono via `next/font`.

Routes are ordinary page files: `/`, `/games`, `/games/tic-tac-toe`, `/games/chess`, `/library`, `/sign-in`, `/sign-up`, `/dashboard`, `/admin`, `/profile`, `/about`.

Boards are CSS Grid: `.chess-board` is eight by eight, `.ttt-board` is three by three, both with `aspect-ratio: 1` so a piece cannot stretch a row. Pieces are positioned inside the square, not in normal flow.

`app/template.tsx` is the only Motion usage: a short fade, skipped when `useReducedMotion` is true.

The live brand mark is `/brandi.png`, not the original SVG monogram.

## 6. Backend and API architecture

A mutation looks like this.

The library desk calls `createShelfBook`. That is a one-line server action in `app/actions/library.ts`. It forwards to `saveBook` in `lib/data/queries.ts`. `saveBook` requires a session, parses `bookSchema`, then `prisma.book.create` with that user’s `userId`. It never trusts a client-supplied owner id.

Match recording is the same shape: `saveMatch` → `recordMatch` → `matchSchema` → `gameMatch.create`.

Auth actions in `app/actions/auth.ts` are `registerAccount`, `authenticate`, `signOutAction`, `updateProfile`, and `setUserRole`. Failures return `{ message, fieldErrors }` instead of leaking stack traces.

I want to be precise: the server **does not replay** a chess game or a tic-tac-toe tree. It stores the result the client submits after local play. That is an accepted limit of local boards.

## 7. Database design and data flow

PostgreSQL is the database. Prisma is the ORM. The schema is `prisma/schema.prisma`.

`User` has `name`, unique `email`, `passwordHash`, and `role` defaulting to `USER`. `GameMatch` stores game type, result, opponent label, and move count. `Book` stores title, author, pages, and read flag. Both child models cascade on user delete.

`Account`, `Session`, and `VerificationToken` exist for an Auth.js adapter. This app does **not** write them. Sessions are JWTs.

There is **no** `prisma/migrations` folder. Schema reaches the database with `npm run db:push`. That is fine locally; it is not a versioned migration history.

`getPrisma()` in `lib/db.ts` is a singleton so hot reload does not open extra clients.

Guest path: `localStorage` keys `bgames.library` and `bgames.matches`. Those never merge into the account on sign-in.

## 8. Authentication and security

Authentication is **real**, not a fake `isLoggedIn` boolean.

`auth.ts` uses the Credentials provider. `authorize` parses `signInSchema`, loads the user by lowercased email, and `bcrypt.compare`s the password against `passwordHash`. A miss returns `null`.

`registerAccount` hashes with `bcrypt.hash(..., 12)` and creates `{ name, email, passwordHash }` only. Role is the schema default `USER`. Signup cannot mint an admin. Admins come from `prisma/seed.ts` reading `ADMIN_EMAIL` and `ADMIN_PASSWORD` from the environment.

`setUserRole` refuses non-admins, refuses self-changes, and refuses demoting the last administrator.

Passwords never go back to the client. `callbackUrl` must start with `/` and must not start with `//`.

Limits I will say out loud: JWT `role` can be stale until re-login; `adminSnapshot` and `searchUsers` do not re-check ADMIN inside the query functions — the page does; there is no password reset, no rate limit, no CSP in `next.config.ts`; local match results are client-trusted.

## 9. Docker and deployment

Docker in this repo is **Postgres only**. `docker-compose.yml` runs `postgres:16`, publishes host **5434** to container 5432, and keeps data in the `bgames-data` volume. Compose user and database name are `bgames`.

There is **no Dockerfile** for the Next.js app. The Node process runs on the host with `npm run dev` or `npm start`.

A Docker **image** is the packaged filesystem and default command. A **container** is a running instance of that image. Here, only the database image is defined. I will not call BGames a containerized application.

`.env` is gitignored. `.env.example` documents `DATABASE_URL`, `AUTH_SECRET`, and the seed admin keys.

## 10. Tic Tac Toe technical walkthrough

Rules live in `lib/games/tic-tac-toe/rules.ts`. `WIN_LINES` is eight index triples. `findWinner` walks those lines. `isDraw` is a full board with no winner.

`createTicTacToeGame` in `factory.ts` is a factory. It closes over `board`, `current`, `status`, `winner`, `line`, and `moves`. Callers get `snapshot`, `play`, and `reset`. `snapshot` copies the board, so React cannot poke squares by accident.

`play` no-ops if the game is over, the index is illegal, or the cell is taken. Otherwise it places the mark, then win, draw, or `opponent(current)`.

The computer is `ticTacToeAi` in `ai.ts`, an IIFE. Only `chooseMove` is public. Easy mode picks a random empty square with an injectable `random` so tests stay deterministic. Hard mode is **minimax** with no depth cap. A win scores `10 - depth`, a loss `depth - 10`, a draw 0. Two hard players draw from the opening — that is a unit test, not a hope.

The UI in `components/games/tic-tac-toe-game.tsx` is a client island. Modes are computer or another person. I did **not** implement online multiplayer. Restart builds a new engine; it does not have to call `reset`.

## 11. Chess technical walkthrough

I did **not** implement chess rules. `createChessSession` in `lib/games/chess/session.ts` constructs `new Chess()` from chess.js.

`play(from, to, promotion?)` calls `chess.move` inside try/catch and returns `null` on illegal moves. `legalFrom` uses `chess.moves({ square, verbose: true })`.

`describePosition` maps library flags to UI copy: `isCheckmate`, `isStalemate`, threefold repetition, insufficient material, fifty-move rule, `inCheck`. Resign is the one extra rule I added: it records which colour resigned.

Castling, en passant, and promotion are chess.js. Tests cover scholar’s mate, a stalemate FEN, `e1` to `g1` kingside, `e5` to `d6` en passant, and queen promotion.

The UI is pass-and-play on one screen. Undo, flip, resign, reset. There is **no** chess AI and **no** online match. Move history is SAN from `chess.history`.

## 12. Library CRUD technical walkthrough

`Book` in `lib/library/book.js` is a constructor. Calling it without `new` throws. `info`, `toggleRead`, and `update` live on `Book.prototype`. `addBookToLibrary` pushes onto an array — that is the Odin `myLibrary` pattern.

`createLibrary` in `collection.js` closes over the array and exposes `list`, `add`, `update`, `remove`, `toggleRead`. `queryBooks` searches, filters read status, and sorts.

On submit, the desk parses `bookSchema`. Guests persist snapshots to `localStorage`. Signed-in users hit server actions, then Prisma rows scoped by `userId` through `ownedBook`. If PostgreSQL is down, the page falls back to the device shelf instead of crashing.

## 13. Admin dashboard and forms

Sign-up is `SignUpForm`: labels, `type="email"`, password rules of eight characters with a letter and a number, confirm match, then the server hashes.

The admin page loads `getCurrentAccount`. No session redirects to sign-in. Non-admin sees a refusal, not data. Admin sees counts from `adminSnapshot`, a user table from `searchUsers`, a GET filter form, and `RoleControl` with a confirm step before `setUserRole`.

Dashboard charts use Recharts on real win/loss/draw counts. A new account does not see invented statistics.

## 14. The Odin Project concepts demonstrated

Semantic HTML is the shell: `header`, `nav`, `main`, `footer`, `form`, `table` with captions and `th scope`. SVG is the chess pieces and tic-tac-toe marks — the header logo is a PNG. Boards and the admin grid are CSS Grid; the header is Flexbox. Tokens are custom properties. Forms use HTML constraints plus Zod.

On the JavaScript side: objects, a real constructor, factories, an IIFE module, encapsulation via closures. React replaces `document.querySelector`. Event handling is `onClick` and `onKeyDown` on `role="grid"` cells.

Browser-compatibility as a dedicated lesson — prefixes, `@supports` — is **not** something this repo teaches. I will not pretend it does.

## 15. Challenges, limitations and future improvements

The hard visual bug was board geometry: empty SVG cells grew CSS grid tracks. The fix was explicit `minmax(0, 1fr)` rows, aspect ratio, and absolutely positioned pieces.

Limitations: no app container, no Prisma migration history, no OAuth, no password reset, client-trusted match results, no guest-to-account merge, JWT role can lag the database, admin query functions are not independently authorized.

I would add migrations, authorize `adminSnapshot` inside the function, replay or sign match payloads if this left the classroom, and keep Docker Desktop running whenever I demo the dashboard.

## 16. Final conclusion

BGames is one App Router application that keeps Odin’s JavaScript patterns in `lib/` and uses Next.js, Prisma, and Auth.js for the product around them. Tic tac toe minimax is mine. Chess rules are chess.js. Passwords are hashed. Signup is never admin.

Thank you. I can walk a file or a live board next.
