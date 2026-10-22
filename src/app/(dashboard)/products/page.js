import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { listCatalog, listUserProducts } from '@/lib/products';
import { getUserPromptIa, getUserStoreUrl, getUserWhatsappGroupName } from '@/lib/users';
import { ProductsBoard } from '@/components/ProductsBoard';

export const dynamic = 'force-dynamic';

function ProductsLoadError({ message }) {
  return (
    <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
      <h1 className="text-lg font-semibold text-red-900">Erro ao carregar produtos</h1>
      <p className="mt-2 text-sm text-red-800">{message}</p>
      <p className="mt-4 text-sm text-red-700">
        Se aparecer erro de certificado SSL no terminal, em desenvolvimento local (Windows com
        antivírus/proxy) defina no <code className="rounded bg-red-100 px-1">.env</code>:{' '}
        <code className="rounded bg-red-100 px-1">TLS_INSECURE_DEV=true</code> e reinicie{' '}
        <code className="rounded bg-red-100 px-1">npm run dev</code>. Não use isso em produção.
      </p>
    </section>
  );
}

export default async function ProductsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/admin');
  }

  try {
    const [products, catalog, initialPrompt, initialWhatsappGroupName, initialStoreUrl] =
      await Promise.all([
        listUserProducts(session.id_users),
        listCatalog(),
        getUserPromptIa(session.id_users),
        getUserWhatsappGroupName(session.id_users),
        getUserStoreUrl(session.id_users),
      ]);

    return (
      <ProductsBoard
        initialProducts={products}
        categories={catalog.categories}
        platforms={catalog.platforms}
        initialPrompt={initialPrompt}
        initialWhatsappGroupName={initialWhatsappGroupName}
        initialStoreUrl={initialStoreUrl}
      />
    );
  } catch (err) {
    console.error('[products page]', err);
    const detail = err?.message || 'Falha ao contactar o Supabase.';
    return <ProductsLoadError message={detail} />;
  }
}
