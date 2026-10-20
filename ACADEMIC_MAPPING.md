# Academic mapping

This file lists the Odin Project objectives that the running application actually demonstrates. A requirement is listed only where the code does the work.

## Intermediate HTML

| Objective | Where it shows up |
| --- | --- |
| SVG | `components/brand/logo.tsx`, `app/icon.svg`, `public/brand/*.svg`, chess pieces in `components/games/chess-piece.tsx`, tic tac toe marks in `components/games/tic-tac-toe-game.tsx` |
| Tables | Recent matches on `app/dashboard/page.tsx`. Users and recent activity on `app/admin/page.tsx`. Both use `<table>`, `<caption>`, `<th scope="col">`, and `<td>` |
| Semantic HTML | `header`, `nav`, `main`, `footer`, `section`, and `form` in the shell and pages. Boards use `role="grid"` because they are not data tables |
| Forms | `components/auth/auth-forms.tsx` and the library form in `components/library/library-desk.tsx`. The admin filter is a GET form |
| Form validation | Required inputs, `type="email"`, `type="password"`, `minLength`, `autoComplete`, labels tied with `htmlFor`, and `role="alert"` errors. Zod checks the same fields on the server in `app/actions/auth.ts` |

## Intermediate CSS

| Objective | Where it shows up |
| --- | --- |
| CSS units | `clamp()`, `rem`, `dvh`, `ch`, and `%` in `app/globals.css` |
| Advanced selectors | `:focus-visible`, `:last-child`, `article + article`, attribute selectors such as `[aria-current="page"]` and `[disabled]` |
| Positioning | Sticky header, skip link, square coordinates, promotion dialog |
| CSS functions | `clamp()`, `color-mix()`, `min()` |
| Custom properties | The token block at the top of `app/globals.css` |
| Flexbox | Header, button rows, book actions, footer |
| CSS Grid | Hero, catalog is not a card grid, steps, stat grid, admin grid, chessboard, tic tac toe board, library layout, auth layout |
| Responsive design | The `@media (max-width: 860px)` block collapses those grids and opens the navigation as a disclosure |

## JavaScript

| Objective | Where it shows up |
| --- | --- |
| Objects | Book snapshots and match records |
| Object constructors | `lib/library/book.js`. `new Book(...)`, with `info`, `toggleRead`, and `update` on `Book.prototype`. Calling `Book` without `new` throws |
| Factory functions | `createTicTacToeGame` in `lib/games/tic-tac-toe/factory.ts` and `createChessSession` in `lib/games/chess/session.ts`. Both close over mutable state and return a small API |
| Module pattern | `ticTacToeAi` in `lib/games/tic-tac-toe/ai.ts` is an IIFE. `minimax` is private. `chooseMove` is the public function |
| Code organization | Rules, factories, UI, validation, and database access are separate files |
| DOM and UI interactions | Board buttons, keyboard arrows, promotion dialog, password visibility, mute |
| Game state | Tic tac toe snapshots and the chess.js session. React renders the snapshot. It does not decide whether a move is legal |

The library constructor stays in JavaScript on purpose. Prisma does not replace it. Server persistence is an additional path for signed-in readers.

## Required Odin projects

### Sign-up form

`app/sign-up/page.tsx` and `components/auth/auth-forms.tsx`.

Demonstrates a real `<form>`, labels, input types, required fields, client-side Zod checks through React Hook Form, server-side Zod checks, hashed passwords, and accessible errors. Sign-in is the same pattern with `autoComplete="current-password"`.

### Admin dashboard

`app/admin/page.tsx`.

Demonstrates a CSS grid of real totals, a user table, search, role filtering, and a role change that cannot demote the last administrator or the current account. `getCurrentAccount()` and `adminSnapshot()` run only after the server has confirmed `role === "ADMIN"`. `proxy.ts` also redirects non-administrators.

### Library

`lib/library/book.js`, `lib/library/collection.js`, `components/library/library-desk.tsx`, `app/library/page.tsx`.

Demonstrates the constructor, `addBookToLibrary`, read toggling, edit, delete, search, status filter, title and date sort, shelf statistics, and an empty state. Guests use `localStorage`. Accounts use the `Book` Prisma model, with queries scoped by `userId`.

### Tic tac toe

`lib/games/tic-tac-toe/*` and `components/games/tic-tac-toe-game.tsx`.

Demonstrates human versus human, human versus computer, easy and hard difficulties, minimax, turn display, win and draw detection, a winning-cell animation, restart, match history, keyboard play, and a mute control. Authenticated results are stored in `GameMatch`.

## What is intentionally not claimed

- Online chess or an in-house chess engine. chess.js validates the rules.
- Fake platform statistics. Empty accounts stay empty.
- A hardcoded administrator password. Admin access comes from the seed environment variables.
- Perfect server-side verification of a local match. The server validates the payload and the session. It does not replay every move.
