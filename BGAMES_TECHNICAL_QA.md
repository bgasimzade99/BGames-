# BGames — Technical Q&A

Twenty-five questions a lecturer might ask. Answers match this repository. Do not claim a Dockerized Next.js app, a custom chess engine, or database sessions.

---

**1. Why Next.js instead of a Vite SPA plus a separate Express API?**  
The App Router colocates routes, Server Components, and server actions. Session and Prisma reads stay on the server in files such as `app/dashboard/page.tsx` and `lib/data/queries.ts`. I still have one HTTP API: Auth.js at `app/api/auth/[...nextauth]/route.ts`. A split SPA would have duplicated the auth cookie story for a coursework app.

**2. What does a React Server Component actually do here?**  
Pages under `app/` with no `"use client"` can `await getCurrentAccount()` and query Prisma. They send HTML plus a payload. Interactive boards cannot be Server Components because they use state, `localStorage`, and click handlers.

**3. How do you avoid hydrating `localStorage` incorrectly?**  
`components/islands.tsx` loads `TicTacToeGame`, `ChessRoute`, `LibraryDesk`, and `DeviceProgress` with `next/dynamic` and `{ ssr: false }`. The first paint is the loading copy (“Ruling the grid…”). Guest data is read only in the browser.

**4. Where is application state if you did not use Redux?**  
Tic tac toe: closure inside `createTicTacToeGame`. Chess: `createChessSession` wrapping a `Chess` instance. Library: `createLibrary` closing over a `Book[]`. React `useState` holds the latest snapshot. That is state management by encapsulation, not a global store.

**5. How does that map to Odin’s factory functions?**  
`createTicTacToeGame`, `createChessSession`, and `createLibrary` return a small API and hide mutable fields. Callers cannot assign `board[0] = "X"` on the closed-over array; they must call `play`.

**6. Where is the object constructor?**  
`lib/library/book.js`. `new Book(title, author, pages, read)`. Without `new`, `new.target` is undefined and it throws. Shared behaviour is on `Book.prototype` (`info`, `toggleRead`, `update`), which is the Odin pattern, not a class sugar rewrite.

**7. What is the module pattern in this project?**  
`ticTacToeAi` in `lib/games/tic-tac-toe/ai.ts` is an IIFE. `minimax`, `easyMove`, and `hardMove` stay private. The exported object only has `chooseMove`.

**8. Explain minimax as you implemented it.**  
From a position, every empty square is tried, the move is undone, and the child score bubbles up. The AI maximises; the opponent minimises. Terminal scores: AI win `10 - depth`, AI loss `depth - 10`, draw `0`. Depth starts at 0 and is **not** capped. Hard vs hard from the opening draws (`tests/games.test.ts`). Easy mode is random, not shallow minimax.

**9. How are illegal tic-tac-toe moves stopped?**  
`play` in `factory.ts` returns the current snapshot if `status !== "playing"`, the index is not an integer in `0..8`, or the cell is occupied. The button is also `disabled` when occupied, the game is over, or it is the computer’s turn.

**10. Did you write the chess rules?**  
No. `chess.js` validates moves, checks, mates, stalemate, draws, castling, en passant, and promotion. `lib/games/chess/session.ts` is a factory plus `describePosition`, captured-piece lists, resign, and a view model for React.

**11. How would I see checkmate in a test?**  
The scholar’s mate sequence in `tests/games.test.ts` ends with `session.view().status.label === "Checkmate. White wins."` because `chess.isCheckmate()` is true inside `describePosition`.

**12. Is there a chess AI or online multiplayer?**  
Neither. The page copy and `ARCHITECTURE.md` state that explicitly. A random mover was omitted so the product does not look like a rated engine.

**13. How does library CRUD persist?**  
Guest: `LibraryDesk` writes JSON to `localStorage` key `bgames.library`. Account: `createShelfBook` / `updateShelfBook` / `deleteShelfBook` / `setShelfRead` → Prisma `Book` rows where `userId` matches the session. Edit/delete use `ownedBook` so you cannot mutate another user’s row by id guessing.

**14. Is validation only in the browser?**  
No. `bookSchema` and `signUpSchema` run in the client forms and again in server actions. HTML `required` / `minLength` is a third layer, not the last.

**15. Walk a request from “Add book” (signed in) to PostgreSQL.**  
Submit → Zod `safeParse` on the client → server action `createShelfBook` → `saveBook` → `getCurrentAccount()` → `bookSchema` again → `prisma.book.create({ data: { userId: account.id, ... } })` → `revalidatePath("/library")` → UI uses the returned book object.

**16. Why JWT sessions instead of database sessions?**  
`auth.config.ts` sets `session: { strategy: "jwt" }`. Credentials auth does not use a Prisma adapter. `Account` and `Session` models are reserved and unused. Trade-off: no server-side session revoke table; `role` on the token can lag a database role change until the user signs in again. Pages that call `getCurrentAccount()` read the live row.

**17. How are passwords stored?**  
Only `passwordHash`. `bcrypt.hash` cost 12 on register (`registerAccount`). `bcrypt.compare` in `authorize`. The hash is never sent to the client.

**18. Can I become admin by signing up?**  
No. `prisma.user.create` in `registerAccount` does not set `role`. The default is `USER`. Admins are created or promoted by `prisma/seed.ts` from environment variables, or by `setUserRole` from an existing admin.

**19. How is `/admin` protected?**  
Three layers: `proxy.ts` checks JWT `role`; `AdminBody` redirects or refuses using the database role; `setUserRole` checks `account.role === "ADMIN"` again. `adminSnapshot` / `searchUsers` themselves do **not** contain a role guard — that is a defence-in-depth gap if those functions were ever imported from a non-admin page.

**20. What HTTP methods exist?**  
Auth.js route: GET and POST. Admin user filter: GET form (`q`, `role` search params). Mutations: server actions (POST under the hood, not documented as a public JSON API). There is no `/api/books` REST surface.

**21. Is the application Dockerized?**  
PostgreSQL is. The Next.js app is not. `docker-compose.yml` defines service `db` (`postgres:16`, `5434:5432`, volume `bgames-data`). There is no app `Dockerfile`. Image = packaged artifact; container = running instance. Only the database image is in this repo.

**22. Where do you use CSS Grid versus Flexbox?**  
Grid: chess board, tic-tac-toe board, hero, stats, admin, library, auth split (`.auth-stage`). Flexbox: `.shell-inner`, primary nav, toolbars, footer, field rows. Both live in `app/globals.css`.

**23. How does this compare to vanilla DOM from The Odin Project?**  
Odin would `querySelector` and `addEventListener`. This codebase has no `document.querySelector` in application source. React commits the snapshot to the DOM. The **logic** files are still vanilla-style modules so they unit-test in Node via Vitest.

**24. What are the main performance and scalability limits?**  
Minimax on a 3×3 board is tiny. Chess is local, so no server CPU per move. `searchUsers` caps at 100 rows. Guest match history caps at 40 in `saveLocalMatch`. `cacheComponents` helps public shells. This is not a multiplayer game server; Prisma on one Postgres instance is the ceiling, and match writes are not authenticated as true game transcripts.

**25. Name three limitations you would fix first.**  
(1) Add Prisma migrations instead of only `db push`. (2) Check ADMIN inside `adminSnapshot`/`searchUsers`. (3) Treat match recording as untrusted input — either accept that in the write-up or sign/replay games. Honourable mentions: CSRF/rate limits on credentials, CSP headers, guest-to-account merge, password reset, app Dockerfile.
