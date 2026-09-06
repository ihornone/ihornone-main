export interface Project {
  id: string;
  title: string;
  category: string;
  icon: string;
  image: string;
  description: string;
  pinned?: boolean;
  meta?: {
    technologies?: string;
  };
}
