"use server";

import { recordMatch } from "@/lib/data/queries";

export async function saveMatch(input: unknown) {
  return recordMatch(input);
}
