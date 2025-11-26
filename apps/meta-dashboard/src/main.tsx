import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  AppService,
  AssetLibraryItem,
  Project,
  BusinessRecord,
  ServiceLineRecord,
  ServiceTypeRecord,
  MarketAreaRecord,
  PriceBookVersionRecord,
  PackageRecord
} from '../../domain/types';
import { sampleProjects, sampleApps, sampleAssets, sampleFeatures } from '../../domain/sampleData';
import {
  serviceBusinesses as sampleBusinesses,
  serviceLines as sampleServiceLines,
  serviceTypes as sampleServiceTypes,
  marketAreas as sampleMarketAreas,
  priceBooks as samplePriceBooks,
  packages as samplePackages,
  modifiers as sampleModifiers
} from '../../domain/serviceData';
import { apiBaseUrl, fetchHealth, authHeaders } from './config';
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

var queryClient = new QueryClient();

type ProjectsResponse = {
  data: Project[];
  updatedAt?: string;
};

type AppsResponse = {
  data: AppService[];
  updatedAt?: string;
};

type AssetsResponse = {
  data: AssetLibraryItem[];
  updatedAt?: string;
};

type SummaryResponse = {
  data: {
    projectCount: number;
    featureCount: number;
    assetCount: number;
    statusCounts: { [key: string]: number };
  };
  updatedAt?: string;
};

type AssetSummaryResponse = {
  data: {
    assetCount: number;
    statusCounts: { [status: string]: number };
    typeCounts: { [type: string]: number };
  };
  updatedAt?: string;
};

type FeaturesResponse = {
  data: {
    id: string;
    name: string;
    summary: string;
    projectId: string;
    projectName: string;
    assets: { id: string; name: string; type: string }[];
  }[];
  updatedAt?: string;
};

type FeatureSummaryResponse = {
  data: {
    featureCount: number;
    projectCoverage: number;
    averageAssetsPerFeature: number;
  };
  updatedAt?: string;
};

type BusinessesResponse = {
  data: BusinessRecord[];
  updatedAt?: string;
};

type ServiceLinesResponse = {
  data: ServiceLineRecord[];
  updatedAt?: string;
};

type ServiceTypesResponse = {
  data: ServiceTypeRecord[];
  updatedAt?: string;
};

type MarketAreasResponse = {
  data: MarketAreaRecord[];
  updatedAt?: string;
};

type PriceBookResponse = {
  data: PriceBookVersionRecord | null;
  updatedAt?: string;
};

type PackagesResponse = {
  data: PackageRecord[];
  updatedAt?: string;
};

type ModifierRecord = {
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
};

function statusColor(status: Project['status']): string {
  if (status === 'complete') {
    return '#1a9c5f';
  }

  if (status === 'in-progress') {
    return '#f0b429';
  }

  return '#8892a0';
}

function featureStatusColor(status?: string): string {
  if (status === 'complete') {
    return '#1a9c5f';
  }
  if (status === 'in-progress') {
    return '#f0b429';
  }
  return '#8892a0';
}

function appStatusColor(status: AppService['status']): string {
  if (status === 'online') {
    return '#1a9c5f';
  }

  if (status === 'maintenance') {
    return '#f59e0b';
  }

  if (status === 'planned') {
    return '#94a3b8';
  }

  return '#ef4444';
}

function buildSummary(projects: Project[]): SummaryResponse['data'] {
  var projectCount = projects.length;
  var featureCount = 0;
  var assetCount = 0;
  var statusCounts: { [key: string]: number } = {};

  projects.forEach(function (project) {
    statusCounts[project.status] = (statusCounts[project.status] || 0) + 1;
    project.features.forEach(function (feature) {
      featureCount += 1;
      assetCount += feature.assets.length;
    });
  });

  return {
    projectCount: projectCount,
    featureCount: featureCount,
    assetCount: assetCount,
    statusCounts: statusCounts
  };
}

function buildAssetSummary(assets: AssetLibraryItem[]): AssetSummaryResponse['data'] {
  var statusCounts: { [key: string]: number } = {};
  var typeCounts: { [key: string]: number } = {};

  assets.forEach(function (item) {
    statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
    typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
  });

  return {
    assetCount: assets.length,
    statusCounts: statusCounts,
    typeCounts: typeCounts
  };
}

function buildFeatureSummaryLocal(features: FeaturesResponse['data']): FeatureSummaryResponse['data'] {
  var featureCount = features.length;
  var projectMap: { [key: string]: boolean } = {};
  var assetTotal = 0;

  features.forEach(function (item) {
    projectMap[item.projectId] = true;
    if (item.assets) {
      assetTotal += item.assets.length;
    }
  });

  var projectCoverage = Object.keys(projectMap).length;
  var averageAssetsPerFeature = featureCount === 0 ? 0 : Math.round((assetTotal / featureCount) * 100) / 100;

  return {
    featureCount: featureCount,
    projectCoverage: projectCoverage,
    averageAssetsPerFeature: averageAssetsPerFeature
  };
}

function filterServiceLines(lines: ServiceLineRecord[], businessId: string): ServiceLineRecord[] {
  if (!businessId) {
    return lines;
  }
  return lines.filter(function (line) {
    return line.businessId === businessId;
  });
}

function filterServiceTypes(types: ServiceTypeRecord[], businessId: string, lines: ServiceLineRecord[]): ServiceTypeRecord[] {
  if (!businessId) {
    return types;
  }
  var allowedLines = filterServiceLines(lines, businessId).map(function (line) {
    return line.id;
  });
  return types.filter(function (type) {
    return allowedLines.indexOf(type.serviceLineId) !== -1;
  });
}

function filterMarketAreas(items: MarketAreaRecord[], businessId: string): MarketAreaRecord[] {
  if (!businessId) {
    return items;
  }
  return items.filter(function (area) {
    return area.businessId === businessId;
  });
}

function filterPackages(items: PackageRecord[], businessId: string): PackageRecord[] {
  if (!businessId) {
    return items;
  }
  return items.filter(function (pkg) {
    return pkg.businessId === businessId;
  });
}

var projectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  status: z.enum(['draft', 'in-progress', 'complete'])
});

var featureSchema = z.object({
  projectId: z.string().min(1),
  id: z.string().min(1),
  name: z.string().min(1),
  summary: z.string().min(1),
  dueDate: z.string().optional(),
  status: z.enum(['draft', 'in-progress', 'complete'])
});

var assetSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.string().min(1),
  status: z.enum(['draft', 'active', 'deprecated']),
  link: z.string().optional(),
  tags: z.string().optional()
});

function assetStatusColor(status: AssetLibraryItem['status']): string {
  if (status === 'active') {
    return '#1a9c5f';
  }

  if (status === 'draft') {
    return '#f59e0b';
  }

  return '#ef4444';
}

function Dashboard(): JSX.Element {
  var [projects, setProjects] = React.useState<Project[]>(sampleProjects);
  var [lastUpdated, setLastUpdated] = React.useState<string | null>(null);
  var [status, setStatus] = React.useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  var [error, setError] = React.useState<string | null>(null);
  var [summary, setSummary] = React.useState<SummaryResponse['data']>(buildSummary(sampleProjects));
  var [summaryUpdated, setSummaryUpdated] = React.useState<string | null>(null);
  var [apps, setApps] = React.useState<AppService[]>(sampleApps);
  var [appsUpdated, setAppsUpdated] = React.useState<string | null>(null);
  var [appsStatus, setAppsStatus] = React.useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  var [appsError, setAppsError] = React.useState<string | null>(null);
  var [assets, setAssets] = React.useState<AssetLibraryItem[]>(sampleAssets);
  var [assetsStatus, setAssetsStatus] = React.useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  var [assetsError, setAssetsError] = React.useState<string | null>(null);
  var [assetsSummary, setAssetsSummary] = React.useState<AssetSummaryResponse['data']>(buildAssetSummary(sampleAssets));
  var [assetsUpdated, setAssetsUpdated] = React.useState<string | null>(null);
  var [features, setFeatures] = React.useState<FeaturesResponse['data']>(sampleFeatures);
  var [featuresStatus, setFeaturesStatus] = React.useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  var [featuresError, setFeaturesError] = React.useState<string | null>(null);
  var [featuresSummary, setFeaturesSummary] = React.useState<FeatureSummaryResponse['data']>(buildFeatureSummaryLocal(sampleFeatures));
  var [featuresUpdated, setFeaturesUpdated] = React.useState<string | null>(null);
  var [businesses, setBusinesses] = React.useState<BusinessRecord[]>(sampleBusinesses);
  var [serviceLinesState, setServiceLinesState] = React.useState<ServiceLineRecord[]>(sampleServiceLines);
  var [serviceTypesState, setServiceTypesState] = React.useState<ServiceTypeRecord[]>(sampleServiceTypes);
  var [marketAreasState, setMarketAreasState] = React.useState<MarketAreaRecord[]>(sampleMarketAreas);
  var [priceBook, setPriceBook] = React.useState<PriceBookVersionRecord | null>(
    samplePriceBooks.find(function (item) {
      return item.isCurrent;
    }) || null
  );
var [packagesState, setPackagesState] = React.useState<PackageRecord[]>(samplePackages);
var [selectedBusinessId, setSelectedBusinessId] = React.useState<string>(sampleBusinesses.length ? sampleBusinesses[0].id : '');
var [serviceDataStatus, setServiceDataStatus] = React.useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
var [serviceDataError, setServiceDataError] = React.useState<string | null>(null);
var [serviceDataUpdated, setServiceDataUpdated] = React.useState<string | null>(null);
var [toastMessage, setToastMessage] = React.useState<string | null>(null);
var [toastTone, setToastTone] = React.useState<'info' | 'error'>('info');
var [authBanner, setAuthBanner] = React.useState<boolean>(false);
var [modifiersState, setModifiersState] = React.useState<ModifierRecord[]>(sampleModifiers);
var [modifiersError, setModifiersError] = React.useState<string | null>(null);
var [newModifierId, setNewModifierId] = React.useState<string>('');
var [newModifierBusinessId, setNewModifierBusinessId] = React.useState<string>('');
var [newModifierScope, setNewModifierScope] = React.useState<string>('pricing');
var [newModifierName, setNewModifierName] = React.useState<string>('');
var [newModifierDescription, setNewModifierDescription] = React.useState<string>('');
var [newModifierMultiplier, setNewModifierMultiplier] = React.useState<string>('');
var [newModifierFlatAdjust, setNewModifierFlatAdjust] = React.useState<string>('');
var [newModifierAppliesTo, setNewModifierAppliesTo] = React.useState<string>('');
var [newModifierTags, setNewModifierTags] = React.useState<string>('');
var [createModifierError, setCreateModifierError] = React.useState<string | null>(null);
var [isCreatingModifier, setIsCreatingModifier] = React.useState<boolean>(false);
var [deleteModifierId, setDeleteModifierId] = React.useState<string | null>(null);
var [editingModifierId, setEditingModifierId] = React.useState<string | null>(null);
var [editModifierScope, setEditModifierScope] = React.useState<string>('pricing');
var [editModifierName, setEditModifierName] = React.useState<string>('');
var [editModifierDescription, setEditModifierDescription] = React.useState<string>('');
var [editModifierMultiplier, setEditModifierMultiplier] = React.useState<string>('');
var [editModifierFlatAdjust, setEditModifierFlatAdjust] = React.useState<string>('');
var [editModifierAppliesTo, setEditModifierAppliesTo] = React.useState<string>('');
var [editModifierTags, setEditModifierTags] = React.useState<string>('');
var [editModifierBusinessId, setEditModifierBusinessId] = React.useState<string>('');
var [editModifierError, setEditModifierError] = React.useState<string | null>(null);
var [isUpdatingModifier, setIsUpdatingModifier] = React.useState<boolean>(false);
var [newLineId, setNewLineId] = React.useState<string>('');
  var [newLineName, setNewLineName] = React.useState<string>('');
  var [newLineDescription, setNewLineDescription] = React.useState<string>('');
  var [newLineCategory, setNewLineCategory] = React.useState<string>('');
  var [createLineError, setCreateLineError] = React.useState<string | null>(null);
  var [isCreatingLine, setIsCreatingLine] = React.useState<boolean>(false);
  var [newTypeId, setNewTypeId] = React.useState<string>('');
  var [newTypeLineId, setNewTypeLineId] = React.useState<string>('');
  var [newTypeCode, setNewTypeCode] = React.useState<string>('');
  var [newTypeName, setNewTypeName] = React.useState<string>('');
  var [newTypeDescription, setNewTypeDescription] = React.useState<string>('');
  var [newTypeUnit, setNewTypeUnit] = React.useState<string>('sqm');
  var [newTypeBaseRate, setNewTypeBaseRate] = React.useState<string>('');
  var [newTypeBaseMinutes, setNewTypeBaseMinutes] = React.useState<string>('');
  var [newTypeRiskLevel, setNewTypeRiskLevel] = React.useState<string>('');
  var [newTypePressureMethod, setNewTypePressureMethod] = React.useState<string>('');
  var [createTypeError, setCreateTypeError] = React.useState<string | null>(null);
var [isCreatingType, setIsCreatingType] = React.useState<boolean>(false);
var [deleteLineId, setDeleteLineId] = React.useState<string | null>(null);
var [deleteTypeId, setDeleteTypeId] = React.useState<string | null>(null);
var [deleteAreaId, setDeleteAreaId] = React.useState<string | null>(null);
var [deletePackageId, setDeletePackageId] = React.useState<string | null>(null);
var [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);
var [lastRefreshedAt, setLastRefreshedAt] = React.useState<string | null>(null);
var [apiHealthy, setApiHealthy] = React.useState<'unknown' | 'ok' | 'error'>('unknown');
var [packageItemTypeMap, setPackageItemTypeMap] = React.useState<{ [key: string]: string }>({});
var [packageItemQuantityMap, setPackageItemQuantityMap] = React.useState<{ [key: string]: string }>({});
var [packageItemUnitMap, setPackageItemUnitMap] = React.useState<{ [key: string]: string }>({});
var [addPackageItemError, setAddPackageItemError] = React.useState<string | null>(null);
var [addPackageItemBusyId, setAddPackageItemBusyId] = React.useState<string | null>(null);
var [deletePackageItemBusyId, setDeletePackageItemBusyId] = React.useState<string | null>(null);
  var [dbMode, setDbMode] = React.useState<string | null>(null);
var [projectFilter, setProjectFilter] = React.useState<string>('');
var [projectStatusFilter, setProjectStatusFilter] = React.useState<string>('');
var [appFilter, setAppFilter] = React.useState<string>('');
var [assetFilter, setAssetFilter] = React.useState<string>('');
var [featureFilter, setFeatureFilter] = React.useState<string>('');
var [featureStatusFilter, setFeatureStatusFilter] = React.useState<string>('');
  var [healthDetails, setHealthDetails] = React.useState<string | null>(null);
var [createAssetError, setCreateAssetError] = React.useState<string | null>(null);
var [isCreatingAsset, setIsCreatingAsset] = React.useState<boolean>(false);
var [deleteAssetError, setDeleteAssetError] = React.useState<string | null>(null);
var [deletingAssetId, setDeletingAssetId] = React.useState<string | null>(null);
  var [updateAssetError, setUpdateAssetError] = React.useState<string | null>(null);
  var [isUpdatingAsset, setIsUpdatingAsset] = React.useState<boolean>(false);
var [createProjectError, setCreateProjectError] = React.useState<string | null>(null);
var [isCreatingProject, setIsCreatingProject] = React.useState<boolean>(false);
var [deleteProjectError, setDeleteProjectError] = React.useState<string | null>(null);
var [deletingProjectId, setDeletingProjectId] = React.useState<string | null>(null);
var [editProjectId, setEditProjectId] = React.useState<string>('');
var [updateProjectError, setUpdateProjectError] = React.useState<string | null>(null);
var [isUpdatingProject, setIsUpdatingProject] = React.useState<boolean>(false);
var [createFeatureError, setCreateFeatureError] = React.useState<string | null>(null);
var [isCreatingFeature, setIsCreatingFeature] = React.useState<boolean>(false);
var [deleteFeatureError, setDeleteFeatureError] = React.useState<string | null>(null);
var [deletingFeatureId, setDeletingFeatureId] = React.useState<string | null>(null);
var [updateFeatureError, setUpdateFeatureError] = React.useState<string | null>(null);
var [isUpdatingFeature, setIsUpdatingFeature] = React.useState<boolean>(false);
var queryClientHook = useQueryClient();
  var projectForm = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: { id: '', name: '', description: '', status: 'in-progress' }
  });
  var featureForm = useForm<z.infer<typeof featureSchema>>({
    resolver: zodResolver(featureSchema),
    defaultValues: { projectId: '', id: '', name: '', summary: '', status: 'in-progress', dueDate: '' }
  });
  var assetForm = useForm<z.infer<typeof assetSchema>>({
    resolver: zodResolver(assetSchema),
    defaultValues: { id: '', title: '', description: '', type: 'doc', status: 'draft', link: '', tags: '' }
  });
  var editProjectForm = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: { id: '', name: '', description: '', status: 'in-progress' }
  });
  var editFeatureForm = useForm<z.infer<typeof featureSchema>>({
    resolver: zodResolver(featureSchema),
    defaultValues: { projectId: '', id: '', name: '', summary: '', status: 'in-progress', dueDate: '' }
  });
  var editAssetForm = useForm<z.infer<typeof assetSchema>>({
    resolver: zodResolver(assetSchema),
    defaultValues: { id: '', title: '', description: '', type: 'doc', status: 'draft', link: '', tags: '' }
  });
  var createProjectMutation = useMutation({
    mutationFn: function (body: { id: string; name: string; description: string; status: string }) {
      return fetch(apiBaseUrl + '/projects', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
        body: JSON.stringify(body)
      }).then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            var message = payload && payload.error ? payload.error : 'Unable to create project';
            throw new Error(message);
          });
        }
        return response.json();
      });
    }
  });
  var createFeatureMutation = useMutation({
    mutationFn: function (body: { projectId: string; id: string; name: string; summary: string; status: string }) {
      return fetch(apiBaseUrl + '/projects/' + body.projectId + '/features', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
        body: JSON.stringify({
          id: body.id,
          name: body.name,
          summary: body.summary,
          status: body.status
        })
      }).then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            var message = payload && payload.error ? payload.error : 'Unable to create feature';
            throw new Error(message);
          });
        }
        return response.json();
      });
    }
  });
  var updateFeatureMutation = useMutation({
    mutationFn: function (body: { projectId: string; featureId: string; name?: string; summary?: string; status?: string }) {
      return fetch(apiBaseUrl + '/projects/' + body.projectId + '/features/' + body.featureId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: body.name,
          summary: body.summary,
          status: body.status
        })
      }).then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            var message = payload && payload.error ? payload.error : 'Unable to update feature';
            throw new Error(message);
          });
        }
        return response.json();
      });
    }
  });
  var deleteFeatureMutation = useMutation({
    mutationFn: function (featureId: string) {
      return fetch(apiBaseUrl + '/features/' + featureId, {
        method: 'DELETE',
        headers: authHeaders()
      }).then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            var message = payload && payload.error ? payload.error : 'Unable to delete feature';
            throw new Error(message);
          });
        }
      });
    }
  });
  var createAssetMutation = useMutation({
    mutationFn: function (body: {
      id: string;
      title: string;
      description?: string;
      type: string;
      status: string;
      link?: string;
      tags?: string[];
    }) {
      return fetch(apiBaseUrl + '/assets', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
        body: JSON.stringify(body)
      }).then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            var message = payload && payload.error ? payload.error : 'Unable to create asset';
            throw new Error(message);
          });
        }
        return response.json();
      });
    }
  });
  var updateAssetMutation = useMutation({
    mutationFn: function (body: {
      id: string;
      title?: string;
      description?: string;
      type?: string;
      status?: string;
      link?: string;
      tags?: string[];
    }) {
      return fetch(apiBaseUrl + '/assets/' + body.id, {
        method: 'PUT',
        headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
        body: JSON.stringify({
          title: body.title,
          description: body.description,
          type: body.type,
          status: body.status,
          link: body.link,
          tags: body.tags
        })
      }).then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            var message = payload && payload.error ? payload.error : 'Unable to update asset';
            throw new Error(message);
          });
        }
        return response.json();
      });
    }
  });
  var deleteAssetMutation = useMutation({
    mutationFn: function (assetId: string) {
      return fetch(apiBaseUrl + '/assets/' + assetId, {
        method: 'DELETE',
        headers: authHeaders()
      }).then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            var message = payload && payload.error ? payload.error : 'Unable to delete asset';
            throw new Error(message);
          });
        }
      });
    }
  });
  var updateProjectMutation = useMutation({
    mutationFn: function (body: { id: string; name?: string; description?: string; status?: string }) {
      return fetch(apiBaseUrl + '/projects/' + body.id, {
        method: 'PUT',
        headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
        body: JSON.stringify({
          name: body.name,
          description: body.description,
          status: body.status
        })
      }).then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            var message = payload && payload.error ? payload.error : 'Unable to update project';
            throw new Error(message);
          });
        }
        return response.json();
      });
    }
  });
  var deleteProjectMutation = useMutation({
    mutationFn: function (id: string) {
      return fetch(apiBaseUrl + '/projects/' + id, {
        method: 'DELETE',
        headers: authHeaders()
      }).then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            var message = payload && payload.error ? payload.error : 'Unable to delete project';
            throw new Error(message);
          });
        }
      });
    }
  });
  var createServiceLineMutation = useMutation({
    mutationFn: function (body: { id: string; businessId: string; name: string; description?: string; category?: string }) {
      return fetch(apiBaseUrl + '/service-lines', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
        body: JSON.stringify(body)
      }).then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            var message = payload && payload.error ? payload.error : 'Unable to create service line';
            throw new Error(message);
          });
        }
      });
    }
  });
  var deleteServiceLineMutation = useMutation({
    mutationFn: function (id: string) {
      return fetch(apiBaseUrl + '/service-lines/' + id, { method: 'DELETE' }).then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            var message = payload && payload.error ? payload.error : 'Unable to delete service line';
            throw new Error(message);
          });
        }
      });
    }
  });
  var createServiceTypeMutation = useMutation({
    mutationFn: function (body: {
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
    }) {
      return fetch(apiBaseUrl + '/service-types', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
        body: JSON.stringify(body)
      }).then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            var message = payload && payload.error ? payload.error : 'Unable to create service type';
            throw new Error(message);
          });
        }
      });
    }
  });
  var createModifierMutation = useMutation({
    mutationFn: function (body: {
      id: string;
      businessId?: string;
      scope: string;
      name: string;
      description?: string;
      multiplier?: number;
      flatAdjust?: number;
      appliesTo?: string;
      tags?: string[];
    }) {
      return fetch(apiBaseUrl + '/modifiers', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
        body: JSON.stringify(body)
      }).then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            var message = payload && payload.error ? payload.error : 'Unable to create modifier';
            throw new Error(message);
          });
        }
      });
    }
  });
  var deleteModifierMutation = useMutation({
    mutationFn: function (id: string) {
      return fetch(apiBaseUrl + '/modifiers/' + id, { method: 'DELETE' }).then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            var message = payload && payload.error ? payload.error : 'Unable to delete modifier';
            throw new Error(message);
          });
        }
      });
    }
  });
  var updateModifierMutation = useMutation({
    mutationFn: function (body: {
      id: string;
      businessId?: string;
      scope?: string;
      name?: string;
      description?: string;
      multiplier?: number;
      flatAdjust?: number;
      appliesTo?: string;
      tags?: string[];
      isActive?: boolean;
    }) {
      return fetch(apiBaseUrl + '/modifiers/' + body.id, {
        method: 'PUT',
        headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
        body: JSON.stringify({
          businessId: body.businessId,
          scope: body.scope,
          name: body.name,
          description: body.description,
          multiplier: body.multiplier,
          flatAdjust: body.flatAdjust,
          appliesTo: body.appliesTo,
          tags: body.tags,
          isActive: body.isActive
        })
      }).then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            var message = payload && payload.error ? payload.error : 'Unable to update modifier';
            throw new Error(message);
          });
        }
      });
    }
  });
  var deleteServiceTypeMutation = useMutation({
    mutationFn: function (id: string) {
      return fetch(apiBaseUrl + '/service-types/' + id, { method: 'DELETE' }).then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            var message = payload && payload.error ? payload.error : 'Unable to delete service type';
            throw new Error(message);
          });
        }
      });
    }
  });
  var deleteMarketAreaMutation = useMutation({
    mutationFn: function (id: string) {
      return fetch(apiBaseUrl + '/market-areas/' + id, { method: 'DELETE' }).then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            var message = payload && payload.error ? payload.error : 'Unable to delete market area';
            throw new Error(message);
          });
        }
      });
    }
  });
  var deletePackageMutation = useMutation({
    mutationFn: function (id: string) {
      return fetch(apiBaseUrl + '/packages/' + id, { method: 'DELETE' }).then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            var message = payload && payload.error ? payload.error : 'Unable to delete package';
            throw new Error(message);
          });
        }
      });
    }
  });
  var addPackageItemMutation = useMutation({
    mutationFn: function (body: { packageId: string; serviceTypeId: string; quantity?: number; unitOverride?: string }) {
      return fetch(apiBaseUrl + '/packages/' + body.packageId + '/items', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
        body: JSON.stringify({
          serviceTypeId: body.serviceTypeId,
          quantity: body.quantity,
          unitOverride: body.unitOverride
        })
      }).then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            var message = payload && payload.error ? payload.error : 'Unable to add package item';
            throw new Error(message);
          });
        }
      });
    }
  });
  var deletePackageItemMutation = useMutation({
    mutationFn: function (body: { packageId: string; itemId: string }) {
      return fetch(apiBaseUrl + '/packages/' + body.packageId + '/items/' + body.itemId, { method: 'DELETE' }).then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            var message = payload && payload.error ? payload.error : 'Unable to delete package item';
            throw new Error(message);
          });
        }
      });
    }
  });
  var projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: function () {
      return fetch(apiBaseUrl + '/projects', { headers: authHeaders() }).then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json() as Promise<ProjectsResponse>;
      });
    },
    staleTime: 30000
  });
  var assetsQuery = useQuery({
    queryKey: ['assets'],
    queryFn: function () {
      return fetch(apiBaseUrl + '/assets', { headers: authHeaders() }).then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json() as Promise<AssetsResponse>;
      });
    },
    staleTime: 30000
  });
  var featuresQuery = useQuery({
    queryKey: ['features'],
    queryFn: function () {
      return fetch(apiBaseUrl + '/features', { headers: authHeaders() }).then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json() as Promise<FeaturesResponse>;
      });
    },
    staleTime: 30000
  });

