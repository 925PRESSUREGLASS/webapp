export interface Asset {
  id: string;
  name: string;
  type: 'service' | 'package' | 'tool';
  description?: string;
}

export interface Feature {
  id: string;
  name: string;
  summary: string;
  assets: Asset[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  features: Feature[];
  status: 'draft' | 'in-progress' | 'complete';
}
