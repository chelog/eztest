import { redirect } from 'next/navigation';

/** Legacy route: the projects list is the app's home. */
export default function DashboardPage() {
  redirect('/projects');
}
