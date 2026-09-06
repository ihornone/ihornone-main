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

export interface Service {
  id: string;
  title: string;
  shortTitle: string;
  icon: string;
  description: string;
  heroSubtitle: string;
  isPopular: boolean;
  order: number;
  includes: Array<{
    title: string;
    icon: string;
    description: string;
  }>;
}
