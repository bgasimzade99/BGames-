"use client";

import { useActionState, useState } from "react";
import { setUserRole } from "@/app/actions/auth";

export function RoleControl({
  userId,
  role,
  name,
}: {
  userId: string;
  role: "USER" | "ADMIN";
  name: string;
}) {
  const [state, action, pending] = useActionState(setUserRole, null);
  const [armed, setArmed] = useState(false);
  const next = role === "ADMIN" ? "USER" : "ADMIN";
  const verb = role === "ADMIN" ? "Make player" : "Make admin";

  if (!armed) {
    return (
      <div className="role-form">
        <button type="button" className="btn btn-line" onClick={() => setArmed(true)}>
          {verb}
        </button>
        {state?.message ? (
          <span className="hint" role="status">
            {state.message}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <form action={action} className="role-form">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="role" value={next} />
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Saving…" : `Confirm for ${name}`}
      </button>
      <button className="btn btn-line" type="button" onClick={() => setArmed(false)} disabled={pending}>
        Cancel
      </button>
      {state?.message ? (
        <span className="hint" role="status">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
