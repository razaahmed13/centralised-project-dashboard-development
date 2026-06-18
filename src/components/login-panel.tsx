"use client";

import { signIn } from 'next-auth/react';
import { useState } from 'react';

type LoginPanelProps = {
  authError?: string | null;
};

function getAuthErrorMessage(error?: string | null) {
  if (error === 'CredentialsSignin') return 'Incorrect admin password.';
  if (error === 'AccessDenied') return 'Google account not authorized.';
  if (error) return 'Sign in failed. Please try again.';
  return null;
}

export function LoginPanel({ authError }: LoginPanelProps = {}) {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const errorMessage = getAuthErrorMessage(authError);
  const isPasswordError = authError === 'CredentialsSignin';

  async function submitPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    await signIn('admin-password', { password, callbackUrl: '/' });
    setIsSubmitting(false);
  }

  return (
    <section className="w-full max-w-md rounded-[2rem] border border-blue-400/20 bg-slate-950/80 p-8 shadow-2xl shadow-blue-950/40">
      <p className="text-xs uppercase tracking-[0.32em] text-blue-300/70">Neodym Admin</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Sign in to Dashboard</h1>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        Use the authorized Google account or the shared admin password to access project links and credentials.
      </p>

      {errorMessage && !isPasswordError ? (
        <p role="alert" className="mt-5 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-200">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => signIn('google', { callbackUrl: '/' })}
        className="mt-8 block w-full rounded-full bg-blue-500 px-5 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-400"
      >
        Continue with Google
      </button>

      <form onSubmit={submitPassword} className="mt-6 space-y-3">
        <label className="block text-sm font-medium text-slate-300" htmlFor="password">
          Admin password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400"
          placeholder="Enter admin password"
          aria-invalid={isPasswordError}
          aria-describedby={isPasswordError ? 'admin-password-error' : undefined}
        />
        {errorMessage && isPasswordError ? (
          <p id="admin-password-error" role="alert" className="rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-200">
            {errorMessage}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full border border-blue-300/20 px-5 py-3 text-sm font-semibold text-blue-100 transition hover:border-blue-300/50 hover:bg-blue-400/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Signing in…' : 'Sign in with Admin Password'}
        </button>
      </form>
    </section>
  );
}
