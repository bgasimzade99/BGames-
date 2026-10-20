export interface BookFields {
  title?: string;
  author?: string;
  pages?: number;
  read?: boolean;
}

export interface BookInstance {
  id: string;
  title: string;
  author: string;
  pages: number;
  read: boolean;
  createdAt: string;
  info: () => string;
  toggleRead: () => boolean;
  update: (fields: BookFields) => void;
}

export interface BookConstructor {
  new (title: string, author: string, pages: number, read: boolean): BookInstance;
}

export const Book: BookConstructor;

export function addBookToLibrary(
  library: BookInstance[],
  title: string,
  author: string,
  pages: number,
  read: boolean,
): BookInstance;
