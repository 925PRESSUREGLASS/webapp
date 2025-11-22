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
  status?: 'draft' | 'in-progress' | 'complete';
  assets: Asset[];
}

export interface FeatureRecord extends Feature {
  projectId: string;
  projectName: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  features: Feature[];
  status: 'draft' | 'in-progress' | 'complete';
}

export type AppStatus = 'online' | 'offline' | 'maintenance' | 'planned';

export type AssetType = 'snippet' | 'component' | 'template' | 'static' | 'doc' | 'prompt';
export type AssetStatus = 'draft' | 'active' | 'deprecated';

export interface AssetVersion {
  id: string;
  version: string;
  changelog?: string;
  isCurrent: boolean;
  createdAt?: string;
}

export interface AssetLibraryItem {
  id: string;
  title: string;
  description: string;
  type: AssetType;
  status: AssetStatus;
  projectIds?: string[];
  featureIds?: string[];
  tags?: string[];
  versions?: AssetVersion[];
  link?: string;
}

export interface AppService {
  id: string;
  name: string;
  description: string;
  url: string;
  kind: 'pwa' | 'api' | 'dashboard' | 'tool';
  status: AppStatus;
  tags?: string[];
}
