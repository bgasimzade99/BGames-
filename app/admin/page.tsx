import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { RoleControl } from "@/components/admin/role-control";
import { ResultChart } from "@/components/charts/result-chart";
import { PageIntro } from "@/components/shell/page-intro";
import { getCurrentAccount } from "@/lib/data/account";
import { adminSnapshot, searchUsers } from "@/lib/data/queries";
import { formatWhen, gameLabel } from "@/lib/records";

export const metadata: Metadata = { title: "Admin" };

export default function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  return (
    <Suspense fallback={<p className="quiet">Checking administrator access…</p>}>
      <AdminBody searchParams={searchParams} />
    </Suspense>
  );
}

async function AdminBody({ searchParams }: { searchParams: Promise<{ q?: string; role?: string }> }) {
  let account;
  try {
    account = await getCurrentAccount();
  } catch {
    return (
      <PageIntro
        index="Admin"
        title="The board is offline."
        lede="Administrator queries need PostgreSQL. Start the database, run the migration, and seed an administrator."
      />
    );
  }
  if (!account) redirect("/sign-in");
  if (account.role !== "ADMIN") {
    return (
      <PageIntro
        index="Admin"
        title="Administrator access required."
        lede="This account is a player. The administrator role is assigned with the database seed, and every admin query is refused on the server."
      />
    );
  }

  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const role = params.role ?? "ALL";

  let snapshot;
  let users;
  try {
    [snapshot, users] = await Promise.all([adminSnapshot(), searchUsers(query, role)]);
  } catch {
    return (
      <PageIntro
        index="Admin"
        title="The board is offline."
        lede="Administrator queries need PostgreSQL. Start the database, run the migration, and seed an administrator."
      />
    );
  }

  return (
    <>
      <PageIntro
        tone="console"
        index="Admin"
        title="Platform board."
        lede="Counts come from the database. A player cannot reach this data by hiding a link."
      />
      <section className="admin-grid" aria-label="Platform totals">
        <article>
          <h2>Players</h2>
          <strong>{snapshot.users}</strong>
        </article>
        <article>
          <h2>Matches</h2>
          <strong>{snapshot.matches}</strong>
        </article>
        <article>
          <h2>Books</h2>
          <strong>{snapshot.books}</strong>
        </article>
        <article>
          <h2>Wins logged</h2>
          <strong>{snapshot.wins}</strong>
        </article>
      </section>
      <div className="console">
        <section>
          <div className="panel-head">
            <h2>Players</h2>
            <p className="hint">
              {users.length} shown
              {query || role !== "ALL" ? (
                <>
                  {" "}
                  · <Link href="/admin">Clear filter</Link>
                </>
              ) : null}
            </p>
          </div>
          <form className="toolbar" action="/admin" method="get">
            <label>
              Search
              <input id="q" name="q" type="search" defaultValue={query} placeholder="Name or email" />
            </label>
            <label>
              Role
              <select id="role" name="role" defaultValue={role}>
                <option value="ALL">All roles</option>
                <option value="USER">Player</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </label>
            <button className="btn btn-primary" type="submit">
              Filter
            </button>
          </form>
          <div className="table-scroll">
            <table className="data-table">
              <caption className="sr-only">Registered users</caption>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Role</th>
                  <th scope="col">Matches</th>
                  <th scope="col">Books</th>
                  <th scope="col">Joined</th>
                  <th scope="col">Access</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7}>No accounts match that filter.</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={user.role === "ADMIN" ? "role-badge is-admin" : "role-badge"}>
                          {user.role === "ADMIN" ? "Administrator" : "Player"}
                        </span>
                      </td>
                      <td className="num">{user._count.matches}</td>
                      <td className="num">{user._count.books}</td>
                      <td>{formatWhen(user.createdAt.toISOString())}</td>
                      <td>
                        {user.id === account.id ? (
                          "You"
                        ) : (
                          <RoleControl
                            key={`${user.id}-${user.role}`}
                            userId={user.id}
                            role={user.role}
                            name={user.name}
                          />
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
        <aside className="console-side">
          <section className="panel">
            <h2>Results</h2>
            <p className="record-line">
              <span>Wins</span>
              <strong className="num">{snapshot.wins}</strong>
            </p>
            <p className="record-line">
              <span>Losses</span>
              <strong className="num">{snapshot.losses}</strong>
            </p>
            <p className="record-line">
              <span>Draws</span>
              <strong className="num">{snapshot.draws}</strong>
            </p>
            <ResultChart
              data={[
                { name: "Chess", value: snapshot.chess, fill: "#8B5CF6" },
                { name: "Tic Tac Toe", value: snapshot.ticTacToe, fill: "#70D6FF" },
              ]}
            />
            {snapshot.matches === 0 ? <p className="hint">No matches have been recorded.</p> : null}
          </section>
          <section className="panel">
            <h2>Recent activity</h2>
            {snapshot.recent.length === 0 ? (
              <p className="quiet">Finished games appear here.</p>
            ) : (
              <table className="data-table">
                <caption className="sr-only">Recent matches across the platform</caption>
                <thead>
                  <tr>
                    <th scope="col">Player</th>
                    <th scope="col">Game</th>
                    <th scope="col">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.recent.map((match) => (
                    <tr key={match.id}>
                      <td>
                        {match.player}
                        <div className="hint">{formatWhen(match.createdAt)}</div>
                      </td>
                      <td>{gameLabel(match.game)}</td>
                      <td>{match.result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
          <p className="hint">
            <Link href="/dashboard">Back to your dashboard</Link>
          </p>
        </aside>
      </div>
    </>
  );
}
