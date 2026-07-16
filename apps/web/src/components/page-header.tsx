import type { ReactNode } from 'react';
import { ModulePageHeader } from '@/components/module-page-header';

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export function PageHeader({ actions, description, eyebrow, title }: PageHeaderProps) {
  return <ModulePageHeader actions={actions} description={description} eyebrow={eyebrow} title={title} />;
}
