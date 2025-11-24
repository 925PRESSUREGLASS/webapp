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

export interface BusinessRecord {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'paused' | 'archived';
  region?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  currency?: string;
  defaultMarkup?: number;
}

export interface ServiceLineRecord {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
}

export interface ServiceTypeRecord {
  id: string;
  serviceLineId: string;
  code: string;
  name: string;
  description?: string;
  unit: string;
  baseRate?: number;
  baseMinutesPerUnit?: number;
  riskLevel?: string;
  pressureMethod?: string;
  tags?: string[];
  isActive?: boolean;
}

export interface ModifierRecord {
  id: string;
  businessId?: string;
  scope: string;
  name: string;
  description?: string;
  multiplier?: number;
  flatAdjust?: number;
  appliesTo?: string;
  tags?: string[];
  isActive?: boolean;
}

export interface MarketAreaRecord {
  id: string;
  businessId: string;
  name: string;
  postalCodes?: string[];
  travelFee?: number;
  minJobValue?: number;
  notes?: string;
}

export interface PriceBookRateRecord {
  id: string;
  priceBookId: string;
  serviceTypeId: string;
  rate?: number;
  minutesPerUnit?: number;
  currency?: string;
  notes?: string;
}

export interface PriceBookVersionRecord {
  id: string;
  businessId: string;
  version: string;
  changelog?: string;
  isCurrent: boolean;
  rates?: PriceBookRateRecord[];
}

export interface PackageRecord {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  discountPct?: number;
  tags?: string[];
  isActive?: boolean;
  items?: {
    serviceTypeId: string;
    quantity?: number;
    unitOverride?: string;
  }[];
}
