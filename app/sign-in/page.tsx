import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <div className="auth-stage">
      <section className="auth-story">
        <img className="auth-mark" src="/brandi.png" alt="" />
        <p className="kicker">Account</p>
        <h1 className="poster">Return to the table.</h1>
        <p className="lede">
          Sign in to keep match results and the library on your account. Guest play does not require an account.
        </p>
        <ol className="auth-points">
          <li>
            <span>01</span>
            Guest boards stay on this device.
          </li>
          <li>
            <span>02</span>
            Signed-in matches and books are stored on the account.
          </li>
          <li>
            <span>03</span>
            Passwords are hashed. Signing up never creates an administrator.
          </li>
        </ol>
      </section>
      <section className="auth-panel" aria-label="Sign in">
        <h2>Sign in</h2>
        <Suspense fallback={<p className="quiet">Opening sign in…</p>}>
          <SignInForm />
        </Suspense>
      </section>
    </div>
  );
}
