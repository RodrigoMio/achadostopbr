import { notFound } from 'next/navigation';
import { GroupsLanding } from '@/components/GroupsLanding';
import { RESERVED_SLUGS } from '@/lib/constants';
import { getPublicProfileBySlug } from '@/lib/showcase';
import { listPublicCategoriesWithGroups } from '@/lib/whatsappGroups';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  if (RESERVED_SLUGS.has(String(slug).toLowerCase())) {
    return { title: 'Grupos WhatsApp' };
  }
  try {
    const profile = await getPublicProfileBySlug(slug);
    if (!profile) {
      return { title: 'Grupos não encontrados' };
    }
    return {
      title: `${profile.name} · Grupos WhatsApp`,
      description: `Entre no grupo de ofertas de ${profile.name}`,
    };
  } catch {
    return { title: 'Grupos WhatsApp' };
  }
}

export default async function GroupsPage({ params }) {
  const { slug } = await params;

  if (RESERVED_SLUGS.has(String(slug).toLowerCase())) {
    notFound();
  }

  let profile;
  try {
    profile = await getPublicProfileBySlug(slug);
  } catch (err) {
    console.error('[groups profile]', err);
    notFound();
  }

  if (!profile) {
    notFound();
  }

  let categories = [];
  try {
    categories = await listPublicCategoriesWithGroups(profile.id_users);
  } catch (err) {
    console.error('[groups list]', err);
  }

  return <GroupsLanding profile={profile} categories={categories} />;
}
