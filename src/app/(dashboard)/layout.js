import { getSession } from '@/lib/session';
import { Sidebar } from '@/components/Sidebar';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }) {
  const session = await getSession();

  if (!session) {
    return children;
  }

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar user={session} />
      <div className="min-h-screen flex-1 lg:min-w-0">
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
