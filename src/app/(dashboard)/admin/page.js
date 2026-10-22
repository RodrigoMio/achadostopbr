import { getSession } from '@/lib/session';
import { getUserWhatsappGroupName } from '@/lib/users';
import { listGroupCategories } from '@/lib/whatsappGroups';
import { GroupsAdminBoard } from '@/components/GroupsAdminBoard';

export const dynamic = 'force-dynamic';

function GroupsLoadError({ message }) {
  return (
    <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
      <h1 className="text-lg font-semibold text-red-900">Erro ao carregar gerenciamento de grupos</h1>
      <p className="mt-2 text-sm text-red-800">{message}</p>
    </section>
  );
}

export default async function AdminPage() {
  const session = await getSession();

  try {
    const [categories, initialPrefix] = await Promise.all([
      listGroupCategories(),
      getUserWhatsappGroupName(session.id_users),
    ]);

    return <GroupsAdminBoard categories={categories} initialPrefix={initialPrefix} />;
  } catch (err) {
    console.error('[admin groups page]', err);
    const detail = err?.message || 'Falha ao contactar o Supabase.';
    return <GroupsLoadError message={detail} />;
  }
}
