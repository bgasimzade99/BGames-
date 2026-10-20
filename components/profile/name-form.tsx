"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/app/actions/auth";

export function NameForm({ name }: { name: string }) {
  const [value, setValue] = useState(name);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await updateProfile({ name: value });
          setMessage(result.message ?? null);
        });
      }}
    >
      <div className="field">
        <label htmlFor="display-name">Display name</label>
        <input
          id="display-name"
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={80}
          autoComplete="name"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </div>
      {message ? <p className="note">{message}</p> : null}
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save name"}
      </button>
    </form>
  );
}
