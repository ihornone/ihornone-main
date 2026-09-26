export interface Project {
  id: string;
  title: string;
  category: string;
  icon: string;
  image: string;
  description: string;
  pinned?: boolean | number;
  order?: number;
  statusBadge?: string;
  clientName?: string;
  meta?: {
    technologies?: string;
  };
}
