/**
 * Library collection as a module-style factory.
 *
 * The Odin Project keeps books in an array (`myLibrary`) and pushes constructor
 * instances into it. `createLibrary` is that array, closed over so the UI
 * cannot replace it by accident. Guest browsers persist the plain snapshots
 * in localStorage; this module itself stays storage-agnostic and testable.
 */
import { Book } from "./book.js";

/**
 * @param {object} raw
 * @returns {Book}
 */
function revive(raw) {
  const book = new Book(raw.title, raw.author, raw.pages, raw.read);
  if (raw.id) book.id = raw.id;
  if (raw.createdAt) book.createdAt = raw.createdAt;
  return book;
}

/**
 * @param {Book} book
 */
export function snapshotBook(book) {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    pages: book.pages,
    read: book.read,
    createdAt: book.createdAt,
    info: book.info(),
  };
}

/**
 * @param {Array<object>} [seed]
 */
export function createLibrary(seed = []) {
  const books = seed.map(revive);

  return {
    /** @returns {object[]} */
    list() {
      return books.map(snapshotBook);
    },
    add(title, author, pages, read) {
      const book = new Book(title, author, pages, read);
      books.push(book);
      return snapshotBook(book);
    },
    update(id, fields) {
      const book = books.find((entry) => entry.id === id);
      if (!book) return null;
      book.update(fields);
      return snapshotBook(book);
    },
    remove(id) {
      const index = books.findIndex((entry) => entry.id === id);
      if (index === -1) return false;
      books.splice(index, 1);
      return true;
    },
    toggleRead(id) {
      const book = books.find((entry) => entry.id === id);
      if (!book) return null;
      book.toggleRead();
      return snapshotBook(book);
    },
  };
}

/**
 * @param {object[]} books
 * @param {{ query?: string, status?: "all" | "read" | "unread", sort?: "title" | "newest" | "oldest" }} options
 */
export function queryBooks(books, options = {}) {
  const query = (options.query ?? "").trim().toLowerCase();
  const status = options.status ?? "all";
  const sort = options.sort ?? "newest";

  const filtered = books.filter((book) => {
    const matchesQuery =
      query.length === 0 ||
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query);
    const matchesStatus =
      status === "all" ||
      (status === "read" && book.read) ||
      (status === "unread" && !book.read);
    return matchesQuery && matchesStatus;
  });

  const sorted = [...filtered];
  if (sort === "title") {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort === "oldest") {
    sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  } else {
    sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return sorted;
}

/** @param {object[]} books */
export function libraryStats(books) {
  const total = books.length;
  const read = books.filter((book) => book.read).length;
  const pages = books.reduce((sum, book) => sum + (Number(book.pages) || 0), 0);
  return {
    total,
    read,
    unread: total - read,
    pages,
  };
}
