import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppService, AssetLibraryItem, Project } from '../../domain/types';
import { sampleProjects, sampleApps, sampleAssets, sampleFeatures } from '../../domain/sampleData';
import { apiBaseUrl, fetchHealth } from './config';

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
  var [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);
  var [reloadToken, setReloadToken] = React.useState<number>(0);
  var [lastRefreshedAt, setLastRefreshedAt] = React.useState<string | null>(null);
  var [apiHealthy, setApiHealthy] = React.useState<'unknown' | 'ok' | 'error'>('unknown');
  var [projectFilter, setProjectFilter] = React.useState<string>('');
  var [appFilter, setAppFilter] = React.useState<string>('');
  var [assetFilter, setAssetFilter] = React.useState<string>('');
  var [featureFilter, setFeatureFilter] = React.useState<string>('');
  var [healthDetails, setHealthDetails] = React.useState<string | null>(null);
  var [newAssetId, setNewAssetId] = React.useState<string>('');
  var [newAssetTitle, setNewAssetTitle] = React.useState<string>('');
  var [newAssetDescription, setNewAssetDescription] = React.useState<string>('');
  var [newAssetType, setNewAssetType] = React.useState<string>('doc');
  var [newAssetStatus, setNewAssetStatus] = React.useState<string>('draft');
  var [newAssetLink, setNewAssetLink] = React.useState<string>('');
  var [newAssetTags, setNewAssetTags] = React.useState<string>('');
  var [createAssetError, setCreateAssetError] = React.useState<string | null>(null);
  var [isCreatingAsset, setIsCreatingAsset] = React.useState<boolean>(false);
  var [deleteAssetError, setDeleteAssetError] = React.useState<string | null>(null);
  var [deletingAssetId, setDeletingAssetId] = React.useState<string | null>(null);
  var [editAssetId, setEditAssetId] = React.useState<string>('');
  var [editAssetTitle, setEditAssetTitle] = React.useState<string>('');
  var [editAssetDescription, setEditAssetDescription] = React.useState<string>('');
  var [editAssetType, setEditAssetType] = React.useState<string>('doc');
  var [editAssetStatus, setEditAssetStatus] = React.useState<string>('draft');
  var [editAssetLink, setEditAssetLink] = React.useState<string>('');
  var [editAssetTags, setEditAssetTags] = React.useState<string>('');
  var [updateAssetError, setUpdateAssetError] = React.useState<string | null>(null);
  var [isUpdatingAsset, setIsUpdatingAsset] = React.useState<boolean>(false);
  var [newProjectId, setNewProjectId] = React.useState<string>('');
  var [newProjectName, setNewProjectName] = React.useState<string>('');
  var [newProjectDescription, setNewProjectDescription] = React.useState<string>('');
  var [newProjectStatus, setNewProjectStatus] = React.useState<'draft' | 'in-progress' | 'complete'>('in-progress');
  var [createProjectError, setCreateProjectError] = React.useState<string | null>(null);
  var [isCreatingProject, setIsCreatingProject] = React.useState<boolean>(false);
  var [deleteProjectError, setDeleteProjectError] = React.useState<string | null>(null);
  var [deletingProjectId, setDeletingProjectId] = React.useState<string | null>(null);
  var [editProjectId, setEditProjectId] = React.useState<string>('');
  var [editProjectName, setEditProjectName] = React.useState<string>('');
  var [editProjectDescription, setEditProjectDescription] = React.useState<string>('');
  var [editProjectStatus, setEditProjectStatus] = React.useState<'draft' | 'in-progress' | 'complete'>('in-progress');
  var [updateProjectError, setUpdateProjectError] = React.useState<string | null>(null);
  var [isUpdatingProject, setIsUpdatingProject] = React.useState<boolean>(false);
  var [featureProjectId, setFeatureProjectId] = React.useState<string>('');
  var [newFeatureId, setNewFeatureId] = React.useState<string>('');
  var [newFeatureName, setNewFeatureName] = React.useState<string>('');
  var [newFeatureSummary, setNewFeatureSummary] = React.useState<string>('');
  var [newFeatureStatus, setNewFeatureStatus] = React.useState<string>('in-progress');
  var [createFeatureError, setCreateFeatureError] = React.useState<string | null>(null);
  var [isCreatingFeature, setIsCreatingFeature] = React.useState<boolean>(false);
  var [deleteFeatureError, setDeleteFeatureError] = React.useState<string | null>(null);
  var [deletingFeatureId, setDeletingFeatureId] = React.useState<string | null>(null);
  var [editFeatureId, setEditFeatureId] = React.useState<string>('');
  var [editFeatureProjectId, setEditFeatureProjectId] = React.useState<string>('');
  var [editFeatureName, setEditFeatureName] = React.useState<string>('');
  var [editFeatureSummary, setEditFeatureSummary] = React.useState<string>('');
  var [editFeatureStatus, setEditFeatureStatus] = React.useState<string>('in-progress');
  var [updateFeatureError, setUpdateFeatureError] = React.useState<string | null>(null);
  var [isUpdatingFeature, setIsUpdatingFeature] = React.useState<boolean>(false);

  function filterProjects(list: Project[]): Project[] {
    if (!projectFilter) {
      return list;
    }
    var needle = projectFilter.toLowerCase();
    return list.filter(function (project) {
      return (
        project.name.toLowerCase().indexOf(needle) !== -1 ||
        project.description.toLowerCase().indexOf(needle) !== -1 ||
        project.id.toLowerCase().indexOf(needle) !== -1
      );
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
    return list.filter(function (feature) {
      return (
        feature.name.toLowerCase().indexOf(needle) !== -1 ||
        feature.summary.toLowerCase().indexOf(needle) !== -1 ||
        feature.projectName.toLowerCase().indexOf(needle) !== -1 ||
        feature.id.toLowerCase().indexOf(needle) !== -1
      );
    });
  }

  function createProject(): void {
    if (!newProjectId || !newProjectName || !newProjectDescription) {
      setCreateProjectError('id, name, and description are required');
      return;
    }

    setCreateProjectError(null);
    setIsCreatingProject(true);

    fetch(apiBaseUrl + '/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: newProjectId,
        name: newProjectName,
        description: newProjectDescription,
        status: newProjectStatus
      })
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            var message = payload && payload.error ? payload.error : 'Unable to create project';
            throw new Error(message);
          });
        }
        return response.json();
      })
      .then(function () {
        setNewProjectId('');
        setNewProjectName('');
        setNewProjectDescription('');
        setNewProjectStatus('in-progress');
        setReloadToken(function (token) {
          return token + 1;
        });
      })
      .catch(function (err) {
        setCreateProjectError(err && err.message ? err.message : 'Unable to create project');
      })
      .finally(function () {
        setIsCreatingProject(false);
      });
  }

  function deleteProject(projectId: string): void {
    setDeleteProjectError(null);
    setDeletingProjectId(projectId);

    fetch(apiBaseUrl + '/projects/' + projectId, {
      method: 'DELETE'
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            var message = payload && payload.error ? payload.error : 'Unable to delete project';
            throw new Error(message);
          });
        }
      })
      .then(function () {
        setReloadToken(function (token) {
          return token + 1;
        });
      })
      .catch(function (err) {
        setDeleteProjectError(err && err.message ? err.message : 'Unable to delete project');
      })
      .finally(function () {
        setDeletingProjectId(null);
      });
  }

  function selectProjectForEdit(project: Project): void {
    setEditProjectId(project.id);
    setEditProjectName(project.name);
    setEditProjectDescription(project.description);
    setEditProjectStatus(project.status as 'draft' | 'in-progress' | 'complete');
    setUpdateProjectError(null);
  }

  function updateProject(): void {
    if (!editProjectId) {
      setUpdateProjectError('Select a project to edit');
      return;
    }

    setIsUpdatingProject(true);
    setUpdateProjectError(null);

    fetch(apiBaseUrl + '/projects/' + editProjectId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editProjectName || undefined,
        description: editProjectDescription || undefined,
        status: editProjectStatus
      })
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            var message = payload && payload.error ? payload.error : 'Unable to update project';
            throw new Error(message);
          });
        }
        return response.json();
      })
      .then(function () {
        setReloadToken(function (token) {
          return token + 1;
        });
      })
      .catch(function (err) {
        setUpdateProjectError(err && err.message ? err.message : 'Unable to update project');
      })
      .finally(function () {
        setIsUpdatingProject(false);
      });
  }

  function createFeature(): void {
    if (!featureProjectId || !newFeatureId || !newFeatureName || !newFeatureSummary) {
      setCreateFeatureError('project id, feature id, name, and summary are required');
      return;
    }

    setCreateFeatureError(null);
    setIsCreatingFeature(true);

    fetch(apiBaseUrl + '/projects/' + featureProjectId + '/features', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: newFeatureId,
        name: newFeatureName,
        summary: newFeatureSummary,
        status: newFeatureStatus
      })
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            var message = payload && payload.error ? payload.error : 'Unable to create feature';
            throw new Error(message);
          });
        }
        return response.json();
      })
      .then(function () {
        setNewFeatureId('');
        setNewFeatureName('');
        setNewFeatureSummary('');
        setNewFeatureStatus('in-progress');
        setFeatureProjectId('');
        setReloadToken(function (token) {
          return token + 1;
        });
      })
      .catch(function (err) {
        setCreateFeatureError(err && err.message ? err.message : 'Unable to create feature');
      })
      .finally(function () {
        setIsCreatingFeature(false);
      });
  }

  function deleteFeature(featureId: string): void {
    setDeleteFeatureError(null);
    setDeletingFeatureId(featureId);

    fetch(apiBaseUrl + '/features/' + featureId, {
      method: 'DELETE'
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            var message = payload && payload.error ? payload.error : 'Unable to delete feature';
            throw new Error(message);
          });
        }
      })
      .then(function () {
        setReloadToken(function (token) {
          return token + 1;
        });
      })
      .catch(function (err) {
        setDeleteFeatureError(err && err.message ? err.message : 'Unable to delete feature');
      })
      .finally(function () {
        setDeletingFeatureId(null);
      });
  }

  function createAsset(): void {
    if (!newAssetId || !newAssetTitle || !newAssetType || !newAssetStatus) {
      setCreateAssetError('id, title, type, and status are required');
      return;
    }

    setCreateAssetError(null);
    setIsCreatingAsset(true);

    var tags = newAssetTags
      ? newAssetTags
          .split(',')
          .map(function (tag) {
            return tag.trim();
          })
          .filter(function (tag) {
            return !!tag;
          })
      : [];

    fetch(apiBaseUrl + '/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: newAssetId,
        title: newAssetTitle,
        description: newAssetDescription,
        type: newAssetType,
        status: newAssetStatus,
        link: newAssetLink || undefined,
        tags: tags
      })
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            var message = payload && payload.error ? payload.error : 'Unable to create asset';
            throw new Error(message);
          });
        }
        return response.json();
      })
      .then(function () {
        setNewAssetId('');
        setNewAssetTitle('');
        setNewAssetDescription('');
        setNewAssetType('doc');
        setNewAssetStatus('draft');
        setNewAssetLink('');
        setNewAssetTags('');
        setReloadToken(function (token) {
          return token + 1;
        });
      })
      .catch(function (err) {
        setCreateAssetError(err && err.message ? err.message : 'Unable to create asset');
      })
      .finally(function () {
        setIsCreatingAsset(false);
      });
  }

  function deleteAsset(assetId: string): void {
    setDeleteAssetError(null);
    setDeletingAssetId(assetId);

    fetch(apiBaseUrl + '/assets/' + assetId, {
      method: 'DELETE'
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            var message = payload && payload.error ? payload.error : 'Unable to delete asset';
            throw new Error(message);
          });
        }
      })
      .then(function () {
        setReloadToken(function (token) {
          return token + 1;
        });
      })
      .catch(function (err) {
        setDeleteAssetError(err && err.message ? err.message : 'Unable to delete asset');
      })
      .finally(function () {
        setDeletingAssetId(null);
      });
  }

  function selectAssetForEdit(asset: AssetLibraryItem): void {
    setEditAssetId(asset.id);
    setEditAssetTitle(asset.title);
    setEditAssetDescription(asset.description);
    setEditAssetType(asset.type);
    setEditAssetStatus(asset.status);
    setEditAssetLink(asset.link || '');
    setEditAssetTags(asset.tags ? asset.tags.join(', ') : '');
    setUpdateAssetError(null);
  }

  function updateAsset(): void {
    if (!editAssetId) {
      setUpdateAssetError('Select an asset to edit');
      return;
    }

    setIsUpdatingAsset(true);
    setUpdateAssetError(null);

    var tags = editAssetTags
      ? editAssetTags
          .split(',')
          .map(function (tag) {
            return tag.trim();
          })
          .filter(function (tag) {
            return !!tag;
          })
      : [];

    fetch(apiBaseUrl + '/assets/' + editAssetId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editAssetTitle || undefined,
        description: editAssetDescription || undefined,
        type: editAssetType || undefined,
        status: editAssetStatus || undefined,
        link: editAssetLink || undefined,
        tags: tags
      })
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            var message = payload && payload.error ? payload.error : 'Unable to update asset';
            throw new Error(message);
          });
        }
        return response.json();
      })
      .then(function () {
        setReloadToken(function (token) {
          return token + 1;
        });
      })
      .catch(function (err) {
        setUpdateAssetError(err && err.message ? err.message : 'Unable to update asset');
      })
      .finally(function () {
        setIsUpdatingAsset(false);
      });
  }

  function selectFeatureForEdit(feature: FeaturesResponse['data'][0]): void {
    setEditFeatureId(feature.id);
    setEditFeatureProjectId(feature.projectId);
    setEditFeatureName(feature.name);
    setEditFeatureSummary(feature.summary);
    setEditFeatureStatus(feature.status || 'in-progress');
    setUpdateFeatureError(null);
  }

  function updateFeature(): void {
    if (!editFeatureId || !editFeatureProjectId) {
      setUpdateFeatureError('Select a feature to edit');
      return;
    }

    setIsUpdatingFeature(true);
    setUpdateFeatureError(null);

    fetch(apiBaseUrl + '/projects/' + editFeatureProjectId + '/features/' + editFeatureId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editFeatureName || undefined,
        summary: editFeatureSummary || undefined,
        status: editFeatureStatus || undefined
      })
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (payload) {
            var message = payload && payload.error ? payload.error : 'Unable to update feature';
            throw new Error(message);
          });
        }
        return response.json();
      })
      .then(function () {
        setReloadToken(function (token) {
          return token + 1;
        });
      })
      .catch(function (err) {
        setUpdateFeatureError(err && err.message ? err.message : 'Unable to update feature');
      })
      .finally(function () {
        setIsUpdatingFeature(false);
      });
  }

  React.useEffect(function () {
    var isActive = true;
    setIsRefreshing(true);
    setStatus('loading');
    setAppsStatus('loading');
    setAssetsStatus('loading');
    setFeaturesStatus('loading');

    var tasks: Promise<void>[] = [];

    var healthPromise = fetchHealth()
      .then(function (payload) {
        if (!isActive) {
          return;
        }
        if (payload && payload.status === 'ok') {
          setApiHealthy('ok');
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
          setHealthDetails(null);
        }
      })
      .catch(function () {
        if (!isActive) {
          return;
        }
        setApiHealthy('error');
        setHealthDetails(null);
      });
    tasks.push(healthPromise);

    var projectsPromise = fetch(apiBaseUrl + '/projects')
      .then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json() as Promise<ProjectsResponse>;
      })
      .then(function (payload) {
        if (!isActive) {
          return;
        }

        if (payload && payload.data && payload.data.length > 0) {
          setProjects(payload.data);
        }

        if (payload && payload.updatedAt) {
          setLastUpdated(payload.updatedAt);
        }

        setStatus('ready');
      })
      .catch(function (err) {
        if (!isActive) {
          return;
        }
        setStatus('error');
        setError(err && err.message ? err.message : 'Unable to load projects');
      });
    tasks.push(projectsPromise);

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
      })
      .catch(function () {
        if (!isActive) {
          return;
        }
        setSummary(buildSummary(sampleProjects));
      });
    tasks.push(projectsSummaryPromise);

    var assetsPromise = fetch(apiBaseUrl + '/assets')
      .then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json() as Promise<AssetsResponse>;
      })
      .then(function (payload) {
        if (!isActive) {
          return;
        }
        if (payload && payload.data) {
          setAssets(payload.data);
        }
        if (payload && payload.updatedAt) {
          setAssetsUpdated(payload.updatedAt);
        }
        setAssetsStatus('ready');
      })
      .catch(function (err) {
        if (!isActive) {
          return;
        }
        setAssetsError(err && err.message ? err.message : 'Unable to load assets');
        setAssetsStatus('error');
        setAssets(sampleAssets);
      });
    tasks.push(assetsPromise);

    var assetsSummaryPromise = fetch(apiBaseUrl + '/assets/summary')
      .then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json() as Promise<AssetSummaryResponse>;
      })
      .then(function (payload) {
        if (!isActive || !payload || !payload.data) {
          return;
        }
        setAssetsSummary(payload.data);
        if (payload.updatedAt) {
          setAssetsUpdated(payload.updatedAt);
        }
      })
      .catch(function () {
        if (!isActive) {
          return;
        }
        setAssetsSummary(buildAssetSummary(sampleAssets));
      });
    tasks.push(assetsSummaryPromise);

    var featuresPromise = fetch(apiBaseUrl + '/features')
      .then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json() as Promise<FeaturesResponse>;
      })
      .then(function (payload) {
        if (!isActive) {
          return;
        }
        if (payload && payload.data) {
          setFeatures(payload.data);
        }
        if (payload && payload.updatedAt) {
          setFeaturesUpdated(payload.updatedAt);
        }
        setFeaturesStatus('ready');
      })
      .catch(function (err) {
        if (!isActive) {
          return;
        }
        setFeaturesError(err && err.message ? err.message : 'Unable to load features');
        setFeaturesStatus('error');
        setFeatures(sampleFeatures);
        setFeaturesSummary(buildFeatureSummaryLocal(sampleFeatures));
      });
    tasks.push(featuresPromise);

    var featuresSummaryPromise = fetch(apiBaseUrl + '/features/summary')
      .then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json() as Promise<FeatureSummaryResponse>;
      })
      .then(function (payload) {
        if (!isActive || !payload || !payload.data) {
          return;
        }
        setFeaturesSummary(payload.data);
        if (payload.updatedAt) {
          setFeaturesUpdated(payload.updatedAt);
        }
      })
      .catch(function () {
        if (!isActive) {
          return;
        }
        setFeaturesSummary(buildFeatureSummaryLocal(sampleFeatures));
      });
    tasks.push(featuresSummaryPromise);

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
  }, [reloadToken]);

  return (
    <main
      style={{
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        padding: '32px',
        background: 'linear-gradient(135deg, #0f172a, #111827)',
        color: '#e5e7eb',
        minHeight: '100vh'
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <p style={{ color: '#93c5fd', fontSize: '14px', letterSpacing: '0.08em', margin: 0 }}>METABUILD</p>
          <h1 style={{ margin: '4px 0 0', fontSize: '32px' }}>Dashboard</h1>
          <p style={{ margin: '4px 0 0', color: '#cbd5e1' }}>Live view of MetaBuild projects and features</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, color: '#cbd5e1' }}>{status === 'ready' ? 'API connected' : 'Using local sample data'}</p>
          {lastUpdated ? <p style={{ margin: '4px 0 0', color: '#93c5fd' }}>Data as of {lastUpdated}</p> : null}
          {error ? <p style={{ margin: '4px 0 0', color: '#f87171' }}>{error}</p> : null}
          <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '12px' }}>API base: {apiBaseUrl}</p>
          {lastRefreshedAt ? <p style={{ margin: '2px 0 0', color: '#94a3b8', fontSize: '12px' }}>Last refresh: {lastRefreshedAt}</p> : null}
          <p style={{ margin: '2px 0 0', color: apiHealthy === 'ok' ? '#34d399' : apiHealthy === 'error' ? '#f87171' : '#cbd5e1', fontSize: '12px', fontWeight: 700 }}>
            API health: {apiHealthy === 'ok' ? 'OK' : apiHealthy === 'error' ? 'Error' : 'Checking...'}
            {healthDetails ? ' (' + healthDetails + ')' : ''}
          </p>
            <button
              onClick={function () {
                setReloadToken(function (token) {
                  return token + 1;
                });
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

      <section style={{ marginTop: '20px', display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
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
              value={featureProjectId}
              onChange={function (event) {
                setFeatureProjectId(event.target.value);
              }}
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
              value={newFeatureId}
              onChange={function (event) {
                setNewFeatureId(event.target.value);
              }}
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
              value={newFeatureName}
              onChange={function (event) {
                setNewFeatureName(event.target.value);
              }}
              placeholder="Feature name"
              style={{
                backgroundColor: '#0b1224',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                padding: '8px',
                color: '#e5e7eb'
              }}
            />
            <select
              value={newFeatureStatus}
              onChange={function (event) {
                setNewFeatureStatus(event.target.value);
              }}
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
            value={newFeatureSummary}
            onChange={function (event) {
              setNewFeatureSummary(event.target.value);
            }}
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
              value={editFeatureId}
              onChange={function (event) {
                setEditFeatureId(event.target.value);
              }}
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
              value={editFeatureProjectId}
              onChange={function (event) {
                setEditFeatureProjectId(event.target.value);
              }}
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
              value={editFeatureName}
              onChange={function (event) {
                setEditFeatureName(event.target.value);
              }}
              placeholder="Feature name"
              style={{
                backgroundColor: '#0b1224',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                padding: '8px',
                color: '#e5e7eb'
              }}
            />
            <select
              value={editFeatureStatus}
              onChange={function (event) {
                setEditFeatureStatus(event.target.value);
              }}
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
            value={editFeatureSummary}
            onChange={function (event) {
              setEditFeatureSummary(event.target.value);
            }}
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

      <section style={{ marginTop: '22px' }}>
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
          </div>
        </header>

        <div style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
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
              <article
                key={project.id}
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
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>{project.id}</p>
                  <h3 style={{ margin: '4px 0 6px', fontSize: '18px' }}>{project.name}</h3>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span
                    style={{
                      backgroundColor: statusColor(project.status),
                      color: '#0b1224',
                      borderRadius: '999px',
                      padding: '6px 12px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      fontSize: '11px'
                    }}
                  >
                    {project.status}
                  </span>
                  <button
                    onClick={function () {
                      selectProjectForEdit(project);
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
                      padding: '6px 10px',
                      cursor: deletingProjectId === project.id ? 'not-allowed' : 'pointer',
                      fontWeight: 600
                    }}
                  >
                    {deletingProjectId === project.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </header>
              <p style={{ margin: '6px 0 10px', color: '#cbd5e1' }}>{project.description}</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                      backgroundColor: '#111827',
                      color: '#cbd5e1',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '12px',
                      border: '1px solid #1f2937'
                    }}
                  >
                    Features: {featureCount}
                  </span>
                  <span
                    style={{
                      backgroundColor: '#111827',
                      color: '#cbd5e1',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '12px',
                      border: '1px solid #1f2937'
                    }}
                  >
                    Assets: {assetCount}
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        <div style={{ marginTop: '12px', backgroundColor: '#0b1224', border: '1px solid #1f2937', borderRadius: '12px', padding: '12px' }}>
          <p style={{ margin: '0 0 6px', color: '#93c5fd', fontSize: '12px', letterSpacing: '0.08em' }}>CREATE PROJECT</p>
          <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <input
              value={newProjectId}
              onChange={function (event) {
                setNewProjectId(event.target.value);
              }}
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
              value={newProjectName}
              onChange={function (event) {
                setNewProjectName(event.target.value);
              }}
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
              value={newProjectStatus}
              onChange={function (event) {
                setNewProjectStatus(event.target.value as 'draft' | 'in-progress' | 'complete');
              }}
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
            value={newProjectDescription}
            onChange={function (event) {
              setNewProjectDescription(event.target.value);
            }}
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
              value={editProjectId}
              onChange={function (event) {
                setEditProjectId(event.target.value);
              }}
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
              value={editProjectName}
              onChange={function (event) {
                setEditProjectName(event.target.value);
              }}
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
              value={editProjectStatus}
              onChange={function (event) {
                setEditProjectStatus(event.target.value as 'draft' | 'in-progress' | 'complete');
              }}
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
            value={editProjectDescription}
            onChange={function (event) {
              setEditProjectDescription(event.target.value);
            }}
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

      <section style={{ marginTop: '22px' }}>
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

        <div style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {filterFeatures(features).map(function (feature) {
            return (
              <article
                key={feature.id}
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
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>{feature.projectName}</p>
                    <h3 style={{ margin: '4px 0 6px', fontSize: '18px' }}>{feature.name}</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span
                      style={{
                        backgroundColor: featureStatusColor(feature.status),
                        color: '#0b1224',
                        borderRadius: '999px',
                        padding: '6px 12px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        fontSize: '11px'
                      }}
                    >
                      {feature.status || 'draft'}
                    </span>
                    <button
                      onClick={function () {
                        selectFeatureForEdit(feature);
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
                        padding: '6px 10px',
                        cursor: deletingFeatureId === feature.id ? 'not-allowed' : 'pointer',
                        fontWeight: 600
                      }}
                    >
                      {deletingFeatureId === feature.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </header>
                <p style={{ margin: '6px 0 10px', color: '#cbd5e1' }}>{feature.summary}</p>
                <div>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px', letterSpacing: '0.05em' }}>Assets</p>
                  <ul style={{ margin: '6px 0 0', paddingLeft: '18px', color: '#cbd5e1' }}>
                    {feature.assets.map(function (asset) {
                      return (
                        <li key={asset.id} style={{ marginBottom: '4px' }}>
                          <strong>{asset.name}</strong> <span style={{ color: '#93c5fd' }}>({asset.type})</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </article>
            );
          })}
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
              value={newAssetId}
              onChange={function (event) {
                setNewAssetId(event.target.value);
              }}
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
              value={newAssetTitle}
              onChange={function (event) {
                setNewAssetTitle(event.target.value);
              }}
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
              value={newAssetType}
              onChange={function (event) {
                setNewAssetType(event.target.value);
              }}
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
              value={newAssetStatus}
              onChange={function (event) {
                setNewAssetStatus(event.target.value);
              }}
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
            value={newAssetDescription}
            onChange={function (event) {
              setNewAssetDescription(event.target.value);
            }}
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
            value={newAssetLink}
            onChange={function (event) {
              setNewAssetLink(event.target.value);
            }}
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
            value={newAssetTags}
            onChange={function (event) {
              setNewAssetTags(event.target.value);
            }}
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
              value={editAssetId}
              onChange={function (event) {
                setEditAssetId(event.target.value);
              }}
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
              value={editAssetTitle}
              onChange={function (event) {
                setEditAssetTitle(event.target.value);
              }}
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
              value={editAssetType}
              onChange={function (event) {
                setEditAssetType(event.target.value);
              }}
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
              value={editAssetStatus}
              onChange={function (event) {
                setEditAssetStatus(event.target.value);
              }}
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
            value={editAssetDescription}
            onChange={function (event) {
              setEditAssetDescription(event.target.value);
            }}
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
            value={editAssetLink}
            onChange={function (event) {
              setEditAssetLink(event.target.value);
            }}
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
            value={editAssetTags}
            onChange={function (event) {
              setEditAssetTags(event.target.value);
            }}
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

      <section style={{ marginTop: '24px', display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {projects.map(function (project) {
          return (
            <article
              key={project.id}
              style={{
                backgroundColor: '#0b1224',
                border: '1px solid #1f2937',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.25)'
              }}
            >
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px', letterSpacing: '0.05em' }}>{project.id}</p>
                  <h2 style={{ margin: '4px 0 6px', fontSize: '20px' }}>{project.name}</h2>
                  <p style={{ margin: 0, color: '#cbd5e1' }}>{project.description}</p>
                </div>
                <span
                  style={{
                    backgroundColor: statusColor(project.status),
                    color: '#0b1224',
                    borderRadius: '999px',
                    padding: '6px 12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    fontSize: '11px'
                  }}
                >
                  {project.status}
                </span>
              </header>

              <div style={{ marginTop: '12px', borderTop: '1px solid #1f2937', paddingTop: '12px' }}>
                <p style={{ margin: '0 0 8px', color: '#94a3b8', fontSize: '12px', letterSpacing: '0.04em' }}>Features</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '10px' }}>
                  {project.features.map(function (feature) {
                    return (
                      <li
                        key={feature.id}
                        style={{
                          backgroundColor: '#0f172a',
                          borderRadius: '8px',
                          padding: '10px',
                          border: '1px solid #1f2937'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <strong style={{ color: '#e2e8f0' }}>{feature.name}</strong>
                          <span style={{ color: '#94a3b8', fontSize: '12px' }}>{feature.id}</span>
                        </div>
                        <p style={{ margin: '4px 0 8px', color: '#cbd5e1' }}>{feature.summary}</p>
                        <div>
                          <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px', letterSpacing: '0.04em' }}>Assets</p>
                          <ul style={{ margin: '6px 0 0', paddingLeft: '18px', color: '#cbd5e1' }}>
                            {feature.assets.map(function (asset) {
                              return (
                                <li key={asset.id} style={{ marginBottom: '4px' }}>
                                  <strong>{asset.name}</strong> <span style={{ color: '#93c5fd' }}>({asset.type})</span>
                                  {asset.description ? <span>: {asset.description}</span> : null}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}

var rootElement = document.getElementById('root');

if (rootElement) {
  var root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <Dashboard />
    </React.StrictMode>
  );
}
