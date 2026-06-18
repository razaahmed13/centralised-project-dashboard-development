'use client';

import { signOut } from 'next-auth/react';

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="flex w-full shrink-0 items-center justify-between rounded-2xl border border-red-500/20 px-4 py-3 text-sm font-medium text-red-300 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-200"
    >
      <span>Logout</span>
    </button>
  );
}
