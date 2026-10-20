/**
 * Book object constructor.
 *
 * Academic objective: The Odin Project — Library.
 * This file is plain JavaScript on purpose. Books are created with `new Book`,
 * and shared behavior lives on `Book.prototype` (one function for every book,
 * not a new closure per instance).
 *
 * The Next.js UI calls these functions. Prisma stores the same fields for
 * signed-in readers, but it does not replace this constructor.
 */

/**
 * @param {string} title
 * @param {string} author
 * @param {number} pages
 * @param {boolean} read
 * @constructor
 */
export function Book(title, author, pages, read) {
  if (new.target === undefined) {
    throw new Error("Use new Book(title, author, pages, read).");
  }

  this.id = globalThis.crypto.randomUUID();
  this.title = String(title ?? "").trim();
  this.author = String(author ?? "").trim();
  this.pages = Number(pages);
  this.read = Boolean(read);
  this.createdAt = new Date().toISOString();
}

/**
 * Sentence used by the original Library project.
 * @returns {string}
 */
Book.prototype.info = function info() {
  const status = this.read ? "already read" : "not read yet";
  return `${this.title} by ${this.author}, ${this.pages} pages, ${status}`;
};

/** @returns {boolean} */
Book.prototype.toggleRead = function toggleRead() {
  this.read = !this.read;
  return this.read;
};

/**
 * @param {{ title?: string, author?: string, pages?: number, read?: boolean }} fields
 */
Book.prototype.update = function update(fields) {
  if (fields.title !== undefined) this.title = String(fields.title).trim();
  if (fields.author !== undefined) this.author = String(fields.author).trim();
  if (fields.pages !== undefined) this.pages = Number(fields.pages);
  if (fields.read !== undefined) this.read = Boolean(fields.read);
};

/**
 * @param {string} title
 * @param {string} author
 * @param {number} pages
 * @param {boolean} read
 * @returns {Book}
 */
export function addBookToLibrary(library, title, author, pages, read) {
  const book = new Book(title, author, pages, read);
  library.push(book);
  return book;
}
