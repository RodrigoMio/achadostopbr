import { redirect } from 'next/navigation';
import { getDefaultCatalogProfile } from '@/lib/users';

export const dynamic = 'force-dynamic';

function CatalogSoon() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center text-foreground">
      <p className="font-display text-xl font-extrabold">Buscador de Ofertas</p>
      <p className="max-w-md text-sm text-muted-foreground">Catálogo em breve</p>
    </main>
  );
}

export default async function HomePage() {
  try {
    const profile = await getDefaultCatalogProfile();
    if (profile?.slug) {
      redirect(`/${profile.slug}`);
    }
  } catch (err) {
    console.error('[default catalog]', err);
  }

  return <CatalogSoon />;
}
