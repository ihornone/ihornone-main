export interface Project {
  id: string;
  title: string;
  category: string;
  icon: string;
  image: string;
  description: string;
  pinned?: boolean;
  statusBadge?: string;
  clientName?: string;
  meta?: {
    technologies?: string;
  };
}
