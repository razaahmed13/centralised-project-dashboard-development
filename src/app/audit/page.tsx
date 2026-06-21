import { redirect } from 'next/navigation';

export default async function AuditPage() {
  redirect('/settings?tab=audit');
}
