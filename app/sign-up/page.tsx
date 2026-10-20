import type { Metadata } from "next";
import { SignUpForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Sign up" };

export default function SignUpPage() {
  return (
    <div className="auth-stage">
      <section className="auth-story">
        <img className="auth-mark" src="/brandi.png" alt="" />
        <p className="kicker">Register</p>
        <h1 className="poster">Create a player account.</h1>
        <p className="lede">
          Your password is hashed before it is stored. New accounts are players. Administrator access is granted from the
          database seed, not from a password hidden in the source.
        </p>
        <ol className="auth-points">
          <li>
            <span>01</span>
            Name, email, and a password with a letter and a number.
          </li>
          <li>
            <span>02</span>
            The confirmation must match before the account is created.
          </li>
          <li>
            <span>03</span>
            The role stays player until an administrator changes it.
          </li>
        </ol>
      </section>
      <section className="auth-panel" aria-label="Create account">
        <h2>Sign up</h2>
        <SignUpForm />
      </section>
    </div>
  );
}
