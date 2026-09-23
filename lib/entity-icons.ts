import {
  BarChart3,
  Bug,
  FileCheck,
  Folder,
  FolderTree,
  Layers,
  PlayCircle,
  Settings,
  Shield,
  Users,
  type LucideIcon,
} from 'lucide-react';

/** One icon per entity, used everywhere (sidebar, cards, stat tiles, dialogs). */
export const ENTITY_ICONS = {
  project: Folder,
  testSuite: FolderTree,
  testCase: FileCheck,
  testRun: PlayCircle,
  defect: Bug,
  module: Layers,
  members: Users,
  settings: Settings,
  statistics: BarChart3,
  admin: Shield,
} satisfies Record<string, LucideIcon>;
