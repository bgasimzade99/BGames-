import { z } from "zod";

export const signUpSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80, "Name is too long."),
    email: z.string().trim().email("Enter a valid email."),
    password: z
      .string()
      .min(8, "Use at least 8 characters.")
      .regex(/[A-Za-z]/, "Include a letter.")
      .regex(/[0-9]/, "Include a number."),
    confirm: z.string(),
  })
  .refine((value) => value.password === value.confirm, {
    message: "Passwords do not match.",
    path: ["confirm"],
  });

export const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

export const bookSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(120, "Keep the title under 120 characters."),
  author: z.string().trim().min(1, "Author is required.").max(120, "Keep the author under 120 characters."),
  pages: z
    .number()
    .int("Pages must be a whole number.")
    .min(1, "A book has at least one page.")
    .max(20000, "That page count is too large."),
  read: z.boolean(),
});

export const matchSchema = z.object({
  game: z.enum(["TIC_TAC_TOE", "CHESS"]),
  result: z.enum(["WIN", "LOSS", "DRAW"]),
  opponent: z.string().trim().min(1).max(80),
  moves: z.number().int().min(1).max(400),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80, "Name is too long."),
});

export type SignUpValues = z.infer<typeof signUpSchema>;
export type SignInValues = z.infer<typeof signInSchema>;
export type BookValues = z.infer<typeof bookSchema>;
