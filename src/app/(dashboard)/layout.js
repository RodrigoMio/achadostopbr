import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { Sidebar } from '@/components/Sidebar';
import { QrLogin } from '@/components/QrLogin';
import { connectWhatsApp, getPublicState } from '@/server/whatsapp';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }) {
  connectWhatsApp().catch(() => {});

  const session = await getSession();
  const state = getPublicState();

  const linked = state.connected && state.authorized && state.user;

  if (!linked) {
    if (session) {
      redirect('/api/auth/session-reset?redirect=/admin');
    }
    return <QrLogin />;
  }

  const sessionOk =
    session && String(session.id_users) === String(state.user.id_users);

  if (!sessionOk) {
    if (session) {
      redirect('/api/auth/session-reset?redirect=/admin');
    }
    return <QrLogin />;
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
