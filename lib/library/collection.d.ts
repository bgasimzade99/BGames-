export interface BookSnapshot {
  id: string;
  title: string;
  author: string;
  pages: number;
  read: boolean;
  createdAt: string;
  info: string;
}

export interface LibraryStore {
  list: () => BookSnapshot[];
  add: (title: string, author: string, pages: number, read: boolean) => BookSnapshot;
  update: (id: string, fields: { title?: string; author?: string; pages?: number; read?: boolean }) => BookSnapshot | null;
  remove: (id: string) => boolean;
  toggleRead: (id: string) => BookSnapshot | null;
}

export function snapshotBook(book: {
  id: string;
  title: string;
  author: string;
  pages: number;
  read: boolean;
  createdAt: string;
  info: () => string;
}): BookSnapshot;

export function createLibrary(seed?: object[]): LibraryStore;

export function queryBooks(
  books: BookSnapshot[],
  options?: {
    query?: string;
    status?: "all" | "read" | "unread";
    sort?: "title" | "newest" | "oldest";
  },
): BookSnapshot[];

export function libraryStats(books: BookSnapshot[]): {
  total: number;
  read: number;
  unread: number;
  pages: number;
};
