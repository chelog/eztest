import { redirect } from 'next/navigation';

interface DefectsPageProps {
  params: Promise<{ id: string }>;
}

export default async function DefectsPage({ params }: DefectsPageProps) {
  const { id } = await params;
  redirect(`/projects/${id}`);
}
