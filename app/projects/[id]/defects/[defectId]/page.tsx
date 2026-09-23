import { redirect } from 'next/navigation';

interface DefectDetailPageProps {
  params: Promise<{ id: string; defectId: string }>;
}

export default async function DefectDetailPage({ params }: DefectDetailPageProps) {
  const { id } = await params;
  redirect(`/projects/${id}`);
}
