import React from 'react';
import ReactDOM from 'react-dom/client';
import { Project } from '../domain/types';

function Dashboard(): JSX.Element {
  var foundationProject: Project = {
    id: 'project-1',
    name: 'MetaBuild Foundation',
    description: 'Track the initial scaffolding for meta-api and meta-dashboard.',
    status: 'in-progress',
    features: [
      {
        id: 'feature-api',
        name: 'Meta API',
        summary: 'Expose Fastify endpoints for health and project metadata.',
        assets: [
          {
            id: 'asset-health',
            name: 'Health Endpoint',
            type: 'service',
            description: 'Responds with uptime indicators.'
          }
        ]
      },
      {
        id: 'feature-dashboard',
        name: 'Meta Dashboard',
        summary: 'Render a React UI for program metadata.',
        assets: [
          {
            id: 'asset-ui-shell',
            name: 'Dashboard Shell',
            type: 'package',
            description: 'Base React TypeScript page layout.'
          }
        ]
      }
    ]
  };

  return (
    <main style={{ fontFamily: 'Arial, sans-serif', padding: '24px' }}>
      <h1>Dashboard</h1>
      <section>
        <h2>{foundationProject.name}</h2>
        <p>{foundationProject.description}</p>
        <p>Status: {foundationProject.status}</p>
        <div>
          <h3>Features</h3>
          <ul>
            {foundationProject.features.map(function (feature) {
              return (
                <li key={feature.id} style={{ marginBottom: '12px' }}>
                  <strong>{feature.name}</strong>
                  <p>{feature.summary}</p>
                  <div>
                    <span>Assets:</span>
                    <ul>
                      {feature.assets.map(function (asset) {
                        return (
                          <li key={asset.id}>
                            {asset.name} ({asset.type})
                            {asset.description ? ': ' + asset.description : ''}
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
