"use client";

import { useMemo, useState } from "react";
import { createShelfBook, deleteShelfBook, setShelfRead, updateShelfBook } from "@/app/actions/library";
import { createLibrary, libraryStats, queryBooks, type BookSnapshot } from "@/lib/library/collection.js";
import { bookSchema } from "@/lib/validations";

const STORAGE_KEY = "bgames.library";

interface RawBook {
  id: string;
  title: string;
  author: string;
  pages: number;
  read: boolean;
  createdAt: string;
}

interface Draft {
  title: string;
  author: string;
  pages: string;
  read: boolean;
}

const emptyDraft: Draft = { title: "", author: "", pages: "", read: false };

function readGuest(): RawBook[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RawBook[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function revive(seed: RawBook[]): BookSnapshot[] {
  return createLibrary(seed).list();
}

export function LibraryDesk({ initialBooks }: { initialBooks: RawBook[] | null }) {
  const account = initialBooks !== null;
  const [books, setBooks] = useState<BookSnapshot[]>(() =>
    revive(initialBooks ?? (typeof window === "undefined" ? [] : readGuest())),
  );
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editing, setEditing] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "read" | "unread">("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "title">("newest");
  const [message, setMessage] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const visible = useMemo(
    () => queryBooks(books, { query, status, sort }),
    [books, query, sort, status],
  );
  const stats = libraryStats(books);

  function persist(next: BookSnapshot[]) {
    if (account) return;
    const plain = next.map((book) => ({
      id: book.id,
      title: book.title,
      author: book.author,
      pages: book.pages,
      read: book.read,
      createdAt: book.createdAt,
    }));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plain));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = bookSchema.safeParse({
      title: draft.title,
      author: draft.author,
      pages: Number(draft.pages),
      read: draft.read,
    });
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? "Check the book fields.");
      return;
    }

    if (!account) {
      const shelf = createLibrary(books);
      if (editing) shelf.update(editing, parsed.data);
      else shelf.add(parsed.data.title, parsed.data.author, parsed.data.pages, parsed.data.read);
      const next = shelf.list();
      setBooks(next);
      persist(next);
      setDraft(emptyDraft);
      setEditing(null);
      setMessage(null);
      return;
    }

    const result = editing ? await updateShelfBook(editing, parsed.data) : await createShelfBook(parsed.data);
    if (!result.ok || !result.book) {
      setMessage(result.message ?? "The shelf could not be saved.");
      return;
    }
    const nextSeed = editing
      ? books.map((book) => (book.id === editing ? result.book! : book))
      : [result.book, ...books];
    setBooks(revive(nextSeed));
    setDraft(emptyDraft);
    setEditing(null);
    setMessage(null);
  }

  async function toggle(id: string) {
    if (!account) {
      const shelf = createLibrary(books);
      shelf.toggleRead(id);
      const next = shelf.list();
      setBooks(next);
      persist(next);
      return;
    }
    const result = await setShelfRead(id);
    if (!result.ok || !result.book) {
      setMessage(result.message ?? "Could not update that book.");
      return;
    }
    setBooks(revive(books.map((book) => (book.id === id ? result.book! : book))));
  }

  async function remove(id: string) {
    if (pendingDelete !== id) {
      setPendingDelete(id);
      return;
    }
    if (!account) {
      const shelf = createLibrary(books);
      shelf.remove(id);
      const next = shelf.list();
      setBooks(next);
      persist(next);
      setPendingDelete(null);
      return;
    }
    const result = await deleteShelfBook(id);
    if (!result.ok) {
      setMessage(result.message ?? "Could not remove that book.");
      return;
    }
    setBooks(books.filter((book) => book.id !== id));
    setPendingDelete(null);
  }

  return (
    <div className="library-layout">
      <form onSubmit={onSubmit}>
        <p className="kicker">{editing ? "Edit volume" : "Add a volume"}</p>
        <div className="field">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            name="title"
            required
            maxLength={120}
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="author">Author</label>
          <input
            id="author"
            name="author"
            required
            maxLength={120}
            value={draft.author}
            onChange={(event) => setDraft({ ...draft, author: event.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="pages">Pages</label>
          <input
            id="pages"
            name="pages"
            type="number"
            inputMode="numeric"
            required
            min={1}
            max={20000}
            value={draft.pages}
            onChange={(event) => setDraft({ ...draft, pages: event.target.value })}
          />
        </div>
        <label className="check-row">
          <input
            type="checkbox"
            name="read"
            checked={draft.read}
            onChange={(event) => setDraft({ ...draft, read: event.target.checked })}
          />
          Already read
        </label>
        {message ? (
          <p className="field-error" role="alert">
            {message}
          </p>
        ) : null}
        <div className="inline-actions">
          <button className="btn btn-primary" type="submit">
            {editing ? "Save changes" : "Add book"}
          </button>
          {editing ? (
            <button
              className="btn btn-line"
              type="button"
              onClick={() => {
                setEditing(null);
                setDraft(emptyDraft);
              }}
            >
              Cancel
            </button>
          ) : null}
        </div>
        <p className="hint">
          {account
            ? "Saved to your account."
            : "Stored on this device. Sign in to keep the shelf in the database."}
        </p>
        <dl className="stat-grid">
          <div>
            <dt>Books</dt>
            <dd>{stats.total}</dd>
          </div>
          <div>
            <dt>Read</dt>
            <dd>{stats.read}</dd>
          </div>
          <div>
            <dt>Pages</dt>
            <dd>{stats.pages}</dd>
          </div>
        </dl>
      </form>

      <section>
        <div className="toolbar">
          <label>
            Search
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <label>
            Status
            <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
              <option value="all">All</option>
              <option value="read">Read</option>
              <option value="unread">Unread</option>
            </select>
          </label>
          <label>
            Sort
            <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="title">Title</option>
            </select>
          </label>
        </div>
        {books.length === 0 ? (
          <p className="quiet">The shelf is empty. Add the book you are actually reading.</p>
        ) : visible.length === 0 ? (
          <p className="quiet">Nothing on the shelf matches that filter.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {visible.map((book) => (
              <li key={book.id} className="volume">
                <span className={book.read ? "spine is-read" : "spine"} aria-hidden="true" />
                <div>
                  <h3>{book.title}</h3>
                  <p className="quiet">{book.info}</p>
                  <div className="inline-actions">
                    <button type="button" className="btn btn-line" onClick={() => void toggle(book.id)}>
                      {book.read ? "Mark unread" : "Mark read"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-line"
                      onClick={() => {
                        setEditing(book.id);
                        setDraft({
                          title: book.title,
                          author: book.author,
                          pages: String(book.pages),
                          read: book.read,
                        });
                      }}
                    >
                      Edit
                    </button>
                    <button type="button" className="btn btn-line" onClick={() => void remove(book.id)}>
                      {pendingDelete === book.id ? "Confirm remove" : "Remove"}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
