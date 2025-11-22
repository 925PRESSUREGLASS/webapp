export type ProjectStatus = 'planning' | 'active' | 'paused' | 'archived';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  techStack?: {
    frontend?: string;
    backend?: string;
    db?: string;
    notes?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Feature {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  stage:
    | 'idea'
    | 'clarification'
    | 'scoping'
    | 'specification'
    | 'implementation'
    | 'validation'
    | 'release';
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id: string;
  type: 'snippet' | 'component' | 'template' | 'static' | 'doc';
  title: string;
  description?: string;
  status: 'draft' | 'active' | 'deprecated';
  currentVersion?: string;
  createdAt: string;
  updatedAt: string;
}
