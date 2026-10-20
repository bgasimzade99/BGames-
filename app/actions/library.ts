"use server";

import { editBook, removeBook, saveBook, toggleShelfRead } from "@/lib/data/queries";

export async function createShelfBook(input: unknown) {
  return saveBook(input);
}

export async function updateShelfBook(id: string, input: unknown) {
  return editBook(id, input);
}

export async function deleteShelfBook(id: string) {
  return removeBook(id);
}

export async function setShelfRead(id: string) {
  return toggleShelfRead(id);
}
