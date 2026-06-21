import { redirect } from 'next/navigation';

export default async function SsoClientsPage() {
  redirect('/settings?tab=sso');
}