function showToast(message: string, tone?: 'info' | 'error'): void {
  setToastTone(tone || 'info');
  setToastMessage(message);
  setTimeout(function () {
    setToastMessage(null);
  }, 3500);
}

function flagAuthError(): void {
  setAuthBanner(true);
}

function clearAuthError(): void {
  setAuthBanner(false);
}

function businessSummary(businessId: string): {
  lines: number;
  types: number;
  areas: number;
  packages: number;
  modifiers: number;
} {
  return {
    lines: serviceLinesState.filter(function (item) {
      return item.businessId === businessId;
    }).length,
    types: serviceTypesState.filter(function (item) {
      var line = serviceLinesState.find(function (ln) {
        return ln.id === item.serviceLineId;
      });
      return line ? line.businessId === businessId : false;
    }).length,
    areas: marketAreasState.filter(function (item) {
      return item.businessId === businessId;
    }).length,
    packages: packagesState.filter(function (item) {
      return item.businessId === businessId;
    }).length,
    modifiers: modifiersState.filter(function (item) {
      return !item.businessId || item.businessId === businessId;
    }).length
  };
}

  function filterProjects(list: Project[]): Project[] {
    if (!projectFilter) {
      return list;
    }
    var needle = projectFilter.toLowerCase();
    var statusFilter = projectStatusFilter;
    return list.filter(function (project) {
      var matchText =
        project.name.toLowerCase().indexOf(needle) !== -1 ||
        project.description.toLowerCase().indexOf(needle) !== -1 ||
        project.id.toLowerCase().indexOf(needle) !== -1;
      var matchStatus = statusFilter ? project.status === statusFilter : true;
      return matchText && matchStatus;
    });
  }

  function filterApps(list: AppService[]): AppService[] {
    if (!appFilter) {
      return list;
    }
    var needle = appFilter.toLowerCase();
    return list.filter(function (app) {
      return (
        app.name.toLowerCase().indexOf(needle) !== -1 ||
        app.description.toLowerCase().indexOf(needle) !== -1 ||
        app.id.toLowerCase().indexOf(needle) !== -1 ||
        (app.tags && app.tags.join(' ').toLowerCase().indexOf(needle) !== -1)
      );
    });
  }

  function filterAssets(list: AssetLibraryItem[]): AssetLibraryItem[] {
    if (!assetFilter) {
      return list;
    }
    var needle = assetFilter.toLowerCase();
    return list.filter(function (asset) {
      return (
        asset.title.toLowerCase().indexOf(needle) !== -1 ||
        asset.description.toLowerCase().indexOf(needle) !== -1 ||
        asset.type.toLowerCase().indexOf(needle) !== -1 ||
        asset.id.toLowerCase().indexOf(needle) !== -1 ||
        (asset.tags && asset.tags.join(' ').toLowerCase().indexOf(needle) !== -1)
      );
    });
  }

  function filterFeatures(list: FeaturesResponse['data']): FeaturesResponse['data'] {
    if (!featureFilter) {
      return list;
    }
    var needle = featureFilter.toLowerCase();
    var statusFilter = featureStatusFilter;
    return list.filter(function (feature) {
      var matchText =
        feature.name.toLowerCase().indexOf(needle) !== -1 ||
        feature.summary.toLowerCase().indexOf(needle) !== -1 ||
        feature.projectName.toLowerCase().indexOf(needle) !== -1 ||
        feature.id.toLowerCase().indexOf(needle) !== -1;
      var matchStatus = statusFilter ? (feature.status || 'draft') === statusFilter : true;
      return matchText && matchStatus;
    });
  }

  function createProject(): void {
    setCreateProjectError(null);
    setIsCreatingProject(true);
    projectForm.handleSubmit(function (values) {
      createProjectMutation
        .mutateAsync(values)
        .then(function () {
          projectForm.reset({ id: '', name: '', description: '', status: 'in-progress' });
          queryClientHook.invalidateQueries({ queryKey: ['projects'] });
          queryClientHook.invalidateQueries({ queryKey: ['projects', 'summary'] });
          showToast('Project created');
        })
        .catch(function (err) {
          setCreateProjectError(err && err.message ? err.message : 'Unable to create project');
          showToast('Unable to create project', 'error');
        })
        .finally(function () {
          setIsCreatingProject(false);
        });
    })();
  }

  function deleteProject(projectId: string): void {
    setDeleteProjectError(null);
    setDeletingProjectId(projectId);
    deleteProjectMutation
      .mutateAsync(projectId)
      .then(function () {
        queryClientHook.invalidateQueries({ queryKey: ['projects'] });
        queryClientHook.invalidateQueries({ queryKey: ['projects', 'summary'] });
        showToast('Project deleted');
      })
      .catch(function (err) {
        setDeleteProjectError(err && err.message ? err.message : 'Unable to delete project');
        showToast('Unable to delete project', 'error');
      })
      .finally(function () {
        setDeletingProjectId(null);
      });
  }

  function selectProjectForEdit(project: Project): void {
    setEditProjectId(project.id);
    editProjectForm.reset({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status as 'draft' | 'in-progress' | 'complete'
    });
    setUpdateProjectError(null);
  }

  function updateProject(): void {
    setIsUpdatingProject(true);
    setUpdateProjectError(null);
    editProjectForm.handleSubmit(function (values) {
      var idToUse = values.id || editProjectId;
      if (!idToUse) {
        setUpdateProjectError('Select a project to edit');
        setIsUpdatingProject(false);
        return;
      }
      updateProjectMutation
        .mutateAsync({
          id: idToUse,
          name: values.name || undefined,
          description: values.description || undefined,
          status: values.status
        })
        .then(function () {
          queryClientHook.invalidateQueries({ queryKey: ['projects'] });
          queryClientHook.invalidateQueries({ queryKey: ['projects', 'summary'] });
          showToast('Project updated');
        })
        .catch(function (err) {
          setUpdateProjectError(err && err.message ? err.message : 'Unable to update project');
          showToast('Unable to update project', 'error');
        })
        .finally(function () {
          setIsUpdatingProject(false);
        });
    })();
  }

  function createFeature(): void {
    setCreateFeatureError(null);
    setIsCreatingFeature(true);
    featureForm.handleSubmit(function (values) {
      createFeatureMutation
        .mutateAsync(values)
        .then(function () {
          featureForm.reset({ projectId: '', id: '', name: '', summary: '', status: 'in-progress' });
          showToast('Feature created');
          queryClientHook.invalidateQueries({ queryKey: ['features'] });
        })
        .catch(function (err) {
          setCreateFeatureError(err && err.message ? err.message : 'Unable to create feature');
          showToast('Unable to create feature', 'error');
        })
        .finally(function () {
          setIsCreatingFeature(false);
        });
    })();
  }

  function deleteFeature(featureId: string): void {
    setDeleteFeatureError(null);
    setDeletingFeatureId(featureId);
    deleteFeatureMutation
      .mutateAsync(featureId)
      .then(function () {
        showToast('Feature deleted');
        queryClientHook.invalidateQueries({ queryKey: ['features'] });
      })
      .catch(function (err) {
        setDeleteFeatureError(err && err.message ? err.message : 'Unable to delete feature');
        showToast('Unable to delete feature', 'error');
      })
      .finally(function () {
        setDeletingFeatureId(null);
      });
  }

  function createAsset(): void {
    setCreateAssetError(null);
    setIsCreatingAsset(true);

    assetForm.handleSubmit(function (values) {
      var tags = values.tags
        ? values.tags
            .split(',')
            .map(function (tag) {
              return tag.trim();
            })
            .filter(function (tag) {
              return !!tag;
            })
        : [];
      createAssetMutation
        .mutateAsync({
          id: values.id,
          title: values.title,
          description: values.description,
          type: values.type,
          status: values.status,
          link: values.link || undefined,
          tags: tags
        })
        .then(function () {
          assetForm.reset({ id: '', title: '', description: '', type: 'doc', status: 'draft', link: '', tags: '' });
          showToast('Asset created');
          queryClientHook.invalidateQueries({ queryKey: ['assets'] });
        })
        .catch(function (err) {
          setCreateAssetError(err && err.message ? err.message : 'Unable to create asset');
          showToast('Unable to create asset', 'error');
        })
        .finally(function () {
          setIsCreatingAsset(false);
        });
    })();
  }

  function deleteAsset(assetId: string): void {
    setDeleteAssetError(null);
    setDeletingAssetId(assetId);
    deleteAssetMutation
      .mutateAsync(assetId)
      .then(function () {
        showToast('Asset deleted');
        queryClientHook.invalidateQueries({ queryKey: ['assets'] });
      })
      .catch(function (err) {
        setDeleteAssetError(err && err.message ? err.message : 'Unable to delete asset');
        showToast('Unable to delete asset', 'error');
      })
      .finally(function () {
        setDeletingAssetId(null);
      });
  }

  function selectAssetForEdit(asset: AssetLibraryItem): void {
    editAssetForm.reset({
      id: asset.id,
      title: asset.title,
      description: asset.description,
      type: asset.type,
      status: asset.status,
      link: asset.link || '',
      tags: asset.tags ? asset.tags.join(', ') : ''
    });
    setUpdateAssetError(null);
  }

  function updateAsset(): void {
    setIsUpdatingAsset(true);
    setUpdateAssetError(null);
    editAssetForm.handleSubmit(function (values) {
      var tags = values.tags
        ? values.tags
            .split(',')
            .map(function (tag) {
              return tag.trim();
            })
            .filter(function (tag) {
              return !!tag;
            })
        : [];
      updateAssetMutation
        .mutateAsync({
          id: values.id,
          title: values.title || undefined,
          description: values.description || undefined,
          type: values.type || undefined,
          status: values.status || undefined,
          link: values.link || undefined,
          tags: tags
        })
        .then(function () {
          showToast('Asset updated');
          queryClientHook.invalidateQueries({ queryKey: ['assets'] });
        })
        .catch(function (err) {
          setUpdateAssetError(err && err.message ? err.message : 'Unable to update asset');
          showToast('Unable to update asset', 'error');
        })
        .finally(function () {
          setIsUpdatingAsset(false);
        });
    })();
  }

  function selectFeatureForEdit(feature: FeaturesResponse['data'][0]): void {
    editFeatureForm.reset({
      projectId: feature.projectId,
      id: feature.id,
      name: feature.name,
      summary: feature.summary,
      status: feature.status || 'in-progress'
    });
    setUpdateFeatureError(null);
  }

  function updateFeature(): void {
    setIsUpdatingFeature(true);
    setUpdateFeatureError(null);

    editFeatureForm.handleSubmit(function (values) {
      updateFeatureMutation
        .mutateAsync({
          projectId: values.projectId,
          featureId: values.id,
          name: values.name || undefined,
          summary: values.summary || undefined,
          status: values.status || undefined
        })
        .then(function () {
          showToast('Feature updated');
          queryClientHook.invalidateQueries({ queryKey: ['features'] });
        })
        .catch(function (err) {
          setUpdateFeatureError(err && err.message ? err.message : 'Unable to update feature');
          showToast('Unable to update feature', 'error');
        })
        .finally(function () {
          setIsUpdatingFeature(false);
        });
    })();
  }

  var filteredLines = filterServiceLines(serviceLinesState, selectedBusinessId);
  var filteredTypes = filterServiceTypes(serviceTypesState, selectedBusinessId, serviceLinesState);
  var filteredAreas = filterMarketAreas(marketAreasState, selectedBusinessId);
  var filteredPackages = filterPackages(packagesState, selectedBusinessId);
  var filteredModifiers = selectedBusinessId
    ? modifiersState.filter(function (mod) {
        return !mod.businessId || mod.businessId === selectedBusinessId;
      })
    : modifiersState;

  function refetchCatalog(): Promise<void> {
    var targetBusinessId = selectedBusinessId || (sampleBusinesses.length ? sampleBusinesses[0].id : '');
    setServiceDataStatus('loading');
    return Promise.all([
      fetch(apiBaseUrl + '/service-lines?businessId=' + encodeURIComponent(targetBusinessId || '')).then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json() as Promise<ServiceLinesResponse>;
      }),
      fetch(apiBaseUrl + '/service-types?businessId=' + encodeURIComponent(targetBusinessId || '')).then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json() as Promise<ServiceTypesResponse>;
      }),
      fetch(apiBaseUrl + '/market-areas?businessId=' + encodeURIComponent(targetBusinessId || '')).then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json() as Promise<MarketAreasResponse>;
      }),
      fetch(apiBaseUrl + '/pricebook/current?businessId=' + encodeURIComponent(targetBusinessId || '')).then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json() as Promise<PriceBookResponse>;
      }),
      fetch(apiBaseUrl + '/packages?businessId=' + encodeURIComponent(targetBusinessId || '')).then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json() as Promise<PackagesResponse>;
      }),
      fetch(apiBaseUrl + '/modifiers?businessId=' + encodeURIComponent(targetBusinessId || '')).then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json() as Promise<{ data: ModifierRecord[]; updatedAt?: string }>;
      })
    ])
      .then(function (results) {
        var linesRes = results[0] as ServiceLinesResponse;
        var typesRes = results[1] as ServiceTypesResponse;
        var areasRes = results[2] as MarketAreasResponse;
        var priceBookRes = results[3] as PriceBookResponse;
        var packagesRes = results[4] as PackagesResponse;
        var modifiersRes = results[5] as { data: ModifierRecord[]; updatedAt?: string };
        if (linesRes && linesRes.data) {
          setServiceLinesState(linesRes.data);
        }
        if (typesRes && typesRes.data) {
          setServiceTypesState(typesRes.data);
        }
        if (areasRes && areasRes.data) {
          setMarketAreasState(areasRes.data);
        }
        if (priceBookRes && priceBookRes.data) {
          setPriceBook(priceBookRes.data);
        }
        if (packagesRes && packagesRes.data) {
          setPackagesState(packagesRes.data);
        }
        if (modifiersRes && modifiersRes.data) {
          setModifiersState(modifiersRes.data);
          setModifiersError(null);
        }
        var updatedAt = linesRes && linesRes.updatedAt ? linesRes.updatedAt : undefined;
        if (updatedAt) {
          setServiceDataUpdated(updatedAt);
        }
        setServiceDataStatus('ready');
      })
      .catch(function (err) {
        setModifiersError(err && err.message ? err.message : null);
        setServiceDataError(err && err.message ? err.message : 'Unable to load catalog');
        setServiceDataStatus('error');
      });
  }

  React.useEffect(
    function () {
      if (projectsQuery.isSuccess && projectsQuery.data && projectsQuery.data.data) {
        setProjects(projectsQuery.data.data);
        clearAuthError();
        if (projectsQuery.data.updatedAt) {
          setLastUpdated(projectsQuery.data.updatedAt);
        }
        setSummary(buildSummary(projectsQuery.data.data));
        setStatus('ready');
      }
      if (projectsQuery.isError) {
        var msg = (projectsQuery.error as any) && (projectsQuery.error as any).message ? (projectsQuery.error as any).message : 'Unable to load projects';
        setStatus('error');
        setError(msg);
        if (msg.indexOf('401') !== -1 || msg.indexOf('403') !== -1) {
          showToast('Auth required: set VITE_META_API_KEY', 'error');
          flagAuthError();
        }
      }
    },
    [projectsQuery.isSuccess, projectsQuery.isError, projectsQuery.data, projectsQuery.error]
  );

  React.useEffect(
    function () {
      if (assetsQuery.isSuccess && assetsQuery.data && assetsQuery.data.data) {
        setAssets(assetsQuery.data.data);
        clearAuthError();
        if (assetsQuery.data.updatedAt) {
          setAssetsUpdated(assetsQuery.data.updatedAt);
        }
        setAssetsSummary(buildAssetSummary(assetsQuery.data.data));
        setAssetsStatus('ready');
      }
      if (assetsQuery.isError) {
        var msg = (assetsQuery.error as any) && (assetsQuery.error as any).message ? (assetsQuery.error as any).message : 'Unable to load assets';
        setAssetsStatus('error');
        setAssetsError(msg);
        if (msg.indexOf('401') !== -1 || msg.indexOf('403') !== -1) {
          showToast('Auth required: set VITE_META_API_KEY', 'error');
          flagAuthError();
        }
      }
    },
    [assetsQuery.isSuccess, assetsQuery.isError, assetsQuery.data, assetsQuery.error]
  );

  React.useEffect(
    function () {
      if (featuresQuery.isSuccess && featuresQuery.data && featuresQuery.data.data) {
        setFeatures(featuresQuery.data.data);
        clearAuthError();
        if (featuresQuery.data.updatedAt) {
          setFeaturesUpdated(featuresQuery.data.updatedAt);
        }
        setFeaturesSummary(buildFeatureSummaryLocal(featuresQuery.data.data));
        setFeaturesStatus('ready');
      }
      if (featuresQuery.isError) {
        var msg = (featuresQuery.error as any) && (featuresQuery.error as any).message ? (featuresQuery.error as any).message : 'Unable to load features';
        setFeaturesStatus('error');
        setFeaturesError(msg);
        if (msg.indexOf('401') !== -1 || msg.indexOf('403') !== -1) {
          showToast('Auth required: set VITE_META_API_KEY', 'error');
          flagAuthError();
        }
      }
    },
    [featuresQuery.isSuccess, featuresQuery.isError, featuresQuery.data, featuresQuery.error]
  );

  React.useEffect(
    function () {
      if (!newTypeLineId && filteredLines.length > 0) {
        setNewTypeLineId(filteredLines[0].id);
      }
    },
    [filteredLines, newTypeLineId]
  );

  function deleteServiceLine(lineId: string): void {
    if (!lineId) {
      return;
    }
    setDeleteLineId(lineId);
    deleteServiceLineMutation
      .mutateAsync(lineId)
      .then(function () {
        refetchCatalog();
        showToast('Service line deleted');
      })
      .catch(function (err) {
        showToast(err && err.message ? err.message : 'Unable to delete service line', 'error');
      })
      .finally(function () {
        setDeleteLineId(null);
      });
  }

  function deleteServiceType(typeId: string): void {
    if (!typeId) {
      return;
    }
    setDeleteTypeId(typeId);
    deleteServiceTypeMutation
      .mutateAsync(typeId)
      .then(function () {
        refetchCatalog();
        showToast('Service type deleted');
      })
      .catch(function (err) {
        showToast(err && err.message ? err.message : 'Unable to delete service type', 'error');
      })
      .finally(function () {
        setDeleteTypeId(null);
      });
  }

  function deleteMarketArea(areaId: string): void {
    if (!areaId) {
      return;
    }
    setDeleteAreaId(areaId);
    deleteMarketAreaMutation
      .mutateAsync(areaId)
      .then(function () {
        refetchCatalog();
        showToast('Market area deleted');
      })
      .catch(function (err) {
        showToast(err && err.message ? err.message : 'Unable to delete market area', 'error');
      })
      .finally(function () {
        setDeleteAreaId(null);
      });
  }

  function deletePackage(pkgId: string): void {
    if (!pkgId) {
      return;
    }
    setDeletePackageId(pkgId);
    deletePackageMutation
      .mutateAsync(pkgId)
      .then(function () {
        refetchCatalog();
        showToast('Package deleted');
      })
      .catch(function (err) {
        showToast(err && err.message ? err.message : 'Unable to delete package', 'error');
      })
      .finally(function () {
        setDeletePackageId(null);
      });
  }

  function createServiceLine(): void {
    var targetBusiness = selectedBusinessId || (businesses.length ? businesses[0].id : '');
    if (!newLineId || !newLineName || !targetBusiness) {
      setCreateLineError('id, name, and business are required');
      return;
    }
    setIsCreatingLine(true);
    setCreateLineError(null);
    createServiceLineMutation
      .mutateAsync({
        id: newLineId,
        businessId: targetBusiness,
        name: newLineName,
        description: newLineDescription,
        category: newLineCategory
      })
      .then(function () {
        setNewLineId('');
        setNewLineName('');
        setNewLineDescription('');
        setNewLineCategory('');
        refetchCatalog();
        showToast('Service line created');
      })
      .catch(function (err) {
        setCreateLineError(err && err.message ? err.message : 'Unable to create service line');
        showToast('Unable to create service line', 'error');
      })
      .finally(function () {
        setIsCreatingLine(false);
      });
  }

  function createServiceType(): void {
    if (!newTypeId || !newTypeLineId || !newTypeCode || !newTypeName || !newTypeUnit) {
      setCreateTypeError('id, service line, code, name, and unit are required');
      return;
    }
    var baseRate = newTypeBaseRate ? parseFloat(newTypeBaseRate) : null;
    var baseMinutes = newTypeBaseMinutes ? parseFloat(newTypeBaseMinutes) : null;
    setIsCreatingType(true);
    setCreateTypeError(null);
    createServiceTypeMutation
      .mutateAsync({
        id: newTypeId,
        serviceLineId: newTypeLineId,
        code: newTypeCode,
        name: newTypeName,
        description: newTypeDescription || undefined,
        unit: newTypeUnit,
        baseRate: typeof baseRate === 'number' && !isNaN(baseRate) ? baseRate : undefined,
        baseMinutesPerUnit: typeof baseMinutes === 'number' && !isNaN(baseMinutes) ? baseMinutes : undefined,
        riskLevel: newTypeRiskLevel || undefined,
        pressureMethod: newTypePressureMethod || undefined
      })
      .then(function () {
        setNewTypeId('');
        setNewTypeCode('');
        setNewTypeName('');
        setNewTypeDescription('');
        setNewTypeUnit('sqm');
        setNewTypeBaseRate('');
        setNewTypeBaseMinutes('');
        setNewTypeRiskLevel('');
        setNewTypePressureMethod('');
        refetchCatalog();
        showToast('Service type created');
      })
      .catch(function (err) {
        setCreateTypeError(err && err.message ? err.message : 'Unable to create service type');
        showToast('Unable to create service type', 'error');
      })
      .finally(function () {
        setIsCreatingType(false);
      });
  }

  function createModifier(): void {
    if (!newModifierId || !newModifierScope || !newModifierName) {
      setCreateModifierError('id, scope, and name are required');
      return;
    }
    setIsCreatingModifier(true);
    setCreateModifierError(null);
    var tags = newModifierTags
      ? newModifierTags
          .split(',')
          .map(function (tag) {
            return tag.trim();
          })
          .filter(function (tag) {
            return !!tag;
          })
      : [];
    var multiplier = newModifierMultiplier ? parseFloat(newModifierMultiplier) : null;
    var flatAdjust = newModifierFlatAdjust ? parseFloat(newModifierFlatAdjust) : null;
    createModifierMutation
      .mutateAsync({
        id: newModifierId,
        businessId: newModifierBusinessId || undefined,
        scope: newModifierScope,
        name: newModifierName,
        description: newModifierDescription || undefined,
        multiplier: typeof multiplier === 'number' && !isNaN(multiplier) ? multiplier : undefined,
        flatAdjust: typeof flatAdjust === 'number' && !isNaN(flatAdjust) ? flatAdjust : undefined,
        appliesTo: newModifierAppliesTo || undefined,
        tags: tags
      })
      .then(function () {
        setNewModifierId('');
        setNewModifierBusinessId('');
        setNewModifierScope('pricing');
        setNewModifierName('');
        setNewModifierDescription('');
        setNewModifierMultiplier('');
        setNewModifierFlatAdjust('');
        setNewModifierAppliesTo('');
        setNewModifierTags('');
        refetchCatalog();
        showToast('Modifier created');
      })
      .catch(function (err) {
        setCreateModifierError(err && err.message ? err.message : 'Unable to create modifier');
        showToast('Unable to create modifier', 'error');
      })
      .finally(function () {
        setIsCreatingModifier(false);
      });
  }

  function deleteModifier(modId: string): void {
    if (!modId) {
      return;
    }
    setDeleteModifierId(modId);
    deleteModifierMutation
      .mutateAsync(modId)
      .then(function () {
        refetchCatalog();
        showToast('Modifier deleted');
      })
      .catch(function (err) {
        setModifiersError(err && err.message ? err.message : 'Unable to delete modifier');
        showToast('Unable to delete modifier', 'error');
      })
      .finally(function () {
        setDeleteModifierId(null);
      });
  }

  function startEditModifier(mod: ModifierRecord): void {
    setEditingModifierId(mod.id);
    setEditModifierBusinessId(mod.businessId || '');
    setEditModifierScope(mod.scope || 'pricing');
    setEditModifierName(mod.name || '');
    setEditModifierDescription(mod.description || '');
    setEditModifierMultiplier(typeof mod.multiplier === 'number' ? String(mod.multiplier) : '');
    setEditModifierFlatAdjust(typeof mod.flatAdjust === 'number' ? String(mod.flatAdjust) : '');
    setEditModifierAppliesTo(mod.appliesTo || '');
    setEditModifierTags(mod.tags && mod.tags.length ? mod.tags.join(', ') : '');
    setEditModifierError(null);
  }

  function cancelEditModifier(): void {
    setEditingModifierId(null);
    setEditModifierError(null);
  }

  function saveModifier(): void {
    if (!editingModifierId) {
      return;
    }
    setIsUpdatingModifier(true);
    setEditModifierError(null);
    var tags = editModifierTags
      ? editModifierTags
          .split(',')
          .map(function (tag) {
            return tag.trim();
          })
          .filter(function (tag) {
            return !!tag;
          })
      : [];
    var multiplier = editModifierMultiplier ? parseFloat(editModifierMultiplier) : null;
    var flatAdjust = editModifierFlatAdjust ? parseFloat(editModifierFlatAdjust) : null;
    if (editModifierMultiplier && isNaN(multiplier as any)) {
      setEditModifierError('Multiplier must be a number');
      setIsUpdatingModifier(false);
      return;
    }
    if (editModifierFlatAdjust && isNaN(flatAdjust as any)) {
      setEditModifierError('Flat adjust must be a number');
      setIsUpdatingModifier(false);
      return;
    }
    updateModifierMutation
      .mutateAsync({
        id: editingModifierId,
        businessId: editModifierBusinessId || undefined,
        scope: editModifierScope || undefined,
        name: editModifierName || undefined,
        description: editModifierDescription || undefined,
        multiplier: typeof multiplier === 'number' && !isNaN(multiplier) ? multiplier : undefined,
        flatAdjust: typeof flatAdjust === 'number' && !isNaN(flatAdjust) ? flatAdjust : undefined,
        appliesTo: editModifierAppliesTo || undefined,
        tags: tags
      })
      .then(function () {
        setEditingModifierId(null);
        refetchCatalog();
        showToast('Modifier updated');
      })
      .catch(function (err) {
        setEditModifierError(err && err.message ? err.message : 'Unable to update modifier');
        showToast('Unable to update modifier', 'error');
      })
      .finally(function () {
        setIsUpdatingModifier(false);
      });
  }

  function addPackageItem(pkgId: string): void {
    var serviceTypeId = packageItemTypeMap[pkgId];
    if (!serviceTypeId) {
      setAddPackageItemError('Select a service type');
      return;
    }
    var qtyRaw = packageItemQuantityMap[pkgId];
    if (qtyRaw && isNaN(parseFloat(qtyRaw))) {
      setAddPackageItemError('Quantity must be a number');
      return;
    }
    setAddPackageItemBusyId(pkgId);
    setAddPackageItemError(null);
    var qtyRaw = packageItemQuantityMap[pkgId];
    var quantity = qtyRaw ? parseFloat(qtyRaw) : null;
    var unit = packageItemUnitMap[pkgId] || '';
    addPackageItemMutation
      .mutateAsync({
        packageId: pkgId,
        serviceTypeId: serviceTypeId,
        quantity: typeof quantity === 'number' && !isNaN(quantity) ? quantity : undefined,
        unitOverride: unit || undefined
      })
      .then(function () {
        refetchCatalog();
        showToast('Item added');
        setPackageItemQuantityMap(function (prev) {
          var next = Object.assign({}, prev);
          next[pkgId] = '';
          return next;
        });
        setPackageItemUnitMap(function (prev) {
          var next = Object.assign({}, prev);
          next[pkgId] = '';
          return next;
        });
      })
      .catch(function (err) {
        setAddPackageItemError(err && err.message ? err.message : 'Unable to add item');
        showToast('Unable to add item', 'error');
      })
      .finally(function () {
        setAddPackageItemBusyId(null);
      });
  }

  function deletePackageItem(pkgId: string, itemId: string): void {
    if (!pkgId || !itemId) {
      return;
    }
    setDeletePackageItemBusyId(itemId);
    deletePackageItemMutation
      .mutateAsync({ packageId: pkgId, itemId: itemId })
      .then(function () {
        refetchCatalog();
        showToast('Item deleted');
      })
      .catch(function (err) {
        showToast(err && err.message ? err.message : 'Unable to delete item', 'error');
      })
      .finally(function () {
        setDeletePackageItemBusyId(null);
      });
  }

  function refreshAllData(): void {
    setIsRefreshing(true);
    setServiceDataError(null);
    Promise.all([
      projectsQuery.refetch(),
      assetsQuery.refetch(),
      featuresQuery.refetch(),
      refetchCatalog()
    ])
      .then(function () {
        setLastRefreshedAt(new Date().toLocaleTimeString());
        showToast('Data refreshed');
      })
      .catch(function (err) {
        showToast(err && err.message ? err.message : 'Unable to refresh', 'error');
      })
      .finally(function () {
        setIsRefreshing(false);
      });
  }

  React.useEffect(function () {
    var isActive = true;
    setIsRefreshing(true);
    setAppsStatus('loading');
    setServiceDataStatus('loading');
    setServiceDataError(null);

    var tasks: Promise<void>[] = [];
    var targetBusinessId = selectedBusinessId || (sampleBusinesses.length ? sampleBusinesses[0].id : '');

    var healthPromise = fetchHealth()
      .then(function (payload) {
        if (!isActive) {
          return;
        }
        if (payload && payload.status === 'ok') {
          setApiHealthy('ok');
          if (payload.dbMode) {
            setDbMode(payload.dbMode);
          }
          var details = [];
        if (typeof payload.projectsTracked === 'number') {
          details.push('projects ' + payload.projectsTracked);
        }
        if (typeof payload.featuresTracked === 'number') {
          details.push('features ' + payload.featuresTracked);
        }
        if (typeof payload.assetsTracked === 'number') {
          details.push('assets ' + payload.assetsTracked);
        }
        if (typeof payload.appsTracked === 'number') {
          details.push('apps ' + payload.appsTracked);
        }
        if (details.length > 0) {
          setHealthDetails(details.join(' | '));
          } else {
            setHealthDetails(null);
          }
        } else {
          setApiHealthy('error');
          setDbMode(null);
          setHealthDetails(null);
        }
      })
      .catch(function () {
        if (!isActive) {
          return;
        }
        setApiHealthy('error');
        setDbMode(null);
        setHealthDetails(null);
      });
    tasks.push(healthPromise);

    var appsPromise = fetch(apiBaseUrl + '/apps')
      .then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json() as Promise<AppsResponse>;
      })
      .then(function (payload) {
        if (!isActive) {
          return;
        }

        if (payload && payload.data && payload.data.length > 0) {
          setApps(payload.data);
          setAppsStatus('ready');
        }

        if (payload && payload.updatedAt) {
          setAppsUpdated(payload.updatedAt);
        }
      })
      .catch(function (err) {
        if (!isActive) {
          return;
        }
        setAppsStatus('error');
        setAppsError(err && err.message ? err.message : 'Unable to load apps');
        setApps(sampleApps);
      });
    tasks.push(appsPromise);

    var projectsSummaryPromise = fetch(apiBaseUrl + '/projects/summary')
      .then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json() as Promise<SummaryResponse>;
      })
      .then(function (payload) {
        if (!isActive || !payload || !payload.data) {
          return;
        }
        setSummary(payload.data);
        if (payload.updatedAt) {
          setSummaryUpdated(payload.updatedAt);
        }
        clearAuthError();
      })
      .catch(function () {
        if (!isActive) {
          return;
        }
        setSummary(buildSummary(sampleProjects));
      });
    tasks.push(projectsSummaryPromise);

    var businessPromise = fetch(apiBaseUrl + '/businesses')
      .then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json() as Promise<BusinessesResponse>;
      })
      .then(function (payload) {
        if (!isActive) {
          return;
        }
        if (payload && payload.data) {
          setBusinesses(payload.data);
          if (!selectedBusinessId && payload.data.length > 0) {
            setSelectedBusinessId(payload.data[0].id);
            targetBusinessId = payload.data[0].id;
          }
        }
        if (payload && payload.updatedAt) {
          setServiceDataUpdated(payload.updatedAt);
        }
        setServiceDataStatus('ready');
        clearAuthError();
      })
      .catch(function (err) {
        if (!isActive) {
          return;
        }
        setBusinesses(sampleBusinesses);
        setServiceDataError(err && err.message ? err.message : 'Unable to load businesses');
        setServiceDataStatus('error');
      });
    tasks.push(businessPromise);

    var serviceLinesPromise = fetch(apiBaseUrl + '/service-lines?businessId=' + encodeURIComponent(targetBusinessId || ''))
      .then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json() as Promise<ServiceLinesResponse>;
      })
      .then(function (payload) {
        if (!isActive) {
          return;
        }
        if (payload && payload.data) {
          setServiceLinesState(payload.data);
        }
      })
      .catch(function () {
        if (!isActive) {
          return;
        }
        setServiceLinesState(filterServiceLines(sampleServiceLines, targetBusinessId));
      });
    tasks.push(serviceLinesPromise);

    var serviceTypesPromise = fetch(apiBaseUrl + '/service-types?businessId=' + encodeURIComponent(targetBusinessId || ''))
      .then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json() as Promise<ServiceTypesResponse>;
      })
      .then(function (payload) {
        if (!isActive) {
          return;
        }
        if (payload && payload.data) {
          setServiceTypesState(payload.data);
        }
      })
      .catch(function () {
        if (!isActive) {
          return;
        }
        setServiceTypesState(filterServiceTypes(sampleServiceTypes, targetBusinessId, sampleServiceLines));
      });
    tasks.push(serviceTypesPromise);

    var marketAreasPromise = fetch(apiBaseUrl + '/market-areas?businessId=' + encodeURIComponent(targetBusinessId || ''))
      .then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json() as Promise<MarketAreasResponse>;
      })
      .then(function (payload) {
        if (!isActive) {
          return;
        }
        if (payload && payload.data) {
          setMarketAreasState(payload.data);
        }
      })
      .catch(function () {
        if (!isActive) {
          return;
        }
        setMarketAreasState(filterMarketAreas(sampleMarketAreas, targetBusinessId));
      });
    tasks.push(marketAreasPromise);

    var priceBookPromise = fetch(apiBaseUrl + '/pricebook/current?businessId=' + encodeURIComponent(targetBusinessId || ''))
      .then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json() as Promise<PriceBookResponse>;
      })
      .then(function (payload) {
        if (!isActive) {
          return;
        }
        if (payload && payload.data) {
          setPriceBook(payload.data);
        }
      })
      .catch(function () {
        if (!isActive) {
          return;
        }
        var fallback = samplePriceBooks.find(function (pb) {
          return pb.businessId === targetBusinessId && pb.isCurrent;
        });
        setPriceBook(fallback || null);
      });
    tasks.push(priceBookPromise);

    var packagesPromise = fetch(apiBaseUrl + '/packages?businessId=' + encodeURIComponent(targetBusinessId || ''))
      .then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json() as Promise<PackagesResponse>;
      })
      .then(function (payload) {
        if (!isActive) {
          return;
        }
        if (payload && payload.data) {
          setPackagesState(payload.data);
        }
      })
      .catch(function () {
        if (!isActive) {
          return;
        }
        setPackagesState(filterPackages(samplePackages, targetBusinessId));
      });
    tasks.push(packagesPromise);

    var modifiersPromise = fetch(apiBaseUrl + '/modifiers?businessId=' + encodeURIComponent(targetBusinessId || ''))
      .then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json() as Promise<{ data: ModifierRecord[]; updatedAt?: string }>;
      })
      .then(function (payload) {
        if (!isActive) {
          return;
        }
        if (payload && payload.data) {
          setModifiersState(payload.data);
        }
      })
      .catch(function () {
        if (!isActive) {
          return;
        }
        var fallbackModifiers = sampleModifiers.filter(function (item) {
          return item.businessId ? item.businessId === targetBusinessId : true;
        });
        setModifiersState(fallbackModifiers);
      });
    tasks.push(modifiersPromise);

    Promise.all(tasks).finally(function () {
      if (!isActive) {
        return;
      }
      setIsRefreshing(false);
      setLastRefreshedAt(new Date().toLocaleTimeString());
    });

    return function () {
      isActive = false;
    };
  }, [selectedBusinessId]);

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a, #111827)',
        color: '#e5e7eb',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
      }}
    >
      <aside
        style={{
          width: '230px',
          borderRight: '1px solid #1f2937',
          padding: '24px 16px',
          position: 'sticky',
          top: 0,
          alignSelf: 'flex-start',
          height: '100vh',
          background: 'rgba(15,23,42,0.9)'
        }}
      >
        <h2 style={{ margin: '0 0 12px', fontSize: '18px' }}>Navigation</h2>
        <nav style={{ display: 'grid', gap: '8px' }}>
          <a href="#overview" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Overview</a>
          <a href="#projects" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Projects</a>
          <a href="#features" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Features</a>
          <a href="#catalog" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Service Catalog</a>
        </nav>
        <div style={{ marginTop: '20px', fontSize: '12px', color: '#94a3b8' }}>
          <p style={{ margin: 0 }}>API base:</p>
          <p style={{ margin: '4px 0 0' }}>{apiBaseUrl}</p>
          {dbMode ? <p style={{ margin: '4px 0 0' }}>DB mode: {dbMode}</p> : null}
        </div>
      </aside>
      <main
        style={{
          flex: 1,
          padding: '32px'
        }}
      >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <p style={{ color: '#93c5fd', fontSize: '14px', letterSpacing: '0.08em', margin: 0 }}>METABUILD</p>
          <h1 style={{ margin: '4px 0 0', fontSize: '32px' }}>Dashboard</h1>
          <p style={{ margin: '4px 0 0', color: '#cbd5e1' }}>Live view of MetaBuild projects and features</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          {toastMessage ? (
            <div
              style={{
                backgroundColor: toastTone === 'error' ? '#7f1d1d' : '#0f5132',
                color: '#e5e7eb',
                padding: '6px 10px',
                borderRadius: '8px',
                marginBottom: '8px',
                border: '1px solid ' + (toastTone === 'error' ? '#991b1b' : '#0f9f77')
              }}
            >
              {toastMessage}
            </div>
          ) : null}
          {authBanner ? (
            <div
              style={{
                backgroundColor: '#7f1d1d',
                color: '#e5e7eb',
                padding: '6px 10px',
                borderRadius: '8px',
                marginBottom: '8px',
                border: '1px solid #991b1b'
              }}
            >
              API key required. Set <code>VITE_META_API_KEY</code> and rebuild the dashboard.
            </div>
          ) : null}
          <p style={{ margin: 0, color: '#cbd5e1' }}>{status === 'ready' ? 'API connected' : 'Using local sample data'}</p>
          {lastUpdated ? <p style={{ margin: '4px 0 0', color: '#93c5fd' }}>Data as of {lastUpdated}</p> : null}
          {error ? <p style={{ margin: '4px 0 0', color: '#f87171' }}>{error}</p> : null}
          <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '12px' }}>API base: {apiBaseUrl}</p>
          {lastRefreshedAt ? <p style={{ margin: '2px 0 0', color: '#94a3b8', fontSize: '12px' }}>Last refresh: {lastRefreshedAt}</p> : null}
          <p style={{ margin: '2px 0 0', color: apiHealthy === 'ok' ? '#34d399' : apiHealthy === 'error' ? '#f87171' : '#cbd5e1', fontSize: '12px', fontWeight: 700 }}>
            API health: {apiHealthy === 'ok' ? 'OK' : apiHealthy === 'error' ? 'Error' : 'Checking...'}
            {healthDetails ? ' (' + healthDetails + ')' : ''}
          </p>
          {dbMode ? (
            <p style={{ margin: '2px 0 0', color: '#93c5fd', fontSize: '12px', fontWeight: 700 }}>
              DB mode: {dbMode}
            </p>
          ) : null}
            <button
              onClick={function () {
                refreshAllData();
            }}
            disabled={isRefreshing}
            style={{
              marginTop: '6px',
              backgroundColor: isRefreshing ? '#1f2937' : '#2563eb',
              color: '#e5e7eb',
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid #1d4ed8',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              fontWeight: 600
            }}
          >
            {isRefreshing ? 'Refreshing…' : 'Refresh data'}
          </button>
        </div>
      </header>

      <section id="overview" style={{ marginTop: '20px', display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <div style={{ backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '12px', padding: '12px' }}>
          <p style={{ margin: '0 0 6px', color: '#94a3b8', fontSize: '12px', letterSpacing: '0.05em' }}>PROJECTS</p>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>{summary.projectCount}</p>
        </div>
        <div style={{ backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '12px', padding: '12px' }}>
          <p style={{ margin: '0 0 6px', color: '#94a3b8', fontSize: '12px', letterSpacing: '0.05em' }}>FEATURES</p>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>{summary.featureCount}</p>
        </div>
        <div style={{ backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '12px', padding: '12px' }}>
          <p style={{ margin: '0 0 6px', color: '#94a3b8', fontSize: '12px', letterSpacing: '0.05em' }}>ASSETS</p>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>{summary.assetCount}</p>
        </div>
        <div style={{ backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '12px', padding: '12px' }}>
          <p style={{ margin: '0 0 6px', color: '#94a3b8', fontSize: '12px', letterSpacing: '0.05em' }}>STATUS MIX</p>
          <p style={{ margin: 0, fontSize: '14px', color: '#e5e7eb' }}>
            {Object.keys(summary.statusCounts)
              .map(function (key) {
                return key + ': ' + summary.statusCounts[key];
              })
              .join(' • ')}
          </p>
          {summaryUpdated ? <p style={{ margin: '6px 0 0', color: '#93c5fd', fontSize: '12px' }}>as of {summaryUpdated}</p> : null}
        </div>

        <div style={{ marginTop: '12px', backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '12px', padding: '12px' }}>
          <p style={{ margin: '0 0 6px', color: '#93c5fd', fontSize: '12px', letterSpacing: '0.08em' }}>CREATE FEATURE</p>
          <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <input
              {...featureForm.register('projectId')}
              placeholder="Project id"
              style={{
                backgroundColor: '#0b1224',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                padding: '8px',
                color: '#e5e7eb'
              }}
            />
            <input
              {...featureForm.register('id')}
              placeholder="Feature id"
              style={{
                backgroundColor: '#0b1224',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                padding: '8px',
                color: '#e5e7eb'
              }}
            />
            <input
              {...featureForm.register('name')}
              placeholder="Feature name"
              style={{
                backgroundColor: '#0b1224',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                padding: '8px',
                color: '#e5e7eb'
              }}
            />
            <input
              {...featureForm.register('dueDate')}
              placeholder="Due date (optional)"
              style={{
                backgroundColor: '#0b1224',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                padding: '8px',
                color: '#e5e7eb'
              }}
            />
            <select
              {...featureForm.register('status')}
              style={{
                backgroundColor: '#0b1224',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                padding: '8px',
                color: '#e5e7eb'
              }}
            >
              <option value="draft">draft</option>
              <option value="in-progress">in-progress</option>
              <option value="complete">complete</option>
            </select>
          </div>
          <textarea
            {...featureForm.register('summary')}
            placeholder="Feature summary"
            style={{
              marginTop: '8px',
              width: '100%',
              minHeight: '60px',
              backgroundColor: '#0b1224',
              border: '1px solid #1f2937',
              borderRadius: '8px',
              padding: '8px',
              color: '#e5e7eb'
            }}
          />
          {featureForm.formState.errors && featureForm.formState.errors.projectId ? (
            <p style={{ margin: '6px 0 0', color: '#f87171', fontSize: '12px' }}>{featureForm.formState.errors.projectId.message as string}</p>
          ) : null}
          {createFeatureError ? <p style={{ margin: '6px 0 0', color: '#f87171', fontSize: '12px' }}>{createFeatureError}</p> : null}
          {deleteFeatureError ? <p style={{ margin: '6px 0 0', color: '#f87171', fontSize: '12px' }}>{deleteFeatureError}</p> : null}
          <button
            onClick={createFeature}
            disabled={isCreatingFeature}
            style={{
              marginTop: '10px',
              backgroundColor: isCreatingFeature ? '#1f2937' : '#2563eb',
              color: '#e5e7eb',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #1d4ed8',
              cursor: isCreatingFeature ? 'not-allowed' : 'pointer',
              fontWeight: 600
            }}
          >
            {isCreatingFeature ? 'Creating…' : 'Create feature'}
          </button>
        </div>

        <div style={{ marginTop: '12px', backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '12px', padding: '12px' }}>
          <p style={{ margin: '0 0 6px', color: '#93c5fd', fontSize: '12px', letterSpacing: '0.08em' }}>EDIT FEATURE</p>
          <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <input
              {...editFeatureForm.register('id')}
              placeholder="Feature id"
              style={{
                backgroundColor: '#0b1224',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                padding: '8px',
                color: '#e5e7eb'
              }}
            />
            <input
              {...editFeatureForm.register('projectId')}
              placeholder="Project id"
              style={{
                backgroundColor: '#0b1224',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                padding: '8px',
                color: '#e5e7eb'
              }}
            />
            <input
              {...editFeatureForm.register('name')}
              placeholder="Feature name"
              style={{
                backgroundColor: '#0b1224',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                padding: '8px',
                color: '#e5e7eb'
              }}
            />
            <input
              {...editFeatureForm.register('dueDate')}
              placeholder="Due date"
              style={{
                backgroundColor: '#0b1224',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                padding: '8px',
                color: '#e5e7eb'
              }}
            />
            <input
              {...editFeatureForm.register('dueDate')}
              placeholder="Due date"
              style={{
                backgroundColor: '#0b1224',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                padding: '8px',
                color: '#e5e7eb'
              }}
            />
            <select
              {...editFeatureForm.register('status')}
              style={{
                backgroundColor: '#0b1224',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                padding: '8px',
                color: '#e5e7eb'
              }}
            >
              <option value="draft">draft</option>
              <option value="in-progress">in-progress</option>
              <option value="complete">complete</option>
            </select>
          </div>
          <textarea
            {...editFeatureForm.register('summary')}
            placeholder="Feature summary"
            style={{
              marginTop: '8px',
              width: '100%',
              minHeight: '60px',
              backgroundColor: '#0b1224',
              border: '1px solid #1f2937',
              borderRadius: '8px',
              padding: '8px',
              color: '#e5e7eb'
            }}
          />
          {updateFeatureError ? <p style={{ margin: '6px 0 0', color: '#f87171', fontSize: '12px' }}>{updateFeatureError}</p> : null}
          <button
            onClick={updateFeature}
            disabled={isUpdatingFeature}
            style={{
              marginTop: '10px',
              backgroundColor: isUpdatingFeature ? '#1f2937' : '#10b981',
              color: '#0b1224',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #0f9f77',
              cursor: isUpdatingFeature ? 'not-allowed' : 'pointer',
              fontWeight: 700
            }}
          >
            {isUpdatingFeature ? 'Updating…' : 'Update feature'}
          </button>
        </div>
      </section>

      <section id="catalog" style={{ marginTop: '22px', backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '14px', padding: '16px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <p style={{ margin: 0, color: '#93c5fd', fontSize: '12px', letterSpacing: '0.08em' }}>SERVICE CATALOG</p>
            <h2 style={{ margin: '4px 0 0', fontSize: '20px' }}>Businesses, lines, and price books</h2>
            <p style={{ margin: '2px 0 0', color: '#cbd5e1', fontSize: '14px' }}>
              Window cleaning, pressure/softwash, and add-ons per brand.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: '#cbd5e1', fontSize: '13px' }}>Business</label>
            <select
              value={selectedBusinessId}
              onChange={function (event) {
                setSelectedBusinessId(event.target.value);
              }}
              style={{
                backgroundColor: '#0f172a',
                border: '1px solid #1f2937',
                color: '#e5e7eb',
                padding: '8px 10px',
                borderRadius: '8px',
                minWidth: '240px'
              }}
            >
              {businesses.map(function (biz) {
                return (
                  <option key={biz.id} value={biz.id}>
                    {biz.name}
                  </option>
                );
              })}
            </select>
            <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '12px' }}>
              {serviceDataStatus === 'ready' ? 'Catalog loaded' : serviceDataStatus === 'loading' ? 'Loading catalog…' : 'Using fallback data'}
              {serviceDataUpdated ? ' • updated ' + serviceDataUpdated : ''}
            </p>
            {serviceDataError ? <p style={{ margin: '4px 0 0', color: '#f87171', fontSize: '12px' }}>{serviceDataError}</p> : null}
          </div>
        </header>

        <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginTop: '12px' }}>
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1f2937', borderRadius: '10px', padding: '10px' }}>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>Service lines</p>
            <p style={{ margin: '4px 0 0', fontWeight: 700, fontSize: '20px' }}>{filteredLines.length}</p>
          </div>
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1f2937', borderRadius: '10px', padding: '10px' }}>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>Service types</p>
            <p style={{ margin: '4px 0 0', fontWeight: 700, fontSize: '20px' }}>{filteredTypes.length}</p>
          </div>
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1f2937', borderRadius: '10px', padding: '10px' }}>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>Market areas</p>
            <p style={{ margin: '4px 0 0', fontWeight: 700, fontSize: '20px' }}>{filteredAreas.length}</p>
          </div>
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1f2937', borderRadius: '10px', padding: '10px' }}>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>Packages</p>
            <p style={{ margin: '4px 0 0', fontWeight: 700, fontSize: '20px' }}>{filteredPackages.length}</p>
          </div>
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1f2937', borderRadius: '10px', padding: '10px' }}>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>Price book</p>
            <p style={{ margin: '4px 0 0', fontWeight: 700, fontSize: '20px' }}>{priceBook && priceBook.version ? priceBook.version : 'n/a'}</p>
          </div>
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1f2937', borderRadius: '10px', padding: '10px' }}>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>Modifiers</p>
            <p style={{ margin: '4px 0 0', fontWeight: 700, fontSize: '20px' }}>{modifiersState.length}</p>
          </div>
        </div>
        <div style={{ marginTop: '14px', display: 'grid', gap: '10px' }}>
          {businesses.map(function (biz) {
            var summary = businessSummary(biz.id);
            return (
              <details key={'biz-' + biz.id} style={{ backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '12px', padding: '10px' }}>
                <summary style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>{biz.id}</p>
                    <h4 style={{ margin: '2px 0 4px', fontSize: '16px' }}>{biz.name}</h4>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ color: '#cbd5e1', fontSize: '12px' }}>Lines: {summary.lines}</span>
                    <span style={{ color: '#cbd5e1', fontSize: '12px' }}>Types: {summary.types}</span>
                    <span style={{ color: '#cbd5e1', fontSize: '12px' }}>Areas: {summary.areas}</span>
                    <span style={{ color: '#cbd5e1', fontSize: '12px' }}>Packages: {summary.packages}</span>
                    <span style={{ color: '#cbd5e1', fontSize: '12px' }}>Modifiers: {summary.modifiers}</span>
                  </div>
                </summary>
                <div style={{ marginTop: '10px', display: 'grid', gap: '10px' }}>
                  <button
                    onClick={function () {
                      setSelectedBusinessId(biz.id);
                    }}
                    style={{
                      backgroundColor: '#111827',
                      color: '#e5e7eb',
                      border: '1px solid #1f2937',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Focus business
                  </button>
                  <div style={{ backgroundColor: '#0f172a', border: '1px solid #1f2937', borderRadius: '10px', padding: '10px' }}>
                    <p style={{ margin: 0, color: '#93c5fd', fontSize: '12px', letterSpacing: '0.06em' }}>Service lines</p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0', display: 'grid', gap: '6px' }}>
                      {serviceLinesState
                        .filter(function (line) {
                          return line.businessId === biz.id;
                        })
                        .map(function (line) {
                          return (
                            <li key={line.id} style={{ border: '1px solid #1f2937', borderRadius: '8px', padding: '6px', backgroundColor: '#0b1224' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <strong style={{ color: '#e5e7eb' }}>{line.name}</strong>
                                  <p style={{ margin: '2px 0 0', color: '#94a3b8', fontSize: '12px' }}>{line.category || 'line'}</p>
                                </div>
                                <button
                                  onClick={function () {
                                    deleteServiceLine(line.id);
                                  }}
                                  disabled={deleteLineId === line.id}
                                  style={{
                                    backgroundColor: deleteLineId === line.id ? '#1f2937' : '#7f1d1d',
                                    color: '#e5e7eb',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid #991b1b',
                                    cursor: deleteLineId === line.id ? 'not-allowed' : 'pointer',
                                    fontSize: '11px'
                                  }}
                                >
                                  {deleteLineId === line.id ? 'Deleting…' : 'Delete'}
                                </button>
                              </div>
                            </li>
                          );
                        })}
                    </ul>
                  </div>
                  <div style={{ backgroundColor: '#0f172a', border: '1px solid #1f2937', borderRadius: '10px', padding: '10px' }}>
                    <p style={{ margin: 0, color: '#93c5fd', fontSize: '12px', letterSpacing: '0.06em' }}>Service types</p>
                    <div style={{ marginTop: '8px', overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e5e7eb', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #1f2937' }}>
                            <th style={{ padding: '6px' }}>Code</th>
                            <th style={{ padding: '6px' }}>Name</th>
                            <th style={{ padding: '6px' }}>Rate</th>
                            <th style={{ padding: '6px' }}>Risk</th>
                          </tr>
                        </thead>
                        <tbody>
                          {serviceTypesState
                            .filter(function (type) {
                              var ln = serviceLinesState.find(function (l) {
                                return l.id === type.serviceLineId;
                              });
                              return ln ? ln.businessId === biz.id : false;
                            })
                            .slice(0, 5)
                            .map(function (type) {
                              return (
                                <tr key={'type-' + type.id} style={{ borderBottom: '1px solid #1f2937' }}>
                                  <td style={{ padding: '6px' }}>{type.code}</td>
                                  <td style={{ padding: '6px' }}>{type.name}</td>
                                  <td style={{ padding: '6px' }}>{typeof type.baseRate === 'number' ? '$' + type.baseRate.toFixed(2) : '—'}</td>
                                  <td style={{ padding: '6px' }}>{type.riskLevel || 'n/a'}</td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#0f172a', border: '1px solid #1f2937', borderRadius: '10px', padding: '10px' }}>
                    <p style={{ margin: 0, color: '#93c5fd', fontSize: '12px', letterSpacing: '0.06em' }}>Packages</p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0', display: 'grid', gap: '6px' }}>
                      {packagesState
                        .filter(function (pkg) {
                          return pkg.businessId === biz.id;
                        })
                        .slice(0, 4)
                        .map(function (pkg) {
                          return (
                            <li key={pkg.id} style={{ border: '1px solid #1f2937', borderRadius: '8px', padding: '8px', backgroundColor: '#0b1224' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong style={{ color: '#e5e7eb' }}>{pkg.name}</strong>
                                <button
                                  onClick={function () {
                                    deletePackage(pkg.id);
                                  }}
                                  disabled={deletePackageId === pkg.id}
                                  style={{
                                    backgroundColor: deletePackageId === pkg.id ? '#1f2937' : '#7f1d1d',
                                    color: '#e5e7eb',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid #991b1b',
                                    cursor: deletePackageId === pkg.id ? 'not-allowed' : 'pointer',
                                    fontSize: '11px'
                                  }}
                                >
                                  {deletePackageId === pkg.id ? 'Deleting…' : 'Delete'}
                                </button>
                              </div>
                              <p style={{ margin: '4px 0 0', color: '#cbd5e1', fontSize: '12px' }}>{pkg.description || 'Package'}</p>
                            </li>
                          );
                        })}
                    </ul>
                  </div>
                  <div style={{ backgroundColor: '#0f172a', border: '1px solid #1f2937', borderRadius: '10px', padding: '10px' }}>
                    <p style={{ margin: 0, color: '#93c5fd', fontSize: '12px', letterSpacing: '0.06em' }}>Modifiers</p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0', display: 'grid', gap: '6px' }}>
                      {modifiersState
                        .filter(function (mod) {
                          return !mod.businessId || mod.businessId === biz.id;
                        })
                        .slice(0, 4)
                        .map(function (mod) {
                          return (
                            <li key={mod.id} style={{ border: '1px solid #1f2937', borderRadius: '8px', padding: '8px', backgroundColor: '#0b1224' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong style={{ color: '#e5e7eb' }}>{mod.name}</strong>
                                <span style={{ color: '#94a3b8', fontSize: '12px' }}>{mod.scope || 'modifier'}</span>
                              </div>
                              <p style={{ margin: '4px 0 0', color: '#cbd5e1', fontSize: '12px' }}>
                                {typeof mod.multiplier === 'number' ? 'x' + mod.multiplier : ''}
                                {typeof mod.flatAdjust === 'number' ? (typeof mod.multiplier === 'number' ? ' • ' : '') + '$' + mod.flatAdjust : ''}
                              </p>
                            </li>
                          );
                        })}
                    </ul>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
        <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginTop: '12px' }}>
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1f2937', borderRadius: '10px', padding: '12px' }}>
            <p style={{ margin: 0, color: '#93c5fd', fontSize: '12px', letterSpacing: '0.08em' }}>CREATE SERVICE LINE</p>
            <input
              value={newLineId}
              onChange={function (event) {
                setNewLineId(event.target.value);
              }}
              placeholder="Line id"
              style={{ marginTop: '8px', width: '100%', backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '8px', padding: '8px', color: '#e5e7eb' }}
            />
            <input
              value={newLineName}
              onChange={function (event) {
                setNewLineName(event.target.value);
              }}
              placeholder="Name"
              style={{ marginTop: '8px', width: '100%', backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '8px', padding: '8px', color: '#e5e7eb' }}
            />
            <input
              value={newLineCategory}
              onChange={function (event) {
                setNewLineCategory(event.target.value);
              }}
              placeholder="Category (e.g. pressure, window)"
              style={{ marginTop: '8px', width: '100%', backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '8px', padding: '8px', color: '#e5e7eb' }}
            />
            <textarea
              value={newLineDescription}
              onChange={function (event) {
                setNewLineDescription(event.target.value);
              }}
              placeholder="Description"
              style={{ marginTop: '8px', width: '100%', minHeight: '60px', backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '8px', padding: '8px', color: '#e5e7eb' }}
            />
            {createLineError ? <p style={{ margin: '6px 0 0', color: '#f87171', fontSize: '12px' }}>{createLineError}</p> : null}
            <button
              onClick={createServiceLine}
              disabled={isCreatingLine}
              style={{
                marginTop: '10px',
                backgroundColor: isCreatingLine ? '#1f2937' : '#2563eb',
                color: '#e5e7eb',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #1d4ed8',
                cursor: isCreatingLine ? 'not-allowed' : 'pointer',
                fontWeight: 600
              }}
            >
              {isCreatingLine ? 'Creating…' : 'Create line'}
            </button>
          </div>

          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1f2937', borderRadius: '10px', padding: '12px' }}>
            <p style={{ margin: 0, color: '#93c5fd', fontSize: '12px', letterSpacing: '0.08em' }}>CREATE SERVICE TYPE</p>
            <select
              value={newTypeLineId}
              onChange={function (event) {
                setNewTypeLineId(event.target.value);
              }}
              style={{ marginTop: '8px', width: '100%', backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '8px', padding: '8px', color: '#e5e7eb' }}
            >
              <option value="">Select service line</option>
              {filteredLines.map(function (line) {
                return (
                  <option key={line.id} value={line.id}>
                    {line.name}
                  </option>
                );
              })}
            </select>
            <input
              value={newTypeId}
              onChange={function (event) {
                setNewTypeId(event.target.value);
              }}
              placeholder="Type id"
              style={{ marginTop: '8px', width: '100%', backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '8px', padding: '8px', color: '#e5e7eb' }}
            />
            <input
              value={newTypeCode}
              onChange={function (event) {
                setNewTypeCode(event.target.value);
              }}
              placeholder="Code (e.g. DRV-CONC)"
              style={{ marginTop: '8px', width: '100%', backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '8px', padding: '8px', color: '#e5e7eb' }}
            />
            <input
              value={newTypeName}
              onChange={function (event) {
                setNewTypeName(event.target.value);
              }}
              placeholder="Name"
              style={{ marginTop: '8px', width: '100%', backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '8px', padding: '8px', color: '#e5e7eb' }}
            />
            <input
              value={newTypeUnit}
              onChange={function (event) {
                setNewTypeUnit(event.target.value);
              }}
              placeholder="Unit (sqm, linear_m, panel, item)"
              style={{ marginTop: '8px', width: '100%', backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '8px', padding: '8px', color: '#e5e7eb' }}
            />
            <input
              value={newTypeBaseRate}
              onChange={function (event) {
                setNewTypeBaseRate(event.target.value);
              }}
              placeholder="Base rate"
              style={{ marginTop: '8px', width: '100%', backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '8px', padding: '8px', color: '#e5e7eb' }}
            />
            <input
              value={newTypeBaseMinutes}
              onChange={function (event) {
                setNewTypeBaseMinutes(event.target.value);
              }}
              placeholder="Minutes per unit"
              style={{ marginTop: '8px', width: '100%', backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '8px', padding: '8px', color: '#e5e7eb' }}
            />
            <input
              value={newTypeRiskLevel}
              onChange={function (event) {
                setNewTypeRiskLevel(event.target.value);
              }}
              placeholder="Risk level (low/medium/high)"
              style={{ marginTop: '8px', width: '100%', backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '8px', padding: '8px', color: '#e5e7eb' }}
            />
            <input
              value={newTypePressureMethod}
              onChange={function (event) {
                setNewTypePressureMethod(event.target.value);
              }}
              placeholder="Method (pressure/softwash)"
              style={{ marginTop: '8px', width: '100%', backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '8px', padding: '8px', color: '#e5e7eb' }}
            />
            {createTypeError ? <p style={{ margin: '6px 0 0', color: '#f87171', fontSize: '12px' }}>{createTypeError}</p> : null}
            <button
              onClick={createServiceType}
              disabled={isCreatingType}
              style={{
                marginTop: '10px',
                backgroundColor: isCreatingType ? '#1f2937' : '#10b981',
                color: '#0b1224',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #0f9f77',
                cursor: isCreatingType ? 'not-allowed' : 'pointer',
                fontWeight: 700
              }}
            >
              {isCreatingType ? 'Creating…' : 'Create type'}
            </button>
          </div>

          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1f2937', borderRadius: '10px', padding: '12px' }}>
            <p style={{ margin: 0, color: '#93c5fd', fontSize: '12px', letterSpacing: '0.08em' }}>CREATE MODIFIER</p>
            <input
              value={newModifierId}
              onChange={function (event) {
                setNewModifierId(event.target.value);
              }}
              placeholder="Modifier id"
              style={{ marginTop: '8px', width: '100%', backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '8px', padding: '8px', color: '#e5e7eb' }}
            />
            <select
              value={newModifierBusinessId || selectedBusinessId}
              onChange={function (event) {
                setNewModifierBusinessId(event.target.value);
              }}
              style={{ marginTop: '8px', width: '100%', backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '8px', padding: '8px', color: '#e5e7eb' }}
            >
              <option value="">All businesses</option>
              {businesses.map(function (biz) {
                return (
                  <option key={biz.id} value={biz.id}>
                    {biz.name}
                  </option>
                );
              })}
            </select>
            <select
              value={newModifierScope}
              onChange={function (event) {
                setNewModifierScope(event.target.value);
              }}
              style={{ marginTop: '8px', width: '100%', backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '8px', padding: '8px', color: '#e5e7eb' }}
            >
              <option value="pricing">pricing</option>
              <option value="scheduling">scheduling</option>
              <option value="risk">risk</option>
              <option value="other">other</option>
            </select>
            <input
              value={newModifierName}
              onChange={function (event) {
                setNewModifierName(event.target.value);
              }}
              placeholder="Name"
              style={{ marginTop: '8px', width: '100%', backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '8px', padding: '8px', color: '#e5e7eb' }}
            />
            <textarea
              value={newModifierDescription}
              onChange={function (event) {
                setNewModifierDescription(event.target.value);
              }}
              placeholder="Description"
              style={{ marginTop: '8px', width: '100%', minHeight: '60px', backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '8px', padding: '8px', color: '#e5e7eb' }}
            />
            <input
              value={newModifierMultiplier}
              onChange={function (event) {
                setNewModifierMultiplier(event.target.value);
              }}
              placeholder="Multiplier (e.g. 1.15)"
              style={{ marginTop: '8px', width: '100%', backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '8px', padding: '8px', color: '#e5e7eb' }}
            />
            <input
              value={newModifierFlatAdjust}
              onChange={function (event) {
                setNewModifierFlatAdjust(event.target.value);
              }}
              placeholder="Flat adjust (e.g. 25)"
              style={{ marginTop: '8px', width: '100%', backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '8px', padding: '8px', color: '#e5e7eb' }}
            />
            <input
              value={newModifierAppliesTo}
              onChange={function (event) {
                setNewModifierAppliesTo(event.target.value);
              }}
              placeholder="Applies to (serviceTypeId/tag)"
              style={{ marginTop: '8px', width: '100%', backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '8px', padding: '8px', color: '#e5e7eb' }}
            />
            <input
              value={newModifierTags}
              onChange={function (event) {
                setNewModifierTags(event.target.value);
              }}
              placeholder="Tags (comma separated)"
              style={{ marginTop: '8px', width: '100%', backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '8px', padding: '8px', color: '#e5e7eb' }}
            />
            {createModifierError ? <p style={{ margin: '6px 0 0', color: '#f87171', fontSize: '12px' }}>{createModifierError}</p> : null}
            <button
              onClick={createModifier}
              disabled={isCreatingModifier}
              style={{
                marginTop: '10px',
                backgroundColor: isCreatingModifier ? '#1f2937' : '#2563eb',
                color: '#e5e7eb',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #1d4ed8',
                cursor: isCreatingModifier ? 'not-allowed' : 'pointer',
                fontWeight: 600
              }}
            >
              {isCreatingModifier ? 'Creating…' : 'Create modifier'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginTop: '14px' }}>
          {filteredLines.map(function (line) {
            return (
              <div key={line.id} style={{ backgroundColor: '#0f172a', border: '1px solid #1f2937', borderRadius: '10px', padding: '10px' }}>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>{line.category || 'line'}</p>
                <h4 style={{ margin: '4px 0 6px', fontSize: '16px' }}>{line.name}</h4>
                <p style={{ margin: 0, color: '#cbd5e1', fontSize: '13px' }}>{line.description || 'No description'}</p>
                {line.tags && line.tags.length ? (
                  <p style={{ margin: '6px 0 0', color: '#93c5fd', fontSize: '12px' }}>{line.tags.join(', ')}</p>
                ) : null}
                <button
                  onClick={function () {
                    deleteServiceLine(line.id);
                  }}
                  disabled={deleteLineId === line.id}
                  style={{
                    marginTop: '8px',
                    backgroundColor: deleteLineId === line.id ? '#1f2937' : '#7f1d1d',
                    color: '#e5e7eb',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid #991b1b',
                    cursor: deleteLineId === line.id ? 'not-allowed' : 'pointer',
                    fontWeight: 600
                  }}
                >
                  {deleteLineId === line.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: '14px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e5e7eb', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1f2937', textAlign: 'left' }}>
                <th style={{ padding: '8px' }}>Code</th>
                <th style={{ padding: '8px' }}>Name</th>
                <th style={{ padding: '8px' }}>Unit</th>
                <th style={{ padding: '8px' }}>Rate</th>
                <th style={{ padding: '8px' }}>Minutes</th>
                <th style={{ padding: '8px' }}>Risk</th>
                <th style={{ padding: '8px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTypes.map(function (type) {
                return (
                  <tr key={type.id} style={{ borderBottom: '1px solid #1f2937' }}>
                    <td style={{ padding: '8px' }}>{type.code}</td>
                    <td style={{ padding: '8px' }}>{type.name}</td>
                    <td style={{ padding: '8px' }}>{type.unit}</td>
                    <td style={{ padding: '8px' }}>{typeof type.baseRate === 'number' ? '$' + type.baseRate.toFixed(2) : '—'}</td>
                    <td style={{ padding: '8px' }}>
                      {typeof type.baseMinutesPerUnit === 'number' ? type.baseMinutesPerUnit.toFixed(2) + ' min/' + type.unit : '—'}
                    </td>
                    <td style={{ padding: '8px' }}>{type.riskLevel || 'n/a'}</td>
                    <td style={{ padding: '8px' }}>
                      <button
                        onClick={function () {
                          deleteServiceType(type.id);
                        }}
                        disabled={deleteTypeId === type.id}
                        style={{
                          backgroundColor: deleteTypeId === type.id ? '#1f2937' : '#7f1d1d',
                          color: '#e5e7eb',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: '1px solid #991b1b',
                          cursor: deleteTypeId === type.id ? 'not-allowed' : 'pointer',
                          fontWeight: 600
                        }}
                      >
                        {deleteTypeId === type.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginTop: '14px' }}>
          {filteredAreas.map(function (area) {
            return (
              <div key={area.id} style={{ backgroundColor: '#0f172a', border: '1px solid #1f2937', borderRadius: '10px', padding: '10px' }}>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>Market area</p>
                <h4 style={{ margin: '4px 0 4px', fontSize: '16px' }}>{area.name}</h4>
                <p style={{ margin: 0, color: '#cbd5e1', fontSize: '13px' }}>
                  Min job ${area.minJobValue || 0} • Travel ${area.travelFee || 0}
                </p>
                {area.postalCodes && area.postalCodes.length ? (
                  <p style={{ margin: '6px 0 0', color: '#93c5fd', fontSize: '12px' }}>Postcodes: {area.postalCodes.join(', ')}</p>
                ) : null}
                {area.notes ? <p style={{ margin: '6px 0 0', color: '#cbd5e1', fontSize: '12px' }}>{area.notes}</p> : null}
                <button
                  onClick={function () {
                    deleteMarketArea(area.id);
                  }}
                  disabled={deleteAreaId === area.id}
                  style={{
                    marginTop: '8px',
                    backgroundColor: deleteAreaId === area.id ? '#1f2937' : '#7f1d1d',
                    color: '#e5e7eb',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid #991b1b',
                    cursor: deleteAreaId === area.id ? 'not-allowed' : 'pointer',
                    fontWeight: 600
                  }}
                >
                  {deleteAreaId === area.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            );
          })}
        </div>

        {priceBook && priceBook.rates && priceBook.rates.length ? (
          <div style={{ marginTop: '14px', backgroundColor: '#0f172a', border: '1px solid #1f2937', borderRadius: '10px', padding: '10px' }}>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>Price book rates</p>
            <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginTop: '8px' }}>
              {priceBook.rates.map(function (rate) {
                return (
                  <div key={rate.id} style={{ border: '1px solid #1f2937', borderRadius: '8px', padding: '8px', backgroundColor: '#0b1224' }}>
                    <p style={{ margin: 0, color: '#cbd5e1' }}>{rate.serviceTypeId}</p>
                    <p style={{ margin: '4px 0 0', color: '#93c5fd', fontSize: '12px' }}>
                      {typeof rate.rate === 'number' ? '$' + rate.rate.toFixed(2) : 'n/a'} •{' '}
                      {typeof rate.minutesPerUnit === 'number' ? rate.minutesPerUnit.toFixed(2) + ' min' : 'n/a'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {filteredPackages.length ? (
          <div style={{ marginTop: '14px', backgroundColor: '#0f172a', border: '1px solid #1f2937', borderRadius: '10px', padding: '10px' }}>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>Packages</p>
            <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginTop: '8px' }}>
              {filteredPackages.map(function (pkg) {
                var pkgTypes = serviceTypesState.filter(function (type) {
                  var line = serviceLinesState.find(function (ln) {
                    return ln.id === type.serviceLineId;
                  });
                  return line ? line.businessId === pkg.businessId : false;
                });
                return (
                  <div key={pkg.id} style={{ border: '1px solid #1f2937', borderRadius: '10px', padding: '10px', backgroundColor: '#0b1224' }}>
                    <h4 style={{ margin: '0 0 6px', fontSize: '16px' }}>{pkg.name}</h4>
                    <p style={{ margin: 0, color: '#cbd5e1', fontSize: '13px' }}>{pkg.description || 'Package'}</p>
                    <p style={{ margin: '6px 0 0', color: '#93c5fd', fontSize: '12px' }}>
                      Discount {typeof pkg.discountPct === 'number' ? Math.round(pkg.discountPct * 100) + '%' : '0%'}
                    </p>
                {pkg.items && pkg.items.length ? (
                  <ul style={{ margin: '6px 0 0', paddingLeft: '16px', color: '#cbd5e1', fontSize: '12px' }}>
                    {pkg.items.map(function (item, idx) {
                      return (
                        <li key={pkg.id + '-itm-' + idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                          <span>
                            {item.serviceTypeId} {typeof item.quantity === 'number' ? 'x' + item.quantity : ''}{' '}
                            {item.unitOverride || ''}
                          </span>
                          <button
                            onClick={function () {
                              deletePackageItem(pkg.id, item.id || pkg.id + '-item-' + idx);
                            }}
                            disabled={deletePackageItemBusyId === (item.id || pkg.id + '-item-' + idx)}
                            style={{
                              backgroundColor: deletePackageItemBusyId === (item.id || pkg.id + '-item-' + idx) ? '#1f2937' : '#7f1d1d',
                              color: '#e5e7eb',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              border: '1px solid #991b1b',
                              cursor: deletePackageItemBusyId === (item.id || pkg.id + '-item-' + idx) ? 'not-allowed' : 'pointer',
                              fontSize: '11px'
                            }}
                          >
                            {deletePackageItemBusyId === (item.id || pkg.id + '-item-' + idx) ? '...' : 'Remove'}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
                <div style={{ marginTop: '8px', display: 'grid', gap: '6px', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                  <select
                    value={packageItemTypeMap[pkg.id] || ''}
                    onChange={function (event) {
                      setPackageItemTypeMap(function (prev) {
                        var next = Object.assign({}, prev);
                        next[pkg.id] = event.target.value;
                        return next;
                      });
                    }}
                    style={{ backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '8px', padding: '6px', color: '#e5e7eb' }}
                  >
                    <option value="">Select service type</option>
                    {pkgTypes.map(function (type) {
                      return (
                        <option key={pkg.id + '-' + type.id} value={type.id}>
                          {type.code} - {type.name}
                        </option>
                      );
                    })}
                  </select>
                  <input
                    value={packageItemQuantityMap[pkg.id] || ''}
                    onChange={function (event) {
                      setPackageItemQuantityMap(function (prev) {
                        var next = Object.assign({}, prev);
                        next[pkg.id] = event.target.value;
                        return next;
                      });
                    }}
                    placeholder="Quantity"
                    style={{ backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '8px', padding: '6px', color: '#e5e7eb' }}
                  />
                  <input
                    value={packageItemUnitMap[pkg.id] || ''}
                    onChange={function (event) {
                      setPackageItemUnitMap(function (prev) {
                        var next = Object.assign({}, prev);
                        next[pkg.id] = event.target.value;
                        return next;
                      });
                    }}
                    placeholder="Unit override"
                    style={{ backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '8px', padding: '6px', color: '#e5e7eb' }}
                  />
                </div>
                {addPackageItemError ? <p style={{ margin: '4px 0 0', color: '#f87171', fontSize: '12px' }}>{addPackageItemError}</p> : null}
                <button
                  onClick={function () {
                    addPackageItem(pkg.id);
                  }}
                  disabled={addPackageItemBusyId === pkg.id}
                  style={{
                    marginTop: '8px',
                    backgroundColor: addPackageItemBusyId === pkg.id ? '#1f2937' : '#2563eb',
                    color: '#e5e7eb',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid #1d4ed8',
                    cursor: addPackageItemBusyId === pkg.id ? 'not-allowed' : 'pointer',
                    fontWeight: 600
                  }}
                >
                  {addPackageItemBusyId === pkg.id ? 'Adding…' : 'Add item'}
                </button>
                {addPackageItemError ? <p style={{ margin: '4px 0 0', color: '#f87171', fontSize: '12px' }}>{addPackageItemError}</p> : null}
                <button
                  onClick={function () {
                    deletePackage(pkg.id);
                  }}
                  disabled={deletePackageId === pkg.id}
                  style={{
                    marginTop: '8px',
                    backgroundColor: deletePackageId === pkg.id ? '#1f2937' : '#7f1d1d',
                    color: '#e5e7eb',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid #991b1b',
                    cursor: deletePackageId === pkg.id ? 'not-allowed' : 'pointer',
                    fontWeight: 600
                  }}
                >
                  {deletePackageId === pkg.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            );
              })}
            </div>
          </div>
        ) : null}

        {filteredModifiers.length ? (
          <div style={{ marginTop: '14px', backgroundColor: '#0f172a', border: '1px solid #1f2937', borderRadius: '10px', padding: '10px' }}>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>Modifiers</p>
            {modifiersError ? <p style={{ margin: '6px 0 0', color: '#f87171', fontSize: '12px' }}>{modifiersError}</p> : null}
            <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginTop: '8px' }}>
              {filteredModifiers.map(function (mod) {
                return (
                  <div key={mod.id} style={{ border: '1px solid #1f2937', borderRadius: '10px', padding: '10px', backgroundColor: '#0b1224' }}>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>{mod.scope || 'modifier'}</p>
                    <h4 style={{ margin: '4px 0 4px', fontSize: '16px' }}>{mod.name}</h4>
                    <p style={{ margin: 0, color: '#cbd5e1', fontSize: '13px' }}>{mod.description || 'No description'}</p>
                    <p style={{ margin: '6px 0 0', color: '#93c5fd', fontSize: '12px' }}>
                      {typeof mod.multiplier === 'number' ? 'x' + mod.multiplier : ''}
                      {typeof mod.flatAdjust === 'number' ? (typeof mod.multiplier === 'number' ? ' • ' : '') + '$' + mod.flatAdjust : ''}
                      {mod.appliesTo ? ' • ' + mod.appliesTo : ''}
                    </p>
                    {mod.tags && mod.tags.length ? (
                      <p style={{ margin: '4px 0 0', color: '#cbd5e1', fontSize: '12px' }}>{mod.tags.join(', ')}</p>
                    ) : null}
                    {editingModifierId === mod.id ? (
                      <div style={{ marginTop: '8px', display: 'grid', gap: '6px' }}>
                        <select
                          value={editModifierBusinessId}
                          onChange={function (event) {
                            setEditModifierBusinessId(event.target.value);
                          }}
                          style={{ backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '8px', padding: '6px', color: '#e5e7eb' }}
                        >
                          <option value="">All businesses</option>
                          {businesses.map(function (biz) {
                            return (
                              <option key={'edit-mod-biz-' + biz.id} value={biz.id}>
                                {biz.name}
                              </option>
                            );
                          })}
                        </select>
                        <select
                          value={editModifierScope}
                          onChange={function (event) {
                            setEditModifierScope(event.target.value);
                          }}
                          style={{ backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '8px', padding: '6px', color: '#e5e7eb' }}
                        >
                          <option value="pricing">pricing</option>
                          <option value="scheduling">scheduling</option>
                          <option value="risk">risk</option>
                          <option value="other">other</option>
                        </select>
                        <input
                          value={editModifierName}
                          onChange={function (event) {
                            setEditModifierName(event.target.value);
                          }}
                          placeholder="Name"
                          style={{ backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '8px', padding: '6px', color: '#e5e7eb' }}
                        />
                        <textarea
                          value={editModifierDescription}
                          onChange={function (event) {
                            setEditModifierDescription(event.target.value);
                          }}
                          placeholder="Description"
                          style={{ backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '8px', padding: '6px', color: '#e5e7eb', minHeight: '50px' }}
                        />
                        <input
                          value={editModifierMultiplier}
                          onChange={function (event) {
                            setEditModifierMultiplier(event.target.value);
                          }}
                          placeholder="Multiplier (e.g. 1.1)"
                          style={{ backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '8px', padding: '6px', color: '#e5e7eb' }}
                        />
                        <input
                          value={editModifierFlatAdjust}
                          onChange={function (event) {
                            setEditModifierFlatAdjust(event.target.value);
                          }}
                          placeholder="Flat adjust"
                          style={{ backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '8px', padding: '6px', color: '#e5e7eb' }}
                        />
                        <input
                          value={editModifierAppliesTo}
                          onChange={function (event) {
                            setEditModifierAppliesTo(event.target.value);
                          }}
                          placeholder="Applies to"
                          style={{ backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '8px', padding: '6px', color: '#e5e7eb' }}
                        />
                        <input
                          value={editModifierTags}
                          onChange={function (event) {
                            setEditModifierTags(event.target.value);
                          }}
                          placeholder="Tags"
                          style={{ backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '8px', padding: '6px', color: '#e5e7eb' }}
                        />
                        {editModifierError ? <p style={{ margin: 0, color: '#f87171', fontSize: '12px' }}>{editModifierError}</p> : null}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            onClick={saveModifier}
                            disabled={isUpdatingModifier}
                            style={{
                              backgroundColor: isUpdatingModifier ? '#1f2937' : '#10b981',
                              color: '#0b1224',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              border: '1px solid #0f9f77',
                              cursor: isUpdatingModifier ? 'not-allowed' : 'pointer',
                              fontWeight: 700
                            }}
                          >
                            {isUpdatingModifier ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            onClick={cancelEditModifier}
                            style={{
                              backgroundColor: '#1f2937',
                              color: '#e5e7eb',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              border: '1px solid #374151',
                              cursor: 'pointer',
                              fontWeight: 600
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={function () {
                          startEditModifier(mod);
                        }}
                        style={{
                          marginTop: '8px',
                          backgroundColor: '#111827',
                          color: '#e5e7eb',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: '1px solid #1f2937',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={function () {
                        deleteModifier(mod.id);
                      }}
                      disabled={deleteModifierId === mod.id}
                      style={{
                        marginTop: '8px',
                        backgroundColor: deleteModifierId === mod.id ? '#1f2937' : '#7f1d1d',
                        color: '#e5e7eb',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1px solid #991b1b',
                        cursor: deleteModifierId === mod.id ? 'not-allowed' : 'pointer',
                        fontWeight: 600
                      }}
                    >
                      {deleteModifierId === mod.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>

      <section id="features" style={{ marginTop: '22px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <p style={{ margin: 0, color: '#93c5fd', fontSize: '12px', letterSpacing: '0.08em' }}>PROJECTS</p>
            <h2 style={{ margin: '4px 0 0', fontSize: '20px' }}>All tracked projects</h2>
            <p style={{ margin: '2px 0 0', color: '#cbd5e1', fontSize: '14px' }}>Status, feature footprint, and asset coverage.</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, color: '#cbd5e1', fontSize: '13px' }}>
              {status === 'ready' ? 'Projects loaded from API' : 'Using bundled sample projects'}
            </p>
            {lastUpdated ? <p style={{ margin: '4px 0 0', color: '#93c5fd', fontSize: '12px' }}>as of {lastUpdated}</p> : null}
            {error ? <p style={{ margin: '4px 0 0', color: '#f87171', fontSize: '12px' }}>{error}</p> : null}
            <input
              value={projectFilter}
              onChange={function (event) {
                setProjectFilter(event.target.value);
              }}
              placeholder="Filter projects"
              style={{
                marginTop: '8px',
                backgroundColor: '#0b1224',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                padding: '8px',
                color: '#e5e7eb',
                width: '220px'
              }}
            />
            <select
              value={projectStatusFilter}
              onChange={function (event) {
                setProjectStatusFilter(event.target.value);
              }}
              style={{
                marginTop: '8px',
                backgroundColor: '#0b1224',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                padding: '8px',
                color: '#e5e7eb'
              }}
            >
              <option value="">All statuses</option>
              <option value="draft">draft</option>
              <option value="in-progress">in-progress</option>
              <option value="complete">complete</option>
            </select>
          </div>
        </header>

        <div style={{ marginTop: '10px', backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '12px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e5e7eb', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1f2937', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>ID</th>
                <th style={{ padding: '10px' }}>Name</th>
                <th style={{ padding: '10px' }}>Status</th>
                <th style={{ padding: '10px' }}>Features</th>
                <th style={{ padding: '10px' }}>Assets</th>
                <th style={{ padding: '10px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filterProjects(projects).map(function (project) {
                var featureCount = project.features ? project.features.length : 0;
                var assetCount = 0;
                if (project.features) {
                  for (var i = 0; i < project.features.length; i++) {
                    var feature = project.features[i];
                    if (feature.assets) {
                      assetCount += feature.assets.length;
                    }
                  }
                }
                return (
                  <tr key={project.id} style={{ borderBottom: '1px solid #1f2937' }}>
                    <td style={{ padding: '10px', color: '#94a3b8' }}>{project.id}</td>
                    <td style={{ padding: '10px' }}>{project.name}</td>
                    <td style={{ padding: '10px' }}>
                      <span
                        style={{
                          backgroundColor: statusColor(project.status),
                          color: '#0b1224',
                          borderRadius: '999px',
                          padding: '4px 10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          fontSize: '11px'
                        }}
                      >
                        {project.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>{featureCount}</td>
                    <td style={{ padding: '10px' }}>{assetCount}</td>
                    <td style={{ padding: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={function () {
                          selectProjectForEdit(project);
                        }}
                        style={{
                          backgroundColor: '#111827',
                          color: '#e5e7eb',
                          border: '1px solid #1f2937',
                          borderRadius: '8px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={function () {
                          deleteProject(project.id);
                        }}
                        disabled={deletingProjectId === project.id}
                        style={{
                          backgroundColor: deletingProjectId === project.id ? '#1f2937' : '#ef4444',
                          color: '#e5e7eb',
                          border: '1px solid #b91c1c',
                          borderRadius: '8px',
                          padding: '4px 8px',
                          cursor: deletingProjectId === project.id ? 'not-allowed' : 'pointer',
                          fontWeight: 600
                        }}
                      >
                        {deletingProjectId === project.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '12px', backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '12px', padding: '12px' }}>
          <p style={{ margin: '0 0 6px', color: '#93c5fd', fontSize: '12px', letterSpacing: '0.08em' }}>CREATE PROJECT</p>
          <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <input
              {...projectForm.register('id')}
              placeholder="Project id"
              style={{
                backgroundColor: '#0b1224',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                padding: '8px',
                color: '#e5e7eb'
              }}
            />
            <input
              {...projectForm.register('name')}
              placeholder="Project name"
              style={{
                backgroundColor: '#0b1224',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                padding: '8px',
                color: '#e5e7eb'
              }}
            />
            <select
              {...projectForm.register('status')}
              style={{
                backgroundColor: '#0b1224',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                padding: '8px',
                color: '#e5e7eb'
              }}
            >
              <option value="draft">draft</option>
              <option value="in-progress">in-progress</option>
              <option value="complete">complete</option>
            </select>
          </div>
          <textarea
            {...projectForm.register('description')}
            placeholder="Project description"
            style={{
              marginTop: '8px',
              width: '100%',
              minHeight: '60px',
              backgroundColor: '#0b1224',
              border: '1px solid #1f2937',
              borderRadius: '8px',
              padding: '8px',
              color: '#e5e7eb'
            }}
          />
          {projectForm.formState.errors && projectForm.formState.errors.id ? (
            <p style={{ margin: '6px 0 0', color: '#f87171', fontSize: '12px' }}>{projectForm.formState.errors.id.message as string}</p>
          ) : null}
          {createProjectError ? <p style={{ margin: '6px 0 0', color: '#f87171', fontSize: '12px' }}>{createProjectError}</p> : null}
          {deleteProjectError ? <p style={{ margin: '6px 0 0', color: '#f87171', fontSize: '12px' }}>{deleteProjectError}</p> : null}
          <button
            onClick={createProject}
            disabled={isCreatingProject}
            style={{
              marginTop: '10px',
              backgroundColor: isCreatingProject ? '#1f2937' : '#2563eb',
              color: '#e5e7eb',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #1d4ed8',
              cursor: isCreatingProject ? 'not-allowed' : 'pointer',
              fontWeight: 600
            }}
          >
            {isCreatingProject ? 'Creating…' : 'Create project'}
          </button>
        </div>

        <div style={{ marginTop: '12px', backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '12px', padding: '12px' }}>
          <p style={{ margin: '0 0 6px', color: '#93c5fd', fontSize: '12px', letterSpacing: '0.08em' }}>EDIT PROJECT</p>
          <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <input
              {...editProjectForm.register('id')}
              placeholder="Project id to edit"
              style={{
                backgroundColor: '#0b1224',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                padding: '8px',
                color: '#e5e7eb'
              }}
            />
            <input
              {...editProjectForm.register('name')}
              placeholder="Project name"
              style={{
                backgroundColor: '#0b1224',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                padding: '8px',
                color: '#e5e7eb'
              }}
            />
            <select
              {...editProjectForm.register('status')}
              style={{
                backgroundColor: '#0b1224',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                padding: '8px',
                color: '#e5e7eb'
              }}
            >
              <option value="draft">draft</option>
              <option value="in-progress">in-progress</option>
              <option value="complete">complete</option>
            </select>
          </div>
          <textarea
            {...editProjectForm.register('description')}
            placeholder="Project description"
            style={{
              marginTop: '8px',
              width: '100%',
              minHeight: '60px',
              backgroundColor: '#0b1224',
              border: '1px solid #1f2937',
              borderRadius: '8px',
              padding: '8px',
              color: '#e5e7eb'
            }}
          />
          {editProjectForm.formState.errors && editProjectForm.formState.errors.id ? (
            <p style={{ margin: '6px 0 0', color: '#f87171', fontSize: '12px' }}>{editProjectForm.formState.errors.id.message as string}</p>
          ) : null}
          {updateProjectError ? <p style={{ margin: '6px 0 0', color: '#f87171', fontSize: '12px' }}>{updateProjectError}</p> : null}
          <button
            onClick={updateProject}
            disabled={isUpdatingProject}
            style={{
              marginTop: '10px',
              backgroundColor: isUpdatingProject ? '#1f2937' : '#10b981',
              color: '#0b1224',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #0f9f77',
              cursor: isUpdatingProject ? 'not-allowed' : 'pointer',
              fontWeight: 700
            }}
          >
            {isUpdatingProject ? 'Updating…' : 'Update project'}
          </button>
        </div>
      </section>

      <section id="roadmap" style={{ marginTop: '22px', backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '14px', padding: '16px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <p style={{ margin: 0, color: '#93c5fd', fontSize: '12px', letterSpacing: '0.08em' }}>ROADMAP</p>
            <h2 style={{ margin: '4px 0 0', fontSize: '20px' }}>Timeline</h2>
            <p style={{ margin: '2px 0 0', color: '#cbd5e1', fontSize: '14px' }}>Group features by status and due date (if provided).</p>
          </div>
        </header>
        <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {['draft', 'in-progress', 'complete'].map(function (statusKey) {
            var feats = features.filter(function (f) {
              return (f.status || 'draft') === statusKey;
            });
            return (
              <div key={'road-' + statusKey} style={{ backgroundColor: '#0f172a', border: '1px solid #1f2937', borderRadius: '10px', padding: '10px' }}>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>{statusKey.toUpperCase()}</p>
                <p style={{ margin: '4px 0 8px', fontWeight: 700 }}>{feats.length} items</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '6px' }}>
                  {feats.slice(0, 5).map(function (feat) {
                    return (
                      <li key={'road-feat-' + feat.id} style={{ border: '1px solid #1f2937', borderRadius: '8px', padding: '8px', backgroundColor: '#0b1224' }}>
                        <strong style={{ color: '#e5e7eb' }}>{feat.name}</strong>
                        <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '12px' }}>{feat.projectName}</p>
                        {feat.summary ? (
                          <p style={{ margin: '2px 0 0', color: '#cbd5e1', fontSize: '12px' }}>
                            {feat.summary.length > 80 ? feat.summary.slice(0, 80) + '…' : feat.summary}
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section id="projects" style={{ marginTop: '22px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <p style={{ margin: 0, color: '#93c5fd', fontSize: '12px', letterSpacing: '0.08em' }}>FEATURES</p>
            <h2 style={{ margin: '4px 0 0', fontSize: '20px' }}>Work in flight</h2>
            <p style={{ margin: '2px 0 0', color: '#cbd5e1', fontSize: '14px' }}>Cross-project features with their asset footprint.</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, color: '#cbd5e1', fontSize: '13px' }}>
              {featuresStatus === 'ready'
                ? 'Features loaded from API'
                : featuresStatus === 'error'
                ? 'Features unavailable (using local)'
                : 'Loading features'}
            </p>
            {featuresUpdated ? <p style={{ margin: '4px 0 0', color: '#93c5fd', fontSize: '12px' }}>as of {featuresUpdated}</p> : null}
            {featuresError ? <p style={{ margin: '4px 0 0', color: '#f87171', fontSize: '12px' }}>{featuresError}</p> : null}
            <input
              value={featureFilter}
              onChange={function (event) {
                setFeatureFilter(event.target.value);
              }}
              placeholder="Filter features"
              style={{
                marginTop: '8px',
                backgroundColor: '#0b1224',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                padding: '8px',
                color: '#e5e7eb',
                width: '220px'
              }}
            />
            <select
              value={featureStatusFilter}
              onChange={function (event) {
                setFeatureStatusFilter(event.target.value);
              }}
              style={{
                marginTop: '8px',
                backgroundColor: '#0b1224',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                padding: '8px',
                color: '#e5e7eb'
              }}
            >
              <option value="">All statuses</option>
              <option value="draft">draft</option>
              <option value="in-progress">in-progress</option>
              <option value="complete">complete</option>
            </select>
          </div>
        </header>

        <div style={{ marginBottom: '12px', display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          <div style={{ backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '12px', padding: '12px' }}>
            <p style={{ margin: '0 0 6px', color: '#94a3b8', fontSize: '12px', letterSpacing: '0.05em' }}>FEATURES</p>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>{featuresSummary.featureCount}</p>
          </div>
          <div style={{ backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '12px', padding: '12px' }}>
            <p style={{ margin: '0 0 6px', color: '#94a3b8', fontSize: '12px', letterSpacing: '0.05em' }}>PROJECT COVERAGE</p>
            <p style={{ margin: 0, fontSize: '18px', color: '#e5e7eb' }}>{featuresSummary.projectCoverage} projects</p>
          </div>
          <div style={{ backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '12px', padding: '12px' }}>
            <p style={{ margin: '0 0 6px', color: '#94a3b8', fontSize: '12px', letterSpacing: '0.05em' }}>AVG ASSETS / FEATURE</p>
            <p style={{ margin: 0, fontSize: '18px', color: '#e5e7eb' }}>{featuresSummary.averageAssetsPerFeature}</p>
          </div>
        </div>

        <div style={{ marginTop: '10px', backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '12px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e5e7eb', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1f2937', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>ID</th>
                <th style={{ padding: '10px' }}>Name</th>
                <th style={{ padding: '10px' }}>Project</th>
                <th style={{ padding: '10px' }}>Status</th>
                <th style={{ padding: '10px' }}>Assets</th>
                <th style={{ padding: '10px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filterFeatures(features).map(function (feature) {
                return (
                  <tr key={feature.id} style={{ borderBottom: '1px solid #1f2937' }}>
                    <td style={{ padding: '10px', color: '#94a3b8' }}>{feature.id}</td>
                    <td style={{ padding: '10px' }}>{feature.name}</td>
                    <td style={{ padding: '10px' }}>{feature.projectName}</td>
                    <td style={{ padding: '10px' }}>
                      <span
                        style={{
                          backgroundColor: featureStatusColor(feature.status),
                          color: '#0b1224',
                          borderRadius: '999px',
                          padding: '4px 10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          fontSize: '11px'
                        }}
                      >
                        {feature.status || 'draft'}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>{feature.assets ? feature.assets.length : 0}</td>
                    <td style={{ padding: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={function () {
                          selectFeatureForEdit(feature);
                        }}
                        style={{
                          backgroundColor: '#111827',
                          color: '#e5e7eb',
                          border: '1px solid #1f2937',
                          borderRadius: '8px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={function () {
                          deleteFeature(feature.id);
                        }}
                        disabled={deletingFeatureId === feature.id}
                        style={{
                          backgroundColor: deletingFeatureId === feature.id ? '#1f2937' : '#ef4444',
                          color: '#e5e7eb',
                          border: '1px solid #b91c1c',
                          borderRadius: '8px',
                          padding: '4px 8px',
                          cursor: deletingFeatureId === feature.id ? 'not-allowed' : 'pointer',
                          fontWeight: 600
                        }}
                      >
                        {deletingFeatureId === feature.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginTop: '22px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <p style={{ margin: 0, color: '#93c5fd', fontSize: '12px', letterSpacing: '0.08em' }}>APPS</p>
            <h2 style={{ margin: '4px 0 0', fontSize: '20px' }}>Primary surfaces</h2>
            <p style={{ margin: '2px 0 0', color: '#cbd5e1', fontSize: '14px' }}>Open the PWA and MetaBuild components from one place.</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, color: '#cbd5e1', fontSize: '13px' }}>
              {appsStatus === 'ready' ? 'Apps loaded from API' : 'Using bundled sample list'}
            </p>
            {appsUpdated ? <p style={{ margin: '4px 0 0', color: '#93c5fd', fontSize: '12px' }}>as of {appsUpdated}</p> : null}
            {appsError ? <p style={{ margin: '4px 0 0', color: '#f87171', fontSize: '12px' }}>{appsError}</p> : null}
            <input
              value={appFilter}
              onChange={function (event) {
                setAppFilter(event.target.value);
              }}
              placeholder="Filter apps"
              style={{
                marginTop: '8px',
                backgroundColor: '#0b1224',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                padding: '8px',
                color: '#e5e7eb',
                width: '220px'
              }}
            />
          </div>
        </header>

        <div style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {filterApps(apps).map(function (app) {
            return (
              <article
                key={app.id}
                style={{
                  backgroundColor: '#0b1224',
                  border: '1px solid #1f2937',
                  borderRadius: '12px',
                  padding: '14px',
                  boxShadow: '0 6px 30px rgba(0,0,0,0.2)'
                }}
              >
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>{app.id}</p>
                    <h3 style={{ margin: '4px 0 6px', fontSize: '18px' }}>{app.name}</h3>
                  </div>
                  <span
                    style={{
                      backgroundColor: appStatusColor(app.status),
                      color: '#0b1224',
                      borderRadius: '999px',
                      padding: '6px 12px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      fontSize: '11px'
                    }}
                  >
                    {app.status}
                  </span>
                </header>
                <p style={{ margin: '6px 0 10px', color: '#cbd5e1' }}>{app.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ margin: 0, color: '#93c5fd', fontSize: '12px', letterSpacing: '0.05em' }}>{app.kind.toUpperCase()}</p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {app.tags &&
                      app.tags.map(function (tag) {
                        return (
                          <span
                            key={tag}
                            style={{
                              backgroundColor: '#111827',
                              color: '#cbd5e1',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              fontSize: '12px',
                              border: '1px solid #1f2937'
                            }}
                          >
                            {tag}
                          </span>
                        );
                      })}
                  </div>
                </div>
                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                  <a
                    href={app.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      backgroundColor: '#2563eb',
                      color: '#e5e7eb',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontWeight: 600,
                      border: '1px solid #1d4ed8'
                    }}
                  >
                    Open
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section style={{ marginTop: '22px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <p style={{ margin: 0, color: '#93c5fd', fontSize: '12px', letterSpacing: '0.08em' }}>ASSETS</p>
            <h2 style={{ margin: '4px 0 0', fontSize: '20px' }}>Reusable library</h2>
            <p style={{ margin: '2px 0 0', color: '#cbd5e1', fontSize: '14px' }}>Prompts, checklists, and links that power the ecosystem.</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, color: '#cbd5e1', fontSize: '13px' }}>
              {assetsStatus === 'ready' ? 'Assets loaded from API' : 'Using bundled sample assets'}
            </p>
            {assetsUpdated ? <p style={{ margin: '4px 0 0', color: '#93c5fd', fontSize: '12px' }}>as of {assetsUpdated}</p> : null}
            {assetsError ? <p style={{ margin: '4px 0 0', color: '#f87171', fontSize: '12px' }}>{assetsError}</p> : null}
            {deleteAssetError ? <p style={{ margin: '4px 0 0', color: '#f87171', fontSize: '12px' }}>{deleteAssetError}</p> : null}
            <input
              value={assetFilter}
              onChange={function (event) {
                setAssetFilter(event.target.value);
              }}
              placeholder="Filter assets"
              style={{
                marginTop: '8px',
                backgroundColor: '#0b1224',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                padding: '8px',
                color: '#e5e7eb',
                width: '220px'
              }}
            />
          </div>
        </header>

        <div style={{ marginBottom: '12px', display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          <div style={{ backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '12px', padding: '12px' }}>
            <p style={{ margin: '0 0 6px', color: '#94a3b8', fontSize: '12px', letterSpacing: '0.05em' }}>ASSETS</p>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>{assetsSummary.assetCount}</p>
          </div>
          <div style={{ backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '12px', padding: '12px' }}>
            <p style={{ margin: '0 0 6px', color: '#94a3b8', fontSize: '12px', letterSpacing: '0.05em' }}>BY STATUS</p>
            <p style={{ margin: 0, fontSize: '14px', color: '#e5e7eb' }}>
              {Object.keys(assetsSummary.statusCounts)
                .map(function (key) {
                  return key + ': ' + assetsSummary.statusCounts[key];
                })
                .join(' • ')}
            </p>
          </div>
          <div style={{ backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '12px', padding: '12px' }}>
            <p style={{ margin: '0 0 6px', color: '#94a3b8', fontSize: '12px', letterSpacing: '0.05em' }}>BY TYPE</p>
            <p style={{ margin: 0, fontSize: '14px', color: '#e5e7eb' }}>
              {Object.keys(assetsSummary.typeCounts)
                .map(function (key) {
                  return key + ': ' + assetsSummary.typeCounts[key];
                })
                .join(' • ')}
            </p>
          </div>
        </div>

        <div style={{ marginTop: '12px', backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '12px', padding: '12px' }}>
          <p style={{ margin: '0 0 6px', color: '#93c5fd', fontSize: '12px', letterSpacing: '0.08em' }}>CREATE ASSET</p>
          <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <input
              {...assetForm.register('id')}
              placeholder="Asset id"
              style={{
                backgroundColor: '#0b1224',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                padding: '8px',
                color: '#e5e7eb'
              }}
            />
            <input
              {...assetForm.register('title')}
              placeholder="Asset title"
              style={{
                backgroundColor: '#0b1224',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                padding: '8px',
                color: '#e5e7eb'
              }}
            />
            <select
              {...assetForm.register('type')}
              style={{
                backgroundColor: '#0b1224',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                padding: '8px',
                color: '#e5e7eb'
              }}
            >
              <option value="snippet">snippet</option>
              <option value="component">component</option>
              <option value="template">template</option>
              <option value="static">static</option>
              <option value="doc">doc</option>
              <option value="prompt">prompt</option>
            </select>
            <select
              {...assetForm.register('status')}
              style={{
                backgroundColor: '#0b1224',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                padding: '8px',
                color: '#e5e7eb'
              }}
            >
              <option value="draft">draft</option>
              <option value="active">active</option>
              <option value="deprecated">deprecated</option>
            </select>
          </div>
          <textarea
            {...assetForm.register('description')}
            placeholder="Asset description"
            style={{
              marginTop: '8px',
              width: '100%',
              minHeight: '60px',
              backgroundColor: '#0b1224',
              border: '1px solid #1f2937',
              borderRadius: '8px',
              padding: '8px',
              color: '#e5e7eb'
            }}
          />
          <input
            {...assetForm.register('link')}
            placeholder="Asset link (optional)"
            style={{
              marginTop: '8px',
              backgroundColor: '#0b1224',
              border: '1px solid #1f2937',
              borderRadius: '8px',
              padding: '8px',
              color: '#e5e7eb',
              width: '100%'
            }}
          />
          <input
            {...assetForm.register('tags')}
            placeholder="Tags (comma separated)"
            style={{
              marginTop: '8px',
              backgroundColor: '#0b1224',
              border: '1px solid #1f2937',
              borderRadius: '8px',
              padding: '8px',
              color: '#e5e7eb',
              width: '100%'
            }}
          />
          {createAssetError ? <p style={{ margin: '6px 0 0', color: '#f87171', fontSize: '12px' }}>{createAssetError}</p> : null}
          <button
            onClick={createAsset}
            disabled={isCreatingAsset}
            style={{
              marginTop: '10px',
              backgroundColor: isCreatingAsset ? '#1f2937' : '#2563eb',
              color: '#e5e7eb',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #1d4ed8',
              cursor: isCreatingAsset ? 'not-allowed' : 'pointer',
              fontWeight: 600
            }}
          >
            {isCreatingAsset ? 'Creating…' : 'Create asset'}
          </button>
        </div>

        <div style={{ marginTop: '12px', backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '12px', padding: '12px' }}>
          <p style={{ margin: '0 0 6px', color: '#93c5fd', fontSize: '12px', letterSpacing: '0.08em' }}>EDIT ASSET</p>
          <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <input
              {...editAssetForm.register('id')}
              placeholder="Asset id"
              style={{
                backgroundColor: '#0b1224',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                padding: '8px',
                color: '#e5e7eb'
              }}
            />
            <input
              {...editAssetForm.register('title')}
              placeholder="Asset title"
              style={{
                backgroundColor: '#0b1224',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                padding: '8px',
                color: '#e5e7eb'
              }}
            />
            <select
              {...editAssetForm.register('type')}
              style={{
                backgroundColor: '#0b1224',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                padding: '8px',
                color: '#e5e7eb'
              }}
            >
              <option value="snippet">snippet</option>
              <option value="component">component</option>
              <option value="template">template</option>
              <option value="static">static</option>
              <option value="doc">doc</option>
              <option value="prompt">prompt</option>
            </select>
            <select
              {...editAssetForm.register('status')}
              style={{
                backgroundColor: '#0b1224',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                padding: '8px',
                color: '#e5e7eb'
              }}
            >
              <option value="draft">draft</option>
              <option value="active">active</option>
              <option value="deprecated">deprecated</option>
            </select>
          </div>
          <textarea
            {...editAssetForm.register('description')}
            placeholder="Asset description"
            style={{
              marginTop: '8px',
              width: '100%',
              minHeight: '60px',
              backgroundColor: '#0b1224',
              border: '1px solid #1f2937',
              borderRadius: '8px',
              padding: '8px',
              color: '#e5e7eb'
            }}
          />
          <input
            {...editAssetForm.register('link')}
            placeholder="Asset link (optional)"
            style={{
              marginTop: '8px',
              backgroundColor: '#0b1224',
              border: '1px solid #1f2937',
              borderRadius: '8px',
              padding: '8px',
              color: '#e5e7eb',
              width: '100%'
            }}
          />
          <input
            {...editAssetForm.register('tags')}
            placeholder="Tags (comma separated)"
            style={{
              marginTop: '8px',
              backgroundColor: '#0b1224',
              border: '1px solid #1f2937',
              borderRadius: '8px',
              padding: '8px',
              color: '#e5e7eb',
              width: '100%'
            }}
          />
          {updateAssetError ? <p style={{ margin: '6px 0 0', color: '#f87171', fontSize: '12px' }}>{updateAssetError}</p> : null}
          <button
            onClick={updateAsset}
            disabled={isUpdatingAsset}
            style={{
              marginTop: '10px',
              backgroundColor: isUpdatingAsset ? '#1f2937' : '#10b981',
              color: '#0b1224',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #0f9f77',
              cursor: isUpdatingAsset ? 'not-allowed' : 'pointer',
              fontWeight: 700
            }}
          >
            {isUpdatingAsset ? 'Updating…' : 'Update asset'}
          </button>
        </div>


        <div style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {filterAssets(assets).map(function (asset) {
            var currentVersion = asset.versions && asset.versions.find(function (v) {
              return v.isCurrent;
            });
            return (
              <article
                key={asset.id}
                style={{
                  backgroundColor: '#0b1224',
                  border: '1px solid #1f2937',
                  borderRadius: '12px',
                  padding: '14px',
                  boxShadow: '0 6px 30px rgba(0,0,0,0.2)'
                }}
              >
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>{asset.id}</p>
                    <h3 style={{ margin: '4px 0 6px', fontSize: '18px' }}>{asset.title}</h3>
                  </div>
                  <span
                    style={{
                      backgroundColor: assetStatusColor(asset.status),
                      color: '#0b1224',
                      borderRadius: '999px',
                      padding: '6px 12px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      fontSize: '11px'
                    }}
                  >
                    {asset.status}
                  </span>
                </header>
                <p style={{ margin: '6px 0 10px', color: '#cbd5e1' }}>{asset.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ margin: 0, color: '#93c5fd', fontSize: '12px', letterSpacing: '0.05em' }}>{asset.type.toUpperCase()}</p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {asset.tags &&
                      asset.tags.map(function (tag) {
                        return (
                          <span
                            key={tag}
                            style={{
                              backgroundColor: '#111827',
                              color: '#cbd5e1',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              fontSize: '12px',
                              border: '1px solid #1f2937'
                            }}
                          >
                            {tag}
                          </span>
                        );
                      })}
                  </div>
                </div>
                {currentVersion ? (
                  <p style={{ margin: '8px 0 0', color: '#cbd5e1', fontSize: '12px' }}>
                    Current version: {currentVersion.version}
                    {currentVersion.changelog ? ' — ' + currentVersion.changelog : ''}
                  </p>
                ) : null}
                <div style={{ marginTop: '12px', display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  {asset.link ? (
                    <a
                      href={asset.link}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        backgroundColor: '#2563eb',
                        color: '#e5e7eb',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: 600,
                        border: '1px solid #1d4ed8'
                      }}
                    >
                      Open
                    </a>
                  ) : null}
                  <button
                    onClick={function () {
                      selectAssetForEdit(asset);
                    }}
                    style={{
                      backgroundColor: '#111827',
                      color: '#e5e7eb',
                      border: '1px solid #1f2937',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={function () {
                      deleteAsset(asset.id);
                    }}
                    disabled={deletingAssetId === asset.id}
                    style={{
                      backgroundColor: deletingAssetId === asset.id ? '#1f2937' : '#ef4444',
                      color: '#e5e7eb',
                      border: '1px solid #b91c1c',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      cursor: deletingAssetId === asset.id ? 'not-allowed' : 'pointer',
                      fontWeight: 600
                    }}
                  >
                    {deletingAssetId === asset.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

    </main>
  </div>
);
}

var rootElement = document.getElementById('root');

if (rootElement) {
  var root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    </React.StrictMode>
  );
}
