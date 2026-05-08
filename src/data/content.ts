import type { ContentFormat } from '@/types';

export const formats: Array<{ value: ContentFormat; label: string }> = [
  { value: 'video', label: 'Videos' },
  { value: 'article', label: 'Articles' },
  { value: 'playbook', label: 'Playbooks' },
];
