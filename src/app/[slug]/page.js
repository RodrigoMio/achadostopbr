import { notFound } from 'next/navigation';
import { ShowcaseGrid } from '@/components/ShowcaseGrid';
import { RESERVED_SLUGS } from '@/lib/constants';
import { getPublicProfileBySlug, listFilterCatalog, listShowcaseProducts } from '@/lib/showcase';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  if (RESERVED_SLUGS.has(String(slug).toLowerCase())) {
    return { title: 'Afiliados WhatsApp' };
  }
  try {
    const profile = await getPublicProfileBySlug(slug);
    if (!profile) {
      return { title: 'Vitrine não encontrada' };
    }
    return {
      title: `${profile.name} · Ofertas`,
      description: `Ofertas de ${profile.name}`,
    };
  } catch {
    return { title: 'Vitrine' };
  }
}

export default async function ShowcasePage({ params }) {
  const { slug } = await params;

  if (RESERVED_SLUGS.has(String(slug).toLowerCase())) {
    notFound();
  }

  let profile;
  try {
    profile = await getPublicProfileBySlug(slug);
  } catch (err) {
    console.error('[showcase profile]', err);
    notFound();
  }

  if (!profile) {
    notFound();
  }

  const [products, catalog] = await Promise.all([
    listShowcaseProducts(profile),
    listFilterCatalog(),
  ]);

  return (
    <ShowcaseGrid
      profile={profile}
      products={products}
      categories={catalog.categories}
      platforms={catalog.platforms}
    />
  );
}
