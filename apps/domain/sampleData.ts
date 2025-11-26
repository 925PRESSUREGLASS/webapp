import { AppService, Project, AssetLibraryItem, FeatureRecord } from './types';

var sampleProjects: Project[] = [
  {
    id: 'project-1',
    name: 'MetaBuild Foundation',
    description: 'Track initial scaffolding for meta-api and meta-dashboard applications.',
    status: 'in-progress',
    features: [
      {
        id: 'feature-api',
        name: 'Meta API',
        summary: 'Expose Fastify endpoints for health, project metadata, and readiness signals.',
        status: 'in-progress',
        assets: [
          {
            id: 'asset-health',
            name: 'Health Endpoint',
            type: 'service',
            description: 'Responds with uptime indicators.'
          },
          {
            id: 'asset-projects',
            name: 'Project Directory',
            type: 'service',
            description: 'Lists tracked MetaBuild projects with status.'
          }
        ]
      },
      {
        id: 'feature-dashboard',
        name: 'Meta Dashboard',
        summary: 'Render a React UI for program metadata pulled from meta-api.',
        status: 'in-progress',
        assets: [
          {
            id: 'asset-ui-shell',
            name: 'Dashboard Shell',
            type: 'package',
            description: 'Base React TypeScript page layout.'
          },
          {
            id: 'asset-status',
            name: 'Status Indicators',
            type: 'tool',
            description: 'Visual status markers for each tracked project.'
          }
        ]
      }
    ]
  }
];

var sampleAssets: AssetLibraryItem[] = [
  {
    id: 'asset-lib-1',
    title: 'Codex Worker Prompts',
    description: 'Standard 4-worker prompt set for parallel delivery (backend, frontend, DB, CRUD).',
    type: 'prompt',
    status: 'active',
    projectIds: ['project-1'],
    featureIds: ['feature-dashboard'],
    tags: ['codex', 'workflow', 'playbook'],
    versions: [
      { id: 'asset-lib-1-v1', version: '1.0.0', isCurrent: true, changelog: 'Initial worker prompts' }
    ],
    link: ''
  },
  {
    id: 'asset-lib-2',
    title: 'Phase Checklist Template',
    description: 'Phase 1 & Phase 2 checklists for MetaBuild (foundation + data/CRUD).',
    type: 'doc',
    status: 'active',
    projectIds: ['project-1'],
    tags: ['checklist', 'docs'],
    versions: [
      { id: 'asset-lib-2-v1', version: '1.0.0', isCurrent: true, changelog: 'Initial template' }
    ],
    link: ''
  },
  {
    id: 'asset-lib-3',
    title: 'TicTacStick PWA Link',
    description: 'Primary field quote engine (offline-first web app). Serve via python3 -m http.server 8081.',
    type: 'static',
    status: 'active',
    projectIds: ['project-1'],
    tags: ['pwa', 'tic-tac-stick'],
    link: 'http://localhost:8081',
    versions: [
      { id: 'asset-lib-3-v1', version: '1.0.0', isCurrent: true, changelog: 'Local dev URL' }
    ]
  }
];

var sampleFeatures: FeatureRecord[] = sampleProjects.reduce(function (acc, project) {
  var next = acc;
  for (var i = 0; i < project.features.length; i++) {
    var feature = project.features[i];
    next.push({
      id: feature.id,
      name: feature.name,
      summary: feature.summary,
      status: feature.status,
      assets: feature.assets,
      projectId: project.id,
      projectName: project.name
    });
  }
  return next;
}, [] as FeatureRecord[]);

var sampleApps: AppService[] = [
  {
    id: 'app-pwa',
    name: 'TicTacStick PWA',
    description: 'Primary field quote engine (offline-first web app). Serve via python3 -m http.server 8081.',
    url: 'http://localhost:8081',
    kind: 'pwa',
    status: 'online',
    tags: ['primary', 'offline']
  },
  {
    id: 'app-meta-dashboard',
    name: 'MetaBuild Dashboard',
    description: 'React/Vite UI for project, feature, and asset status.',
    url: 'http://localhost:5173',
    kind: 'dashboard',
    status: 'online',
    tags: ['meta', 'ui']
  },
  {
    id: 'app-meta-api',
    name: 'MetaBuild API',
    description: 'Fastify service exposing projects, summary, and apps data.',
    url: 'http://localhost:4000/health',
    kind: 'api',
    status: 'online',
    tags: ['meta', 'api']
  }
];

export { sampleProjects, sampleApps, sampleAssets, sampleFeatures };
