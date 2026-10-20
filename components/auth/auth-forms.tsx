"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { authenticate, registerAccount } from "@/app/actions/auth";
import { signInSchema, signUpSchema, type SignInValues, type SignUpValues } from "@/lib/validations";

function applyIssues<Field extends string>(
  issues: { path: PropertyKey[]; message: string }[],
  setError: (name: Field, error: { message: string }) => void,
  fields: readonly Field[],
) {
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "");
    if ((fields as readonly string[]).includes(key)) {
      setError(key as Field, { message: issue.message });
    }
  }
}

export function SignUpForm() {
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const form = useForm<SignUpValues>({
    defaultValues: { name: "", email: "", password: "", confirm: "" },
  });

  return (
    <form
      onSubmit={form.handleSubmit((values) => {
        const parsed = signUpSchema.safeParse(values);
        form.clearErrors();
        if (!parsed.success) {
          applyIssues(parsed.error.issues, form.setError, ["name", "email", "password", "confirm"]);
          return;
        }
        startTransition(async () => {
          const result = await registerAccount(parsed.data);
          setMessage(result.message ?? null);
          if (result.fieldErrors) {
            for (const [key, text] of Object.entries(result.fieldErrors)) {
              if (key === "name" || key === "email" || key === "password" || key === "confirm") {
                form.setError(key, { message: text });
              }
            }
          }
        });
      })}
    >
      <div className="field">
        <label htmlFor="name">Name</label>
        <input id="name" type="text" autoComplete="name" required minLength={2} {...form.register("name")} />
        {form.formState.errors.name ? <p className="field-error">{form.formState.errors.name.message}</p> : null}
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="email" inputMode="email" required {...form.register("email")} />
        {form.formState.errors.email ? <p className="field-error">{form.formState.errors.email.message}</p> : null}
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <div className="field-row">
          <input
            id="password"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            aria-describedby="password-hint"
            {...form.register("password")}
          />
          <button className="btn btn-line" type="button" aria-pressed={show} onClick={() => setShow((value) => !value)}>
            {show ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
            <span className="sr-only">{show ? "Hide password" : "Show password"}</span>
          </button>
        </div>
        <p id="password-hint" className="hint">
          At least 8 characters, with a letter and a number.
        </p>
        {form.formState.errors.password ? <p className="field-error">{form.formState.errors.password.message}</p> : null}
      </div>
      <div className="field">
        <label htmlFor="confirm">Confirm password</label>
        <input
          id="confirm"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          required
          {...form.register("confirm")}
        />
        {form.formState.errors.confirm ? <p className="field-error">{form.formState.errors.confirm.message}</p> : null}
      </div>
      {message ? (
        <p className="alert" role="alert">
          {message}
        </p>
      ) : null}
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </button>
      <p className="hint">
        Already registered? <Link href="/sign-in">Sign in</Link>
      </p>
    </form>
  );
}

export function SignInForm() {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const form = useForm<SignInValues>({ defaultValues: { email: "", password: "" } });

  return (
    <form
      onSubmit={form.handleSubmit((values) => {
        const parsed = signInSchema.safeParse(values);
        form.clearErrors();
        if (!parsed.success) {
          applyIssues(parsed.error.issues, form.setError, ["email", "password"]);
          return;
        }
        startTransition(async () => {
          const result = await authenticate(parsed.data, callbackUrl);
          setMessage(result.message ?? null);
          if (result.fieldErrors) {
            for (const [key, text] of Object.entries(result.fieldErrors)) {
              if (key === "email" || key === "password") form.setError(key, { message: text });
            }
          }
        });
      })}
    >
      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          autoFocus
          aria-invalid={form.formState.errors.email ? true : undefined}
          aria-describedby={form.formState.errors.email ? "email-error" : undefined}
          {...form.register("email")}
        />
        {form.formState.errors.email ? (
          <p id="email-error" className="field-error">
            {form.formState.errors.email.message}
          </p>
        ) : null}
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <div className="field-row">
          <input
            id="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
            aria-invalid={form.formState.errors.password ? true : undefined}
            aria-describedby={form.formState.errors.password ? "password-error" : undefined}
            {...form.register("password")}
          />
          <button className="btn btn-line" type="button" aria-pressed={show} onClick={() => setShow((value) => !value)}>
            {show ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
            <span className="sr-only">{show ? "Hide password" : "Show password"}</span>
          </button>
        </div>
        {form.formState.errors.password ? (
          <p id="password-error" className="field-error">
            {form.formState.errors.password.message}
          </p>
        ) : null}
      </div>
      {message ? (
        <p className="alert" role="alert">
          {message}
        </p>
      ) : null}
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="hint">
        New here? <Link href="/sign-up">Create an account</Link>
      </p>
    </form>
  );
}
